// Dev-only fixtures for host services, statistics, reports, public host pages and the listing catalog.
const day = 86_400_000;
const at = (d: number) => new Date(Date.now() + d * day).toISOString();
const img = (n: number) =>
  `/images/landing/${['place-accra', 'place-aburi', 'place-cape-coast', 'place-kumasi', 'stay-osu-apartment'][n % 5]}.webp`;
const json = (data: unknown) =>
  new Response(JSON.stringify({ success: true, data }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

const series = (scale: number) => ({
  days: Array.from({ length: 30 }, (_, i) => {
    const views = Math.round((8 + ((i * 7) % 13)) * scale);
    return {
      day: new Date(Date.now() - (29 - i) * day).toISOString().slice(0, 10),
      views,
      visitors: Math.round(views * 0.7),
      clicks: Math.round(views * 0.22),
    };
  }),
  totals: { views: Math.round(420 * scale), visitors: Math.round(290 * scale), clicks: Math.round(96 * scale) },
  by_action: {
    view: Math.round(420 * scale),
    click_book: Math.round(70 * scale),
    click_tickets: Math.round(22 * scale),
    click_host: 9,
  },
});

const services = {
  pause_available: true,
  properties: [
    {
      id: 'e890dd25-cd2d-48cd-937a-f5002261dc2f',
      kind: 'property',
      name: 'Osu Courtyard Apartment',
      sub_type: 'apartment',
      city: 'Accra',
      approval_status: 'approved',
      price: 1050,
      currency: 'GHS',
      pricing_period: 'month',
      image: img(4),
      is_paused: false,
    },
    {
      id: 'p2',
      kind: 'property',
      name: 'Tema Warehouse',
      sub_type: 'warehouse',
      city: 'Tema',
      approval_status: 'approved',
      price: 9000,
      currency: 'GHS',
      pricing_period: 'month',
      image: img(3),
      is_paused: true,
      pause_reason: 'Roof repairs until March',
      paused_at: at(-4),
    },
  ],
  events: [
    {
      id: 'ev2',
      kind: 'event',
      name: 'Ghana Music Awards Night',
      slug: 'ghana-music-awards-night',
      status: 'published',
      starts_at: at(30),
      ends_at: at(30),
      city: 'Accra',
      venue_name: 'Labadi Beach Hotel',
      image: img(0),
      is_paused: false,
    },
  ],
};

const reportRow = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  target_type: 'booking',
  category: 'not_as_described',
  description: 'The photos showed a balcony but the flat has none, and the water was off for the first two days.',
  status: 'open',
  severity: 'high',
  created_at: at(-2),
  reporter_name: 'Kofi Mensah',
  host_response: null,
  host_responded_at: null,
  evidence_urls: [],
  property: { id: 'e890dd25-cd2d-48cd-937a-f5002261dc2f', name: 'Osu Courtyard Apartment' },
  event: null,
  ...over,
});

const publicHost = {
  id: 'h1',
  name: 'Pulse Live Events',
  verified: true,
  type: 'business',
  city: 'Accra',
  region: 'Greater Accra',
  since: at(-700),
  stats: { listings: 2, upcoming_events: 1, past_events: 6, rating: 4.7 },
  listings: services.properties.map((p) => ({
    id: p.id,
    name: p.name,
    city: p.city,
    sub_type: p.sub_type,
    price: p.price,
    currency: 'GHS',
    pricing_period: 'month',
    rating: 4.8,
    review_count: 12,
    verified: true,
    image: p.image,
  })),
  events: [
    {
      id: 'ev2',
      slug: 'ghana-music-awards-night',
      title: 'Ghana Music Awards Night',
      category: 'Awards & pageant',
      venue_name: 'Labadi Beach Hotel',
      city: 'Accra',
      starts_at: at(30),
      ends_at: at(30),
      currency: 'GHS',
      status: 'published',
      postponed: false,
      voting_enabled: true,
      from_price: 100,
      cover_image_url: img(0),
    },
  ],
};

const catalog = {
  services: [{ key: 'accommodation', label: 'Accommodation', status: 'active' }],
  property_types: [
    {
      id: 't1',
      name: 'Apartment',
      slug: 'apartment',
      category: 'residential',
      applicable_fields: { bedrooms: true, bathrooms: true, capacity: true, furnished: true },
    },
    {
      id: 't2',
      name: 'Warehouse',
      slug: 'warehouse',
      category: 'commercial',
      applicable_fields: { ceiling_height: true, loading_access: true, access_24h: true },
    },
  ],
  rental_units: [
    { code: 'day', label: 'Daily', per: 'night', quantity: 'nights', bookable: true },
    { code: 'month', label: 'Monthly', per: 'month', quantity: 'months', bookable: true },
  ],
  cancellation_policies: [
    {
      id: 'cp1',
      code: 'standard',
      name: 'Standard',
      description: 'Fair to guests and hosts.',
      tiers: [
        { days_before_start: 7, refund_percent: 100 },
        { days_before_start: 2, refund_percent: 50 },
        { days_before_start: 0, refund_percent: 0 },
      ],
      summary: [],
    },
  ],
  locations: {
    country: 'Ghana',
    regions: ['Greater Accra'],
    cities: [{ name: 'Accra', slug: 'accra', region: 'Greater Accra', lat: 5.6037, lng: -0.187, aliases: [] }],
  },
};

export function handleHost(path: string, method: string): Response | undefined {
  if (path === '/host-services') return json(services);
  if (path.startsWith('/host-services/') && method === 'POST') return json({ is_paused: path.endsWith('/pause') });
  if (path === '/engagement/host/overview')
    return json({
      days: 30,
      per_target: {
        'e890dd25-cd2d-48cd-937a-f5002261dc2f': { views: 310, clicks: 74 },
        p2: { views: 12, clicks: 1 },
        ev2: { views: 540, clicks: 130 },
      },
      properties: series(1),
      events: series(1.4),
    });
  if (path.startsWith('/engagement/host/properties/'))
    return json({
      ...series(1),
      listing: { id: 'x', name: 'Osu Courtyard Apartment' },
      conversions: { requests: 18, booked: 9, revenue: 28350 },
    });
  if (path.startsWith('/engagement/host/events/'))
    return json({
      ...series(1.4),
      conversions: { checkouts_started: 64, ticket_orders_paid: 41, vote_orders_paid: 120 },
    });
  if (path === '/engagement/track') return new Response(null, { status: 204 });
  if (path === '/reports/host')
    return json([
      reportRow('r1'),
      reportRow('r2', {
        target_type: 'ticket_order',
        category: 'entry_problem',
        status: 'in_review',
        severity: 'high',
        property: null,
        event: { id: 'ev2', title: 'Ghana Music Awards Night' },
        host_response: 'Our gate scanner was offline for ten minutes; everyone was admitted.',
        host_responded_at: at(-1),
      }),
      reportRow('r3', { category: 'cleanliness', severity: 'normal', status: 'resolved' }),
    ]);
  if (path === '/reports/categories')
    return json({
      property: [
        {
          value: 'fake_listing',
          label: 'This listing is fake or a scam',
          severity: 'high',
          hint: "The place doesn't exist, isn't the host's, or the photos are stolen.",
        },
        { value: 'misleading', label: 'Photos or details are misleading', severity: 'normal' },
      ],
      event: [{ value: 'fake_event', label: 'This event is fake or a scam', severity: 'high' }],
      booking: [{ value: 'not_as_described', label: 'Not as described', severity: 'high' }],
      ticket_order: [{ value: 'entry_problem', label: 'Problem getting in', severity: 'high' }],
      host: [{ value: 'scam', label: 'Scam or fraud', severity: 'high' }],
      other: [{ value: 'other', label: 'Something else', severity: 'normal' }],
    });
  if (path === '/reports' && method === 'POST') return json({ id: 'new' });
  if (path.startsWith('/hosts/')) return json(publicHost);
  if (path === '/catalog/options') return json(catalog);
  return undefined;
}
