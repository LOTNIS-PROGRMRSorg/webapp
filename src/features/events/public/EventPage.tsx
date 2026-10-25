import { useEffect, useState } from 'react';
import { BadgeCheck, CalendarDays, Clock, MapPin, ShieldCheck, Star, Ticket, Users } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Seo, SITE_URL } from '@/lib/seo/seo';
import { fmtDate, fmtDateTime, fmtRange, fmtTime } from '@/features/events/eventUi';
import { eventApi, EventDetail } from '@/lib/api/events';
import { Leaderboard } from '@/features/voting';
import { HostCard } from '@/components/cards';
import { ReportSection } from '@/features/reports/ReportSection';
import { track, useTrackView } from '@/lib/track';
import { errText } from './eventShared';
import { TicketBuyer } from './TicketBuyer';

// ── Event page ────────────────────────────────────────────────────────────────

export type Tab = 'tickets' | 'about' | 'vote' | 'reviews';
export const POLICY_ICON = <ShieldCheck size={16} />;

export function EventPage() {
  const { slug = '' } = useParams();
  const [ev, setEv] = useState<EventDetail | null>(null);
  const [error, setError] = useState('');
  const [query] = useSearchParams();
  const wanted = (['tickets', 'about', 'vote', 'reviews'] as Tab[]).find((t) => t === query.get('tab')) ?? 'tickets';
  const [tab, setTab] = useState<Tab>(wanted);
  useTrackView('event', ev?.id);
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
      {cancelled && <div className="callout callout-danger"><Clock size={22} /><div><b>This event was cancelled</b><p>{ev.cancellation_reason || 'The organiser cancelled the event.'} Ticket holders are refunded in full.</p></div></div>}
      {ev.postponed && !cancelled && <div className="callout callout-warn"><Clock size={22} /><div><b>Postponed to {fmtDateTime(ev.starts_at)}</b><p>{ev.postponed_from && <>It was due on {fmtDate(ev.postponed_from)}. </>}{ev.postponement_policy === 'refund_all' ? 'Every ticket is being refunded in full.' : ev.postponement_policy === 'carry_over' ? 'Existing tickets stay valid for the new date.' : `Existing tickets stay valid — holders can ask for a full refund${ev.postponed_refund_deadline ? ` until ${fmtDateTime(ev.postponed_refund_deadline)}` : ''}.`}</p></div></div>}
      {ev.status !== 'published' && ev.is_owner && <div className="notice"><span>You're previewing this event as its organiser. Status: <b>{ev.status.replace('_', ' ')}</b>. <Link to={`/host/events/${ev.id}`}>Open in your dashboard</Link></span></div>}

      {ev.sales_paused && !cancelled && <div className="callout callout-warn"><div><b>Sales are paused</b><p>The organiser has paused ticket sales for now. Check back soon.</p></div></div>}
      <div className="ev-layout">
        <div className="ev-main">
          <div className="tabs" role="tablist">{tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={`tab ${tab === k ? 'tab-on' : ''}`} onClick={() => { setTab(k); if (k === 'tickets') track('event', ev.id, 'click_tickets'); if (k === 'vote') track('event', ev.id, 'click_vote'); }}>{l}</button>)}</div>
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
            <HostCard host={ev.host} label="Organised by" />
          </div>
        </aside>
      </div>
      <ReportSection kind="event" target={{ event_id: ev.id }} subject={ev.title} />
    </div>
  );
}

export function About({ ev }: { ev: EventDetail }) {
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
