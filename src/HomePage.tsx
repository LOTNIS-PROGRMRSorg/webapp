import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight, BadgeCheck, Building2, CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin, Search, ShieldCheck, Smartphone, Star, Ticket, Undo2, UtensilsCrossed, Wrench,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api, getSession } from './api';
import { useReveal } from './bookingUi';
import { formatPrice, periodLabel, primaryImage } from './format';
import { LINES, lineByKey, partnerMailto, type LineKey } from './lines';
import { cedisShort, fmtDate } from './eventUi';
import { eventApi, type EventCard } from './eventApi';
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

type StaySource = 'featured' | 'newest';

/** The next few events on sale. Quietly empty if events aren't available yet, so the page never breaks. */
function useHomeEvents() {
  const [state, setState] = useState<{ events: EventCard[]; loading: boolean }>({ events: [], loading: true });
  useEffect(() => {
    let live = true;
    eventApi.list({ limit: 8 }).then((r) => live && setState({ events: r.data, loading: false })).catch(() => live && setState({ events: [], loading: false }));
    return () => { live = false; };
  }, []);
  return state;
}

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
  const { events, loading: eventsLoading } = useHomeEvents();
  const heroStay = source === 'featured' ? stays.find((stay) => primaryImage(stay)) : undefined;
  useReveal(loading || eventsLoading);
  return (
    <div className="lp">
      <Seo title="Rent spaces and buy event tickets in Ghana" description={DEFAULT_DESCRIPTION} path="/"
        jsonLd={[organizationLd(), websiteLd()]} />
      <Hero heroStay={heroStay} />
      <HeroSearch />
      <LinesGrid />
      {(loading || stays.length > 0) && <StayRail stays={stays} source={source} loading={loading} />}
      {(eventsLoading || events.length > 0) && <EventRail events={events} loading={eventsLoading} />}
      <Providers />
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
        <p>Rent a space, buy tickets to an event, and soon order food or book a plumber, a photographer or a tour guide — one account, one way to pay, verified providers across Ghana.</p>
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
    } else if (line.status === 'live') {
      // Events: the text is what they're after; the place narrows it to a city.
      const text = what.trim() || where.trim();
      if (text) params.set('query', text);
      if (what.trim() && where.trim()) params.set('city', where.trim());
      navigate(`${line.path}${params.toString() ? `?${params}` : ''}`);
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
          {line.status === 'soon' && <div className="lp-field lp-soon-note"><Clock size={20} /><span className="lp-field-text"><span className="lp-field-label">Launching soon</span><span>See what's planned</span></span></div>}
        </>)}
        <button className="lp-search-btn" type="submit"><Search size={20} /> {line.status === 'live' ? 'Search' : 'Learn more'}</button>
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

function Providers() {
  const signedIn = Boolean(getSession());
  return (
    <section className="lp-section lp-container" aria-labelledby="lp-providers-title">
      <div className="lp-section-head reveal"><div><span className="lp-eyebrow">Earn on Lotnis</span>
        <h2 id="lp-providers-title">Got a space or an event? Get paid for it.</h2>
        <p className="lp-intro">One verified account and one payout method. <Link to="/how-it-works">See how Lotnis works</Link>.</p></div></div>
      <div className="lp-lines lp-providers">
        {LINES.filter((l) => l.status === 'live').map((l, i) => { const Icon = LINE_ICON[l.key]; return (
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


function EventRail({ events, loading }: { events: EventCard[]; loading: boolean }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: true });
  const updateEdges = useCallback(() => {
    const rail = railRef.current;
    if (rail) setEdges({ atStart: rail.scrollLeft <= 4, atEnd: rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4 });
  }, []);
  useEffect(() => { updateEdges(); }, [events.length, loading, updateEdges]);
  useEffect(() => { window.addEventListener('resize', updateEdges); return () => window.removeEventListener('resize', updateEdges); }, [updateEdges]);
  const scroll = (direction: number) => { const rail = railRef.current; rail?.scrollBy({ left: direction * rail.clientWidth * 0.8, behavior: 'smooth' }); };
  return (
    <section className="lp-section lp-container" aria-labelledby="lp-events-title">
      <div className="lp-section-head">
        <div><span className="lp-eyebrow">Upcoming events</span><h2 id="lp-events-title">What's on in Ghana</h2></div>
        <div className="lp-head-tools">
          <Link className="lp-text-link" to="/events">See all</Link>
          <button type="button" className="lp-arrow" aria-label="Previous events" disabled={edges.atStart} onClick={() => scroll(-1)}><ChevronLeft size={20} /></button>
          <button type="button" className="lp-arrow" aria-label="More events" disabled={edges.atEnd} onClick={() => scroll(1)}><ChevronRight size={20} /></button>
        </div>
      </div>
      <div className="lp-rail" ref={railRef} onScroll={updateEdges} aria-busy={loading}>
        {loading
          ? Array.from({ length: 4 }, (_, index) => <div className="lp-stay lp-skeleton" key={index} aria-hidden="true"><div className="lp-stay-media" /><i /><i /></div>)
          : events.map((ev) => (
            <Link className="lp-stay" to={`/events/${ev.slug}`} key={ev.id}>
              <div className="lp-stay-media">
                {ev.cover_image_url ? <img src={ev.cover_image_url} alt={`${ev.title} in ${ev.city}`} loading="lazy" /> : <div className="lp-stay-noimage"><Ticket size={26} /></div>}
                <span className="lp-badge">{fmtDate(ev.starts_at, { day: 'numeric', month: 'short' })}</span>
              </div>
              <div className="lp-stay-body">
                <div className="lp-stay-row"><h3>{ev.title}</h3></div>
                <p className="lp-stay-meta">{ev.category} · {ev.venue_name}, {ev.city}</p>
                <p className="lp-price"><strong>{ev.sold_out ? 'Sold out' : ev.from_price == null ? 'Tickets' : ev.from_price === 0 ? 'Free' : `From ${cedisShort(ev.from_price, ev.currency)}`}</strong></p>
              </div>
            </Link>))}
        <Link className="lp-stay lp-more" to="/events"><div className="lp-more-inner"><ArrowRight size={22} /><strong>View more events</strong></div></Link>
      </div>
    </section>
  );
}
