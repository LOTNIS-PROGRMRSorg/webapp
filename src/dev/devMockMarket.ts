// Dev-only fixtures for the services marketplace and the explore map.
const day = 86_400_000;
const at = (d: number, h = 10) => {
  const t = new Date(Date.now() + d * day);
  t.setUTCHours(h, 0, 0, 0);
  return t.toISOString();
};
const img = (n: number) =>
  `/images/landing/${['place-accra', 'place-aburi', 'place-cape-coast', 'place-kumasi', 'stay-osu-apartment'][n % 5]}.webp`;
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify({ success: true, data }), { status, headers: { 'content-type': 'application/json' } });

const cats = [
  { id: 'c1', slug: 'photography', name: 'Photography', icon: 'camera' },
  { id: 'c2', slug: 'plumbing', name: 'Plumbing', icon: 'wrench' },
  { id: 'c3', slug: 'cleaning', name: 'Cleaning', icon: 'sparkles' },
  { id: 'c4', slug: 'dj-mc', name: 'DJ & MC', icon: 'music' },
  { id: 'c5', slug: 'hair-beauty', name: 'Hair & beauty', icon: 'scissors' },
];
const provider = (n: string, v = true) => ({
  id: 'h1',
  name: n,
  verified: v,
  type: 'individual',
  since: at(-500),
  avatar_url: null,
});
const svc = (
  id: string,
  title: string,
  cat: number,
  rate: number,
  unit: string,
  lat: number,
  lng: number,
  over: Record<string, unknown> = {},
) => ({
  id,
  title,
  summary: 'Reliable, on time and fairly priced.',
  category: cats[cat],
  pricing_unit: unit,
  rate,
  currency: 'GHS',
  allow_negotiation: true,
  min_units: 1,
  max_units: 8,
  job_minutes: 60,
  city: 'Accra',
  region: 'Greater Accra',
  latitude: lat,
  longitude: lng,
  service_radius_km: 15,
  travels_to_customer: true,
  works_at_own_place: false,
  photos: [img(cat)],
  tags: ['weddings', 'events'],
  languages: ['English', 'Twi'],
  rating: 4.8,
  review_count: 23,
  jobs_completed: 41,
  is_paused: false,
  provider: provider('Kwame Mensah'),
  distance_km: 3.2,
  serves_you: true,
  ...over,
});
const list = [
  svc('s1', 'Wedding & event photography', 0, 250, 'per_hour', 5.6037, -0.187),
  svc('s2', 'Emergency plumber, 24/7', 1, 80, 'per_hour', 5.58, -0.2, {
    rating: 4.6,
    provider: provider('Yaw Boateng'),
    distance_km: 5.1,
  }),
  svc('s3', 'Deep cleaning for flats & offices', 2, 300, 'per_job', 5.64, -0.14, {
    provider: provider('Sparkle Crew', false),
    distance_km: 7.4,
  }),
  svc('s4', 'DJ & MC for parties', 3, 1200, 'per_day', 5.55, -0.23, {
    rating: 4.9,
    provider: provider('DJ Kobi'),
    distance_km: 9.8,
  }),
];
const detail = {
  ...list[0],
  description:
    'I shoot weddings, birthdays, corporate events and portraits across Accra. You get edited photos within 5 days, and a preview gallery on the day. I bring my own lighting and a second shooter for events over 4 hours.\n\nBook early for weekends.',
  status: 'published',
  is_owner: false,
  min_offer_percent: 80,
  availability: [1, 2, 3, 4, 5, 6].map((weekday) => ({ weekday, start_time: '08:00', end_time: '18:00' })),
  busy: [{ starts_at: at(2, 10), ends_at: at(2, 14) }],
  photos: [img(0), img(1), img(2)],
  reviews: [
    {
      id: 'r1',
      rating: 5,
      comment: 'Kwame was brilliant — on time, friendly, and the photos are stunning.',
      host_reply: 'Thank you Ama! It was a joy.',
      created_at: at(-12),
      reviewer: 'Ama O.',
    },
    { id: 'r2', rating: 4, comment: 'Great photos, a little late to start.', created_at: at(-30), reviewer: 'Kofi M.' },
  ],
};
const markers = [
  {
    kind: 'stay',
    id: 'p1',
    lat: 5.5604,
    lng: -0.1969,
    title: 'Osu Courtyard Apartment',
    subtitle: 'Apartment · Accra',
    price: 850,
    currency: 'GHS',
    unit: 'month',
    rating: 4.8,
    image: img(4),
    href: '/stays/p1',
  },
  {
    kind: 'stay',
    id: 'p2',
    lat: 5.61,
    lng: -0.17,
    title: 'East Legon Villa',
    subtitle: 'Villa · Accra',
    price: 4200,
    currency: 'GHS',
    unit: 'month',
    rating: 4.9,
    image: img(2),
    href: '/stays/p2',
  },
  {
    kind: 'event',
    id: 'ev2',
    lat: 5.5604,
    lng: -0.1969,
    title: 'Ghana Music Awards Night',
    subtitle: 'Awards · Labadi Beach Hotel',
    price: 100,
    currency: 'GHS',
    starts_at: at(30),
    image: img(0),
    href: '/events/ghana-music-awards-night',
  },
  {
    kind: 'event',
    id: 'ev1',
    lat: 5.59,
    lng: -0.15,
    title: 'Accra Rooftop Sessions',
    subtitle: 'Concert · Skybar, Osu',
    price: 0,
    currency: 'GHS',
    starts_at: at(12),
    image: img(1),
    href: '/events/accra-rooftop-sessions-vol-4',
  },
  ...list.map((s) => ({
    kind: 'service',
    id: s.id,
    lat: s.latitude,
    lng: s.longitude,
    title: s.title,
    subtitle: `${s.category.name} · ${s.provider.name}`,
    price: s.rate,
    currency: 'GHS',
    unit: s.pricing_unit,
    rating: s.rating,
    image: s.photos[0],
    icon: s.category.icon,
    radius_km: s.service_radius_km,
    href: `/services/${s.id}`,
  })),
];

const baseJob = {
  id: 'j1',
  status: 'negotiating',
  role: 'customer',
  service: {
    id: 's1',
    title: list[0].title,
    photos: [img(0)],
    pricing_unit: 'per_hour',
    rate: 250,
    currency: 'GHS',
    city: 'Accra',
    allow_negotiation: true,
    category: cats[0],
  },
  provider: provider('Kwame Mensah'),
  customer: { id: 'u3', name: 'Esi B.' },
  starts_at: at(3, 10),
  ends_at: at(3, 13),
  units: 3,
  currency: 'GHS',
  list_total: 750,
  floor_total: 600,
  current_offer: 675,
  offer_by: 'host',
  agreed_total: null,
  notes: 'A birthday party for 40 guests, mostly indoors.',
  distance_km: 4.2,
  expires_at: at(1),
  created_at: at(-1),
  offers: [
    { by_role: 'customer', amount: 600, message: null, created_at: at(-1) },
    { by_role: 'host', amount: 675, message: 'I can do 675 for the full 3 hours.', created_at: at(-0.5) },
  ],
  review: null,
  refunds: [],
  unread_messages: 1,
  min_offer_percent: 80,
  location_text: 'East Legon, near the Total station',
  can: {
    accept: true,
    counter: true,
    decline: true,
    pay: false,
    cancel: false,
    mark_done: false,
    confirm: false,
    review: false,
    message: true,
  },
};
const jobRows = [
  {
    id: 'j1',
    status: 'negotiating',
    starts_at: at(3, 10),
    ends_at: at(3, 13),
    units: 3,
    currency: 'GHS',
    current_offer: 675,
    agreed_total: null,
    offer_by: 'host',
    expires_at: at(1),
    created_at: at(-1),
    service: { id: 's1', title: list[0].title, photos: [img(0)] },
    customer_name: 'Esi B.',
  },
  {
    id: 'j2',
    status: 'paid',
    starts_at: at(6, 14),
    ends_at: at(6, 16),
    units: 2,
    currency: 'GHS',
    current_offer: 160,
    agreed_total: 160,
    offer_by: 'customer',
    expires_at: at(1),
    created_at: at(-3),
    service: { id: 's2', title: list[1].title, photos: [img(1)] },
    customer_name: 'Kofi M.',
  },
];
const mine = list.map((s, i) => ({
  ...s,
  category_id: s.category.id,
  category: s.category,
  status: i === 3 ? 'pending_review' : 'published',
  open_requests: i === 0 ? 2 : 0,
  active_jobs: i === 1 ? 1 : 0,
  availability: [],
  time_off: [],
}));

export function handleMarket(path: string, method: string): Response | undefined {
  if (path === '/services/categories') return json(cats);
  if (path === '/services' && method === 'GET') return json({ data: list, total: list.length, page: 1, limit: 24 });
  if (path === '/map/markers') return json({ markers, counts: { stays: 2, events: 2, services: 4 }, capped: false });
  if (path === '/services/requests/mine') return json(jobRows);
  if (/^\/services\/requests\/[^/]+\/messages$/.test(path))
    return method === 'POST'
      ? json({ id: 'm9', mine: true, body: 'Thanks!', masked: false, created_at: at(0) })
      : json([
          {
            id: 'm1',
            mine: false,
            body: 'Hi Esi — happy to help. Is it indoors or outdoors?',
            masked: false,
            created_at: at(-0.4),
          },
          {
            id: 'm2',
            mine: true,
            body: 'Mostly indoors. Call me on [number hidden]',
            masked: true,
            created_at: at(-0.3),
          },
        ]);
  if (/^\/services\/requests\/[^/]+$/.test(path))
    return json(
      path.endsWith('j2')
        ? {
            ...baseJob,
            id: 'j2',
            status: 'paid',
            agreed_total: 160,
            current_offer: 160,
            offer_by: 'customer',
            money: { agreed: 160, processing_fee: 3.2, total_charge: 163.2 },
            can: { ...baseJob.can, accept: false, counter: false, decline: false, cancel: true, confirm: true },
          }
        : baseJob,
    );
  if (path === '/services/host/mine') return json(mine);
  if (/^\/services\/host\/[^/]+$/.test(path) && method === 'GET') return json({ ...mine[0], missing: [] });
  if (/^\/services\/[^/]+$/.test(path) && method === 'GET') return json(detail);
  return undefined;
}
