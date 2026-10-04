import type { AuthUser, Booking, HostProfile, HostRequirementReview, HostStatusHistory, Profile, Property, Transaction } from './types';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
const SESSION_KEY = 'lotnis_web_session';

export function getSession(): AuthUser | null {
  const value = localStorage.getItem(SESSION_KEY);
  return value ? (JSON.parse(value) as AuthUser) : null;
}

export function setSession(user: AuthUser | null) {
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else localStorage.removeItem(SESSION_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = getSession();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      ...(init.headers || {}),
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error || `Request failed (${response.status})`);
  return body?.success ? body.data : body;
}

export const api = {
  searchProperties: (params: URLSearchParams) =>
    request<{ data: Property[]; total: number }>(`/explore/search?${params}`),
  getProperty: (id: string) => request<Property>(`/explore/${id}`),
  getProfile: () => request<Profile>('/auth/profile'),
  getMyBookings: () => request<{ data: Booking[]; total: number }>('/bookings/my'),
  getMyBooking: (id: string) => request<Booking>(`/bookings/my/${id}`),
  getHostBookings: () => request<{ data: Booking[]; total: number }>('/bookings/host'),
  getHostTransactions: () => request<Transaction[]>('/bookings/host/transactions'),
  getTransactions: () => request<Transaction[]>('/bookings/my/transactions'),
  getMyProperties: () => request<Property[]>('/property/mine'),
  createBooking: (payload: {
    property_id: string;
    room_id?: string;
    start_date: string;
    end_date: string;
  }) => request<Booking>('/bookings', { method: 'POST', body: JSON.stringify(payload) }),
  confirmBooking: (bookingId: string, paystackReference: string) =>
    request<Booking>(`/bookings/internal/${bookingId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ paystack_reference: paystackReference }),
    }),
  hostAcceptBooking: (bookingId: string) =>
    request<Booking>(`/bookings/host/${bookingId}/accept`, { method: 'POST' }),
  hostRejectBooking: (bookingId: string, reason: string) =>
    request<Booking>(`/bookings/host/${bookingId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  publishProperty: (payload: unknown) =>
    request<Property>('/property/publish', { method: 'POST', body: JSON.stringify(payload) }),

  // ── Host application (identity/business verification) ──────────────────
  getHostProfile: async (): Promise<HostProfile | null> => {
    try { return await request<HostProfile>('/host/me'); }
    catch (err) { if (err instanceof Error && err.message.includes('not found')) return null; throw err; }
  },
  saveHostProfile: (payload: unknown) => request<HostProfile>('/host/me', { method: 'PUT', body: JSON.stringify(payload) }),
  uploadHostDocument: (slot: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<{ url: string }>(`/host/upload/${slot}`, { method: 'POST', body: form });
  },
  submitHostApplication: () => request<HostProfile>('/host/submit', { method: 'POST' }),
  getHostStatusHistory: () => request<HostStatusHistory[]>('/host/me/history'),
  getHostRequirementReviews: async (): Promise<HostRequirementReview[]> => {
    try { return await request<HostRequirementReview[]>('/host/me/requirements'); }
    catch { return []; }
  },
};
