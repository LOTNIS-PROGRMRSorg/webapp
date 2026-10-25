import { useEffect, useState } from 'react';
import { ArrowRight, CalendarClock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cedis, EventStatusPill, fmtDateTime } from '@/features/events/eventUi';
import { eventApi } from '@/lib/api/events';
import { PageHeader, errText } from './hostShared';

export function HostEvents() {
  const [events, setEvents] = useState<Array<Record<string, any>> | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    eventApi.host
      .list()
      .then(setEvents)
      .catch((e) => setError(errText(e)));
  }, []);
  return (
    <section className="host-page">
      <PageHeader eyebrow="Events" title="Your events">
        <Link className="button button-primary" to="/host/events/new">
          Create an event <ArrowRight size={16} />
        </Link>
      </PageHeader>
      {error ? (
        <div className="error-state">{error}</div>
      ) : !events ? (
        <div className="empty-state">Loading…</div>
      ) : events.length ? (
        <div className="space-list">
          {events.map((e) => (
            <Link key={e.id} to={`/host/events/${e.id}`} className="space-row ev-hostrow">
              <div className="host-rowmain">
                {e.cover_image_url ? (
                  <img className="host-thumb" src={e.cover_image_url} alt={e.title} loading="lazy" />
                ) : (
                  <span className="host-thumb host-thumb-ph">
                    <CalendarClock size={22} />
                  </span>
                )}
                <div>
                  <strong>{e.title}</strong>
                  <p>
                    {fmtDateTime(e.starts_at)} · {e.venue_name}, {e.city}
                  </p>
                  <small>
                    {e.stats.tickets_sold} sold · {e.stats.tickets_scanned} scanned · {cedis(e.stats.gross, e.currency)}{' '}
                    gross{e.stats.votes_total ? ` · ${e.stats.votes_total.toLocaleString()} votes` : ''}
                    {e.stats.refund_requests_pending ? ` · ${e.stats.refund_requests_pending} refund request(s)` : ''}
                  </small>
                </div>
              </div>
              <EventStatusPill status={e.status} />
              <span className="button button-secondary">Manage</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <CalendarClock size={28} />
          <p>You haven't created an event yet.</p>
          <Link className="button button-secondary" to="/host/events/new">
            Create your first event
          </Link>
        </div>
      )}
    </section>
  );
}

// ── Create / edit form ────────────────────────────────────────────────────────
