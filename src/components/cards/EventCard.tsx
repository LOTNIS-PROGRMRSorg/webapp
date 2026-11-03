import { Ticket, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { EventCard as EventCardData } from '@/lib/api/events';
import { cedisShort, fmtDate, fmtTime } from '@/lib/dates';
import { FavoriteButton } from '@/features/favorites/Favorites';
import { track } from '@/lib/track';
import { ShareMenu } from '@/components/share/ShareMenu';
import { SITE_URL } from '@/lib/seo/seo';
import { eventShare } from '@/lib/shareCopy';

/** A complete, image-led event card linking to the public event page. */
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
  const url = `${SITE_URL}/events/${ev.slug}`;
  const share = eventShare(ev, url);
  return (
    <Link className="ev-card" to={`/events/${ev.slug}`}>
      <div className="fav-actions">
        <ShareMenu
          url={url}
          title={share.title}
          text={share.description}
          heading="Share this event"
          className="fav-share"
          onShare={() => track('event', ev.id, 'click_share')}
        />
        <FavoriteButton type="event" id={ev.id} label={ev.title} />
      </div>
      <div className="ev-card-img">
        {ev.cover_image_url ? (
          <img
            src={ev.cover_image_url}
            alt={`${ev.title} — ${ev.category} in ${ev.city}`}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="ev-card-ph" aria-hidden="true">
            <Ticket size={34} />
          </div>
        )}
        <span className="ev-category">{ev.category}</span>
        <div className="ev-flags">
          {ev.postponed && <span className="ev-flag ev-flag-warn">Postponed</span>}
          {ev.status === 'cancelled' && <span className="ev-flag ev-flag-bad">Cancelled</span>}
          {ev.voting_enabled && ev.status === 'published' && (
            <span className="ev-flag">
              <Trophy size={12} aria-hidden="true" /> Voting
            </span>
          )}
        </div>
      </div>
      <div className="ev-card-body">
        <h3>{ev.title}</h3>
        <p className="ev-card-meta">
          {fmtDate(ev.starts_at, { weekday: 'short', day: 'numeric', month: 'short' })} · {fmtTime(ev.starts_at)}
        </p>
        <p className="ev-card-meta">
          {ev.venue_name}, {ev.city}
        </p>
        <p className={`ev-card-price${ev.sold_out || ev.sales_paused ? ' ev-soldout' : ''}`}>{price}</p>
      </div>
    </Link>
  );
}
