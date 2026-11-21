import { request } from '@/lib/api';

// ── Services marketplace ─────────────────────────────────────────────────────
export type PricingUnit = 'per_30min' | 'per_hour' | 'per_day' | 'per_job';
export const UNIT_NOUN: Record<PricingUnit, string> = {
  per_30min: '30 min',
  per_hour: 'hour',
  per_day: 'day',
  per_job: 'job',
};
export const UNIT_MINUTES: Record<Exclude<PricingUnit, 'per_job'>, number> = {
  per_30min: 30,
  per_hour: 60,
  per_day: 480,
};

export type ServiceCategory = { id: string; slug: string; name: string; icon: string };
export type Provider = {
  id: string;
  name: string;
  verified: boolean;
  type: string;
  since: string;
  avatar_url?: string | null;
};

export type ServiceCard = {
  id: string;
  title: string;
  summary?: string | null;
  category: ServiceCategory | null;
  pricing_unit: PricingUnit;
  rate: number;
  currency: string;
  allow_negotiation: boolean;
  min_units: number;
  max_units: number;
  job_minutes: number;
  city?: string | null;
  region?: string | null;
  latitude: number | null;
  longitude: number | null;
  service_radius_km: number;
  travels_to_customer: boolean;
  works_at_own_place: boolean;
  photos: string[];
  tags: string[];
  languages: string[];
  rating: number | null;
  review_count: number;
  jobs_completed: number;
  is_paused: boolean;
  pause_reason?: string | null;
  provider: Provider | null;
  distance_km: number | null;
  serves_you?: boolean;
};

export type ServiceDetail = ServiceCard & {
  description: string;
  status: string;
  is_owner: boolean;
  min_offer_percent: number;
  availability: Array<{ weekday: number; start_time: string; end_time: string }>;
  busy: Array<{ starts_at: string; ends_at: string }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment?: string | null;
    host_reply?: string | null;
    created_at: string;
    reviewer: string;
  }>;
};

export type SearchQuery = {
  lat?: number;
  lng?: number;
  radius_km?: number;
  category?: string;
  /** language name, e.g. "Ga" */
  language?: string;
  q?: string;
  min_price?: number;
  max_price?: number;
  sort?: string;
  page?: number;
  host_id?: string;
};

export type JobStatus =
  | 'requested'
  | 'negotiating'
  | 'accepted'
  | 'paid'
  | 'awaiting_confirmation'
  | 'completed'
  | 'disputed'
  | 'declined'
  | 'cancelled'
  | 'expired'
  | 'refunded';

export type Job = {
  id: string;
  status: JobStatus;
  role: 'customer' | 'host' | 'admin';
  service: {
    id: string;
    title: string;
    photos: string[];
    pricing_unit: PricingUnit;
    rate: number;
    currency: string;
    city?: string | null;
    allow_negotiation: boolean;
    category: ServiceCategory | null;
  };
  provider: Provider | null;
  customer: { id: string; name: string; avatar_url?: string | null };
  starts_at: string;
  ends_at: string;
  units: number;
  currency: string;
  list_total: number;
  floor_total: number;
  current_offer: number;
  offer_by: 'customer' | 'host';
  agreed_total: number | null;
  notes?: string | null;
  distance_km: number | null;
  expires_at: string;
  pay_by?: string | null;
  accepted_at?: string | null;
  paid_at?: string | null;
  provider_done_at?: string | null;
  auto_release_at?: string | null;
  confirmed_at?: string | null;
  cancelled_by?: string | null;
  cancel_reason?: string | null;
  dispute_reason?: string | null;
  disputed_at?: string | null;
  resolution?: string | null;
  created_at: string;
  offers: Array<{ by_role: 'customer' | 'host'; amount: number; message?: string | null; created_at: string }>;
  review: {
    id: string;
    rating: number;
    comment?: string | null;
    host_reply?: string | null;
    created_at: string;
  } | null;
  refunds: Array<{ id: string; amount: number; status: string; trigger: string; created_at: string }>;
  unread_messages: number;
  min_offer_percent: number;
  location_text?: string | null;
  location_hidden?: boolean;
  provider_place?: string | null;
  money?: {
    agreed: number;
    processing_fee: number;
    total_charge: number;
    commission_percent?: number;
    commission?: number;
    you_earn?: number;
  };
  can: {
    accept: boolean;
    counter: boolean;
    decline: boolean;
    pay: boolean;
    cancel: boolean;
    mark_done: boolean;
    confirm: boolean;
    review: boolean;
    message: boolean;
  };
  admin?: { host_id: string; customer_id: string; payment_reference?: string | null; transaction_id?: string | null };
};

export type JobRow = {
  id: string;
  status: JobStatus;
  starts_at: string;
  ends_at: string;
  units: number;
  currency: string;
  current_offer: number;
  agreed_total: number | null;
  offer_by: 'customer' | 'host';
  expires_at: string;
  created_at: string;
  service: { id: string; title: string; photos: string[] };
  customer_name?: string;
};

export type ChatMessage = {
  id: string;
  mine: boolean;
  body: string;
  masked: boolean;
  created_at: string;
  notice?: string;
};

// ── Provider side ────────────────────────────────────────────────────────────
export type MyService = {
  id: string;
  title: string;
  summary?: string | null;
  description: string;
  category_id: string;
  category?: { name: string; slug: string; icon: string };
  pricing_unit: PricingUnit;
  rate: number;
  currency: string;
  job_minutes: number;
  min_units: number;
  max_units: number;
  allow_negotiation: boolean;
  city?: string | null;
  region?: string | null;
  latitude: number | null;
  longitude: number | null;
  service_radius_km: number;
  travels_to_customer: boolean;
  works_at_own_place: boolean;
  address_text?: string | null;
  photos: string[];
  tags: string[];
  languages: string[];
  status: 'draft' | 'pending_review' | 'published' | 'rejected' | 'suspended';
  rejection_reason?: string | null;
  is_paused: boolean;
  rating: number | null;
  review_count: number;
  jobs_completed: number;
  open_requests?: number;
  active_jobs?: number;
  availability?: Array<{ id: string; weekday: number; start_time: string; end_time: string }>;
  time_off?: Array<{ id: string; starts_at: string; ends_at: string; reason?: string | null }>;
  missing?: string[];
};

const qs = (o: Record<string, unknown>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  return p.toString();
};
const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) });

export const marketApi = {
  categories: () => request<ServiceCategory[]>('/services/categories'),
  search: (q: SearchQuery) =>
    request<{ data: ServiceCard[]; total: number; page: number; limit: number }>(`/services?${qs(q)}`),
  detail: (id: string) => request<ServiceDetail>(`/services/${id}`),
  ask: (
    serviceId: string,
    body: {
      starts_at: string;
      units: number;
      offer?: number | null;
      location_text?: string;
      latitude?: number | null;
      longitude?: number | null;
      notes?: string;
    },
  ) => post<Job>(`/services/${serviceId}/requests`, body),

  jobs: (as: 'customer' | 'host', status?: string) =>
    request<JobRow[]>(`/services/requests/mine?${qs({ as, status })}`),
  job: (id: string) => request<Job>(`/services/requests/${id}`),
  respond: (id: string, action: 'accept' | 'counter' | 'decline', body: { amount?: number; message?: string } = {}) =>
    post<Job>(`/services/requests/${id}/respond`, { action, ...body }),
  startPay: (id: string) =>
    post<{
      reference: string;
      amount_pesewas: number;
      currency: string;
      email: string;
      total: number;
      pay_by?: string;
    }>(`/services/requests/${id}/pay`),
  confirmPay: (id: string, reference: string) => post<Job>(`/services/requests/${id}/pay/confirm`, { reference }),
  cancel: (id: string, reason?: string) => post<Job>(`/services/requests/${id}/cancel`, { reason }),
  done: (id: string) => post<Job>(`/services/requests/${id}/done`),
  confirm: (id: string, satisfied: boolean, reason?: string) =>
    post<Job>(`/services/requests/${id}/confirm`, { satisfied, reason }),
  messages: (id: string) => request<ChatMessage[]>(`/services/requests/${id}/messages`),
  send: (id: string, body: string) => post<ChatMessage>(`/services/requests/${id}/messages`, { body }),
  review: (id: string, rating: number, comment?: string) =>
    post<{ id: string }>(`/services/requests/${id}/review`, { rating, comment }),

  host: {
    list: () => request<MyService[]>('/services/host/mine'),
    get: (id: string) => request<MyService>(`/services/host/${id}`),
    create: (
      body: Partial<MyService> & { availability?: Array<{ weekday: number; start_time: string; end_time: string }> },
    ) => post<MyService>('/services/host', body),
    update: (
      id: string,
      body: Partial<MyService> & { availability?: Array<{ weekday: number; start_time: string; end_time: string }> },
    ) => request<MyService>(`/services/host/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    setHours: (id: string, windows: Array<{ weekday: number; start_time: string; end_time: string }>) =>
      request<{ ok: boolean }>(`/services/host/${id}/availability`, {
        method: 'PUT',
        body: JSON.stringify({ windows }),
      }),
    addTimeOff: (id: string, body: { starts_at: string; ends_at: string; reason?: string }) =>
      post<{ id: string }>(`/services/host/${id}/time-off`, body),
    removeTimeOff: (id: string, offId: string) =>
      request<{ ok: boolean }>(`/services/host/${id}/time-off/${offId}`, { method: 'DELETE' }),
    submit: (id: string) => post<{ status: string }>(`/services/host/${id}/submit`),
    remove: (id: string) =>
      request<{ deleted?: boolean; archived?: boolean }>(`/services/host/${id}`, { method: 'DELETE' }),
    reply: (reviewId: string, reply: string) =>
      post<{ ok: boolean }>(`/services/host/reviews/${reviewId}/reply`, { reply }),
  },
};

// ── Map ──────────────────────────────────────────────────────────────────────
export type MapMarker = {
  kind: 'stay' | 'event' | 'service';
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle: string;
  price: number | null;
  currency: string;
  unit?: string | null;
  rating?: number | null;
  image?: string | null;
  icon?: string | null;
  starts_at?: string;
  radius_km?: number;
  href: string;
};
export type MapArea = { minLat: number; maxLat: number; minLng: number; maxLng: number };
export const mapApi = {
  markers: (area: MapArea, kinds: string[], q?: string, category?: string) =>
    request<{ markers: MapMarker[]; counts: Record<string, number>; capped: boolean }>(
      `/map/markers?${qs({ ...area, kinds: kinds.join(','), q, category })}`,
    ),
};
