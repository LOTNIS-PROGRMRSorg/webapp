export type AuthUser = {
  id: string;
  email: string;
  accessToken: string;
  refreshToken: string;
};

export type Profile = {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  role?: 'user' | 'host' | 'admin' | null;
};

export type PropertyImage = {
  id?: string;
  public_url: string;
  tag?: string;
  sort_order?: number;
};

export type Room = {
  id: string;
  room_label?: string;
  description?: string | null;
  price_per_period: number;
  pricing_period?: string;
  currency?: string;
  is_available?: boolean;
  deleted_at?: string | null;
  capacity?: number | null;
  bed_type?: string | null;
  private_bathroom?: boolean | null;
  size_sqm?: number | null;
  min_stay?: number | null;
  max_stay?: number | null;
  room_images?: PropertyImage[];
};

/** Whole property, room by room, or either. */
export type BookingMode = 'entire' | 'rooms' | 'both';

export type Property = {
  id: string;
  name: string;
  tagline?: string | null;
  description?: string | null;
  category?: string;
  sub_type?: string;
  city?: string;
  state?: string | null;
  country?: string;
  formatted_address?: string | null;
  price?: number | null;
  pricing_period?: string | null;
  currency?: string | null;
  rating?: number | null;
  review_count?: number | null;
  featured?: boolean;
  verified?: boolean;
  pet_friendly?: boolean;
  parking_available?: boolean;
  property_images?: PropertyImage[];
  rooms?: Room[];
  approval_status?: string;
  allows_individual_bookings?: boolean;
  booking_mode?: BookingMode | null;
  size_sqm?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  max_guests?: number | null;
  furnished?: boolean | null;
  ceiling_height_m?: number | null;
  loading_access?: boolean | null;
  access_24h?: boolean | null;
  power_backup?: boolean | null;
  utilities_included?: boolean | null;
  security_deposit?: number | null;
  minimum_stay?: number | null;
  max_stay?: number | null;
  cancellation_policy?: string;
  cancellation_policy_id?: string | null;
  requires_host_acceptance?: boolean;
  street_address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distance_km?: number;
};

export type Booking = {
  id: string;
  property_id: string;
  start_date: string;
  end_date: string;
  final_amount: number;
  currency_snapshot: string;
  status: string;
  payment_deadline?: string;
  payment_reference?: string | null;
  total_amount?: number;
  platform_fee?: number | null;
  landlord_payout?: number | null;
  tenant_refund_amount?: number | null;
  refund_status?: string | null;
  created_at?: string;
  property?: Property;
  renter?: { id: string; first_name?: string | null; last_name?: string | null; email?: string | null } | null;
  guest_service_fee?: number | null;
  host_commission?: number | null;
  requires_host_acceptance?: boolean;
  reservation_stage?:
    | 'instant'
    | 'awaiting_host_acceptance'
    | 'awaiting_payment'
    | 'secured'
    | 'host_acceptance_expired'
    | 'payment_window_expired';
  host_accepted_at?: string | null;
  host_acceptance_deadline?: string | null;
  payment_deadline_at?: string | null;
  host_response_note?: string | null;
  duration?: number;
  security_deposit?: number | null;
  pricing_period?: string;
  cancellation_policy?: string;
  cancellation_reason?: string | null;
  refund?: BookingRefund | null;
};

export type Transaction = {
  id: string;
  booking_id: string;
  service: 'accommodation' | 'food' | 'event' | 'provider';
  status: string;
  currency: string;
  gross_amount: number;
  platform_fee: number;
  host_payout: number;
  payment_reference?: string | null;
  created_at: string;
  property?: Pick<Property, 'id' | 'name' | 'city' | 'country'>;
};

export type HostVerificationStatus = 'pending' | 'under_review' | 'verified' | 'rejected' | 'suspended';

export type HostProfile = {
  id: string;
  user_id: string;
  categories: string[];
  account_type: 'individual' | 'business';
  verification_status: HostVerificationStatus;
  verified_at?: string | null;
  legal_first_name?: string | null;
  legal_last_name?: string | null;
  date_of_birth?: string | null;
  nationality?: string | null;
  business_name?: string | null;
  business_tax_id?: string | null;
  business_website?: string | null;
  business_phone?: string | null;
  business_email?: string | null;
  display_name: string;
  phone?: string | null;
  street_address: string;
  city: string;
  state?: string | null;
  postal_code?: string | null;
  country: string;
  gov_id_front_image_url?: string | null;
  gov_id_back_image_url?: string | null;
  selfie_image_url?: string | null;
  biz_certificate_image_url?: string | null;
  proof_image_url?: string | null;
  payout_method?: 'bank' | 'mobile_money' | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_account_name?: string | null;
  momo_provider?: string | null;
  momo_number?: string | null;
  created_at: string;
  updated_at: string;
};

export type HostStatusHistory = {
  id: string;
  host_profile_id: string;
  previous_status: HostVerificationStatus | null;
  new_status: HostVerificationStatus;
  reason: string | null;
  notes: string | null;
  created_at: string;
};

export type HostRequirementReview = {
  requirement: 'identity' | 'phone' | 'ownership' | 'business' | 'tax' | 'payout';
  status: 'pending' | 'approved' | 'rejected' | 'changes_required';
  note?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: { reason: string } | null;
};

export type BookingRefund = {
  id: string;
  status: 'pending' | 'processing' | 'processed' | 'failed';
  refund_amount: number;
  refund_percentage?: number;
  refund_reference?: string | null;
  refund_method?: string | null;
  processed_at?: string | null;
  created_at?: string;
  currency: string;
  host_receives?: number;
};

export type PolicyTier = { days_before_start: number; refund_percentage: number };

export type CancellationPreview = {
  is_paid: boolean;
  full_refund: boolean;
  currency: string;
  policy_applied: string;
  policy_name: string;
  policy_tiers: PolicyTier[];
  days_until_checkin: number;
  refund_percentage: number;
  total_paid: number;
  property_amount: number;
  guest_service_fee: number;
  security_deposit: number;
  refund_property_amount: number;
  refund_fee_amount: number;
  refund_deposit_amount: number;
  tenant_refund: number;
  landlord_receives: number;
  platform_keeps: number;
};

export type StayQuote = {
  unit: 'hour' | 'day' | 'week' | 'month' | 'year';
  quantity: number;
  stay_label: string;
  price_per_unit: number;
  currency: string;
  stay_total: number;
  property_amount: number;
  discount_label: string | null;
  guest_service_fee: number;
  security_deposit: number;
  final_amount: number;
  min_stay: number | null;
  max_stay: number | null;
  requires_host_acceptance: boolean;
  cancellation_policy: { code: string; name: string; description?: string | null; tiers: PolicyTier[] } | null;
};

export type CatalogOptions = {
  services: Array<{ key: string; label: string; status: 'active' | 'coming_soon' }>;
  property_types: Array<{ id: string; name: string; slug: string; category: 'residential' | 'hospitality' | 'commercial'; applicable_fields: Record<string, boolean> }>;
  rental_units: Array<{ code: 'hour' | 'day' | 'week' | 'month' | 'year'; label: string; per: string; quantity: string; bookable: boolean }>;
  cancellation_policies: Array<{ id: string; code: string; name: string; description?: string | null; tiers: PolicyTier[]; summary: string[] }>;
  locations: { country: string; regions: string[]; cities: CatalogCity[] };
};

export type CatalogCity = { name: string; slug: string; region: string; lat: number; lng: number; aliases: string[] };

export type HostAccessState =
  | 'not_applied' | 'draft' | 'action_required' | 'submitted' | 'in_review' | 'verified' | 'suspended';

export type HostAccess = {
  state: HostAccessState;
  can_access_dashboard: boolean;
  verification_status: string | null;
  items: Array<{ requirement: string; status: string; reason: string | null; note: string | null }>;
  message: string | null;
  submitted_at: string | null;
  review_started_at: string | null;
  last_admin_nudge_at: string | null;
  can_nudge: boolean;
  next_nudge_at: string | null;
};

export type AppNotification = {
  id: string;
  audience: 'user' | 'host' | 'admin';
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

export type ExitStatus = 'notice_given' | 'host_responded' | 'moved_out' | 'in_dispute' | 'settled' | 'withdrawn';

export type ExitSettlement = {
  currency: string;
  departure?: string;
  notice_nights_required?: number;
  nights_total: number;
  nights_stayed: number;
  advance_notice_days: number;
  notice_nights_charged: number;
  relet_credit_nights: number;
  nights_charged?: number;
  nights_refunded: number;
  nightly_rate?: number;
  rent_refund: number;
  fee_refund: number;
  deposit_held: number;
  deposit_note?: string | null;
  deductions_total?: number;
  deposit_returned?: number;
  total_refund?: number;
  estimated_refund_before_deposit?: number;
  host_receives: number;
  platform_keeps: number;
};

export type ExitDeduction = {
  id: string;
  amount: number;
  reason: string;
  evidence_urls: string[];
  status: 'proposed' | 'accepted' | 'disputed' | 'upheld' | 'reduced' | 'waived';
  guest_comment?: string | null;
  admin_note?: string | null;
  final_amount?: number | null;
  created_at: string;
};

export type ExitEvent = {
  id: string; actor_role: 'guest' | 'host' | 'admin' | 'system'; actor_name?: string | null;
  event: string; note?: string | null; data: Record<string, unknown>; created_at: string;
};

export type ExitCaseSummary = {
  id: string; booking_id: string; kind: 'early_departure' | 'checkout'; status: ExitStatus;
  planned_checkout: string; actual_checkout?: string | null; notice_given_at: string;
  reason?: string | null; reason_category?: string | null;
  host_response?: string | null; relet_from?: string | null; host_at_fault: boolean;
  total_refund?: number | null; rent_refund?: number | null; deposit_returned?: number | null;
  admin_override_reason?: string | null; created_at: string;
  booking: {
    id: string; start_date: string; end_date: string; currency_snapshot: string; security_deposit?: number | null;
    property?: { id: string; name: string; city?: string };
    room?: { id: string; room_label?: string } | null;
  };
};

export type ExitCaseDetail = {
  role: 'guest' | 'host' | 'admin';
  exit: ExitCaseSummary;
  booking: ExitCaseSummary['booking'];
  guest: { name: string | null; phone?: string | null; email?: string | null } | null;
  host: { name: string | null; phone?: string | null; email?: string | null } | null;
  events: ExitEvent[];
  deductions: ExitDeduction[];
  estimate: ExitSettlement | null;
};
