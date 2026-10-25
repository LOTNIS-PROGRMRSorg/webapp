import { CalendarDays, MapPin, Ticket, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { EventCard as EventCardData } from '@/lib/api/events';
import { cedisShort, fmtDate, fmtTime } from '@/lib/dates';

/** An event in a grid: cover, date badge, title, place, "from GH₵…". */
export function EventCard({ ev }: { ev: EventCardData }) {
  const price = ev.sold_out
    ? 'Sold out'
    : ev.sales_paused
      ? 'Sales paused'
      : ev.from_price == null
        ? 'Tickets'
        : ev.from_price === 0
          ? 'Free'
          : `From ${cedisShort(ev.from_price, ev.currency)}`;
  return (
    <Link className="ev-card" to={`/events/${ev.slug}`}>
      <div className="ev-card-img">
        {ev.cover_image_url ? (
          <img
            src={ev.cover_image_url}
            alt={`${ev.title} — ${ev.category} in ${ev.city}`}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="ev-card-ph">
            <Ticket size={34} />
          </div>
        )}
        <span className="ev-date-badge">
          <b>{fmtDate(ev.starts_at, { day: 'numeric' })}</b>
          {fmtDate(ev.starts_at, { month: 'short' })}
        </span>
        {ev.postponed && <span className="ev-flag ev-flag-warn">Postponed</span>}
        {ev.status === 'cancelled' && <span className="ev-flag ev-flag-bad">Cancelled</span>}
        {ev.voting_enabled && ev.status === 'published' && (
          <span className="ev-flag">
            <Trophy size={12} /> Voting
          </span>
        )}
      </div>
      <div className="ev-card-body">
        <small>{ev.category}</small>
        <h3>{ev.title}</h3>
        <p>
          <CalendarDays size={14} /> {fmtDate(ev.starts_at)} · {fmtTime(ev.starts_at)}
        </p>
        <p>
          <MapPin size={14} /> {ev.venue_name}, {ev.city}
        </p>
        <strong className={ev.sold_out || ev.sales_paused ? 'ev-soldout' : ''}>{price}</strong>
      </div>
    </Link>
  );
}
