import type {
  AppNotification,
  ExitCaseDetail,
  ExitCaseSummary,
  ExitSettlement,
  AuthUser,
  Booking,
  CancellationPreview,
  CatalogOptions,
  HostAccess,
  HostProfile,
  HostRequirementReview,
  HostStatusHistory,
  Profile,
  Property,
  StayQuote,
  Transaction,
} from '@/types';

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

export const decodeExp = (token: string): number => {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).exp * 1000;
  } catch {
    return Number.MAX_SAFE_INTEGER;
  } // not a decodable JWT: don't guess, let the server say
};

let refreshing: Promise<boolean> | null = null;
/** Swap the refresh token for a new access token. One call at a time, however many requests are waiting on it. */
function refreshSession(): Promise<boolean> {
  if (refreshing) return refreshing;
  const session = getSession();
  if (!session?.refreshToken) return Promise.resolve(false);
  refreshing = fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: session.refreshToken }),
  })
    .then(async (response) => {
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.data?.access_token) return false;
      setSession({
        ...session,
        accessToken: body.data.access_token,
        refreshToken: body.data.refresh_token || session.refreshToken,
      });
      return true;
    })
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

/** The session is truly over: forget it and take the person to sign in, then back to where they were. */
function endSession() {
  setSession(null);
  const here = `${window.location.pathname}${window.location.search}`;
  if (!window.location.pathname.startsWith('/auth'))
    window.location.assign(`/?signin=1&expired=1&next=${encodeURIComponent(here)}`);
}

export async function request<T>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
  let session = getSession();
  // Renew a token that is about to expire before using it, instead of letting the request fail.
  if (session?.accessToken && decodeExp(session.accessToken) - Date.now() < 60_000) {
    if (await refreshSession()) session = getSession();
    else if (decodeExp(session.accessToken) < Date.now()) {
      endSession();
      throw new Error('Your session has expired. Please sign in again.');
    }
  }
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      ...(init.headers || {}),
    },
  });
  const body = await response.json().catch(() => null);
  if (response.status === 401 && session?.accessToken && !retried && path !== '/auth/refresh') {
    if (await refreshSession()) return request<T>(path, init, true);
    endSession();
    throw new Error('Your session has expired. Please sign in again.');
  }
  if (!response.ok) {
    const error = new Error(body?.error || `Request failed (${response.status})`) as Error & {
      code?: string;
      status?: number;
    };
    error.code = body?.code;
    error.status = response.status;
    throw error;
  }
  return body?.success ? body.data : body;
}

export const api = {
  searchProperties: (params: URLSearchParams) =>
    request<{ data: Property[]; total: number }>(`/explore/search?${params}`),
  getFeaturedProperties: (limit = 8) =>
    request<{ data: Property[] }>(`/explore/featured?limit=${limit}`).then((result) => result.data || []),
  getProperty: (id: string) => request<Property>(`/explore/${id}`),
  getProfile: () => request<Profile>('/auth/profile'),
  getMyBookings: () => request<{ data: Booking[]; total: number }>('/bookings/my'),
  getMyBooking: (id: string) => request<Booking>(`/bookings/my/${id}`),
  getHostBookings: () => request<{ data: Booking[]; total: number }>('/bookings/host?limit=100'),
  getHostTransactions: () => request<Transaction[]>('/bookings/host/transactions'),
  getTransactions: () => request<Transaction[]>('/bookings/my/transactions'),
  getMyProperties: () => request<Property[]>('/property/mine'),
  createBooking: (payload: { property_id: string; room_id?: string; start_date: string; end_date: string }) =>
    request<Booking>('/bookings', { method: 'POST', body: JSON.stringify(payload) }),
  confirmBooking: (bookingId: string, paystackReference: string) =>
    request<Booking>(`/bookings/internal/${bookingId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ paystack_reference: paystackReference }),
    }),
  hostAcceptBooking: (bookingId: string) => request<Booking>(`/bookings/host/${bookingId}/accept`, { method: 'POST' }),
  hostRejectBooking: (bookingId: string, reason: string) =>
    request<Booking>(`/bookings/host/${bookingId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  quoteStay: (payload: { property_id: string; room_id?: string; start_date: string; end_date: string }) =>
    request<StayQuote>('/bookings/quote', { method: 'POST', body: JSON.stringify(payload) }),
  getCatalog: () => request<CatalogOptions>('/catalog/options'),

  // ── Cancellation & refunds ──────────────────────────────────────────────
  previewTripCancellation: (bookingId: string) =>
    request<CancellationPreview>(`/bookings/my/${bookingId}/cancellation-preview`),
  cancelTrip: (bookingId: string, reason?: string) =>
    request<Booking>(`/bookings/my/${bookingId}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
  previewHostCancellation: (bookingId: string) =>
    request<CancellationPreview>(`/bookings/host/${bookingId}/cancellation-preview`),
  hostCancelBooking: (bookingId: string, reason: string) =>
    request<Booking>(`/bookings/host/${bookingId}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // ── Move-outs ───────────────────────────────────────────────────────────
  previewExit: (bookingId: string, departure: string) =>
    request<ExitSettlement>(`/exits/preview?booking_id=${bookingId}&departure=${departure}`),
  giveNotice: (payload: { booking_id: string; planned_checkout: string; reason_category?: string; reason?: string }) =>
    request<ExitCaseSummary>('/exits', { method: 'POST', body: JSON.stringify(payload) }),
  getMyExits: () => request<ExitCaseSummary[]>('/exits/mine'),
  getHostExits: () => request<ExitCaseSummary[]>('/exits/host'),
  getExit: (id: string) => request<ExitCaseDetail>(`/exits/${id}`),
  withdrawExit: (id: string) => request<ExitCaseDetail>(`/exits/${id}/withdraw`, { method: 'POST' }),
  hostRespondExit: (id: string, payload: { response?: string; relet_from?: string | null; concede_fault?: boolean }) =>
    request<ExitCaseDetail>(`/exits/${id}/host-response`, { method: 'POST', body: JSON.stringify(payload) }),
  confirmMoveOut: (id: string, actualCheckout?: string) =>
    request<ExitCaseDetail>(`/exits/${id}/move-out`, {
      method: 'POST',
      body: JSON.stringify({ actual_checkout: actualCheckout }),
    }),
  startCheckout: (bookingId: string) =>
    request<ExitCaseDetail>('/exits/checkout', { method: 'POST', body: JSON.stringify({ booking_id: bookingId }) }),
  proposeDeduction: (id: string, payload: { amount: number; reason: string; evidence_urls: string[] }) =>
    request<unknown>(`/exits/${id}/deductions`, { method: 'POST', body: JSON.stringify(payload) }),
  respondToDeduction: (
    id: string,
    deductionId: string,
    payload: { response: 'accept' | 'dispute'; comment?: string },
  ) =>
    request<ExitCaseDetail>(`/exits/${id}/deductions/${deductionId}/respond`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  uploadExitEvidence: (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<{ url: string }>(`/exits/${id}/evidence`, { method: 'POST', body: form });
  },

  // ── Notifications (guest + host feed) ───────────────────────────────────
  getNotifications: (params: { audience?: 'user' | 'host'; unread?: boolean; before?: string } = {}) => {
    const query = new URLSearchParams({ limit: '30' });
    if (params.audience) query.set('audience', params.audience);
    if (params.unread) query.set('unread', '1');
    if (params.before) query.set('before', params.before);
    return request<AppNotification[]>(`/notifications?${query}`);
  },
  getUnreadCount: () => request<{ count: number }>('/notifications/unread-count').then((r) => r.count),
  markNotificationsRead: (ids: string[]) =>
    request<{ ok: boolean }>('/notifications/read', { method: 'POST', body: JSON.stringify({ ids }) }),
  markAllNotificationsRead: () =>
    request<{ ok: boolean }>('/notifications/read-all', { method: 'POST', body: JSON.stringify({}) }),

  // ── Host dashboard gate ─────────────────────────────────────────────────
  getHostAccess: () => request<HostAccess>('/host/me/access'),
  nudgeHostReview: () => request<HostAccess>('/host/me/nudge', { method: 'POST' }),

  uploadPropertyPhoto: (propertyId: string, file: File, roomId?: string) => {
    const form = new FormData();
    form.append('propertyId', propertyId);
    if (roomId) form.append('roomId', roomId);
    form.append('file', file);
    return request<{ publicUrl: string; storagePath: string }>('/property/image/upload', {
      method: 'POST',
      body: form,
    });
  },
  publishProperty: (payload: unknown) =>
    request<Property>('/property/publish', { method: 'POST', body: JSON.stringify(payload) }),

  // ── Host application (identity/business verification) ──────────────────
  getHostProfile: async (): Promise<HostProfile | null> => {
    try {
      return await request<HostProfile>('/host/me');
    } catch (err) {
      if (err instanceof Error && err.message.includes('not found')) return null;
      throw err;
    }
  },
  saveHostProfile: (payload: unknown) =>
    request<HostProfile>('/host/me', { method: 'PUT', body: JSON.stringify(payload) }),
  uploadHostDocument: (slot: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<{ url: string }>(`/host/upload/${slot}`, { method: 'POST', body: form });
  },
  submitHostApplication: () => request<HostProfile>('/host/submit', { method: 'POST' }),
  getHostStatusHistory: () => request<HostStatusHistory[]>('/host/me/history'),
  getHostRequirementReviews: async (): Promise<HostRequirementReview[]> => {
    try {
      return await request<HostRequirementReview[]>('/host/me/requirements');
    } catch {
      return [];
    }
  },
};
