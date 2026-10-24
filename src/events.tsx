import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, BadgeCheck, CalendarDays, Check, ChevronDown, Clock, Mail, MapPin, Minus, Plus, Search, ShieldCheck, Star, Ticket, Trophy, Users } from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getSession } from './api';
import { Seo, SITE_URL } from './seo';
import { cedis, cedisShort, fmtDate, fmtDateTime, fmtRange, fmtTime, forgetPayment, payWithPaystack, QrImage, recallPayment, rememberPayment, TicketStatusPill } from './eventUi';
import { eventApi, EventCard, EventDetail, OrderView, Quote, TicketView } from './eventApi';
import { Leaderboard } from './voting';

// ─────────────────────────────────────────────────────────────────────────────
// Public events: browse → event page (tickets + voting + policies) → order / ticket pages.
// Guests need only an email. Signed-in buyers can use their account email or any other.
// ─────────────────────────────────────────────────────────────────────────────

const errText = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

function EventTile({ ev }: { ev: EventCard }) {
  const price = ev.sold_out ? 'Sold out' : ev.from_price == null ? 'Tickets' : ev.from_price === 0 ? 'Free' : `From ${cedisShort(ev.from_price, ev.currency)}`;
  return (
    <Link className="ev-card" to={`/events/${ev.slug}`}>
      <div className="ev-card-img">
        {ev.cover_image_url ? <img src={ev.cover_image_url} alt={`${ev.title} — ${ev.category} in ${ev.city}`} loading="lazy" decoding="async" /> : <div className="ev-card-ph"><Ticket size={34} /></div>}
        <span className="ev-date-badge"><b>{fmtDate(ev.starts_at, { day: 'numeric' })}</b>{fmtDate(ev.starts_at, { month: 'short' })}</span>
        {ev.postponed && <span className="ev-flag ev-flag-warn">Postponed</span>}
        {ev.status === 'cancelled' && <span className="ev-flag ev-flag-bad">Cancelled</span>}
        {ev.voting_enabled && ev.status === 'published' && <span className="ev-flag"><Trophy size={12} /> Voting</span>}
      </div>
      <div className="ev-card-body">
        <small>{ev.category}</small>
        <h3>{ev.title}</h3>
        <p><CalendarDays size={14} /> {fmtDate(ev.starts_at)} · {fmtTime(ev.starts_at)}</p>
        <p><MapPin size={14} /> {ev.venue_name}, {ev.city}</p>
        <strong className={ev.sold_out ? 'ev-soldout' : ''}>{price}</strong>
      </div>
    </Link>
  );
}

export function EventsPage() {
  const [params, setParams] = useSearchParams();
  const [events, setEvents] = useState<EventCard[] | null>(null);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [cities, setCities] = useState<Array<{ city: string; count: number }>>([]);
  const [error, setError] = useState('');
  const [query, setQuery] = useState(params.get('query') || '');
  const category = params.get('category') || '', city = params.get('city') || '', when = params.get('when') || '', free = params.get('free') === 'true';

  useEffect(() => { eventApi.categories().then(setCategories).catch(() => {}); eventApi.cities().then(setCities).catch(() => {}); }, []);
  const range = useMemo(() => {
    const now = new Date(); const day = 86_400_000;
    if (when === 'today') { const end = new Date(now); end.setHours(23, 59, 59, 999); return { from: now.toISOString(), to: end.toISOString() }; }
    if (when === 'week') return { from: now.toISOString(), to: new Date(now.getTime() + 7 * day).toISOString() };
    if (when === 'month') return { from: now.toISOString(), to: new Date(now.getTime() + 31 * day).toISOString() };
    return {} as { from?: string; to?: string };
  }, [when]);
  useEffect(() => {
    setEvents(null);
    eventApi.list({ query: params.get('query') || undefined, category: category || undefined, city: city || undefined, free: free ? 'true' : undefined, ...range, limit: 36 })
      .then((r) => { setEvents(r.data); setTotal(r.total); setError(''); })
      .catch((e) => { setError(errText(e, 'Unable to load events')); setEvents([]); });
  }, [params, category, city, free, range]);

  const set = (key: string, value: string) => { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); setParams(next, { replace: true }); };
  const submit = (e: FormEvent) => { e.preventDefault(); set('query', query.trim()); };
  const title = [category, city && `in ${city}`].filter(Boolean).join(' ') || 'Events and tickets in Ghana';

  return (
    <div className="page">
      <Seo title={`${title} — buy tickets`} description="Find concerts, parties, workshops, festivals and awards nights across Ghana. Buy tickets with mobile money or card — no account needed — and get them instantly by email." path={`/events${params.toString() ? `?${params}` : ''}`} jsonLd={[{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Events in Ghana', url: `${SITE_URL}/events` }]} />
      <div className="page-head"><div><span className="eyebrow">Events</span><h1>What's on in Ghana.</h1><p className="lead">Concerts, parties, workshops and awards nights. Pay with mobile money or card — your ticket lands in your inbox in seconds.</p></div></div>
      <form className="ev-filters" onSubmit={submit}>
        <div className="ev-search"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search events, venues, places…" aria-label="Search events" /><button className="button button-primary">Search</button></div>
        <div className="ev-filter-row">
          <label className="ev-select"><span>City</span><select value={city} onChange={(e) => set('city', e.target.value)}><option value="">All cities</option>{cities.map((c) => <option key={c.city} value={c.city}>{c.city} ({c.count})</option>)}</select></label>
          <label className="ev-select"><span>Category</span><select value={category} onChange={(e) => set('category', e.target.value)}><option value="">All categories</option>{categories.map((c) => <option key={c}>{c}</option>)}</select></label>
          <div className="ev-chips" role="group" aria-label="When">
            {[['', 'Anytime'], ['today', 'Today'], ['week', 'This week'], ['month', 'This month']].map(([v, l]) => <button type="button" key={v} className={`chip ${when === v ? 'chip-active' : ''}`} onClick={() => set('when', v)}>{l}</button>)}
            <button type="button" className={`chip ${free ? 'chip-active' : ''}`} onClick={() => set('free', free ? '' : 'true')}>Free</button>
          </div>
        </div>
      </form>
      {error ? <div className="error-state">{error}</div> : !events ? <div className="ev-grid">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="ev-card ev-skel" />)}</div>
        : events.length ? <><p className="muted-inline">{total} event{total === 1 ? '' : 's'}</p><div className="ev-grid">{events.map((ev) => <EventTile key={ev.id} ev={ev} />)}</div></>
        : <div className="empty-state"><Ticket size={28} /><p>No events match yet.</p><Link className="button button-secondary" to="/events" onClick={() => setQuery('')}>Clear filters</Link></div>}
      <section className="ev-cta"><div><h2>Putting something on?</h2><p>Sell tickets, run awards voting and scan guests in at the gate. You're paid after the event, with every number in one dashboard.</p></div><Link className="button button-primary" to="/host/events">Host an event <ArrowRight size={16} /></Link></section>
    </div>
  );
}

// ── Event page ────────────────────────────────────────────────────────────────

type Tab = 'tickets' | 'about' | 'vote' | 'reviews';
const POLICY_ICON = <ShieldCheck size={16} />;

export function EventPage() {
  const { slug = '' } = useParams();
  const [ev, setEv] = useState<EventDetail | null>(null);
  const [error, setError] = useState('');
  const [query] = useSearchParams();
  const wanted = (['tickets', 'about', 'vote', 'reviews'] as Tab[]).find((t) => t === query.get('tab')) ?? 'tickets';
  const [tab, setTab] = useState<Tab>(wanted);
  const [reviews, setReviews] = useState<Awaited<ReturnType<typeof eventApi.reviews>>>([]);
  useEffect(() => {
    setEv(null); setError('');
    eventApi.get(slug).then((e) => { setEv(e); setTab(wanted); eventApi.reviews(slug).then(setReviews).catch(() => {}); }).catch((e) => setError(errText(e, 'Event not found')));
  }, [slug]);

  if (error) return <div className="page"><Link className="back-link" to="/events">← All events</Link><div className="error-state">{error}</div></div>;
  if (!ev) return <div className="page"><div className="skeleton-hero" /></div>;

  const cancelled = ev.status === 'cancelled';
  const ended = new Date(ev.ends_at) < new Date();
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Event', name: ev.title, description: ev.summary || ev.description.slice(0, 300), startDate: ev.starts_at, endDate: ev.ends_at,
    eventStatus: cancelled ? 'https://schema.org/EventCancelled' : ev.postponed ? 'https://schema.org/EventRescheduled' : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode', image: ev.cover_image_url ? [ev.cover_image_url] : undefined,
    location: { '@type': 'Place', name: ev.venue_name, address: { '@type': 'PostalAddress', streetAddress: ev.address || undefined, addressLocality: ev.city, addressCountry: 'GH' } },
    organizer: ev.host ? { '@type': 'Organization', name: ev.host.name } : undefined,
    offers: ev.ticket_types.map((t) => ({ '@type': 'Offer', name: t.name, price: t.price, priceCurrency: ev.currency, url: `${SITE_URL}/events/${ev.slug}`, availability: t.status === 'sold_out' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock' })),
  };
  const tabs: Array<[Tab, string]> = [['tickets', cancelled || ended ? 'Tickets' : 'Get tickets'], ['about', 'About & policies'], ...(ev.voting ? [['vote', 'Vote'] as [Tab, string]] : []), ['reviews', `Reviews${ev.rating ? ` (${ev.rating.count})` : ''}`]];

  return (
    <div className="page ev-page">
      <Seo title={`${ev.title} — tickets, ${ev.city}`} description={ev.summary || ev.description.slice(0, 160)} path={`/events/${ev.slug}`} image={ev.cover_image_url} imageAlt={ev.title} type="article" jsonLd={[jsonLd]} noindex={ev.status !== 'published'} />
      <Link className="back-link" to="/events">← All events</Link>
      <div className="ev-hero">
        {ev.cover_image_url ? <img src={ev.cover_image_url} alt={ev.title} /> : <div className="ev-card-ph"><Ticket size={52} /></div>}
        <div className="ev-hero-shade" />
        <div className="ev-hero-text">
          <span className="ev-hero-cat">{ev.category}</span>
          <h1>{ev.title}</h1>
          <p>{fmtRange(ev.starts_at, ev.ends_at)}</p>
          <p><MapPin size={15} /> {ev.venue_name}, {ev.city}</p>
        </div>
      </div>
      {cancelled && <div className="bk-callout ev-banner-bad"><Clock size={22} /><div><b>This event was cancelled</b><p>{ev.cancellation_reason || 'The organiser cancelled the event.'} Ticket holders are refunded in full.</p></div></div>}
      {ev.postponed && !cancelled && <div className="bk-callout bk-callout-warm"><Clock size={22} /><div><b>Postponed to {fmtDateTime(ev.starts_at)}</b><p>{ev.postponed_from && <>It was due on {fmtDate(ev.postponed_from)}. </>}{ev.postponement_policy === 'refund_all' ? 'Every ticket is being refunded in full.' : ev.postponement_policy === 'carry_over' ? 'Existing tickets stay valid for the new date.' : `Existing tickets stay valid — holders can ask for a full refund${ev.postponed_refund_deadline ? ` until ${fmtDateTime(ev.postponed_refund_deadline)}` : ''}.`}</p></div></div>}
      {ev.status !== 'published' && ev.is_owner && <div className="notice"><span>You're previewing this event as its organiser. Status: <b>{ev.status.replace('_', ' ')}</b>. <Link to={`/host/events/${ev.id}`}>Open in your dashboard</Link></span></div>}

      <div className="ev-layout">
        <div className="ev-main">
          <div className="ev-tabs" role="tablist">{tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={`ev-tab ${tab === k ? 'ev-tab-on' : ''}`} onClick={() => setTab(k)}>{l}</button>)}</div>
          {tab === 'tickets' && <section className="ev-section">
            <p className="ev-summary">{ev.summary || ev.description.slice(0, 220)}</p>
            <TicketBuyer ev={ev} disabled={cancelled || ended || ev.status !== 'published'} />
          </section>}
          {tab === 'about' && <About ev={ev} />}
          {tab === 'vote' && ev.voting && <Leaderboard ev={ev} />}
          {tab === 'reviews' && <section className="ev-section">
            {ev.rating && <div className="ev-rating"><Star size={20} fill="currentColor" /> <b>{ev.rating.average}</b> <span>from {ev.rating.count} verified attendee{ev.rating.count === 1 ? '' : 's'}</span></div>}
            {reviews.length ? reviews.map((r) => <article className="ev-review" key={r.id}><div className="ev-stars">{'★'.repeat(r.rating)}<span>{'★'.repeat(5 - r.rating)}</span></div><p>{r.comment || 'No comment.'}</p><small>{r.reviewer_name || 'Attendee'} · {fmtDate(r.created_at)}</small>{r.host_reply && <blockquote><b>Organiser:</b> {r.host_reply}</blockquote>}</article>)
              : <div className="empty-state">No reviews yet. Reviews come from people whose ticket was scanned at the gate.</div>}
          </section>}
        </div>
        <aside className="ev-side">
          <div className="ev-sidecard">
            <h3>When &amp; where</h3>
            <p><CalendarDays size={16} /> <span>{fmtDate(ev.starts_at, { dateStyle: 'full' })}<br />{fmtTime(ev.starts_at)} – {fmtTime(ev.ends_at)}</span></p>
            <p><MapPin size={16} /> <span>{ev.venue_name}{ev.address ? `, ${ev.address}` : ''}<br />{ev.city}</span></p>
            <a className="ev-maplink" target="_blank" rel="noreferrer" href={ev.latitude && ev.longitude ? `https://www.google.com/maps/search/?api=1&query=${ev.latitude},${ev.longitude}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${ev.venue_name} ${ev.city} Ghana`)}`}>Open in Maps</a>
            {ev.host && <p className="ev-host"><Users size={16} /> <span>Organised by <b>{ev.host.name}</b>{ev.host.verified && <BadgeCheck size={15} className="ev-verified" aria-label="Verified host" />}</span></p>}
          </div>
        </aside>
      </div>
    </div>
  );
}

function About({ ev }: { ev: EventDetail }) {
  return (
    <section className="ev-section ev-about">
      <h2>About this event</h2>
      <p className="ev-desc">{ev.description}</p>
      <dl className="ev-facts">
        {ev.doors_open_at && <><dt>Doors open</dt><dd>{fmtTime(ev.doors_open_at)}</dd></>}
        {ev.age_limit && <><dt>Age</dt><dd>{ev.age_limit}</dd></>}
        {ev.dress_code && <><dt>Dress code</dt><dd>{ev.dress_code}</dd></>}
        {ev.entry_rules && <><dt>Entry rules</dt><dd>{ev.entry_rules}</dd></>}
        {(ev.contact_phone || ev.contact_email) && <><dt>Contact</dt><dd>{[ev.contact_phone, ev.contact_email].filter(Boolean).join(' · ')}</dd></>}
      </dl>
      <h2>Refunds &amp; changes</h2>
      <ul className="policy-ticks">{ev.refund_summary.map((l) => <li key={l}>{l}</li>)}</ul>
      <h2>How you pay</h2>
      <ul className="policy-ticks">
        <li>{ev.fee_mode === 'on_top' ? `Ticket prices exclude Lotnis's ${ev.commission_percent}% service fee, which is added at checkout.` : 'The price you see is the ticket price — the Lotnis service fee is already included.'}</li>
        <li>Mobile money or card, handled by Paystack. A payment-processing fee (about {ev.processing_fee_percent}%) is added at checkout and is not refundable.</li>
        <li>No account needed. Your tickets are emailed to you straight away.</li>
      </ul>
      {ev.terms && <details className="policy-detail"><summary>Organiser's terms</summary><p className="ev-desc">{ev.terms}</p></details>}
    </section>
  );
}

// ── Ticket picker + checkout ──────────────────────────────────────────────────

function TicketBuyer({ ev, disabled }: { ev: EventDetail; disabled: boolean }) {
  const navigate = useNavigate();
  const session = getSession();
  const [qty, setQty] = useState<Record<string, number>>({});
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [step, setStep] = useState<'pick' | 'details'>('pick');
  const [email, setEmail] = useState(session?.email || '');
  const [name, setName] = useState('');
  const [split, setSplit] = useState(false);
  const [holders, setHolders] = useState<Record<number, { email: string; name: string }>>({});
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState<{ orderId: string; token: string; reference: string; amount: number; currency: string } | null>(null);

  const items = useMemo(() => Object.entries(qty).filter(([, n]) => n > 0).map(([ticket_type_id, quantity]) => ({ ticket_type_id, quantity })), [qty]);
  const count = items.reduce((a, i) => a + i.quantity, 0);
  const tickets = useMemo(() => items.flatMap((i) => Array.from({ length: i.quantity }, () => i.ticket_type_id)), [items]);

  useEffect(() => {
    if (!items.length) { setQuote(null); return; }
    setQuoting(true);
    const t = window.setTimeout(() => eventApi.quote(ev.id, items).then((q) => { setQuote(q); setError(''); }).catch((e) => { setQuote(null); setError(errText(e, 'Unable to price your tickets')); }).finally(() => setQuoting(false)), 250);
    return () => window.clearTimeout(t);
  }, [ev.id, items]);

  const change = (id: string, delta: number, max: number) => setQty((q) => {
    const total = Object.values(q).reduce((a, b) => a + b, 0);
    const next = Math.max(0, Math.min(max, (q[id] ?? 0) + delta));
    if (delta > 0 && total >= ev.max_tickets_per_order) return q;
    return { ...q, [id]: next };
  });

  const finish = async (orderId: string, token: string) => { forgetPayment(orderId); navigate(`/orders/${orderId}?token=${token}`); };
  const pay = async (p: NonNullable<typeof pending>, buyerEmail: string) => {
    const reference = await payWithPaystack({ email: buyerEmail, amountPesewas: Math.round(p.amount * 100), currency: p.currency, reference: p.reference, orderId: p.orderId });
    if (!reference) { setError('Payment window closed. Your tickets are held for 10 minutes — you can try again.'); return; }
    rememberPayment(p.orderId, reference, p.token);
    await eventApi.confirm(p.orderId, reference, p.token);
    await finish(p.orderId, p.token);
  };
  const checkout = async () => {
    setError('');
    if (!/^\S+@\S+\.\S{2,}$/.test(email.trim())) { setError('Enter a valid email — your tickets and receipt go there.'); return; }
    if (split) { for (let i = 0; i < tickets.length; i++) { const h = holders[i]?.email?.trim(); if (h && !/^\S+@\S+\.\S{2,}$/.test(h)) { setError(`Ticket ${i + 1}: that email isn't valid.`); return; } } }
    if (!agree) { setError('Please accept the refund policy and event terms to continue.'); return; }
    setBusy(true);
    try {
      if (pending) { const fresh = await eventApi.newReference(pending.orderId, pending.token); const next = { ...pending, reference: fresh.reference }; setPending(next); await pay(next, email.trim()); return; }
      const res = await eventApi.checkout(ev.id, {
        email: email.trim(), name: name.trim() || undefined, accepted_terms: true,
        tickets: tickets.map((id, i) => ({ ticket_type_id: id, holder_email: split ? holders[i]?.email?.trim() || undefined : undefined, holder_name: split ? holders[i]?.name?.trim() || undefined : undefined })),
      });
      if (res.free) { await finish(res.order_id, res.access_token); return; }
      const p = { orderId: res.order_id, token: res.access_token, reference: res.reference!, amount: (res.amount_pesewas ?? 0) / 100, currency: res.currency || ev.currency };
      setPending(p); await pay(p, email.trim());
    } catch (e) { setError(errText(e, 'Something went wrong. Please try again.')); } finally { setBusy(false); }
  };

  const typeName = (id: string) => ev.ticket_types.find((t) => t.id === id)?.name || 'Ticket';
  if (!ev.ticket_types.length) return <div className="empty-state">Tickets haven't been added yet.</div>;

  return (
    <div className="ev-buy">
      <div className="ev-types">
        {ev.ticket_types.map((t) => {
          const q = qty[t.id] ?? 0; const max = Math.min(t.max_per_order, ev.max_tickets_per_order, t.remaining ?? 50);
          const live = t.status === 'on_sale' && !disabled;
          return (
            <div className={`ev-type ${q > 0 ? 'ev-type-on' : ''}`} key={t.id}>
              <div className="ev-type-info">
                <b>{t.name}</b>{t.description && <p>{t.description}</p>}
                <small>{t.status === 'sold_out' ? 'Sold out' : t.status === 'not_started' ? `Sales open ${t.sales_start ? fmtDateTime(t.sales_start) : 'soon'}` : t.status === 'ended' ? 'Sales closed' : t.remaining != null ? `Only ${t.remaining} left` : t.max_per_order < ev.max_tickets_per_order ? `Up to ${t.max_per_order} per order` : ''}</small>
              </div>
              <strong className="ev-type-price">{t.is_free ? 'Free' : cedis(t.price, ev.currency)}</strong>
              <div className="ev-stepper" aria-label={`${t.name} quantity`}>
                <button type="button" onClick={() => change(t.id, -1, max)} disabled={!live || q === 0} aria-label="Fewer"><Minus size={16} /></button>
                <output>{q}</output>
                <button type="button" onClick={() => change(t.id, 1, max)} disabled={!live || q >= max} aria-label="More"><Plus size={16} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {count > 0 && quote && (
        <div className="ev-checkout">
          <div className="ev-lines">
            {quote.lines.map((l) => <div key={l.ticket_type_id}><span>{l.quantity} × {l.name}</span><b>{(l.unit_price ?? 0) === 0 ? 'Free' : cedis((l.quantity ?? 0) * (l.unit_price ?? 0), quote.currency)}</b></div>)}
            {quote.service_fee > 0 && <div><span>Lotnis service fee</span><b>{cedis(quote.service_fee, quote.currency)}</b></div>}
            {quote.processing_fee > 0 && <div><span>Payment processing</span><b>{cedis(quote.processing_fee, quote.currency)}</b></div>}
            <div className="ev-total"><span>Total</span><b>{quote.total === 0 ? 'Free' : cedis(quote.total, quote.currency)}</b></div>
          </div>
          {step === 'pick' ? (
            <button className="button button-primary button-lg button-wide" onClick={() => setStep('details')} disabled={quoting}>{quoting ? 'Pricing…' : 'Continue'} <ArrowRight size={18} /></button>
          ) : (
            <div className="ev-details">
              <h3>Where should we send your tickets?</h3>
              {!session && <div className="notice"><Mail size={16} /><span>No account needed — just an email. <Link to="/auth">Sign in</Link> to keep all your tickets in one place.</span></div>}
              <div className="two">
                <label className="fld">Email{session && <small>Using your account email — change it if you want the tickets elsewhere</small>}<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" /></label>
                <label className="fld">Your name <small>optional</small><input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
              </div>
              {count > 1 && <label className="check"><input type="checkbox" checked={split} onChange={(e) => setSplit(e.target.checked)} /> Send each ticket to a different person</label>}
              {split && <div className="ev-holders">{tickets.map((id, i) => (
                <div className="ev-holder" key={i}>
                  <b>Ticket {i + 1} · {typeName(id)}</b>
                  <input type="email" placeholder={`Email (defaults to ${email || 'yours'})`} value={holders[i]?.email || ''} onChange={(e) => setHolders({ ...holders, [i]: { name: holders[i]?.name || '', email: e.target.value } })} />
                  <input placeholder="Name on ticket (optional)" value={holders[i]?.name || ''} onChange={(e) => setHolders({ ...holders, [i]: { email: holders[i]?.email || '', name: e.target.value } })} />
                </div>))}</div>}
              <details className="policy-detail" open><summary>Refunds &amp; changes for this event</summary><ul>{ev.refund_summary.map((l) => <li key={l}>{l}</li>)}</ul></details>
              <label className="check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> <span>I've read the refund policy and the organiser's terms, and agree to Lotnis's <Link to="/terms" target="_blank">Terms</Link>.</span></label>
              {error && <div className="form-error" role="alert">{error}</div>}
              <button className="button button-primary button-lg button-wide" onClick={checkout} disabled={busy}>{busy ? 'Working…' : quote.total === 0 ? 'Get my free tickets' : pending ? `Retry payment · ${cedis(quote.total, quote.currency)}` : `Pay ${cedis(quote.total, quote.currency)}`} <ArrowRight size={18} /></button>
              <p className="muted-inline">{POLICY_ICON} Secured by Paystack. Lotnis never sees your card or PIN.</p>
            </div>
          )}
        </div>
      )}
      {error && step === 'pick' && <div className="form-error" role="alert">{error}</div>}
    </div>
  );
}

// ── Order page (receipt, tickets, refund requests) ────────────────────────────

export function OrderPage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const token = params.get('token') || undefined;
  const [view, setView] = useState<OrderView | null>(null);
  const [error, setError] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => eventApi.order(id, token).then(async (v) => {
    // A buyer who paid but whose tab closed before confirming: finish it now.
    const saved = recallPayment(id);
    if (v.order.status === 'pending' && saved) { try { v = await eventApi.confirm(id, saved.reference, saved.token); forgetPayment(id); } catch { /* shown as pending below */ } }
    setView(v); setError('');
  }).catch((e) => setError(errText(e, 'Unable to load this order')));
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id, token]);

  const requestRefund = async () => {
    setBusy(true); setMsg('');
    try { await eventApi.requestRefund(id, { token, ticket_ids: picked, reason }); setPicked([]); setReason(''); setMsg('Refund requested. We paused those tickets and emailed you.'); await load(); }
    catch (e) { setMsg(errText(e, 'Unable to request a refund')); } finally { setBusy(false); }
  };

  if (error) return <div className="page"><div className="error-state">{error}</div></div>;
  if (!view) return <div className="page"><div className="empty-state">Loading your order…</div></div>;
  const { order, event, tickets } = view;
  const paid = ['paid', 'partially_refunded', 'refunded'].includes(order.status);
  const refundable = tickets.filter((t) => t.refundable);

  return (
    <div className="page ev-order">
      <Seo title="Your order" description="Your tickets and receipt." noindex />
      <div className="done-card">
        <svg className="done-check" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24" /><path d="M14 27l8 8 16-17" /></svg>
        <h1>{paid ? (order.kind === 'vote' ? 'Votes counted.' : "You're going.") : order.status === 'pending' ? 'Waiting for payment' : `Order ${order.status.replace('_', ' ')}`}</h1>
        <p className="lead">{paid ? <>{order.kind === 'vote' ? 'Thanks for voting in' : 'Your tickets for'} <b>{event.title}</b> {order.kind === 'vote' ? '.' : 'are ready — we emailed them to you too.'}</> : order.status === 'pending' ? 'If you paid, this page updates in a moment. If not, go back to the event and try again — your tickets are held for 10 minutes.' : 'This order is no longer active.'}</p>
        <p className="muted-inline"><CalendarDays size={14} /> {fmtRange(event.starts_at, event.ends_at)} · <MapPin size={14} /> {event.venue_name}, {event.city}</p>
        {event.postponed && <div className="bk-callout bk-callout-warm"><Clock size={20} /><div><b>Postponed</b><p>New date {fmtDateTime(event.starts_at)}. Your tickets are still valid.</p></div></div>}
        {event.status === 'cancelled' && <div className="bk-callout ev-banner-bad"><Clock size={20} /><div><b>This event was cancelled</b><p>You'll be refunded in full (the payment-processing fee is not refundable).</p></div></div>}
      </div>

      {order.kind === 'ticket' && tickets.length > 0 && <section className="ev-tickets">
        <h2>Your tickets</h2>
        <div className="ev-ticket-grid">{tickets.map((t) => (
          <article className={`ev-ticket ev-ticket-${t.status}`} key={t.id}>
            <div className="ev-ticket-top"><b>{t.ticket_type?.name}</b><TicketStatusPill status={t.status} /></div>
            {t.status === 'valid' || t.status === 'used' ? <QrImage value={t.code} size={170} label={`QR code for ticket ${t.code}`} /> : <div className="ev-qr-void">{t.status === 'refund_pending' ? 'Refund pending' : t.status === 'refunded' ? 'Refunded' : 'Not valid'}</div>}
            <code>{t.code}</code>
            <small>{t.holder_name || t.holder_email}</small>
            {refundable.length > 0 && t.refundable && <label className="check"><input type="checkbox" checked={picked.includes(t.id)} onChange={(e) => setPicked(e.target.checked ? [...picked, t.id] : picked.filter((x) => x !== t.id))} /> Select for refund</label>}
            <Link className="button button-secondary" to={`/tickets/${t.code}`}>Open ticket</Link>
          </article>))}</div>
      </section>}

      {order.kind === 'vote' && view.votes && <section className="ev-tickets"><h2>Your votes</h2><ul className="policy-ticks">{view.votes.map((v) => <li key={v.nominee_id}>{v.votes.toLocaleString()} vote{v.votes > 1 ? 's' : ''}</li>)}</ul></section>}

      <section className="ev-receipt">
        <h2>Receipt</h2>
        <div className="ev-lines">
          <div><span>{order.kind === 'vote' ? 'Votes' : 'Tickets'}</span><b>{cedis(order.subtotal, order.currency)}</b></div>
          {order.service_fee > 0 && <div><span>Lotnis service fee</span><b>{cedis(order.service_fee, order.currency)}</b></div>}
          {order.processing_fee > 0 && <div><span>Payment processing</span><b>{cedis(order.processing_fee, order.currency)}</b></div>}
          <div className="ev-total"><span>Paid</span><b>{cedis(order.total, order.currency)}</b></div>
          {order.refunded_amount > 0 && <div><span>Refunded</span><b>−{cedis(order.refunded_amount, order.currency)}</b></div>}
        </div>
        <small className="muted-inline">Order {order.id.slice(0, 8).toUpperCase()} · {order.buyer_email}</small>
      </section>

      {order.kind === 'ticket' && paid && <section className="ev-refunds">
        <h2>Refunds</h2>
        {view.refund.eligible ? <p>You can ask for {view.refund.percent === 100 ? 'a full refund' : `a ${view.refund.percent}% refund`} of the ticket price. The payment-processing fee isn't refundable.</p>
          : <p className="muted-inline">{view.refund.reason === 'no_refunds' ? 'This organiser doesn\'t offer refunds, except if the event is cancelled.' : view.refund.reason === 'too_late' ? 'The refund window for this event has closed.' : view.refund.reason === 'event_started' ? 'The event has started, so tickets can no longer be refunded.' : view.refund.reason === 'postponed_carry_over' ? 'The event was postponed and tickets stay valid for the new date.' : 'Refunds are not available right now.'}</p>}
        {refundable.length > 0 && <div className="stack"><label className="fld">Reason <small>optional</small><textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} /></label>
          <button className="button button-primary" disabled={!picked.length || busy} onClick={requestRefund}>{busy ? 'Sending…' : `Request refund for ${picked.length || 'selected'} ticket${picked.length === 1 ? '' : 's'}`}</button></div>}
        {msg && <div className={msg.startsWith('Refund requested') ? 'notice notice-ok' : 'form-error'}><span>{msg}</span></div>}
        {view.refund_requests.length > 0 && <div className="booking-list">{view.refund_requests.map((r) => (
          <div className="booking-row" key={r.id}><div><strong>{cedis(r.amount, order.currency)} · {r.trigger === 'buyer_request' ? 'Your request' : r.trigger.replace('_', ' ')}</strong><p>{fmtDate(r.created_at)}{r.admin_note ? ` · ${r.admin_note}` : ''}{r.refund_reference ? ` · ref ${r.refund_reference}` : ''}</p></div><span className={`status status-${r.status === 'processed' ? 'confirmed' : r.status === 'rejected' || r.status === 'failed' ? 'cancelled' : 'pending'}`}>{r.status === 'processed' ? 'Sent' : r.status}</span><span /></div>))}</div>}
      </section>}
      <div className="bk-actions bk-actions-center"><Link className="button button-quiet" to={`/events/${event.slug}`}>Back to event</Link><Link className="button button-quiet" to="/events">More events</Link></div>
    </div>
  );
}

// ── Single ticket page (the one people show at the gate) ──────────────────────

export function TicketPage() {
  const { code = '' } = useParams();
  const [view, setView] = useState<TicketView | null>(null);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { eventApi.ticket(code).then(setView).catch((e) => setError(errText(e, 'Ticket not found'))); }, [code]);

  const sendReview = async () => {
    setBusy(true);
    try { await eventApi.review(code, { rating, comment: comment.trim() || undefined }); setSent(true); } catch (e) { setError(errText(e, 'Unable to send your review')); } finally { setBusy(false); }
  };
  if (error && !view) return <div className="page"><div className="error-state">{error}</div></div>;
  if (!view) return <div className="page"><div className="empty-state">Loading ticket…</div></div>;
  const { ticket, event } = view;
  const usable = ticket.status === 'valid' && event.status !== 'cancelled';
  const note = { valid: 'Show this code at the gate. It works once.', used: `Scanned${ticket.used_at ? ` ${fmtDateTime(ticket.used_at)}` : ''}. This ticket has been used.`, refund_pending: 'A refund is being reviewed, so this ticket is paused.', refunded: 'This ticket was refunded and can no longer be used.', cancelled: 'This ticket was cancelled.', void: 'This ticket is not valid.' }[ticket.status];
  return (
    <div className="page ev-ticketpage">
      <Seo title={`Ticket — ${event.title}`} description="Your event ticket." noindex />
      <div className={`ev-pass ev-pass-${usable ? 'ok' : ticket.status}`}>
        <div className="ev-pass-top"><small>{ticket.type}</small><h1>{event.title}</h1><p>{fmtRange(event.starts_at, event.ends_at)}</p><p>{event.venue_name}, {event.city}</p></div>
        <div className="ev-pass-qr">{ticket.status === 'valid' || ticket.status === 'used' ? <QrImage value={ticket.code} size={240} label={`Ticket ${ticket.code}`} /> : <div className="ev-qr-void">{ticket.status === 'refund_pending' ? 'Refund pending' : ticket.status === 'refunded' ? 'Refunded' : 'Not valid'}</div>}<code>{ticket.code}</code></div>
        <div className="ev-pass-foot"><TicketStatusPill status={ticket.status} /><p>{event.status === 'cancelled' ? 'This event was cancelled.' : note}</p>{ticket.holder_name && <small>{ticket.holder_name}</small>}</div>
      </div>
      {event.postponed && <div className="bk-callout bk-callout-warm"><Clock size={20} /><div><b>Postponed</b><p>New date: {fmtDateTime(event.starts_at)}. This ticket stays valid.</p></div></div>}
      {event.entry_rules && <p className="muted-inline">{event.entry_rules}</p>}
      {view.can_review && !sent && <section className="ev-reviewform"><h2>How was it?</h2><p className="muted-inline">You were there, so your review is marked as a verified attendee.</p>
        <div className="ev-rate" role="radiogroup" aria-label="Rating">{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} aria-label={`${n} star${n > 1 ? 's' : ''}`} className={n <= rating ? 'on' : ''} onClick={() => setRating(n)}><Star size={28} fill={n <= rating ? 'currentColor' : 'none'} /></button>)}</div>
        <label className="fld">Tell others what it was like<textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} /></label>
        {error && <div className="form-error">{error}</div>}
        <button className="button button-primary" disabled={!rating || busy} onClick={sendReview}>{busy ? 'Sending…' : 'Post review'}</button></section>}
      {(sent || view.review) && <div className="notice notice-ok"><Check size={16} /><span>Thanks — your review is posted.</span></div>}
      <div className="bk-actions bk-actions-center"><Link className="button button-quiet" to={`/events/${event.slug}`}>Event page</Link></div>
    </div>
  );
}

// ── My tickets (signed in) ────────────────────────────────────────────────────

export function MyTicketsPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof eventApi.mine>> | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { eventApi.mine().then(setData).catch((e) => setError(errText(e, 'Unable to load your tickets'))); }, []);
  const upcoming = (data?.tickets ?? []).filter((t) => t.event && new Date(t.event.ends_at) > new Date());
  const past = (data?.tickets ?? []).filter((t) => !t.event || new Date(t.event.ends_at) <= new Date());
  const Row = ({ t }: { t: NonNullable<typeof data>['tickets'][number] }) => (
    <div className="booking-row"><div><strong>{t.event?.title || 'Event'}</strong><p>{t.event ? `${fmtDateTime(t.event.starts_at)} · ${t.event.venue_name}` : ''} · {t.type}</p></div><TicketStatusPill status={t.status} /><Link className="button button-secondary" to={`/tickets/${t.code}`}>Open</Link></div>
  );
  return (
    <div className="page">
      <Seo title="My tickets" description="Your event tickets and vote receipts." noindex />
      <div className="page-head"><div><span className="eyebrow">Events</span><h1>My tickets</h1><p className="lead">Tickets bought with your account, or sent to your account email.</p></div><Link className="button button-primary" to="/events">Find events <ArrowRight size={16} /></Link></div>
      {error ? <div className="error-state">{error}</div> : !data ? <div className="empty-state">Loading…</div> : <>
        <h2>Upcoming</h2>{upcoming.length ? <div className="booking-list">{upcoming.map((t) => <Row key={t.id} t={t} />)}</div> : <div className="empty-state">No upcoming tickets.</div>}
        {past.length > 0 && <><h2 className="subsection-heading">Past</h2><div className="booking-list">{past.map((t) => <Row key={t.id} t={t} />)}</div></>}
        {data.orders.length > 0 && <><h2 className="subsection-heading">Receipts</h2><div className="booking-list">{data.orders.map((o) => (
          <div className="booking-row" key={o.id}><div><strong>{o.event?.title || 'Event'}</strong><p>{o.kind === 'vote' ? 'Votes' : 'Tickets'} · {fmtDate(o.created_at)}</p></div><strong>{cedis(o.total, o.currency)}</strong><Link className="button button-quiet" to={`/orders/${o.id}?token=${o.access_token}`}>View</Link></div>))}</div></>}
      </>}
    </div>
  );
}
void ChevronDown;
