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
  price_per_period: number;
  pricing_period?: string;
  currency?: string;
  is_available?: boolean;
};

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
