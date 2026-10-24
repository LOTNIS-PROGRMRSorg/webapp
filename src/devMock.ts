// Dev-only: `?mock=<state>` fakes a signed-in session and the authenticated API
// responses so signed-in screens can be previewed (and screenshotted) without real
// accounts. Public endpoints (catalog, explore, quote) still hit the real backend.
// Never loaded in production builds: main.tsx guards on import.meta.env.DEV.
const API = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
const params = new URLSearchParams(location.search);
const state = params.get('mock') || sessionStorage.getItem('lotnis_mock') || 'verified';
sessionStorage.setItem('lotnis_mock', state);
localStorage.setItem('lotnis_web_session', JSON.stringify({ id: 'dev-user', email: 'ama@example.com', accessToken: 'dev', refreshToken: 'dev' }));

const photo = (n: number) => ({ id: `p${n}`, public_url: `/images/landing/${['stay-osu-apartment', 'place-accra', 'place-cape-coast', 'place-aburi', 'place-kumasi'][n % 5]}.webp`, tag: 'gallery', sort_order: n });
const property = { id: 'e890dd25-cd2d-48cd-937a-f5002261dc2f', name: 'Osu Courtyard Apartment', city: 'Accra', country: 'Ghana', sub_type: 'apartment', property_images: [photo(0), photo(1)], approval_status: 'approved', price: 3100, currency: 'GHS', pricing_period: 'month', booking_mode: 'both' };
const roomPhotos = (n: number) => [photo(n), photo(n + 1), photo(n + 2)].map((p, i) => ({ ...p, id: `rp${n}${i}`, tag: 'room' }));
const roomsProperty = {
  ...property, id: 'mock-rooms', name: 'Palm Grove Villa', city: 'Cape Coast', sub_type: 'villa', booking_mode: 'both', allows_individual_bookings: true, price: 12000, security_deposit: 1500,
  bedrooms: 4, bathrooms: 3.5, max_guests: 9, furnished: true, power_backup: true, utilities_included: true, size_sqm: 320, cancellation_policy: 'standard', requires_host_acceptance: false,
  description: 'A sunlit villa a short walk from the beach, with a shared courtyard, fast wifi, a generator and a live-in caretaker. Take the whole house for the family or rent a single room.',
  property_images: [0, 1, 2, 3, 4, 0, 1].map(photo),
  rooms: [
    { id: 'r1', room_label: 'Master suite', description: 'Ocean-facing suite with a private balcony.', price_per_period: 4200, pricing_period: 'month', currency: 'GHS', is_available: true, capacity: 2, bed_type: 'King bed', private_bathroom: true, size_sqm: 28, room_images: roomPhotos(0) },
    { id: 'r2', room_label: 'Garden room', description: 'Quiet room opening on to the courtyard.', price_per_period: 2900, pricing_period: 'month', currency: 'GHS', is_available: true, capacity: 2, bed_type: 'Queen bed', private_bathroom: false, size_sqm: 18, room_images: roomPhotos(2) },
    { id: 'r3', room_label: 'Studio annex', description: 'Self-contained studio with its own entrance.', price_per_period: 3300, pricing_period: 'month', currency: 'GHS', is_available: true, capacity: 1, bed_type: 'Single bed', private_bathroom: true, size_sqm: 20, room_images: [] },
  ],
};
const iso = (d: number) => new Date(Date.now() + d * 86_400_000).toLocaleDateString('en-CA');
const startedBooking = { id: 'b-started', property_id: property.id, start_date: iso(-10), end_date: iso(21), final_amount: 3162, currency_snapshot: 'GHS', status: 'confirmed', security_deposit: 0, guest_service_fee: 62, platform_fee: 155, landlord_payout: 3007, total_amount: 3100, property, renter: { id: 'g1', first_name: 'Kofi', last_name: 'Mensah', email: 'kofi@example.com' }, reservation_stage: 'secured', created_at: iso(-12) };
const requestBooking = { ...startedBooking, id: 'b-request', start_date: iso(14), end_date: iso(45), status: 'pending', reservation_stage: 'awaiting_host_acceptance', host_acceptance_deadline: iso(2) };
const futureBooking = { ...startedBooking, id: 'b-future', start_date: iso(20), end_date: iso(51), reservation_stage: 'secured' };

const access: Record<string, unknown> = {
  verified: { state: 'verified', can_access_dashboard: true, verification_status: 'verified', items: [], message: null, submitted_at: iso(-3), review_started_at: iso(-2), last_admin_nudge_at: null, can_nudge: false, next_nudge_at: null },
  action_required: { state: 'action_required', can_access_dashboard: false, verification_status: 'under_review', items: [{ requirement: 'identity', status: 'rejected', reason: 'The ID photo is blurry', note: 'Retake it in daylight, all four corners visible' }, { requirement: 'phone', status: 'changes_required', reason: null, note: 'The number did not match your ID' }], message: null, submitted_at: iso(-3), review_started_at: iso(-2), last_admin_nudge_at: null, can_nudge: false, next_nudge_at: null },
  submitted: { state: 'submitted', can_access_dashboard: false, verification_status: 'pending', items: [], message: null, submitted_at: iso(-1), review_started_at: null, last_admin_nudge_at: null, can_nudge: true, next_nudge_at: null },
  in_review: { state: 'in_review', can_access_dashboard: false, verification_status: 'under_review', items: [], message: null, submitted_at: iso(-1), review_started_at: iso(0), last_admin_nudge_at: iso(0), can_nudge: false, next_nudge_at: iso(1) },
  draft: { state: 'draft', can_access_dashboard: false, verification_status: 'pending', items: [], message: null, submitted_at: null, review_started_at: null, last_admin_nudge_at: null, can_nudge: false, next_nudge_at: null },
  not_applied: { state: 'not_applied', can_access_dashboard: false, verification_status: null, items: [], message: null, submitted_at: null, review_started_at: null, last_admin_nudge_at: null, can_nudge: false, next_nudge_at: null },
};

const settlement = { currency: 'GHS', nights_total: 31, nights_stayed: 12, advance_notice_days: 3, notice_nights_charged: 4, relet_credit_nights: 1, nights_refunded: 16, rent_refund: 1600, fee_refund: 0, deposit_held: 500, deductions_total: 150, deposit_returned: 350, total_refund: 1950, host_receives: 1450, platform_keeps: 112, nightly_rate: 100 };
const exitBooking = { ...startedBooking, security_deposit: 500, property };
const mkExit = (status: string) => ({ id: 'x1', booking_id: 'b-started', kind: 'early_departure', status, planned_checkout: iso(2), actual_checkout: status === 'moved_out' || status === 'in_dispute' ? iso(2) : null, notice_given_at: iso(-1), reason: 'Relocating for work to Takoradi.', host_response: 'Noted — please return the keys on the day.', relet_from: iso(5), host_at_fault: false, booking: exitBooking });
const exitDetail = (role: string, status = 'in_dispute') => ({
  role, exit: mkExit(status), booking: exitBooking,
  guest: { name: 'Kofi Mensah', phone: '024 000 0001' }, host: { name: 'Ama Owusu', phone: '024 000 0002' },
  events: [
    { id: 'e1', actor_role: 'guest', actor_name: 'Kofi Mensah', event: 'notice_given', note: 'Relocating for work to Takoradi.', data: {}, created_at: iso(-1) },
    { id: 'e2', actor_role: 'host', actor_name: 'Ama Owusu', event: 'host_responded', note: 'Noted — please return the keys on the day.', data: {}, created_at: iso(-1) },
    { id: 'e3', actor_role: 'host', actor_name: 'Ama Owusu', event: 'moved_out', note: null, data: {}, created_at: iso(0) },
    { id: 'e4', actor_role: 'host', actor_name: 'Ama Owusu', event: 'deduction_proposed', note: 'Cracked bathroom mirror', data: {}, created_at: iso(0) },
    { id: 'e5', actor_role: 'guest', actor_name: 'Kofi Mensah', event: 'deduction_disputed', note: 'The mirror was already cracked when I arrived.', data: {}, created_at: iso(0) },
  ],
  deductions: [
    { id: 'd1', amount: 150, reason: 'Cracked bathroom mirror', evidence_urls: [photo(1).public_url, photo(2).public_url], status: 'disputed', guest_comment: 'The mirror was already cracked when I arrived.', created_at: iso(0) },
    { id: 'd2', amount: 100, reason: 'Deep clean of the kitchen', evidence_urls: [photo(3).public_url], status: 'proposed', created_at: iso(0) },
  ],
  estimate: settlement,
});

const ok = (data: unknown, status = 200) => new Response(JSON.stringify({ success: true, data }), { status, headers: { 'content-type': 'application/json' } });
const fail = (error: string, status = 404) => new Response(JSON.stringify({ success: false, error }), { status, headers: { 'content-type': 'application/json' } });

function quoteFor(body: { start_date: string; end_date: string; room_id?: string }) {
  const months = Math.max(1, Math.round((new Date(body.end_date).getTime() - new Date(body.start_date).getTime()) / (30.4 * 86_400_000)));
  const price = body.room_id ? ({ r1: 4200, r2: 2900, r3: 3300 } as Record<string, number>)[body.room_id] ?? 3000 : 12000;
  const total = price * months; const fee = Math.round(total * 0.02 * 100) / 100;
  return { unit: 'month', quantity: months, stay_label: `${months} month${months === 1 ? '' : 's'}`, price_per_unit: price, currency: 'GHS', stay_total: total, property_amount: total, discount_label: null, guest_service_fee: fee, security_deposit: 1500, final_amount: total + fee + 1500, min_stay: 1, max_stay: null, requires_host_acceptance: false, cancellation_policy: { code: 'standard', name: 'Standard', tiers: [{ days_before_start: 7, refund_percentage: 100 }, { days_before_start: 3, refund_percentage: 50 }, { days_before_start: 0, refund_percentage: 0 }] } };
}

function handle(path: string, method: string, init?: RequestInit): Response | undefined {
  if (path === '/explore/mock-rooms') return new Response(JSON.stringify(roomsProperty), { headers: { 'content-type': 'application/json' } });
  if (path === '/bookings/quote' && String(init?.body).includes('mock-rooms')) return new Response(JSON.stringify(quoteFor(JSON.parse(String(init?.body)))), { headers: { 'content-type': 'application/json' } });
  if (path === '/host/me/access') return ok(access[state] ?? access.verified);
  if (path === '/host/me' && method === 'GET') return state === 'not_applied' ? fail('Host profile not found') : ok({ id: 'h1', user_id: 'dev-user', account_type: 'individual', verification_status: 'pending', display_name: "Ama's Homes", legal_first_name: 'Ama', legal_last_name: 'Owusu', phone: '024 000 0002', street_address: '12 Oak St', city: 'Accra', country: 'Ghana', payout_method: 'mobile_money', momo_provider: 'MTN MoMo', momo_number: '0240000002', gov_id_front_image_url: photo(1).public_url, selfie_image_url: photo(2).public_url, created_at: iso(-5), updated_at: iso(-1), categories: ['property'] });
  if (path === '/host/me/requirements') return ok([]);
  if (path === '/host/me' && method === 'PUT') return ok({ id: 'h1' });
  if (path.startsWith('/host/upload/')) return ok({ url: photo(1).public_url });
  if (path === '/host/me/nudge') return ok({ ...(access.in_review as object) });
  if (path === '/notifications/unread-count') return ok({ count: 3 });
  if (path === '/notifications') return ok([
    { id: 'n1', audience: 'user', type: 'exit.host_responded', title: 'Your host responded', body: 'Noted — please return the keys on the day.', data: { exit_id: 'x1' }, read_at: null, created_at: iso(0) },
    { id: 'n2', audience: 'user', type: 'refund.processed', title: 'Your refund has been sent', body: 'GHS 600.00 for Osu Courtyard Apartment via Paystack refund (ref RF-123).', data: {}, read_at: null, created_at: iso(-1) },
    { id: 'n3', audience: 'host', type: 'booking.requested', title: 'New booking request', body: 'Osu Courtyard Apartment: respond within 48 hours.', data: {}, read_at: iso(-1), created_at: iso(-2) },
  ]);
  if (path === '/bookings/host') return new Response(JSON.stringify({ data: [requestBooking, startedBooking, futureBooking], total: 3 }), { headers: { 'content-type': 'application/json' } });
  if (path === '/bookings/host/transactions') return ok([{ id: 't1', booking_id: 'b-started', service: 'accommodation', status: 'paid', currency: 'GHS', gross_amount: 3162, platform_fee: 155, host_payout: 3007, created_at: iso(-12), property }]);
  if (path === '/property/mine') return new Response(JSON.stringify([{ ...property, rooms: [{ id: 'r1', room_label: 'Master room' }, { id: 'r2', room_label: 'Room 2' }] }, { ...property, id: 'p2', name: 'Tema Warehouse', sub_type: 'warehouse', approval_status: 'pending', booking_mode: 'entire' }]), { headers: { 'content-type': 'application/json' } });
  if (path === '/bookings/my') return new Response(JSON.stringify({ data: [startedBooking, { ...futureBooking, id: 'b-f2' }], total: 2 }), { headers: { 'content-type': 'application/json' } });
  if (path.startsWith('/bookings/my/') && path.endsWith('/cancellation-preview')) return new Response(JSON.stringify({ is_paid: true, full_refund: false, currency: 'GHS', policy_applied: 'standard', policy_name: 'Standard', policy_tiers: [{ days_before_start: 7, refund_percentage: 100 }, { days_before_start: 3, refund_percentage: 50 }, { days_before_start: 0, refund_percentage: 0 }], days_until_checkin: 5, refund_percentage: 50, total_paid: 1120, property_amount: 1000, guest_service_fee: 20, security_deposit: 100, refund_property_amount: 500, refund_fee_amount: 0, refund_deposit_amount: 100, tenant_refund: 600, landlord_receives: 485, platform_keeps: 35 }), { headers: { 'content-type': 'application/json' } });
  if (path.startsWith('/bookings/my/')) return new Response(JSON.stringify({ ...startedBooking, id: path.split('/').pop(), status: path.includes('pay') ? 'pending' : 'confirmed', reservation_stage: 'awaiting_payment', payment_deadline_at: iso(2) }), { headers: { 'content-type': 'application/json' } });
  if (path === '/bookings' && method === 'POST') return new Response(JSON.stringify({ ...startedBooking, id: 'b-new', status: 'pending', reservation_stage: 'awaiting_payment' }), { status: 201, headers: { 'content-type': 'application/json' } });
  if (path === '/exits/mine') return ok([mkExit('host_responded')]);
  if (path === '/exits/host') return ok([mkExit('in_dispute'), { ...mkExit('notice_given'), id: 'x2' }]);
  if (path === '/exits/preview') return ok({ ...settlement, deductions_total: undefined, deposit_returned: undefined, total_refund: undefined });
  if (path.startsWith('/exits/') && method === 'GET') return ok(exitDetail(state.startsWith('host') ? 'host' : 'guest', state === 'exit_notice' ? 'host_responded' : 'in_dispute'));
  return undefined;
}

const realFetch = window.fetch.bind(window);
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (!url.startsWith(API)) return realFetch(input, init);
  const path = url.slice(API.length).split('?')[0];
  return handle(path, (init?.method || 'GET').toUpperCase(), init) ?? realFetch(input, init);
};
console.info(`[devMock] signed in as a fake user, state="${state}"`);
