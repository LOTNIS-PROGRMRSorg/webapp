// What a shared link says. Plain JS with no imports so the app (share sheet, <Seo>) and the link-preview
// function in api/share.js use the exact same words: the message is tuned to the kind of event or space.

const TZ = 'Africa/Accra';
const when = (iso) =>
  iso
    ? `${new Date(iso).toLocaleDateString('en-GH', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short' })}, ${new Date(iso).toLocaleTimeString('en-GH', { timeZone: TZ, hour: 'numeric', minute: '2-digit' })}`
    : '';
const cedis = (currency, n) =>
  `${!currency || currency === 'GHS' ? 'GH₵' : `${currency} `}${Number(n).toLocaleString('en-GH', { maximumFractionDigits: 2 })}`;
const join = (parts) => parts.filter(Boolean).join(' · ');

// One hook line per event category. {title} is filled in.
const EVENT_HOOKS = {
  'Concert & music': 'Live music you will not want to miss — {title}.',
  'Party & nightlife': 'The night is set: {title}. Tag your crew.',
  Festival: 'A whole festival of good times — {title}.',
  Conference: 'Learn from the best in the room at {title}.',
  'Workshop & class': 'Learn something new at {title}. Seats are limited — reserve yours.',
  Networking: 'Meet people worth knowing at {title}. Come ready to connect.',
  'Sports & fitness': 'Get moving with {title}. Bring a friend.',
  'Comedy & theatre': 'Come for the laughs and the stage — {title}.',
  'Faith & community': 'You are invited to {title}. Come together with us.',
  'Food & drink': 'Come hungry — {title}.',
  'Arts & exhibition': 'Art worth stepping out for — {title}.',
  'Awards & pageant': 'Back your favourites at {title}. Every vote counts.',
  'Wedding & private': 'You are invited — {title}.',
  'Charity & fundraiser': 'Show up for a good cause at {title}.',
};

/** Words for sharing an event: a short message for chat apps and a fuller description for the link preview. */
export function eventShare(ev, url = '') {
  const hook = (EVENT_HOOKS[ev.category] || 'Join us at {title}.').replace('{title}', ev.title);
  const price = ev.sold_out
    ? 'Sold out'
    : ev.from_price === 0
      ? 'Free entry'
      : ev.from_price != null
        ? `Tickets from ${cedis(ev.currency, ev.from_price)}`
        : '';
  const facts = join([when(ev.starts_at), [ev.venue_name, ev.city].filter(Boolean).join(', '), price]);
  return {
    title: `${ev.title}${ev.city ? ` — ${ev.city}` : ''}`,
    description: `${hook} ${facts}`.trim(),
    text: `${hook} ${facts}${url ? `\n${url}` : ''}`.trim(),
  };
}

// One hook line per kind of space. {name} and {city} are filled in.
const SPACE_HOOKS = {
  apartment: 'A place to call home in {city}: {name}.',
  house: 'A whole house to settle into in {city}: {name}.',
  villa: 'Room to breathe in {city}: {name}.',
  room: 'A comfortable room in {city}: {name}.',
  hostel: 'A friendly, affordable stay in {city}: {name}.',
  hotel: 'Check in to {name} in {city}.',
  office: 'A workspace ready for your team in {city}: {name}.',
  shop: 'A shopfront for your business in {city}: {name}.',
  warehouse: 'Storage and room to scale in {city}: {name}.',
  garage: 'Secure garage space for your car or tools in {city}: {name}.',
  venue: 'A venue for your next event in {city}: {name}.',
};

/** Words for sharing a space (listing). `price` is the display string, e.g. "GHS 500 / month". */
export function propertyShare(p, price = '', url = '') {
  const city = p.city || 'Ghana';
  const name = String(p.name).trim(); // hosts' names can end in a space, which would read "The Ark ."
  const hook = (SPACE_HOOKS[p.sub_type] || 'A space for rent in {city}: {name}.')
    .replace('{city}', city)
    .replace('{name}', name);
  const facts = join([price, p.verified ? 'Verified host' : '']);
  return {
    title: `${name} — for rent in ${city}`,
    description: `${hook} ${facts}`.trim(),
    text: `${hook} ${facts}${url ? `\n${url}` : ''}`.trim(),
  };
}
