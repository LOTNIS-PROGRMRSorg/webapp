// The four Lotnis business lines and their marketing content, shared by the home page
// and the /food, /services and /events pages so the story is told once and stays consistent.
// Spaces is live; the others are launching, and every page says so plainly.

export type LineKey = 'spaces' | 'food' | 'services' | 'events';
export type Line = {
  key: LineKey; label: string; status: 'live' | 'soon'; path: string;
  tagline: string; summary: string; examples: string[];
  categoriesTitle: string; categories: string[];
  steps: Array<[string, string]>;
  providerTitle: string; providerText: string; providerCta: string; providerMail?: string;
  browseCta?: string;
  seo: { title: string; description: string };
  faqs: Array<{ question: string; answer: string }>;
};

export const LINES: Line[] = [
  {
    key: 'spaces', label: 'Spaces', status: 'live', path: '/explore',
    tagline: 'Rent a place — by the night, week, month or year.',
    summary: 'Rooms, apartments, villas, offices, shops, garages, warehouses and venues from verified hosts, with the full price up front and fair refund rules.',
    examples: ['A room for a month', 'An office for a year', 'A warehouse in Tema', 'A villa for the weekend'],
    categoriesTitle: 'What you can rent', categories: ['Rooms', 'Apartments', 'Houses & villas', 'Offices', 'Shops', 'Garages', 'Warehouses', 'Venues'],
    steps: [['Find a space', 'Search by place, type and how long you need it.'], ['Book it', 'Pick dates in whole nights, weeks, months or years.'], ['Pay securely', 'Mobile money or card — the full price is shown first.'], ['Move in', 'Your host, receipt and policy stay in My trips.']],
    providerTitle: 'Host a space', providerText: 'List a room, home, office or warehouse. You set the price and the refund policy; we verify, take bookings and pay you after check-in.', providerCta: 'Start hosting',
    seo: { title: 'Rent spaces in Ghana', description: 'Rent rooms, homes, villas, offices, shops, garages and warehouses across Ghana by the night, week, month or year.' }, faqs: [],
  },
  {
    key: 'food', label: 'Food', status: 'soon', path: '/food',
    tagline: 'Order from the cooks and kitchens near you.',
    summary: 'Home cooks, local restaurants, bakers and caterers in one place. Browse menus, order for now or later, and pay with mobile money.',
    examples: ['Waakye for lunch', 'A birthday cake', 'Catering for 50', 'Fresh produce delivered'],
    categoriesTitle: 'What you can order', categories: ['Local dishes', 'Home-cooked meals', 'Street food', 'Bakery & cakes', 'Catering & events', 'Drinks & juices', 'Fresh produce', 'Healthy & vegan'],
    steps: [['Browse', 'See menus, photos and prices from vendors near you.'], ['Order', 'Choose pickup or delivery, now or scheduled.'], ['Pay', 'Mobile money or card, protected by Lotnis.'], ['Enjoy', 'Rate your meal and reorder in a tap.']],
    providerTitle: 'Sell your food', providerText: 'Cook from home, run a kitchen or a bakery? Reach hungry customers and get paid straight to your mobile money.', providerCta: 'Tell us you\'re interested', providerMail: 'Sell my food on Lotnis',
    seo: { title: 'Food delivery and catering in Ghana — coming soon', description: 'Order local dishes, home-cooked meals, cakes and catering from cooks and kitchens near you. Coming soon to Lotnis.' },
    faqs: [{ question: 'When will food ordering launch on Lotnis?', answer: 'Food is being built next. Tell us you\'re interested and we\'ll let you know the moment vendors start taking orders.' }, { question: 'Can I sell food on Lotnis?', answer: 'Yes. Home cooks, restaurants, bakers and caterers will be able to apply with the same host account used for spaces: verified, paid to mobile money or bank.' }],
  },
  {
    key: 'services', label: 'Services', status: 'soon', path: '/services',
    tagline: 'Book anyone who can do the job.',
    summary: 'Plumbers, electricians, tour guides, photographers, drivers, tutors — any skill, from anyone who can provide it. Compare, book and pay in one place.',
    examples: ['A plumber today', 'A tour guide for Saturday', 'A photographer for the wedding', 'A driver for the week'],
    categoriesTitle: 'What you can book', categories: ['Plumbers', 'Electricians', 'Carpenters & painters', 'Cleaners', 'Tour guides', 'Photographers & videographers', 'Drivers & movers', 'Tutors & trainers', 'Hair, makeup & tailors', 'DJs & MCs', 'Designers & developers', 'And anything else'],
    steps: [['Say what you need', 'Describe the job and when you need it.'], ['Pick a provider', 'See profiles, prices, reviews and availability.'], ['Pay securely', 'Your money is held until the job is done.'], ['Rate the work', 'Honest reviews keep quality high.']],
    providerTitle: 'Offer your service', providerText: 'If you can do it, you can list it. Plumber, guide, photographer, tutor — set your rates and get booked by people nearby.', providerCta: 'Offer my service', providerMail: 'Offer my service on Lotnis',
    seo: { title: 'Book trusted service providers in Ghana — coming soon', description: 'Find and book plumbers, electricians, tour guides, photographers, drivers, tutors and more. Any service, from anyone who can provide it. Coming soon to Lotnis.' },
    faqs: [{ question: 'What kinds of services can I book or offer?', answer: 'Anything a person can do for someone else: home repairs, cleaning, tour guiding, photography and video, driving and moving, tutoring, beauty, design, and more. If it isn\'t listed, you can still offer it.' }, { question: 'How will providers be checked?', answer: 'Providers go through the same verification as hosts — ID, selfie and contact checks — and customers can rate the work, so you know who is coming to your door.' }, { question: 'When does it launch?', answer: 'Services are launching after food. Tell us you\'re interested to be first in line.' }],
  },
  {
    key: 'events', label: 'Events', status: 'live', path: '/events', browseCta: 'Find events',
    tagline: 'Find it, buy tickets, walk in.',
    summary: 'Concerts, parties, workshops and awards nights across Ghana. Pay with mobile money or card — no account needed — and your ticket is in your inbox in seconds. Organisers sell tickets, run paid voting and scan guests in at the gate.',
    examples: ['A rooftop brunch', 'An awards night with voting', 'A two-day workshop', 'A pop-up market'],
    categoriesTitle: 'What\'s on', categories: ['Concerts & music', 'Parties & nightlife', 'Festivals', 'Conferences', 'Workshops', 'Awards & pageants', 'Faith & community', 'Food & drink'],
    steps: [['Find an event', 'Browse by city, date or category.'], ['Pick tickets', 'Several at once, to one email or a different email for each.'], ['Pay securely', 'Mobile money or card. The full price is shown first.'], ['Show your QR', 'Scanned once at the gate. Refunds follow the organiser\'s policy.']],
    providerTitle: 'Organise an event', providerText: 'Create an event, set ticket types and prices in cedis, add gates for your scanners, even run paid voting. You\'re paid after the event, with every number in your dashboard.', providerCta: 'Host an event',
    seo: { title: 'Events and tickets in Ghana', description: 'Find concerts, parties, workshops, festivals and awards nights across Ghana. Buy tickets with mobile money or card — no account needed — and get them instantly by email.' },
    faqs: [{ question: 'Do I need an account to buy tickets?', answer: 'No. You only need an email address for your tickets and receipt. Signing in just keeps all your tickets in one place.' }, { question: 'Can I send tickets to friends?', answer: 'Yes. When you buy several tickets you can send each one to a different email address.' }, { question: 'Can I get a refund?', answer: 'Each organiser sets their own refund policy, shown before you pay. Cancelled events are always refunded in full, and postponed events follow the organiser\'s postponement policy.' }, { question: 'How do organisers get paid?', answer: 'After the event. Lotnis holds ticket money until the event is over, then pays the organiser, so cancelled events can always be refunded.' }],
  },
];

export const lineByKey = (key: LineKey) => LINES.find((l) => l.key === key)!;
export const PARTNER_EMAIL = 'partners@lotnis.com';
export const partnerMailto = (subject: string) => `mailto:${PARTNER_EMAIL}?subject=${encodeURIComponent(subject)}`;
