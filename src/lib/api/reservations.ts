import { request } from '@/lib/api';

export type ReservationLineInput = {
  room_id?: string | null;
  start_date: string;
  end_date?: string;
  start_time?: string;
  hours?: number;
};

export type SpaceRules = {
  id: string;
  name: string;
  check_in_time: string;
  check_out_time: string;
  buffer_minutes: number;
  opens_at: string;
  closes_at: string;
  house_rules?: string | null;
  quiet_hours?: string | null;
  smoking_allowed: boolean;
  parties_allowed: boolean;
};
export type BusyRange = { room_id: string | null; starts_at: string; blocks_until: string };
export type SpaceAvailability = { rules: SpaceRules; busy: BusyRange[] };

export type QuoteLine = {
  room_id: string | null;
  room_label: string | null;
  unit: 'hour' | 'day' | 'week' | 'month' | 'year';
  quantity: number;
  stay_label: string;
  start_date: string;
  end_date: string;
  starts_at: string | null;
  ends_at: string | null;
  price_per_unit: number;
  stay_total: number;
  property_amount: number;
  guest_service_fee: number;
  security_deposit: number;
  final_amount: number;
  discount_label: string | null;
};
export type ReservationQuote = {
  currency: string;
  lines: QuoteLine[];
  stay_total: number;
  property_amount: number;
  guest_service_fee: number;
  security_deposit: number;
  final_amount: number;
  guests: number | null;
  capacity: number | null;
  requires_host_acceptance: boolean;
  cancellation_policy?: {
    name: string;
    description?: string | null;
    tiers: Array<{ days_before_start: number; refund_percentage: number }>;
  } | null;
  check_in_time: string;
  check_out_time: string;
};

export type ReservationBooking = {
  id: string;
  room_id: string | null;
  start_date: string;
  end_date: string;
  starts_at: string;
  ends_at: string;
  pricing_period: string;
  status: string;
  final_amount: number;
  total_amount: number;
  security_deposit: number | null;
  guest_service_fee: number | null;
  reservation_stage: string | null;
  host_acceptance_deadline: string | null;
  room?: { room_label?: string | null } | null;
};
export type Reservation = {
  id: string;
  renter_id: string;
  property_id: string;
  guests: number | null;
  currency: string;
  total_charge: number;
  paid_at: string | null;
  requires_host_acceptance: boolean;
  created_at: string;
  property?: {
    id: string;
    name: string;
    city?: string | null;
    check_in_time?: string;
    check_out_time?: string;
    house_rules?: string | null;
    property_images?: Array<{ public_url: string; sort_order?: number }>;
  } | null;
  bookings: ReservationBooking[];
};

const json = (body: unknown) => ({ method: 'POST', body: JSON.stringify(body) });

export const reservationsApi = {
  availability: (propertyId: string, from: string, to: string) =>
    request<SpaceAvailability>(`/reservations/availability/${propertyId}?from=${from}&to=${to}`),
  quote: (property_id: string, lines: ReservationLineInput[], guests?: number) =>
    request<ReservationQuote>('/reservations/quote', json({ property_id, lines, guests })),
  create: (input: { property_id: string; lines: ReservationLineInput[]; guests?: number; notes?: string }) =>
    request<Reservation>('/reservations', json(input)),
  get: (id: string) => request<Reservation>(`/reservations/my/${id}`),
  startPayment: (id: string) =>
    request<{ reference: string; amount: number; currency: string }>(`/reservations/my/${id}/pay`, json({})),
  confirm: (id: string, reference: string) =>
    request<Reservation>(`/reservations/my/${id}/confirm`, json({ reference })),
};
