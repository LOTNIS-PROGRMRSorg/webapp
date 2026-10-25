import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, Building2, CalendarClock, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { cedis, EventStatusPill, fmtDate, fmtDateTime } from '@/features/events/eventUi';
import { eventApi, PayoutSummary } from '@/lib/api/events';
import { money, periodLabel, primaryImage } from '@/lib/format';
import { BookingRequests } from './BookingRequests';
import { Seo } from '@/lib/seo/seo';
import type { Booking, Property } from '@/types';
import { PageHeader } from '@/components/ui';
import { Stat, errText } from './hostHomeShared';

export function HostOverview() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [properties, setProperties] = useState<Property[] | null>(null);
  const [events, setEvents] = useState<Array<Record<string, any>> | null>(null);
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    // Each area loads on its own: events not being set up must never hide the host's stays.
    api
      .getHostBookings()
      .then((r) => setBookings(r.data || []))
      .catch((e) => setError(errText(e)));
    api
      .getMyProperties()
      .then((p) => setProperties(p || []))
      .catch((e) => setError(errText(e)));
    eventApi.host
      .list()
      .then(setEvents)
      .catch(() => setEvents([]));
    eventApi.payouts
      .summary()
      .then(setSummary)
      .catch(() => {});
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Accra' });
  const requests = bookings.filter((b) => b.reservation_stage === 'awaiting_host_acceptance' && b.status === 'pending');
  const upcomingStays = bookings
    .filter((b) => (b.status === 'confirmed' || b.status === 'active') && b.end_date >= today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
  const liveEvents = (events ?? [])
    .filter((e) => e.status === 'published' && new Date(e.ends_at) > new Date())
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const ticketsSold = (events ?? []).reduce((a, e) => a + (e.stats?.tickets_sold ?? 0), 0);

  const attention = useMemo(() => {
    const items: Array<{ key: string; text: string; to: string; tone?: 'warn' }> = [];
    if (requests.length)
      items.push({
        key: 'req',
        tone: 'warn',
        text: `${requests.length} booking request${requests.length > 1 ? 's' : ''} waiting for your answer`,
        to: '/host/bookings',
      });
    for (const e of events ?? []) {
      if (e.status === 'rejected')
        items.push({
          key: `rej-${e.id}`,
          tone: 'warn',
          text: `“${e.title}” needs changes before it can go live`,
          to: `/host/events/${e.id}`,
        });
      else if (e.status === 'draft')
        items.push({
          key: `dr-${e.id}`,
          text: `“${e.title}” is still a draft — finish it and submit for review`,
          to: `/host/events/${e.id}`,
        });
      if (e.stats?.refund_requests_pending)
        items.push({
          key: `rf-${e.id}`,
          text: `${e.stats.refund_requests_pending} refund request${e.stats.refund_requests_pending > 1 ? 's' : ''} on “${e.title}” (Lotnis is reviewing)`,
          to: `/host/events/${e.id}?tab=refunds`,
        });
    }
    for (const p of properties ?? [])
      if (p.approval_status === 'rejected')
        items.push({
          key: `p-${p.id}`,
          tone: 'warn',
          text: `Your listing “${p.name}” needs changes`,
          to: '/host/accommodation',
        });
    if (summary && !summary.payout_details && summary.totals.awaiting_release + summary.totals.due > 0)
      items.push({
        key: 'payout',
        tone: 'warn',
        text: 'Add a payout account so Lotnis can pay you',
        to: '/host/payout-settings',
      });
    if (summary?.totals.on_hold)
      items.push({
        key: 'hold',
        text: `${cedis(summary.totals.on_hold, summary.currency)} of your earnings is on hold while a problem is reviewed`,
        to: '/host/earnings',
      });
    return items;
  }, [requests.length, events, properties, summary]);

  const c = summary?.currency || 'GHS';
  return (
    <section className="host-page">
      <Seo title="Host overview" description="Your hosting overview" noindex />
      <PageHeader eyebrow="Overview" title="Welcome back.">
        <div className="form-actions">
          <Link className="button button-secondary" to="/host/events/new">
            Create an event
          </Link>
          <Link className="button button-primary" to="/host/accommodation/new">
            Add a space <ArrowRight size={16} />
          </Link>
        </div>
      </PageHeader>
      {error && <div className="error-state">{error}</div>}

      <h2 className="subsection-heading">Your money</h2>
      <div className="metric-grid metric-grid-4">
        <Stat
          label="Waiting for release"
          value={summary ? cedis(summary.totals.awaiting_release, c) : '—'}
          sub={summary?.next_release_at ? `next ${fmtDate(summary.next_release_at)}` : 'across stays and events'}
        />
        <Stat
          label="Ready to send"
          value={summary ? cedis(summary.totals.due, c) : '—'}
          sub="Lotnis pays this out next"
        />
        <Stat label="Paid to you" value={summary ? cedis(summary.totals.paid, c) : '—'} sub="to date" />
        <Stat
          label="On hold"
          value={summary ? cedis(summary.totals.on_hold, c) : '—'}
          sub="while a problem is reviewed"
        />
      </div>
      <p className="muted-inline">
        <Link to="/host/earnings">See all earnings</Link> · <Link to="/host/transactions">Transactions</Link> ·{' '}
        <Link to="/host/payout-settings">Payout accounts</Link>
      </p>

      <h2 className="subsection-heading">Needs your attention</h2>
      {attention.length ? (
        <div className="booking-list">
          {attention.map((a) => (
            <Link key={a.key} to={a.to} className="booking-row host-attn">
              <div>
                <AlertCircle size={16} className={a.tone === 'warn' ? 'host-attn-warn' : ''} /> {a.text}
              </div>
              <span />
              <ArrowRight size={16} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="notice">
          <Check size={16} />
          <span>You're all caught up — nothing is waiting on you.</span>
        </div>
      )}
      <BookingRequests bookings={bookings} onChange={load} />

      <div className="host-twin">
        <div className="host-card">
          <div className="host-card-head">
            <h2>
              <Building2 size={18} /> Accommodation
            </h2>
            <Link to="/host/accommodation">Manage</Link>
          </div>
          <div className="host-mini">
            <Stat label="Listings" value={properties?.length ?? '—'} />
            <Stat label="Requests" value={requests.length} />
            <Stat label="Upcoming stays" value={upcomingStays.length} />
          </div>
          {(properties ?? []).slice(0, 3).map((p) => (
            <Link key={p.id} to="/host/accommodation" className="host-mini-row">
              {primaryImage(p) ? (
                <img className="host-thumb host-thumb-sm" src={primaryImage(p)} alt="" />
              ) : (
                <span className="host-thumb host-thumb-sm host-thumb-ph">
                  <Building2 size={16} />
                </span>
              )}
              <div>
                <b>{p.name}</b>
                <small>
                  {p.city}
                  {p.price != null ? ` · ${money(p.currency, p.price)} / ${periodLabel(p.pricing_period)}` : ''}
                </small>
              </div>
            </Link>
          ))}
          {upcomingStays[0] && (
            <p className="muted-inline">
              Next stay: {upcomingStays[0].property?.name || 'Reservation'} from {upcomingStays[0].start_date}.
            </p>
          )}
          {properties && !properties.length && (
            <div className="empty-state">
              No listings yet. <Link to="/host/accommodation/new">Add your first space</Link>
            </div>
          )}
        </div>
        <div className="host-card">
          <div className="host-card-head">
            <h2>
              <CalendarClock size={18} /> Events
            </h2>
            <Link to="/host/events">Manage</Link>
          </div>
          <div className="host-mini">
            <Stat label="On sale" value={liveEvents.length} />
            <Stat label="Tickets sold" value={ticketsSold.toLocaleString()} />
            <Stat label="Events" value={events?.length ?? '—'} />
          </div>
          {(events ?? []).slice(0, 3).map((e) => (
            <Link key={e.id} to={`/host/events/${e.id}`} className="host-mini-row">
              {e.cover_image_url ? (
                <img className="host-thumb host-thumb-sm" src={e.cover_image_url} alt="" />
              ) : (
                <span className="host-thumb host-thumb-sm host-thumb-ph">
                  <CalendarClock size={16} />
                </span>
              )}
              <div>
                <b>{e.title}</b>
                <small>
                  {fmtDateTime(e.starts_at)} · {e.stats?.tickets_sold ?? 0} sold
                </small>
              </div>
              <EventStatusPill status={e.status} />
            </Link>
          ))}
          {liveEvents[0] && (
            <p className="muted-inline">
              Next event: {liveEvents[0].title} on {fmtDate(liveEvents[0].starts_at)}.
            </p>
          )}
          {events && !events.length && (
            <div className="empty-state">
              No events yet. <Link to="/host/events/new">Create your first event</Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
