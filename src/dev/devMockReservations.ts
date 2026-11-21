// Dev-only fixtures for booking a space: opening hours, taken times, multi-room quotes and a reservation to pay.
const day = 86_400_000;
const at = (d: number, h = 14) => {
  const t = new Date(Date.now() + d * day);
  t.setUTCHours(h, 0, 0, 0);
  return t.toISOString();
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify({ success: true, data }), { status, headers: { 'content-type': 'application/json' } });

const rules = {
  id: 'mock-rooms',
  name: 'Palm Grove Villa',
  check_in_time: '14:00:00',
  check_out_time: '11:00:00',
  buffer_minutes: 0,
  opens_at: '08:00:00',
  closes_at: '20:00:00',
  house_rules: 'Shoes off inside.\nGuests after 10pm must be announced to the caretaker.\nThe generator runs 6pm–6am.',
  quiet_hours: '10pm – 6am',
  smoking_allowed: false,
  parties_allowed: false,
};
const RATES: Record<string, [string, number]> = {
  whole: ['Whole place', 12000],
  r1: ['Master suite', 4200],
  r2: ['Garden room', 2900],
  r3: ['Studio annex', 3300],
};
const busy = [
  { room_id: 'r2', starts_at: at(20), blocks_until: at(34, 11) },
  { room_id: 'r3', starts_at: at(8), blocks_until: at(12, 11) },
];

export function handleReservations(path: string, method: string, init?: RequestInit): Response | undefined {
  if (!path.startsWith('/reservations')) return undefined;
  if (path.startsWith('/reservations/availability/')) return json({ rules, busy });
  const body = (() => {
    try {
      return JSON.parse(String(init?.body ?? '{}'));
    } catch {
      return {};
    }
  })();
  if (path === '/reservations/quote' || (path === '/reservations' && method === 'POST')) {
    const lines = (body.lines ?? []).map((l: any) => {
      const [label, rate] = RATES[l.room_id ?? 'whole'];
      const qty = Math.max(1, Math.round((Date.parse(l.end_date) - Date.parse(l.start_date)) / day / 30));
      const stay = rate * qty;
      return {
        room_id: l.room_id ?? null,
        room_label: l.room_id ? label : null,
        unit: 'month',
        quantity: qty,
        stay_label: `${qty} month${qty === 1 ? '' : 's'}`,
        start_date: l.start_date,
        end_date: l.end_date,
        starts_at: null,
        ends_at: null,
        price_per_unit: rate,
        stay_total: stay,
        property_amount: stay,
        guest_service_fee: Math.round(stay * 0.05),
        security_deposit: 500,
        final_amount: stay + Math.round(stay * 0.05) + 500,
        discount_label: null,
      };
    });
    const sum = (k: string) => lines.reduce((s: number, l: any) => s + l[k], 0);
    const quote = {
      currency: 'GHS',
      lines,
      stay_total: sum('stay_total'),
      property_amount: sum('property_amount'),
      guest_service_fee: sum('guest_service_fee'),
      security_deposit: sum('security_deposit'),
      final_amount: sum('final_amount'),
      guests: body.guests ?? 1,
      capacity: 5,
      requires_host_acceptance: false,
      cancellation_policy: {
        name: 'Standard',
        description: 'Free up to 14 days before',
        tiers: [
          { days_before_start: 14, refund_percentage: 100 },
          { days_before_start: 3, refund_percentage: 50 },
          { days_before_start: 0, refund_percentage: 0 },
        ],
      },
      check_in_time: '14:00:00',
      check_out_time: '11:00:00',
    };
    if (path === '/reservations/quote') return json(quote);
    return json({ id: 'res-1' }, 201);
  }
  if (/^\/reservations\/my\/[^/]+$/.test(path)) {
    return json({
      id: 'res-1',
      renter_id: 'u1',
      property_id: 'mock-rooms',
      guests: 2,
      currency: 'GHS',
      total_charge: 8115,
      paid_at: null,
      requires_host_acceptance: false,
      created_at: at(0),
      property: { id: 'mock-rooms', name: 'Palm Grove Villa', city: 'Cape Coast', property_images: [] },
      bookings: [
        {
          id: 'b1',
          room_id: 'r1',
          start_date: '2027-01-10',
          end_date: '2027-02-10',
          starts_at: at(30),
          ends_at: at(60, 11),
          pricing_period: 'month',
          status: 'pending',
          final_amount: 4725,
          total_amount: 4200,
          security_deposit: 500,
          guest_service_fee: 210,
          reservation_stage: 'instant',
          host_acceptance_deadline: null,
          room: { room_label: 'Master suite' },
        },
        {
          id: 'b2',
          room_id: 'r3',
          start_date: '2027-01-10',
          end_date: '2027-02-10',
          starts_at: at(30),
          ends_at: at(60, 11),
          pricing_period: 'month',
          status: 'pending',
          final_amount: 3390,
          total_amount: 3300,
          security_deposit: 500,
          guest_service_fee: 165,
          reservation_stage: 'instant',
          host_acceptance_deadline: null,
          room: { room_label: 'Studio annex' },
        },
      ],
    });
  }
  return undefined;
}
