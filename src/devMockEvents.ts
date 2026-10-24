// Dev-only fixtures for the events screens (loaded through devMock.ts). Lets every events page be previewed
// and screenshotted without the events tables existing in the database.
const day = 86_400_000;
const at = (d: number, h = 18) => { const t = new Date(Date.now() + d * day); t.setHours(h, 0, 0, 0); return t.toISOString(); };
const img = (n: number) => `/images/landing/${['place-accra', 'place-aburi', 'place-cape-coast', 'place-kumasi', 'stay-osu-apartment'][n % 5]}.webp`;
const json = (data: unknown, status = 200) => new Response(JSON.stringify({ success: true, data }), { status, headers: { 'content-type': 'application/json' } });
const err = (error: string, code?: string, status = 400) => new Response(JSON.stringify({ success: false, error, code }), { status, headers: { 'content-type': 'application/json' } });

const cards = [
  { id: 'ev1', slug: 'accra-rooftop-sessions-vol-4', title: 'Accra Rooftop Sessions Vol. 4', category: 'Concert & music', summary: 'Afrobeats, amapiano and sunset over the city.', cover_image_url: img(0), venue_name: 'Skybar, Osu', city: 'Accra', starts_at: at(12), ends_at: at(12, 23), currency: 'GHS', status: 'published', postponed: false, voting_enabled: false, from_price: 80 },
  { id: 'ev2', slug: 'ghana-music-awards-night', title: 'Ghana Music Awards Night', category: 'Awards & pageant', summary: 'Vote for your favourites — the winners are crowned live.', cover_image_url: img(1), venue_name: 'Accra International Conference Centre', city: 'Accra', starts_at: at(30), ends_at: at(30, 23), currency: 'GHS', status: 'published', postponed: false, voting_enabled: true, from_price: 150 },
  { id: 'ev3', slug: 'kumasi-startup-workshop', title: 'Kumasi Startup Workshop', category: 'Workshop & class', summary: 'A one-day hands-on workshop for founders.', cover_image_url: img(3), venue_name: 'Adum Hub', city: 'Kumasi', starts_at: at(5, 9), ends_at: at(5, 16), currency: 'GHS', status: 'published', postponed: false, voting_enabled: false, from_price: 0, has_free: true },
  { id: 'ev4', slug: 'cape-coast-food-festival', title: 'Cape Coast Food Festival', category: 'Food & drink', summary: 'Street food, chefs and live music by the castle.', cover_image_url: img(2), venue_name: 'Victoria Park', city: 'Cape Coast', starts_at: at(20, 12), ends_at: at(20, 22), currency: 'GHS', status: 'published', postponed: true, voting_enabled: false, from_price: 40, sold_out: false },
];

const detail = {
  ...cards[1], description: 'The biggest night in Ghanaian music. Red carpet from 5pm, live performances from the year\'s biggest artists, and the winners announced on stage.\n\nVoting is open now: back your favourites, and tickets include a seat in the main hall.',
  address: 'Liberia Road', latitude: 5.5604, longitude: -0.1969, gallery: [img(2), img(3)], doors_open_at: at(30, 16), age_limit: '16+', dress_code: 'Formal / traditional',
  entry_rules: 'No bags larger than A4. Tickets are scanned once; there is no re-entry.', terms: 'The organiser may refuse entry for safety reasons.', contact_phone: '024 000 0000', contact_email: 'hello@gmaawards.example',
  fee_mode: 'included', max_tickets_per_order: 10, postponed_from: null, postponed_refund_deadline: null, cancellation_reason: null, refund_policy: 'tiers', refund_tiers: [{ days_before: 7, percent: 100 }, { days_before: 2, percent: 50 }],
  refund_summary: ['7 or more days before the event: full refund.', '2 or more days before the event: 50% refund.', 'Closer to the event than that: no refund.', 'If the event is cancelled you get a full refund of the ticket price.', 'If the event is postponed, your ticket stays valid for the new date — or you can ask for a full refund within 7 days of the new date being announced.', 'The payment processing fee is not refundable.'],
  postponement_policy: 'carry_over_or_refund', postponement_refund_days: 7,
  ticket_types: [
    { id: 't1', name: 'Regular', description: 'Main hall, general seating', price: 150, is_free: false, status: 'on_sale', remaining: null, min_per_order: 1, max_per_order: 10 },
    { id: 't2', name: 'VIP', description: 'Front rows + red-carpet entry + one drink', price: 450, is_free: false, status: 'on_sale', remaining: 12, min_per_order: 1, max_per_order: 6 },
    { id: 't3', name: 'Early bird', description: 'Limited launch offer', price: 100, is_free: false, status: 'sold_out', remaining: 0, min_per_order: 1, max_per_order: 4 },
  ],
  host: { name: 'Pulse Live Events', verified: true, type: 'business', city: 'Accra' }, processing_fee_percent: 1.95, commission_percent: 7, rating: { average: 4.6, count: 38 },
  voting: { open: true, opens_at: at(-3), closes_at: at(28), show_counts: true, vote_commission_percent: 7, categories: [
    { id: 'c1', name: 'Artist of the Year', description: 'The artist who defined this year.', price_per_vote: 1, is_open: true, nominees: [
      { id: 'n1', name: 'Kofi Kinaata', code: 'A01', bio: 'Takoradi\'s storyteller.', photo_url: img(0), votes: 18420, rank: 1 }, { id: 'n2', name: 'Efya', code: 'A02', bio: 'Soul and Afropop.', photo_url: img(1), votes: 12310, rank: 2 }, { id: 'n3', name: 'Black Sherif', code: 'A03', bio: 'Konongo\'s finest.', photo_url: img(4), votes: 9800, rank: 3 }] },
    { id: 'c2', name: 'Best Newcomer', description: null, price_per_vote: 0.5, is_open: true, nominees: [{ id: 'n4', name: 'Amaarae Jr', code: 'B01', bio: null, photo_url: img(3), votes: 2210, rank: 1 }, { id: 'n5', name: 'Yaw Tog', code: 'B02', bio: null, photo_url: img(2), votes: 1980, rank: 2 }] },
  ] },
  is_owner: false,
};

const tickets = [
  { id: 'k1', code: 'A7F3K9Q2M8ZP4XWB', holder_email: 'ama@example.com', holder_name: 'Ama Owusu', status: 'valid', price: 150, service_fee: 0, refundable: true, ticket_type: { id: 't1', name: 'Regular' } },
  { id: 'k2', code: 'B2N8C5T7J1RV6YHD', holder_email: 'kofi@example.com', holder_name: 'Kofi Mensah', status: 'valid', price: 450, service_fee: 0, refundable: true, ticket_type: { id: 't2', name: 'VIP' } },
  { id: 'k3', code: 'C9D4E1F6G3H2J5KL', holder_email: 'ama@example.com', holder_name: null, status: 'refund_pending', price: 150, service_fee: 0, refundable: false, ticket_type: { id: 't1', name: 'Regular' } },
];
const orderEvent = { id: 'ev2', slug: detail.slug, title: detail.title, venue_name: detail.venue_name, address: detail.address, city: 'Accra', starts_at: detail.starts_at, ends_at: detail.ends_at, cover_image_url: img(1), status: 'published', postponed: false, entry_rules: detail.entry_rules };
const order = { order: { id: 'o1', kind: 'ticket', status: 'paid', currency: 'GHS', subtotal: 750, service_fee: 0, processing_fee: 14.9, total: 764.9, refunded_amount: 0, buyer_email: 'ama@example.com', buyer_name: 'Ama Owusu', paid_at: at(-1), created_at: at(-1) }, access_token: 'tok', event: orderEvent, tickets, refund: { eligible: true, percent: 100, reason: 'policy' }, refund_requests: [{ id: 'r1', status: 'pending', amount: 150, refund_percent: 100, trigger: 'buyer_request', reason: 'Cannot make it', created_at: at(-1) }] };

const stats = {
  tickets_sold: 412, tickets_scanned: 268, tickets_refunded: 6, orders_paid: 187, ticket_gross: 71850, ticket_commission: 5029.5, ticket_host_net: 66820.5, refunded_amount: 780,
  votes_total: 44720, vote_gross: 31450, vote_commission: 2201.5, vote_host_net: 29248.5, refund_requests_pending: 2, review_count: 38, review_average: 4.6,
  by_ticket_type: [{ id: 't1', name: 'Regular', price: 150, quantity: null, reserved: 0, sold: 301, scanned: 198, refunded: 4 }, { id: 't2', name: 'VIP', price: 450, quantity: 120, reserved: 3, sold: 108, scanned: 70, refunded: 2 }, { id: 't3', name: 'Early bird', price: 100, quantity: 50, reserved: 0, sold: 3, scanned: 0, refunded: 0 }],
  by_gate: [{ id: 'g1', name: 'Gate 1 — Main', is_active: true, last_used_at: at(0, 17), admitted: 171, rejected: 9 }, { id: 'g2', name: 'VIP entrance', is_active: true, last_used_at: at(0, 17), admitted: 97, rejected: 3 }],
  scan_results: { valid: 268, already_used: 8, refunded: 3, not_found: 1 },
  scans_by_hour: [16, 17, 18, 19, 20, 21].map((h, i) => ({ hour: at(0, h), count: [22, 96, 88, 41, 15, 6][i] })),
};
const overview = { event: { ...detail, id: 'ev2', host_id: 'dev-user', status: 'published', voting_enabled: true, show_vote_counts: true }, stats, ticket_types: [{ id: 't1', name: 'Regular', description: 'Main hall', price: 150, quantity: null, sold: 301, reserved: 0, is_active: true }, { id: 't2', name: 'VIP', description: 'Front rows', price: 450, quantity: 120, sold: 108, reserved: 3, is_active: true }], payout: { awaiting_release: 96069, due: 0, on_hold: 0, processing: 0, paid: 0, next_release_at: at(32), currency: 'GHS' }, host: { name: 'Pulse Live Events', verified: true } };

const earnings = { currency: 'GHS', totals: { awaiting_release: 98234.5, due: 3007, on_hold: 360, processing: 0, paid: 12400 }, adjustments: -46.5, next_release_at: at(3), by_service: [{ service: 'accommodation', label: 'Stays', awaiting_release: 2165, due: 3007, on_hold: 360, processing: 0, paid: 12400 }, { service: 'event_ticket', label: 'Event tickets', awaiting_release: 66820.5, due: 0, on_hold: 0, processing: 0, paid: 0 }, { service: 'event_vote', label: 'Event votes', awaiting_release: 29248.5, due: 0, on_hold: 0, processing: 0, paid: 0 }], payout_details: { method: 'mobile_money', provider: 'MTN MoMo', number: '0244 123 456' } };
const items = [
  { id: 'p1', service: 'event_ticket', service_label: 'Event tickets', kind: 'ticket', title: 'Ghana Music Awards Night', detail: 'Tickets', amount: 66820.5, bucket: 'awaiting_release', release_at: at(32), on_hold: false, currency: 'GHS', status: 'pending', commission: 5029.5 },
  { id: 'p2', service: 'accommodation', service_label: 'Stays', kind: 'stay', title: 'Osu Courtyard Apartment', detail: '2026-10-01 → 2026-11-01', amount: 3007, bucket: 'due', release_at: at(-1), on_hold: false, currency: 'GHS', status: 'pending', commission: 93 },
  { id: 'p3', service: 'accommodation', service_label: 'Stays', kind: 'stay', title: 'Palm Grove Villa', detail: '2026-10-20 → 2026-11-20', amount: 360, bucket: 'on_hold', release_at: at(1), on_hold: true, hold_reason: 'Guest reported a problem', currency: 'GHS', status: 'pending', commission: 40 },
  { id: 'p4', service: 'accommodation', service_label: 'Stays', kind: 'stay', title: 'Tema Warehouse', detail: '2026-09-01 → 2026-10-01', amount: 12400, bucket: 'paid', release_at: at(-20), paid_at: at(-18), provider_reference: 'MOMO-88213', on_hold: false, currency: 'GHS', status: 'paid', commission: 400 },
];

const votePage = (catId: string, nomId?: string) => {
  const c = detail.voting.categories.find((x) => x.id === catId) ?? detail.voting.categories[0];
  const nominees = c.nominees.map((n) => ({ ...n, photo_url: n.photo_url || img(4) }));
  return {
    event: { id: 'ev2', slug: detail.slug, title: detail.title, cover_image_url: detail.cover_image_url, venue_name: detail.venue_name, city: 'Accra', starts_at: detail.starts_at, ends_at: detail.ends_at, currency: 'GHS', fee_mode: 'included', status: 'published' },
    voting: { open: true, closed: false, opens_at: at(-3), closes_at: at(28), show_counts: true, vote_commission_percent: 7, processing_fee_percent: 1.95 },
    category: { id: c.id, name: c.name, description: c.description, price_per_vote: c.price_per_vote, is_open: true, total_votes: nominees.reduce((a, n) => a + (n.votes ?? 0), 0), nominee_count: nominees.length },
    nominees, nominee: nomId ? nominees.find((n) => n.id === nomId) ?? null : null,
  };
};

export function handleEvents(path: string, method: string, init?: RequestInit): Response | undefined {
  if (!path.startsWith('/events') && !path.startsWith('/payouts')) return undefined;
  const body = (() => { try { return JSON.parse(String(init?.body ?? '{}')); } catch { return {}; } })();
  if (path === '/events/categories') return json(['Concert & music', 'Party & nightlife', 'Festival', 'Conference', 'Workshop & class', 'Awards & pageant', 'Food & drink', 'Other']);
  if (path === '/events/cities') return json([{ city: 'Accra', count: 2 }, { city: 'Kumasi', count: 1 }, { city: 'Cape Coast', count: 1 }]);
  if (path === '/events/fees') return json({ ticket_commission_percent: 7, vote_commission_percent: 7, processing_fee_percent: 1.95 });
  if (path === '/events' && method === 'GET') return json({ data: cards, total: cards.length, page: 1, limit: 36 });
  if (path === '/events/my/tickets') return json({ tickets: tickets.map((t) => ({ ...t, type: t.ticket_type.name, event: { title: detail.title, starts_at: detail.starts_at, ends_at: detail.ends_at, venue_name: detail.venue_name }, order_id: 'o1' })), orders: [{ id: 'o1', kind: 'ticket', status: 'paid', total: 764.9, currency: 'GHS', access_token: 'tok', created_at: at(-1), event: { title: detail.title } }] });
  if (path === '/events/ev2/quote' || path.endsWith('/quote')) {
    const items = (body.items ?? []) as Array<{ ticket_type_id: string; quantity: number }>;
    const priceOf = (id: string) => detail.ticket_types.find((t) => t.id === id);
    const lines = items.map((i) => ({ ticket_type_id: i.ticket_type_id, name: priceOf(i.ticket_type_id)?.name, quantity: i.quantity, unit_price: priceOf(i.ticket_type_id)?.price ?? 0, unit_fee: 0 }));
    const subtotal = lines.reduce((a, l) => a + l.quantity * l.unit_price, 0); const fee = Math.round(subtotal * 0.0199 * 100) / 100;
    return json({ currency: 'GHS', fee_mode: 'included', lines, subtotal, service_fee: 0, processing_fee: fee, total: subtotal + fee, free: false });
  }
  if (path.endsWith('/vote-quote')) {
    const votes = (body.votes ?? []) as Array<{ nominee_id: string; votes: number }>;
    const noms = detail.voting.categories.flatMap((c) => c.nominees.map((n) => ({ ...n, cat: c })));
    const lines = votes.map((v) => { const n = noms.find((x) => x.id === v.nominee_id)!; return { nominee: n.name, category: n.cat.name, votes: v.votes, amount: v.votes * n.cat.price_per_vote }; });
    const subtotal = lines.reduce((a, l) => a + l.amount, 0); const fee = Math.round(subtotal * 0.0199 * 100) / 100;
    return json({ currency: 'GHS', fee_mode: 'included', lines, subtotal, service_fee: 0, processing_fee: fee, total: subtotal + fee });
  }
  if (path.startsWith('/events/orders/') && path.endsWith('/refund-request')) return json({ id: 'r2' }, 201);
  if (path.startsWith('/events/orders/')) return json(order);
  if (path.startsWith('/events/tickets/')) { const code = path.split('/').pop()!; const t = tickets.find((x) => x.code === code) ?? tickets[0]; return json({ ticket: { code: t.code, status: code === 'USEDUSEDUSEDUSED' ? 'used' : t.status, holder_name: t.holder_name, holder_email: t.holder_email, type: t.ticket_type.name, used_at: code === 'USEDUSEDUSEDUSED' ? at(0, 17) : null }, event: orderEvent, can_review: code === 'USEDUSEDUSEDUSED', review: null }); }
  if (path.startsWith('/events/scan/') && path.endsWith('/open')) { if (path.includes('pinned') && !body.pin) return err('Enter the PIN the organiser gave you.', 'PIN_REQUIRED', 401); return json({ gate: { name: 'Gate 1 — Main' }, event: { title: detail.title, venue_name: detail.venue_name, city: 'Accra', starts_at: detail.starts_at, ends_at: detail.ends_at, status: 'published' }, stats: { admitted_here: 171, admitted_total: 268, tickets_total: 412 } }); }
  if (path.startsWith('/events/scan/') && path.endsWith('/check')) { const code = String(body.code).toUpperCase(); const r = code.startsWith('A') ? { result: 'valid', ticket_type: 'VIP', holder_name: 'Ama Owusu' } : code.startsWith('B') ? { result: 'already_used', ticket_type: 'Regular', holder_name: 'Kofi Mensah', used_at: at(0, 17), used_gate: 'VIP entrance' } : code.startsWith('C') ? { result: 'refunded' } : { result: 'not_found' }; return json({ ...r, admitted_total: 269 }); }
  if (path === '/events/host/events' && method === 'GET') return json([{ ...overview.event, id: 'ev2', stats: { tickets_sold: 412, tickets_scanned: 268, gross: 103300, votes_total: 44720, refund_requests_pending: 2 } }, { ...cards[0], id: 'ev1', host_id: 'dev-user', status: 'pending_review', stats: { tickets_sold: 0, tickets_scanned: 0, gross: 0, votes_total: 0, refund_requests_pending: 0 } }, { ...cards[2], id: 'ev3', status: 'draft', stats: { tickets_sold: 0, tickets_scanned: 0, gross: 0, votes_total: 0, refund_requests_pending: 0 } }]);
  if (/^\/events\/host\/events\/[^/]+$/.test(path) && method === 'GET') return json(overview);
  if (path.endsWith('/gates') && method === 'GET') return json([{ id: 'g1', name: 'Gate 1 — Main', assigned_to: 'Kwame', is_active: true, has_pin: true, last_used_at: at(0, 17), created_at: at(-4) }, { id: 'g2', name: 'VIP entrance', assigned_to: null, is_active: true, has_pin: false, last_used_at: null, created_at: at(-4) }]);
  if (path.endsWith('/scans')) return json([{ id: 's1', code: 'A7F3K9Q2M8ZP4XWB', result: 'valid', scanned_at: at(0, 17), gate: { name: 'Gate 1 — Main' }, ticket: { holder_name: 'Ama Owusu', holder_email: 'ama@example.com', ticket_type: { name: 'VIP' } } }, { id: 's2', code: 'B2N8C5T7J1RV6YHD', result: 'already_used', scanned_at: at(0, 17), gate: { name: 'VIP entrance' }, ticket: { holder_name: 'Kofi Mensah', holder_email: 'kofi@example.com', ticket_type: { name: 'Regular' } } }]);
  if (path.endsWith('/attendees')) return json({ data: tickets.map((t) => ({ ...t, ticket_type: t.ticket_type, used_at: t.status === 'valid' ? at(0, 17) : null, gate: { name: 'Gate 1 — Main' }, order: { buyer_email: 'ama@example.com' } })), total: 3, page: 1, limit: 40 });
  if (path.endsWith('/orders')) return json({ data: [{ id: 'o1', kind: 'ticket', status: 'paid', buyer_email: 'ama@example.com', buyer_name: 'Ama Owusu', subtotal: 750, service_fee: 0, host_net: 697.5, currency: 'GHS', paid_at: at(-1), created_at: at(-1), tickets: tickets }, { id: 'o2', kind: 'vote', status: 'paid', buyer_email: 'v@example.com', buyer_name: null, subtotal: 200, service_fee: 0, host_net: 186, currency: 'GHS', paid_at: at(-1), created_at: at(-1), tickets: [] }], total: 2, page: 1, limit: 30 });
  if (path.endsWith('/vote-categories')) return json([]);
  if (path.endsWith('/votes')) return json({ orders: 211, gross: 31450, commission: 2201.5, host_net: 29248.5, categories: detail.voting.categories.map((c) => ({ ...c, price_per_vote: c.price_per_vote, is_open: true, total_votes: c.nominees.reduce((a, n) => a + (n.votes ?? 0), 0), nominees: c.nominees.map((n) => ({ ...n, votes_count: n.votes, is_active: true })) })) });
  if (path.endsWith('/reviews')) return json([{ id: 'rv1', rating: 5, comment: 'Incredible night, flawless entry.', reviewer_name: 'Ama', created_at: at(-1), host_reply: 'Thank you Ama!' }, { id: 'rv2', rating: 4, comment: 'Great show, queue at gate 1 was slow.', reviewer_name: 'Kofi', created_at: at(-1) }]);
  if (path.endsWith('/refunds')) return json([{ id: 'r1', status: 'pending', amount: 150, trigger: 'buyer_request', reason: 'Cannot make it', created_at: at(-1), ticket_ids: ['k3'] }, { id: 'r2', status: 'processed', amount: 75, trigger: 'buyer_request', created_at: at(-3), refund_reference: 'RF-0042', ticket_ids: ['k9'] }]);
  const vp = path.match(/^\/events\/[^/]+\/vote\/([^/]+)(?:\/([^/]+))?$/); if (vp) return json(votePage(vp[1], vp[2]));
  if (/^\/events\/[^/]+$/.test(path) && method === 'GET') return json(detail);
  if (path === '/payouts/summary') return json(earnings);
  if (path === '/payouts/items') return json({ data: items, total: items.length, page: 1, limit: 60 });
  if (path === '/payouts/batches') return json([{ id: 'b1', amount: 12400, currency: 'GHS', status: 'paid', reference: 'MOMO-88213', paid_at: at(-18), created_at: at(-19), destination: { method: 'mobile_money', provider: 'MTN MoMo', number: '0244 123 456' }, items_total: 12400, adjustments_total: 0 }]);
  return undefined;
}
