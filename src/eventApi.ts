import { request } from './api';

export type FeeMode = 'included' | 'on_top';
export type RefundTier = { days_before: number; percent: number };
export type VotingState = 'open' | 'not_published' | 'cancelled' | 'not_started' | 'closed' | 'category_closed';
export type EventStatus = 'draft' | 'pending_review' | 'published' | 'rejected' | 'cancelled' | 'suspended';

export type TicketTypeView = {
  id: string; name: string; description?: string | null; price: number; is_free: boolean;
  status: 'on_sale' | 'sold_out' | 'not_started' | 'ended' | 'unavailable'; remaining: number | null;
  sales_start?: string | null; sales_end?: string | null; min_per_order: number; max_per_order: number;
};

export type EventCard = {
  id: string; slug: string; title: string; category: string; summary?: string | null; cover_image_url?: string | null;
  venue_name: string; city: string; region?: string | null; starts_at: string; ends_at: string; currency: string; status: EventStatus;
  postponed: boolean; voting_enabled: boolean; from_price?: number | null; sold_out?: boolean; has_free?: boolean;
};

export type Nominee = { id: string; name: string; code?: string | null; bio?: string | null; photo_url?: string | null; votes: number | null; rank?: number | null };
export type VoteCategory = { id: string; name: string; description?: string | null; price_per_vote: number; is_open: boolean; nominees: Nominee[] };

export type EventDetail = EventCard & {
  description: string; address?: string | null; latitude?: number | null; longitude?: number | null; gallery: string[];
  doors_open_at?: string | null; age_limit?: string | null; dress_code?: string | null; entry_rules?: string | null; terms?: string | null;
  contact_phone?: string | null; contact_email?: string | null; fee_mode: FeeMode; max_tickets_per_order: number;
  postponed_from?: string | null; postponed_refund_deadline?: string | null; cancellation_reason?: string | null;
  refund_policy: 'none' | 'tiers'; refund_tiers: RefundTier[]; refund_summary: string[];
  postponement_policy: 'carry_over' | 'carry_over_or_refund' | 'refund_all'; postponement_refund_days: number;
  ticket_types: TicketTypeView[]; host: { name: string; verified: boolean; type: string; city?: string } | null;
  processing_fee_percent: number; commission_percent: number; rating: { average: number; count: number } | null;
  voting: null | { open: boolean; state: VotingState; opens_at?: string | null; closes_at?: string | null; show_counts: boolean; vote_commission_percent: number; categories: VoteCategory[] };
  is_owner: boolean;
};

export type Quote = {
  currency: string; fee_mode: FeeMode; subtotal: number; service_fee: number; processing_fee: number; total: number; free?: boolean;
  lines: Array<{ ticket_type_id?: string; name?: string; quantity?: number; unit_price?: number; unit_fee?: number; nominee?: string; category?: string; votes?: number; amount?: number }>;
};

export type CheckoutResult = {
  free: boolean; order_id: string; access_token: string; reference?: string; email?: string; amount_pesewas?: number; currency?: string;
  subtotal?: number; service_fee?: number; processing_fee?: number; total?: number;
};

export type OrderTicket = {
  id: string; code: string; holder_email: string; holder_name?: string | null; status: 'valid' | 'used' | 'refund_pending' | 'refunded' | 'cancelled' | 'void';
  price: number; service_fee: number; used_at?: string | null; refunded_at?: string | null; refund_percent?: number | null; refundable: boolean; ticket_type?: { id: string; name: string } | null;
};
export type RefundRequestRow = { id: string; status: 'pending' | 'approved' | 'rejected' | 'processed' | 'failed'; amount: number; refund_percent: number; trigger: string; reason?: string | null; admin_note?: string | null; refund_reference?: string | null; created_at: string; processed_at?: string | null; ticket_ids?: string[] };

export type OrderView = {
  order: { id: string; kind: 'ticket' | 'vote'; status: string; currency: string; subtotal: number; service_fee: number; processing_fee: number; total: number; refunded_amount: number; buyer_email: string; buyer_name?: string | null; paid_at?: string | null; created_at: string };
  access_token?: string;
  event: { id: string; slug: string; title: string; venue_name: string; address?: string | null; city: string; starts_at: string; ends_at: string; cover_image_url?: string | null; status: EventStatus; postponed: boolean; postponed_refund_deadline?: string | null; entry_rules?: string | null };
  tickets: OrderTicket[]; votes?: Array<{ nominee_id: string; category_id: string; votes: number; amount: number }>;
  refund: { eligible: boolean; percent: number; reason: string }; refund_requests: RefundRequestRow[];
};

export type TicketView = {
  ticket: { code: string; status: OrderTicket['status']; holder_name?: string | null; holder_email: string; type?: string; used_at?: string | null };
  event: { title: string; venue_name: string; address?: string | null; city: string; starts_at: string; ends_at: string; cover_image_url?: string | null; status: EventStatus; slug: string; entry_rules?: string | null; postponed: boolean };
  can_review: boolean; review: { id: string; rating: number; comment?: string | null } | null;
};

export type ScanResult = {
  result: 'valid' | 'already_used' | 'not_found' | 'refunded' | 'refund_pending' | 'cancelled' | 'wrong_event' | 'outside_window' | 'event_cancelled';
  ticket_type?: string; holder_name?: string | null; holder_email?: string | null; used_at?: string; used_gate?: string; admitted_total?: number; starts_at?: string; ends_at?: string;
};

export type GateRow = { id: string; name: string; assigned_to?: string | null; is_active: boolean; has_pin: boolean; last_used_at?: string | null; created_at: string };

export type EventStats = {
  tickets_sold: number; tickets_scanned: number; tickets_refunded: number; orders_paid: number;
  ticket_gross: number; ticket_commission: number; ticket_host_net: number; refunded_amount: number;
  votes_total: number; vote_gross: number; vote_commission: number; vote_host_net: number; refund_requests_pending: number;
  review_count: number; review_average: number | null;
  by_ticket_type: Array<{ id: string; name: string; price: number; quantity: number | null; reserved: number; sold: number; scanned: number; refunded: number }>;
  by_gate: Array<{ id: string; name: string; is_active: boolean; last_used_at: string | null; admitted: number; rejected: number }>;
  scan_results: Record<string, number>; scans_by_hour: Array<{ hour: string; count: number }>;
};

export type HostEventOverview = {
  event: Record<string, any> & { id: string; slug: string; title: string; status: EventStatus; starts_at: string; ends_at: string; currency: string; fee_mode: FeeMode };
  stats: EventStats; ticket_types: any[];
  payout: { awaiting_release: number; due: number; on_hold: number; processing: number; paid: number; next_release_at: string | null; currency: string };
  host: { name: string; verified: boolean } | null;
};

export type VotePage = {
  event: { id: string; slug: string; title: string; cover_image_url?: string | null; venue_name: string; city: string; starts_at: string; ends_at: string; currency: string; fee_mode: FeeMode; status: EventStatus };
  voting: { open: boolean; state: VotingState; closed: boolean; opens_at?: string | null; closes_at?: string | null; show_counts: boolean; vote_commission_percent: number; processing_fee_percent: number };
  category: { id: string; name: string; description?: string | null; price_per_vote: number; is_open: boolean; total_votes: number | null; nominee_count: number };
  nominees: Nominee[]; nominee: Nominee | null;
};

export type Paged<T> = { data: T[]; total: number; page: number; limit: number };
const qs = (o: Record<string, string | number | undefined | null>) => {
  const p = new URLSearchParams();
  Object.entries(o).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') p.set(k, String(v)); });
  const s = p.toString();
  return s ? `?${s}` : '';
};
const post = <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) });
const patch = <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) });
const del = <T>(path: string) => request<T>(path, { method: 'DELETE' });

// ── Payouts (shared by every service) ───────────────────────────────────────────
export type PayoutMethod = { id: string; kind: 'momo' | 'bank'; provider: string; account_number: string; account_number_masked: string; account_name: string; is_default: boolean };
export type PayoutOptions = { momo_networks: string[]; banks: string[] };
export type PayoutBucket = 'awaiting_release' | 'due' | 'on_hold' | 'processing' | 'paid';
export type PayoutTotals = Record<PayoutBucket, number>;
export type PayoutSummary = {
  currency: string; totals: PayoutTotals; adjustments: number; next_release_at: string | null;
  by_service: Array<{ service: string; label: string } & PayoutTotals>;
  payout_details: null | { method: 'bank' | 'mobile_money'; bank_name?: string; account_number?: string; account_name?: string; provider?: string; number?: string };
};
export type PayoutItem = {
  id: string; service: string; service_label: string; kind: string; amount: number; gross: number | null; commission: number; refunded_amount: number; currency: string;
  status: string; created_at?: string; bucket: PayoutBucket | null; release_at: string | null; on_hold: boolean; hold_reason: string | null; paid_at: string | null; title: string; detail: string | null; provider_reference: string | null;
};

export const eventApi = {
  categories: () => request<string[]>('/events/categories'),
  fees: () => request<{ ticket_commission_percent: number; vote_commission_percent: number; processing_fee_percent: number }>('/events/fees'),
  cities: () => request<Array<{ city: string; count: number }>>('/events/cities'),
  list: (params: Record<string, string | number | undefined>) => request<Paged<EventCard>>(`/events${qs(params)}`),
  get: (idOrSlug: string) => request<EventDetail>(`/events/${idOrSlug}`),
  votePage: (idOrSlug: string, categoryId: string, nomineeId?: string) => request<VotePage>(`/events/${idOrSlug}/vote/${categoryId}${nomineeId ? `/${nomineeId}` : ''}`),
  reviews: (idOrSlug: string) => request<Array<{ id: string; reviewer_name?: string | null; rating: number; comment?: string | null; host_reply?: string | null; created_at: string }>>(`/events/${idOrSlug}/reviews`),
  quote: (id: string, items: Array<{ ticket_type_id: string; quantity: number }>) => post<Quote>(`/events/${id}/quote`, { items }),
  checkout: (id: string, body: { email?: string; name?: string; phone?: string; tickets: Array<{ ticket_type_id: string; holder_email?: string; holder_name?: string }>; accepted_terms: boolean }) => post<CheckoutResult>(`/events/${id}/checkout`, body),
  voteQuote: (id: string, votes: Array<{ nominee_id: string; votes: number }>) => post<Quote>(`/events/${id}/vote-quote`, { votes }),
  voteCheckout: (id: string, body: { email?: string; name?: string; votes: Array<{ nominee_id: string; votes: number }>; accepted_terms: boolean }) => post<CheckoutResult>(`/events/${id}/vote-checkout`, body),
  confirm: (orderId: string, reference: string, token?: string) => post<OrderView>(`/events/orders/${orderId}/confirm`, { reference, token }),
  newReference: (orderId: string, token: string) => post<{ reference: string; amount_pesewas: number; currency: string }>(`/events/orders/${orderId}/new-reference`, { token }),
  order: (orderId: string, token?: string) => request<OrderView>(`/events/orders/${orderId}${qs({ token })}`),
  requestRefund: (orderId: string, body: { token?: string; ticket_ids: string[]; reason?: string }) => post(`/events/orders/${orderId}/refund-request`, body),
  ticket: (code: string) => request<TicketView>(`/events/tickets/${code}`),
  review: (code: string, body: { rating: number; comment?: string; name?: string }) => post(`/events/tickets/${code}/review`, body),
  mine: () => request<{ tickets: Array<{ id: string; code: string; status: string; holder_name?: string | null; type?: string; event?: any; order_id: string }>; orders: Array<{ id: string; kind: string; status: string; total: number; currency: string; access_token: string; event?: any; created_at: string }> }>('/events/my/tickets'),

  // gate scanner (no account)
  scanOpen: (token: string, pin?: string) => post<{ gate: { name: string }; event: { title: string; venue_name: string; city: string; starts_at: string; ends_at: string; status: string }; stats: { admitted_here: number; admitted_total: number; tickets_total: number } }>(`/events/scan/${token}/open`, { pin }),
  scanCheck: (token: string, pin: string | undefined, code: string) => post<ScanResult>(`/events/scan/${token}/check`, { pin, code }),

  // host
  host: {
    list: () => request<Array<Record<string, any>>>('/events/host/events'),
    create: (body: Record<string, unknown>) => post<Record<string, any>>('/events/host/events', body),
    overview: (id: string) => request<HostEventOverview>(`/events/host/events/${id}`),
    update: (id: string, body: Record<string, unknown>) => patch<Record<string, any>>(`/events/host/events/${id}`, body),
    remove: (id: string) => del(`/events/host/events/${id}`),
    submit: (id: string) => post<{ event: Record<string, any>; auto_published: boolean }>(`/events/host/events/${id}/submit`),
    cancel: (id: string, reason: string) => post<{ orders: number; total: number }>(`/events/host/events/${id}/cancel`, { reason }),
    postpone: (id: string, body: { starts_at: string; ends_at: string; reason?: string }) => post(`/events/host/events/${id}/postpone`, body),
    upload: (file: File) => { const f = new FormData(); f.append('file', file); return request<{ url: string }>('/events/host/images', { method: 'POST', body: f }); },
    orders: (id: string, p: Record<string, string | number | undefined>) => request<Paged<any>>(`/events/host/events/${id}/orders${qs(p)}`),
    attendees: (id: string, p: Record<string, string | number | undefined>) => request<Paged<any>>(`/events/host/events/${id}/attendees${qs(p)}`),
    scans: (id: string) => request<any[]>(`/events/host/events/${id}/scans?limit=60`),
    reviews: (id: string) => request<any[]>(`/events/host/events/${id}/reviews`),
    reply: (reviewId: string, reply: string) => post(`/events/host/reviews/${reviewId}/reply`, { reply }),
    refunds: (id: string) => request<any[]>(`/events/host/events/${id}/refunds`),
    votes: (id: string) => request<{ categories: any[]; orders: number; gross: number; commission: number; host_net: number }>(`/events/host/events/${id}/votes`),
    addTicketType: (id: string, body: Record<string, unknown>) => post(`/events/host/events/${id}/ticket-types`, body),
    updateTicketType: (ttId: string, body: Record<string, unknown>) => patch(`/events/host/ticket-types/${ttId}`, body),
    removeTicketType: (ttId: string) => del<{ deleted: boolean; deactivated: boolean }>(`/events/host/ticket-types/${ttId}`),
    gates: (id: string) => request<GateRow[]>(`/events/host/events/${id}/gates`),
    addGate: (id: string, body: { name: string; pin?: string; assigned_to?: string; send_to?: string }) => post<{ gate: GateRow; link: string; token: string; emailed: boolean }>(`/events/host/events/${id}/gates`, body),
    updateGate: (gateId: string, body: Record<string, unknown>) => patch<GateRow>(`/events/host/gates/${gateId}`, body),
    regenerateGate: (gateId: string, body: { send_to?: string } = {}) => post<{ link: string; token: string; emailed: boolean }>(`/events/host/gates/${gateId}/regenerate`, body),
    removeGate: (gateId: string) => del(`/events/host/gates/${gateId}`),
    voteCategories: (id: string) => request<any[]>(`/events/host/events/${id}/vote-categories`),
    addCategory: (id: string, body: Record<string, unknown>) => post(`/events/host/events/${id}/vote-categories`, body),
    updateCategory: (catId: string, body: Record<string, unknown>) => patch(`/events/host/vote-categories/${catId}`, body),
    removeCategory: (catId: string) => del(`/events/host/vote-categories/${catId}`),
    addNominee: (catId: string, body: Record<string, unknown>) => post(`/events/host/vote-categories/${catId}/nominees`, body),
    updateNominee: (nId: string, body: Record<string, unknown>) => patch(`/events/host/nominees/${nId}`, body),
    removeNominee: (nId: string) => del(`/events/host/nominees/${nId}`),
    csvUrl: (id: string) => `/events/host/events/${id}/attendees.csv`,
  },

  // earnings across every service
  payouts: {
    summary: () => request<PayoutSummary>('/payouts/summary'),
    items: (p: Record<string, string | number | undefined> = {}) => request<Paged<PayoutItem>>(`/payouts/items${qs(p)}`),
    methodOptions: () => request<PayoutOptions>('/payouts/methods/options'),
    methods: () => request<PayoutMethod[]>('/payouts/methods'),
    addMethod: (body: { kind: 'momo' | 'bank'; provider: string; account_number: string; account_name: string }) => post<PayoutMethod>('/payouts/methods', body),
    updateMethod: (id: string, body: { account_number?: string; account_name?: string }) => patch<PayoutMethod>(`/payouts/methods/${id}`, body),
    makeDefaultMethod: (id: string) => post<PayoutMethod>(`/payouts/methods/${id}/default`),
    removeMethod: (id: string) => del(`/payouts/methods/${id}`),
    batches: () => request<Array<{ id: string; amount: number; currency: string; status: string; reference?: string | null; paid_at?: string | null; created_at: string; destination: any; items_total: number; adjustments_total: number }>>('/payouts/batches'),
  },
  reportStayIssue: (bookingId: string, body: { category: string; description: string }) => post(`/bookings/my/${bookingId}/report-issue`, body),
};

export const EVENT_STATUS_LABEL: Record<string, string> = {
  draft: 'Draft', pending_review: 'In review', published: 'On sale', rejected: 'Needs changes', cancelled: 'Cancelled', suspended: 'Paused',
};
export const TICKET_STATUS_LABEL: Record<string, string> = {
  valid: 'Valid', used: 'Used', refund_pending: 'Refund pending', refunded: 'Refunded', cancelled: 'Cancelled', void: 'Void',
};
