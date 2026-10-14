import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight, ArrowUpRight, BadgeCheck, BellRing, Building2, CalendarDays, Check, ChevronLeft,
  ChevronRight, Lock, MapPin, Plus, ReceiptText, Search, ShieldCheck, Smartphone, Star, Wallet,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api, getSession } from './api';
import { formatPrice, periodLabel, primaryImage } from './format';
import type { Property } from './types';
import './home.css';

const IMAGES = '/images/landing';

type Period = 'day' | 'month' | 'year';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'day', label: 'Nightly' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
];

// Budget bands per pricing period, in GHS. Sent to /explore as minPrice/maxPrice.
const BUDGETS: Record<Period, { label: string; min?: number; max?: number }[]> = {
  day: [{ label: 'Up to GHS 500', max: 500 }, { label: 'GHS 500 – 1,000', min: 500, max: 1000 }, { label: 'GHS 1,000 and up', min: 1000 }],
  month: [{ label: 'Up to GHS 5,000', max: 5000 }, { label: 'GHS 5,000 – 10,000', min: 5000, max: 10000 }, { label: 'GHS 10,000 and up', min: 10000 }],
  year: [{ label: 'Up to GHS 30,000', max: 30000 }, { label: 'GHS 30,000 – 60,000', min: 30000, max: 60000 }, { label: 'GHS 60,000 and up', min: 60000 }],
};

const DESTINATIONS = [
  { name: 'Cape Coast', query: 'Cape Coast', blurb: 'Castle views and beach guesthouses', image: 'place-cape-coast' },
  { name: 'Kumasi', query: 'Kumasi', blurb: 'Family homes and long lets', image: 'place-kumasi' },
  { name: 'Takoradi & Busua', query: 'Takoradi', blurb: 'Surf towns and quiet beach stays', image: 'place-busua' },
  { name: 'Aburi', query: 'Aburi', blurb: 'Cool hills an hour from Accra', image: 'place-aburi' },
];

const ACCRA_AREAS = ['Osu', 'Cantonments', 'East Legon', 'Airport Residential', 'Labone'];

const FAQS = [
  {
    id: 'faq-when-pay',
    question: 'When do I pay?',
    answer: 'If a stay confirms instantly, you pay right after you reserve. If the host reviews requests first, you pay only after they accept, and you have 72 hours from then to complete payment.',
  },
  {
    id: 'faq-mobile-money',
    question: 'Can I pay with mobile money?',
    answer: 'Yes. Checkout runs through Paystack, which accepts MTN, Telecel and AirtelTigo mobile money as well as Visa and Mastercard cards.',
  },
  {
    id: 'faq-cancel',
    question: 'What happens if I need to cancel?',
    answer: 'Every stay has a Flexible, Standard or Strict cancellation policy. Flexible stays refund in full up to a day before check-in. Standard stays refund in full up to 30 days before, and Strict stays up to 60 days before, with smaller refunds closer to the date.',
  },
  {
    id: 'faq-verification',
    question: 'How are hosts verified?',
    answer: 'Hosts submit a government ID, a selfie, proof of address and their payout details. The Lotnis team reviews every application, and each listing is approved before it appears in search.',
  },
  {
    id: 'faq-long-stays',
    question: 'Can I rent for a month or a full year?',
    answer: 'Yes. Hosts can price by the night, the month or the year. Choose a length of stay when you search to see only those places.',
  },
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
  return (
    <div className="lp">
      <Hero heroStay={heroStay} />
      <HeroSearch />
      {(loading || stays.length > 0) && <StayRail stays={stays} source={source} loading={loading} />}
      <Destinations />
      <BookingFlow />
      <HostSection />
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
        <h1>Stay somewhere worth remembering.</h1>
        <p>Verified apartments, guesthouses and homes across Ghana. Book by the night, the month or the year.</p>
      </div>
      {heroStay && (
        <Link className="lp-hero-stay" to={`/stays/${heroStay.id}`}>
          <img src={primaryImage(heroStay)} alt="" />
          <span>
            <strong>{heroStay.name}</strong>
            <small>Featured{heroStay.city ? ` · ${heroStay.city}` : ''}{heroStay.price != null ? ` · from ${formatPrice(heroStay.currency, heroStay.price)} a ${periodLabel(heroStay.pricing_period)}` : ''}</small>
          </span>
          <ArrowRight size={16} />
        </Link>
      )}
    </section>
  );
}

function HeroSearch() {
  const navigate = useNavigate();
  const [where, setWhere] = useState('');
  const [period, setPeriod] = useState<Period | ''>('');
  const [budget, setBudget] = useState('');
  const budgets = period ? BUDGETS[period] : [];

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (where.trim()) params.set('query', where.trim());
    if (period) params.set('pricingPeriod', period);
    const range = budget === '' ? undefined : budgets[Number(budget)];
    if (range?.min != null) params.set('minPrice', String(range.min));
    if (range?.max != null) params.set('maxPrice', String(range.max));
    const search = params.toString();
    navigate(search ? `/explore?${search}` : '/explore');
  };

  return (
    <div className="lp-container lp-search-wrap">
      <form className="lp-search" role="search" onSubmit={submit}>
        <label className="lp-field lp-field-where">
          <MapPin size={20} />
          <span className="lp-field-text">
            <span className="lp-field-label">Where</span>
            <input value={where} onChange={(e) => setWhere(e.target.value)} placeholder="Search Osu, Kumasi, Cape Coast…" />
          </span>
        </label>
        <label className="lp-field">
          <CalendarDays size={20} />
          <span className="lp-field-text">
            <span className="lp-field-label">Length of stay</span>
            <select value={period} onChange={(e) => { setPeriod(e.target.value as Period | ''); setBudget(''); }}>
              <option value="">Any length</option>
              {PERIODS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
          </span>
        </label>
        <label className="lp-field">
          <Wallet size={20} />
          <span className="lp-field-text">
            <span className="lp-field-label">Budget</span>
            <select value={budget} onChange={(e) => setBudget(e.target.value)} disabled={!period}>
              <option value="">{period ? 'Any price' : 'Pick a length first'}</option>
              {budgets.map((band, index) => <option key={band.label} value={index}>{band.label}</option>)}
            </select>
          </span>
        </label>
        <button className="lp-search-btn" type="submit"><Search size={20} /> Search</button>
      </form>
      <ul className="lp-assurances">
        <li><ShieldCheck size={16} /> Every host is ID-verified</li>
        <li><Smartphone size={16} /> Pay with mobile money or card</li>
        <li><ReceiptText size={16} /> See the full price before you pay</li>
      </ul>
    </div>
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
          <span className="lp-eyebrow">{source === 'featured' ? 'Featured stays' : 'New on Lotnis'}</span>
          <h2 id="lp-stays-title">{source === 'featured' ? 'Hand-picked places to stay' : 'Freshly listed places to stay'}</h2>
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
        {image ? <img src={image} alt="" loading="lazy" /> : <div className="lp-stay-noimage"><Building2 size={26} />Photos coming soon</div>}
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

function Destinations() {
  return (
    <section className="lp-section lp-container" style={{ paddingTop: 0 }} aria-labelledby="lp-places-title">
      <div className="lp-section-head">
        <div>
          <span className="lp-eyebrow">Destinations</span>
          <h2 id="lp-places-title">Where to stay in Ghana</h2>
        </div>
        <Link className="lp-btn lp-btn-outline" to="/explore">Browse all stays <ArrowRight size={16} /></Link>
      </div>
      <div className="lp-bento">
        <div className="lp-place lp-place-lg">
          <img src={`${IMAGES}/place-accra.webp`} alt="" loading="lazy" />
          <span className="lp-place-go" aria-hidden="true"><ArrowUpRight size={16} /></span>
          <h3><Link className="lp-place-link" to="/explore?query=Accra">Accra</Link></h3>
          <p>Apartments and serviced stays close to work, the airport and the coast.</p>
          <ul className="lp-areas" aria-label="Popular areas in Accra">
            {ACCRA_AREAS.map((area) => <li key={area}><Link to={`/explore?query=${encodeURIComponent(area)}`}>{area}</Link></li>)}
          </ul>
        </div>
        {DESTINATIONS.map(({ name, query, blurb, image }) => (
          <div className="lp-place" key={name}>
            <img src={`${IMAGES}/${image}.webp`} alt="" loading="lazy" />
            <span className="lp-place-go" aria-hidden="true"><ArrowUpRight size={16} /></span>
            <h3><Link className="lp-place-link" to={`/explore?query=${encodeURIComponent(query)}`}>{name}</Link></h3>
            <p>{blurb}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function BookingFlow() {
  return (
    <section className="lp-section lp-flow" aria-labelledby="lp-flow-title">
      <div className="lp-container lp-split">
        <div>
          <span className="lp-eyebrow">How booking works</span>
          <h2 className="lp-h2" id="lp-flow-title">Know exactly where your booking stands.</h2>
          <p className="lp-intro">Every request, acceptance and payment is tracked in your account, so you always know what happens next.</p>
          <ol className="lp-steps">
            <li className="lp-step"><span className="lp-step-n">1</span><div><h3>Find your place</h3><p>Search by area, budget and length of stay. The Lotnis team reviews every listing before it goes live.</p></div></li>
            <li className="lp-step"><span className="lp-step-n">2</span><div><h3>Send a request</h3><p>Some places confirm instantly. Otherwise the host has <strong>48 hours</strong> to accept.</p></div></li>
            <li className="lp-step"><span className="lp-step-n">3</span><div><h3>Pay to secure it</h3><p>Once accepted, you have <strong>72 hours</strong> to pay by mobile money or card. Nothing is charged before then.</p></div></li>
            <li className="lp-step"><span className="lp-step-n">4</span><div><h3>Check in</h3><p>Your booking, receipt and host details stay in My trips.</p></div></li>
          </ol>
        </div>

        <figure className="lp-example" aria-label="Example of a booking in My trips">
          <figcaption className="lp-example-tag">Example booking</figcaption>
          <div className="lp-toast" aria-hidden="true">
            <span className="lp-toast-icon"><BellRing size={18} /></span>
            <div><strong>Abena accepted your request</strong><span>Pay by Thu 13 Nov, 4:12 pm to secure your stay.</span></div>
          </div>
          <div className="lp-booking" aria-hidden="true">
            <div className="lp-booking-head">
              <img src={`${IMAGES}/stay-osu-apartment.webp`} alt="" loading="lazy" />
              <div>
                <strong>Osu Courtyard Apartment</strong>
                <p>Fri 14 – Mon 17 Nov · 3 nights</p>
                <span className="lp-status">Awaiting payment</span>
              </div>
            </div>
            <ol className="lp-timeline">
              <li><span className="lp-dot"><Check size={13} strokeWidth={3} /></span>Request sent<time>Mon 10 Nov, 9:40 am</time></li>
              <li><span className="lp-dot"><Check size={13} strokeWidth={3} /></span>Host accepted<time>Mon 10 Nov, 4:12 pm</time></li>
              <li className="is-now"><span className="lp-dot" />Payment due<time>2 days 6 hrs left</time></li>
              <li className="is-next"><span className="lp-dot" />Booking secured<time>—</time></li>
            </ol>
            <div className="lp-lines">
              <div><span>GHS 850.00 × 3 nights</span><span>GHS 2,550.00</span></div>
              <div><span>Lotnis service fee</span><span>GHS 51.00</span></div>
              <div className="is-total"><span>Total</span><span>GHS 2,601.00</span></div>
            </div>
            <div className="lp-pay"><Lock size={16} /> Pay GHS 2,601.00</div>
            <div className="lp-pay-meta"><span>Secured by Paystack</span><span className="lp-methods"><span>MoMo</span><span>VISA</span><span>MC</span></span></div>
          </div>
        </figure>
      </div>
    </section>
  );
}

function HostSection() {
  const signedIn = Boolean(getSession());
  const showVerification = () => {
    const item = document.getElementById('faq-verification') as HTMLDetailsElement | null;
    if (!item) return;
    item.open = true;
    item.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  return (
    <section className="lp-section lp-container" aria-labelledby="lp-host-title">
      <div className="lp-split">
        <div className="lp-host-media">
          <img src={`${IMAGES}/host-portrait.webp`} alt="A host relaxing on a wooden sofa at home" loading="lazy" />
          <div className="lp-payout" aria-hidden="true">
            <span className="lp-payout-icon"><Wallet size={20} /></span>
            <div><strong>Payout sent</strong><span>MTN MoMo •••• 4821 · 12 Nov</span></div>
            <b>GHS 2,473.50</b>
          </div>
        </div>
        <div>
          <span className="lp-eyebrow">Host on Lotnis</span>
          <h2 className="lp-h2" id="lp-host-title">Turn your spare room, flat or house into income.</h2>
          <p className="lp-lead">List a room for the weekend or a home for the year. You set the price and the cancellation policy, you choose who stays, and payouts go straight to your bank or mobile money wallet.</p>
          <ul className="lp-checks">
            <li><span className="lp-check"><Check size={15} strokeWidth={2.6} /></span><div><strong>Verify who you are</strong><span>A government ID, such as your Ghana Card, and a selfie.</span></div></li>
            <li><span className="lp-check"><Check size={15} strokeWidth={2.6} /></span><div><strong>Confirm your address</strong><span>A recent utility bill or similar document.</span></div></li>
            <li><span className="lp-check"><Check size={15} strokeWidth={2.6} /></span><div><strong>Choose how you get paid</strong><span>A bank account or a mobile money number.</span></div></li>
          </ul>
          <div className="lp-btn-row">
            <Link className="lp-btn lp-btn-dark" to={signedIn ? '/host' : '/auth?next=/host'}>Start your listing <ArrowRight size={16} /></Link>
            <button type="button" className="lp-btn lp-btn-outline" onClick={showVerification}>How verification works</button>
          </div>
          <p className="lp-fine">Free to list. Lotnis takes a small commission only when you get booked.</p>
        </div>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section className="lp-section lp-container" style={{ paddingTop: 0 }} aria-labelledby="lp-faq-title">
      <div className="lp-faq-grid">
        <div>
          <span className="lp-eyebrow">Good to know</span>
          <h2 className="lp-h2" id="lp-faq-title">Questions before you book</h2>
          <p>Straight answers on payment, cancellations and how we check hosts.</p>
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
