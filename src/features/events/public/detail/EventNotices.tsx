import { Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fmtDate, fmtDateTime } from '@/features/events/eventUi';
import type { EventDetail } from '@/lib/api/events';

/** Cancelled / postponed / preview / paused banners shown above the page body. */
export function EventNotices({ ev }: { ev: EventDetail }) {
  const cancelled = ev.status === 'cancelled';
  return (
    <>
      {cancelled && (
        <div className="callout callout-danger">
          <Clock size={22} />
          <div>
            <b>This event was cancelled</b>
            <p>{ev.cancellation_reason || 'The organiser cancelled the event.'} Ticket holders are refunded in full.</p>
          </div>
        </div>
      )}
      {ev.postponed && !cancelled && (
        <div className="callout callout-warn">
          <Clock size={22} />
          <div>
            <b>Postponed to {fmtDateTime(ev.starts_at)}</b>
            <p>
              {ev.postponed_from && <>It was due on {fmtDate(ev.postponed_from)}. </>}
              {ev.postponement_policy === 'refund_all'
                ? 'Every ticket is being refunded in full.'
                : ev.postponement_policy === 'carry_over'
                  ? 'Existing tickets stay valid for the new date.'
                  : `Existing tickets stay valid — holders can ask for a full refund${ev.postponed_refund_deadline ? ` until ${fmtDateTime(ev.postponed_refund_deadline)}` : ''}.`}
            </p>
          </div>
        </div>
      )}
      {ev.status !== 'published' && ev.is_owner && (
        <div className="notice">
          <span>
            You're previewing this event as its organiser. Status: <b>{ev.status.replace('_', ' ')}</b>.{' '}
            <Link to={`/host/events/${ev.id}`}>Open in your dashboard</Link>
          </span>
        </div>
      )}
      {ev.sales_paused && !cancelled && (
        <div className="callout callout-warn">
          <div>
            <b>Sales are paused</b>
            <p>The organiser has paused ticket sales for now. Check back soon.</p>
          </div>
        </div>
      )}
    </>
  );
}
