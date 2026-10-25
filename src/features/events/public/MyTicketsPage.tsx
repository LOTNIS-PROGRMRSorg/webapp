import { useEffect, useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Seo } from '@/lib/seo/seo';
import { cedis, fmtDate, fmtDateTime, TicketStatusPill } from '@/features/events/eventUi';
import { eventApi } from '@/lib/api/events';
import { errText } from './eventShared';

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
