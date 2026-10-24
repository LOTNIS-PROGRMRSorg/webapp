import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight, ArrowUpRight, BadgeCheck, Building2, CalendarDays, Camera, Check, ChevronLeft, ChevronRight, Clock, CookingPot,
  Hammer, LogOut, MapPin, PartyPopper, Plus, Search, ShieldCheck, Smartphone, Sparkles, Star, Ticket, Undo2, UtensilsCrossed, Wallet, Wrench,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api, getSession } from './api';
import { useReveal } from './bookingUi';
import { formatPrice, periodLabel, primaryImage } from './format';
import { LINES, lineByKey, partnerMailto, type Line, type LineKey } from './lines';
import { DEFAULT_DESCRIPTION, faqLd, organizationLd, Seo, websiteLd } from './seo';
import type { Property } from './types';
import './home.css';

const IMAGES = '/images/landing';

const LINE_ICON: Record<LineKey, typeof Building2> = { spaces: Building2, food: UtensilsCrossed, services: Wrench, events: Ticket };

type Period = 'day' | 'week' | 'month' | 'year';
const PERIODS: { value: Period; label: string }[] = [
  { value: 'day', label: 'Nightly' }, { value: 'week', label: 'Weekly' }, { value: 'month', label: 'Monthly' }, { value: 'year', label: 'Yearly' },
];

const SPACE_TYPES = [
  { slug: 'apartment', label: 'Apartment' }, { slug: 'house', label: 'House' }, { slug: 'villa', label: 'Villa' }, { slug: 'room', label: 'Room' },
  { slug: 'hotel', label: 'Hotel / hostel' }, { slug: 'office', label: 'Office' }, { slug: 'shop', label: 'Shop' }, { slug: 'garage', label: 'Garage' },
  { slug: 'warehouse', label: 'Warehouse' }, { slug: 'venue', label: 'Venue' },
];

// "What you can rent" chips link straight to the matching landing page.
const SPACE_LINKS: Record<string, string> = { Rooms: 'room', Apartments: 'apartment', 'Houses & villas': 'house', Offices: 'office', Shops: 'shop', Garages: 'garage', Warehouses: 'warehouse', Venues: 'venue' };

const FAQS = [
  { id: 'faq-what', question: 'What is Lotnis?', answer: 'Lotnis is one place for the things people need done: rent a space (rooms, homes, offices, garages, warehouses), order food from local vendors, book any service provider — plumbers, tour guides, photographers and more — and organise events. One account, one payment method, verified providers. Spaces is live today; food, services and events are launching next.' },
  { id: 'faq-services', question: 'What kinds of services can I book or offer?', answer: 'Anything a person can do for someone else: home repairs, cleaning, tour guiding, photography and video, driving and moving, tutoring, beauty, design and more. If you can do it, you can offer it — and if you need it, you can ask for it.' },
  { id: 'faq-events', question: 'Can I organise an event on Lotnis?', answer: 'Yes. Create an event, sell tickets in cedis, run paid voting for awards nights, and scan guests in at the gate. You can also book a venue for it through Spaces.' },
  { id: 'faq-offer', question: 'How do I offer food, a service or an event?', answer: 'Hosts, cooks, service providers and organisers all use one verified Lotnis account. Spaces hosting is open now. For food, services and events, tell us you\'re interested at partners@lotnis.com and we\'ll bring you in as each line launches.' },
  { id: 'faq-when-pay', question: 'When do I pay?', answer: 'If a space confirms instantly, you pay right after you reserve (your dates are held for a short window). If the host reviews requests first, you pay only after they accept — and you have up to 72 hours from then to complete payment. Nothing is charged before that.' },
  { id: 'faq-mobile-money', question: 'Can I pay with mobile money?', answer: 'Yes. Checkout runs through Paystack, which accepts MTN, Telecel and AirtelTigo mobile money as well as Visa and Mastercard.' },
  { id: 'faq-cancel', question: 'What happens if I need to cancel a space?', answer: 'Every listing shows its refund policy before you book. For example, under a Standard policy you get 100% of the stay back up to 7 days before check-in, 50% from 3–6 days, and none after that. Your deposit always comes back, the Lotnis service fee is kept, and if the host cancels you get everything back. We show you the exact refund before you confirm.' },
  { id: 'faq-leave-early', question: 'What if I need to leave a space early?', answer: 'Once you have moved in, give notice from My trips. We ask for 7 nights\' notice: give it and there is nothing extra to pay; give less and the shortfall is charged — never past your booking end. If your host re-lets the space, those nights are credited back, and if the host is at fault there is no notice charge.' },
  { id: 'faq-verification', question: 'How are hosts and providers verified?', answer: 'Hosts submit a government ID, a selfie, proof of address and payout details, and the Lotnis team reviews each requirement. Listings are approved before they appear in search. Hosts can\'t take bookings until they are verified.' },
];

type StaySource = 'featured' | 'newest';

/** Featured stays, falling back to the newest approved stays when nothing is featured yet. */
function useHomeStays() {
  const [state, setState] = useState<{ stays: Property[]; source: StaySource; loading: boolean }>({ stays: [], source: 'featured', loading: true });
  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<{ stays: Property[]; source: StaySource }> => {
      const featured = await api.getFeaturedProperties(8).catch(() => [] as Property[]);
      if (featured.length) return { stays: featured, source: 'featured' };
      const newest = await api.searchProperties(new URLSearchParams({ page: '1', limit: '8', sortBy: 'created_at', sortOrder: 'desc' })).catch(() => null);
      return { stays: newest?.data || [], source: 'newest' };
    };
    load().then((result) => { if (!cancelled) setState({ ...result, loading: false }); });
    return () => { cancelled = true; };
  }, []);
  return state;
}


export default function HomePage() {
  const { stays, source, loading } = useHomeStays();
  const heroStay = source === 'featured' ? stays.find((stay) => primaryImage(stay)) : undefined;
  useReveal(loading);
  return (
    <div className="lp">
      <Seo title="Rent spaces, order food, book services & organise events in Ghana" description={DEFAULT_DESCRIPTION} path="/"
        jsonLd={[organizationLd(), websiteLd(), faqLd(FAQS)]} />
      <Hero heroStay={heroStay} />
      <HeroSearch />
      <LinesGrid />
      <SpacesBlock stays={stays} source={source} loading={loading} />
      <FoodBlock />
      <ServicesBlock />
      <EventsBlock />
      <HowItWorks />
      <Trust />
      <Providers />
      <Faq />
    </div>
  );
}

function Hero({ heroStay }: { heroStay?: Property }) {
  return (
    <section className="lp-hero">
      <picture className="lp-hero-media">
        <source media="(max-width: 640px)" srcSet={`${IMAGES}/hero-terracotta-hallway-portrait.webp`} />
        <img src={`${IMAGES}/hero-terracotta-hallway.webp`} alt="" fetchPriority="high" />
      </picture>
      <div className="lp-container lp-hero-content">
        <h1>Everything you need, from people you can trust.</h1>
        <p>Rent a space, order food, book a plumber, a photographer or a tour guide, or organise your next event — one account, one way to pay, verified providers across Ghana.</p>
      </div>
      {heroStay && (
        <Link className="lp-hero-stay" to={`/stays/${heroStay.id}`}>
          <img src={primaryImage(heroStay)} alt="" />
          <span>
            <strong>{heroStay.name}</strong>
            <small>Featured space{heroStay.city ? ` · ${heroStay.city}` : ''}{heroStay.price != null ? ` · from ${formatPrice(heroStay.currency, heroStay.price)} a ${periodLabel(heroStay.pricing_period)}` : ''}</small>
          </span>
          <ArrowRight size={16} />
        </Link>
      )}
    </section>
  );
}

// ── One search box, four lines ──────────────────────────────────────────────
const PLACEHOLDER: Record<Exclude<LineKey, 'spaces'>, string> = {
  food: 'Waakye, cake, catering…', services: 'Plumber, photographer, tour guide…', events: 'Wedding, concert, workshop…',
};

function HeroSearch() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<LineKey>('spaces');
  const [where, setWhere] = useState('');
  const [what, setWhat] = useState('');
  const [period, setPeriod] = useState<Period | ''>('');
  const [space, setSpace] = useState('');
  const line = lineByKey(tab);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (tab === 'spaces') {
      if (where.trim()) params.set('query', where.trim());
      if (period) params.set('pricingPeriod', period);
      if (space) params.set('subType', space);
      const search = params.toString();
      navigate(search ? `/explore?${search}` : '/explore');
    } else {
      if (what.trim()) params.set('query', what.trim());
      if (where.trim()) params.set('where', where.trim());
      navigate(`${line.path}${params.size ? `?${params}` : ''}`);
    }
  };

  return (
    <div className="lp-container lp-search-wrap">
      <div className="lp-tabs" role="tablist" aria-label="What are you looking for?">
        {LINES.map((l) => { const Icon = LINE_ICON[l.key]; return (
          <button key={l.key} type="button" role="tab" aria-selected={tab === l.key} className={tab === l.key ? 'on' : ''} onClick={() => setTab(l.key)}>
            <Icon size={17} /> {l.label}{l.status === 'soon' && <em>Soon</em>}
          </button>); })}
      </div>
      <form className="lp-search" role="search" onSubmit={submit}>
        {tab === 'spaces' ? (<>
          <label className="lp-field lp-field-where"><MapPin size={20} /><span className="lp-field-text"><span className="lp-field-label">Where</span>
            <input value={where} onChange={(e) => setWhere(e.target.value)} placeholder="Search Osu, Kumasi, Cape Coast…" /></span></label>
          <label className="lp-field"><Building2 size={20} /><span className="lp-field-text"><span className="lp-field-label">Space</span>
            <select value={space} onChange={(e) => setSpace(e.target.value)}><option value="">Any kind of space</option>{SPACE_TYPES.map(({ slug, label }) => <option key={slug} value={slug}>{label}</option>)}</select></span></label>
          <label className="lp-field"><CalendarDays size={20} /><span className="lp-field-text"><span className="lp-field-label">Rent by</span>
            <select value={period} onChange={(e) => setPeriod(e.target.value as Period | '')}><option value="">Any length</option>{PERIODS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select></span></label>
        </>) : (<>
          <label className="lp-field lp-field-where"><Search size={20} /><span className="lp-field-text"><span className="lp-field-label">{tab === 'food' ? 'What are you hungry for?' : tab === 'services' ? 'What do you need done?' : 'What are you planning?'}</span>
            <input value={what} onChange={(e) => setWhat(e.target.value)} placeholder={PLACEHOLDER[tab as Exclude<LineKey, 'spaces'>]} /></span></label>
          <label className="lp-field"><MapPin size={20} /><span className="lp-field-text"><span className="lp-field-label">Where</span>
            <input value={where} onChange={(e) => setWhere(e.target.value)} placeholder="Your area or city" /></span></label>
          <div className="lp-field lp-soon-note"><Clock size={20} /><span className="lp-field-text"><span className="lp-field-label">Launching soon</span><span>See what's planned</span></span></div>
        </>)}
        <button className="lp-search-btn" type="submit"><Search size={20} /> {tab === 'spaces' ? 'Search' : 'Learn more'}</button>
      </form>
      <ul className="lp-assurances">
        <li><ShieldCheck size={16} /> Verified hosts and providers</li>
        <li><Smartphone size={16} /> Pay with mobile money or card</li>
        <li><Undo2 size={16} /> Clear prices and fair refund rules</li>
      </ul>
    </div>
  );
}

// ── Four equal doors ────────────────────────────────────────────────────────
function LinesGrid() {
  return (
    <section className="lp-section lp-container lp-lines-sec" aria-labelledby="lp-lines-title">
      <div className="lp-section-head reveal"><div><span className="lp-eyebrow">One account · four ways</span>
        <h2 id="lp-lines-title">Whatever you need, start here.</h2></div></div>
      <div className="lp-lines">
        {LINES.map((l, i) => { const Icon = LINE_ICON[l.key]; return (
          <Link key={l.key} to={l.path} className={`lp-line lp-line-${l.key} reveal`} style={{ transitionDelay: `${i * 70}ms` }}>
            <span className="lp-line-top"><span className="lp-line-icon"><Icon size={26} strokeWidth={1.6} /></span>{l.status === 'live' ? <b className="lp-badge-live">Live now</b> : <b className="lp-badge-soon">Launching soon</b>}</span>
            <h3>{l.label}</h3>
            <p>{l.tagline}</p>
            <ul>{l.examples.slice(0, 3).map((e) => <li key={e}>{e}</li>)}</ul>
            <span className="lp-line-go">{l.status === 'live' ? (l.browseCta ?? 'Browse spaces') : 'See what\'s coming'} <ArrowRight size={15} /></span>
          </Link>); })}
      </div>
    </section>
  );
}

// ── The same block, four times ──────────────────────────────────────────────
function LineBlock({ line, flip, visual, children, id }: { line: Line; flip?: boolean; visual: React.ReactNode; children?: React.ReactNode; id: string }) {
  const Icon = LINE_ICON[line.key];
  return (
    <section className={`lp-section lp-container lp-block lp-block-${line.key}`} aria-labelledby={id}>
      <div className={`lp-block-grid ${flip ? 'is-flip' : ''}`}>
        <div className="lp-block-copy reveal">
          <span className="lp-eyebrow"><Icon size={14} /> {line.label}{line.status === 'soon' ? ' · launching soon' : ' · live now'}</span>
          <h2 className="lp-h2" id={id}>{line.tagline}</h2>
          <p className="lp-lead">{line.summary}</p>
          <div className="lp-cats-title">{line.categoriesTitle}</div>
          <ul className="lp-chips">{line.categories.map((c) => <li key={c}>{line.key === 'spaces' && SPACE_LINKS[c] ? <Link to={`/rent/${SPACE_LINKS[c]}`}>{c}</Link> : c}</li>)}</ul>
          <div className="lp-btn-row">
            <Link className="lp-btn lp-btn-dark" to={line.path}>{line.status === 'live' ? (line.browseCta ?? 'Browse spaces') : `About ${line.label.toLowerCase()}`} <ArrowRight size={16} /></Link>
            {line.status === 'soon' && <a className="lp-btn lp-btn-outline" href={partnerMailto(line.providerMail ?? line.providerTitle)}>{line.providerCta}</a>}
            {line.status === 'live' && <Link className="lp-btn lp-btn-outline" to="/host">{line.providerTitle}</Link>}
          </div>
        </div>
        <div className="lp-block-visual reveal">{visual}</div>
      </div>
      {children}
    </section>
  );
}

function SpacesBlock({ stays, source, loading }: { stays: Property[]; source: StaySource; loading: boolean }) {
  const spaces = lineByKey('spaces');
  return (
    <>
      <LineBlock id="lp-spaces-title" line={spaces} visual={
        <div className="lp-mosaic" aria-hidden="true">
          <img src={`${IMAGES}/stay-osu-apartment.webp`} alt="" loading="lazy" />
          <img src={`${IMAGES}/place-accra.webp`} alt="" loading="lazy" />
          <img src={`${IMAGES}/place-cape-coast.webp`} alt="" loading="lazy" />
          <span className="lp-float lp-float-a"><Building2 size={16} /> Office · Kumasi <b>GHS 2,000 / month</b></span>
        </div>} />
      {(loading || stays.length > 0) && <StayRail stays={stays} source={source} loading={loading} />}
    </>
  );
}

const Mock = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <figure className="lp-mock" aria-label={`${label} (example)`}><figcaption className="lp-example-tag">Example · {label}</figcaption>{children}</figure>
);

function FoodBlock() {
  return (
    <LineBlock id="lp-food-title" line={lineByKey('food')} flip visual={
      <Mock label="a food order">
        <div className="lp-mock-card">
          <div className="lp-mock-head"><span className="lp-mock-avatar lp-tone-food"><CookingPot size={22} /></span><div><strong>Auntie Ama's Kitchen</strong><small>Osu · 4.9 ★ · ready in 25 min</small></div></div>
          <ul className="lp-mock-rows"><li><span>Waakye special</span><b>GHS 45</b></li><li><span>Fried plantain</span><b>GHS 12</b></li><li><span>Sobolo (500ml)</span><b>GHS 8</b></li></ul>
          <div className="lp-mock-total"><span>Total</span><b>GHS 65</b></div>
          <div className="lp-mock-pay"><Smartphone size={16} /> Pay with MoMo</div>
        </div>
      </Mock>} />
  );
}

function ServicesBlock() {
  return (
    <LineBlock id="lp-services-title" line={lineByKey('services')} visual={
      <Mock label="a service booking">
        <div className="lp-mock-card">
          <div className="lp-mock-head"><span className="lp-mock-avatar lp-tone-services"><Hammer size={22} /></span><div><strong>Kwame A. — Plumber</strong><small>Kumasi · 4.8 ★ (126) · <BadgeCheck size={12} /> Verified</small></div></div>
          <ul className="lp-mock-rows"><li><span>Fix a leaking tap</span><b>from GHS 80</b></li><li><span>Available</span><b>Today, 3 pm</b></li><li><span>Payment</span><b>Held until done</b></li></ul>
          <div className="lp-mock-chips"><span><Camera size={13} /> Photographers</span><span><Wrench size={13} /> Electricians</span><span><MapPin size={13} /> Tour guides</span></div>
          <div className="lp-mock-pay"><ShieldCheck size={16} /> Book Kwame</div>
        </div>
      </Mock>} />
  );
}

function EventsBlock() {
  return (
    <LineBlock id="lp-events-title" line={lineByKey('events')} flip visual={
      <Mock label="an event">
        <div className="lp-mock-card">
          <div className="lp-mock-head"><span className="lp-mock-avatar lp-tone-events"><PartyPopper size={22} /></span><div><strong>Rooftop Brunch & Music</strong><small>Sat 14 Nov · Osu, Accra · 120 going</small></div></div>
          <ul className="lp-mock-rows"><li><span>General entry</span><b>GHS 120</b></li><li><span>VIP table (4)</span><b>GHS 600</b></li><li><span>Venue</span><b>Booked via Spaces</b></li></ul>
          <div className="lp-mock-chips"><span><Building2 size={13} /> Venue</span><span><UtensilsCrossed size={13} /> Catering</span><span><Camera size={13} /> Photographer</span></div>
          <div className="lp-mock-pay"><Ticket size={16} /> Get tickets</div>
        </div>
      </Mock>} />
  );
}

// ── Shared: how it works, trust, providers ──────────────────────────────────
function HowItWorks() {
  const steps = [
    ['Find it', 'Search spaces, menus, providers or events — all from one place.', Search],
    ['Book or order', 'Pick your dates, your meal, your provider or your tickets.', CalendarDays],
    ['Pay securely', 'Mobile money or card. You see the full price before you pay.', Wallet],
    ['Done — and rated', 'Your receipts and bookings live in one account; reviews keep everyone honest.', Star],
  ] as const;
  return (
    <section className="lp-section lp-flow" aria-labelledby="lp-how-title">
      <div className="lp-container">
        <div className="lp-section-head reveal"><div><span className="lp-eyebrow">How Lotnis works</span><h2 id="lp-how-title">The same simple flow, every time.</h2></div></div>
        <ol className="lp-how">{steps.map(([title, text, Icon], i) => (
          <li key={title} className="reveal" style={{ transitionDelay: `${i * 70}ms` }}><span className="lp-how-n">{i + 1}</span><Icon size={22} strokeWidth={1.7} /><h3>{title}</h3><p>{text}</p></li>))}</ol>
      </div>
    </section>
  );
}

function Trust() {
  const tiers = [{ label: '7+ days before', pct: 100 }, { label: '3–6 days', pct: 50 }, { label: 'Under 3 days', pct: 0 }];
  return (
    <section className="lp-section lp-fair" aria-labelledby="lp-fair-title">
      <div className="lp-container lp-split">
        <div className="reveal">
          <span className="lp-eyebrow">Built on trust</span>
          <h2 className="lp-h2" id="lp-fair-title">Verified people. Clear prices. Fair rules.</h2>
          <p className="lp-lead">Every host and provider is checked before they can take a booking, you always see the full price first, and the rules for changes and refunds are written down — and visible to everyone involved.</p>
          <ul className="lp-checks">
            <li><span className="lp-check"><ShieldCheck size={15} strokeWidth={2.4} /></span><div><strong>Verified providers</strong><span>ID, selfie and contact checks — reviewed item by item by the Lotnis team.</span></div></li>
            <li><span className="lp-check"><Undo2 size={15} strokeWidth={2.4} /></span><div><strong>Refunds calculated for you</strong><span>See exactly what you'd get back before you cancel. If a host cancels, you get everything back.</span></div></li>
            <li><span className="lp-check"><LogOut size={15} strokeWidth={2.4} /></span><div><strong>Fair notice and honest deposits</strong><span>Leaving a space early? Pay for the nights you stayed plus fair notice. Deposit deductions need photo evidence you can dispute.</span></div></li>
          </ul>
          <div className="lp-btn-row"><Link className="lp-btn lp-btn-dark" to="/refund-policy">Read the refund policy <ArrowRight size={16} /></Link><Link className="lp-btn lp-btn-outline" to="/terms">Terms of Use</Link></div>
        </div>
        <figure className="lp-policy reveal" aria-label="Example refund policy for spaces">
          <figcaption className="lp-example-tag">Example · a space with a Standard policy</figcaption>
          <h3>If you cancel before check-in…</h3>
          <ul className="lp-bars">{tiers.map(({ label, pct }) => (<li key={label}><span>{label}</span><div className="lp-bar"><i style={{ width: `${Math.max(pct, 3)}%` }} className={pct === 0 ? 'zero' : ''} /></div><b>{pct}%</b></li>))}</ul>
          <p className="lp-policy-note">of the stay price refunded. Your deposit is returned in full; the Lotnis service fee is not.</p>
          <div className="lp-policy-ex"><b>Leaving after move-in?</b><span>Stay 10 of 31 nights with no notice → pay for 17, get back 14 nights.</span></div>
        </figure>
      </div>
    </section>
  );
}

function Providers() {
  const signedIn = Boolean(getSession());
  return (
    <section className="lp-section lp-container" aria-labelledby="lp-providers-title">
      <div className="lp-section-head reveal"><div><span className="lp-eyebrow">Earn on Lotnis</span>
        <h2 id="lp-providers-title">Got something to offer? Get paid for it.</h2>
        <p className="lp-intro">One verified account, one payout method — host a space, sell food, offer a service or organise events.</p></div></div>
      <div className="lp-lines lp-providers">
        {LINES.map((l, i) => { const Icon = LINE_ICON[l.key]; return (
          <div key={l.key} className={`lp-line lp-line-${l.key} reveal`} style={{ transitionDelay: `${i * 70}ms` }}>
            <span className="lp-line-top"><span className="lp-line-icon"><Icon size={26} strokeWidth={1.6} /></span>{l.status === 'live' ? <b className="lp-badge-live">Open now</b> : <b className="lp-badge-soon">Soon</b>}</span>
            <h3>{l.providerTitle}</h3><p>{l.providerText}</p>
            {l.status === 'live'
              ? <Link className="lp-line-go" to={signedIn ? '/host' : '/auth?next=/host'}>{l.providerCta} <ArrowRight size={15} /></Link>
              : <a className="lp-line-go" href={partnerMailto(l.providerMail ?? l.providerTitle)}>{l.providerCta} <ArrowRight size={15} /></a>}
          </div>); })}
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section className="lp-section lp-container" style={{ paddingTop: 0 }} aria-labelledby="lp-faq-title">
      <div className="lp-faq-grid">
        <div className="reveal">
          <span className="lp-eyebrow">Good to know</span>
          <h2 className="lp-h2" id="lp-faq-title">Questions, answered.</h2>
          <p>How Lotnis works across spaces, food, services and events — plus payment, refunds and verification.</p>
        </div>
        <div className="lp-faq">
          {FAQS.map(({ id, question, answer }, index) => (
            <details key={id} id={id} open={index === 0}>
              <summary>{question}<Plus size={20} /></summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function StayRail({ stays, source, loading }: { stays: Property[]; source: StaySource; loading: boolean }) {
  const [period, setPeriod] = useState<Period | 'all'>('all');
  const railRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: true });
  const periodOf = (stay: Property) => (stay.pricing_period || 'day') as Period;
  const periods = PERIODS.filter(({ value }) => stays.some((stay) => periodOf(stay) === value));
  const visible = period === 'all' ? stays : stays.filter((stay) => periodOf(stay) === period);

  const updateEdges = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    setEdges({ atStart: rail.scrollLeft <= 4, atEnd: rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4 });
  }, []);
  useEffect(() => { railRef.current?.scrollTo({ left: 0 }); updateEdges(); }, [period, visible.length, loading, updateEdges]);
  useEffect(() => {
    window.addEventListener('resize', updateEdges);
    return () => window.removeEventListener('resize', updateEdges);
  }, [updateEdges]);
  const scroll = (direction: number) => {
    const rail = railRef.current;
    rail?.scrollBy({ left: direction * rail.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <section className="lp-section lp-container" aria-labelledby="lp-stays-title">
      <div className="lp-section-head">
        <div>
          <span className="lp-eyebrow">{source === 'featured' ? 'Featured spaces' : 'New spaces'}</span>
          <h2 id="lp-stays-title">{source === 'featured' ? 'Hand-picked spaces to rent' : 'Freshly listed spaces to rent'}</h2>
        </div>
        <div className="lp-head-tools">
          {periods.length > 1 && (
            <div className="lp-segmented" role="group" aria-label="Filter by length of stay">
              <button type="button" aria-pressed={period === 'all'} onClick={() => setPeriod('all')}>All</button>
              {periods.map(({ value, label }) => <button type="button" key={value} aria-pressed={period === value} onClick={() => setPeriod(value)}>{label}</button>)}
            </div>
          )}
          <Link className="lp-text-link" to={period === 'all' ? '/explore' : `/explore?pricingPeriod=${period}`}>See all</Link>
          <button type="button" className="lp-arrow" aria-label="Previous stays" disabled={edges.atStart} onClick={() => scroll(-1)}><ChevronLeft size={20} /></button>
          <button type="button" className="lp-arrow" aria-label="More stays" disabled={edges.atEnd} onClick={() => scroll(1)}><ChevronRight size={20} /></button>
        </div>
      </div>
      <div className="lp-rail" ref={railRef} onScroll={updateEdges} aria-busy={loading}>
        {loading
          ? Array.from({ length: 4 }, (_, index) => <div className="lp-stay lp-skeleton" key={index} aria-hidden="true"><div className="lp-stay-media" /><i /><i /></div>)
          : visible.map((stay) => <StayCard key={stay.id} stay={stay} />)}
      </div>
    </section>
  );
}

function StayCard({ stay }: { stay: Property }) {
  const image = primaryImage(stay);
  const kind = stay.sub_type ? stay.sub_type.charAt(0).toUpperCase() + stay.sub_type.slice(1) : 'Stay';
  const place = [stay.city, stay.country].filter(Boolean).join(', ');
  return (
    <Link className="lp-stay" to={`/stays/${stay.id}`}>
      <div className="lp-stay-media">
        {image ? <img src={image} alt={`${stay.name} — ${kind.toLowerCase()} in ${stay.city ?? 'Ghana'}`} loading="lazy" /> : <div className="lp-stay-noimage"><Building2 size={26} />Photos coming soon</div>}
        {stay.verified && <span className="lp-badge"><BadgeCheck size={14} /> Verified</span>}
      </div>
      <div className="lp-stay-body">
        <div className="lp-stay-row">
          <h3>{stay.name}</h3>
          {stay.rating
            ? <span className="lp-rating"><Star size={13} strokeWidth={0} /> {stay.rating.toFixed(1)}{stay.review_count ? <small>({stay.review_count})</small> : null}</span>
            : <span className="lp-new">New</span>}
        </div>
        <p className="lp-stay-meta">{kind}{place ? ` · ${place}` : ''}</p>
        <p className="lp-price">
          <strong>{formatPrice(stay.currency, stay.price)}</strong>
          {stay.price != null && <span> {periodLabel(stay.pricing_period)}</span>}
        </p>
      </div>
    </Link>
  );
}

