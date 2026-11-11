import { ArrowRight, CalendarDays, Clock3, MapPin, Ticket } from 'lucide-react';
import { cedis, fmtDate, fmtTime } from '@/features/events/eventUi';
import type { EventDetail } from '@/lib/api/events';
import { mapsUrl } from '../eventShared';
import { FavoriteButton } from '@/features/favorites/Favorites';
import { track } from '@/lib/track';
import { ShareMenu } from '@/components/share/ShareMenu';
import { SITE_URL } from '@/lib/seo/seo';
import { eventShare } from '@/lib/shareCopy';
import { HostCard } from '@/components/cards';

/** A shared cover-and-details introduction, with the event identity visible beside its artwork. */
export function EventHero({ ev, canBuy }: { ev: EventDetail; canBuy: boolean }) {
  const url = `${SITE_URL}/events/${ev.slug}`;
  const share = eventShare(ev, url);
  const spansDays = fmtDate(ev.starts_at, { dateStyle: 'short' }) !== fmtDate(ev.ends_at, { dateStyle: 'short' });

  return (
    <header className="evd-hero">
      <div className="evd-cover-wrap">
        <div className="evd-poster">
          {ev.cover_image_url ? (
            <img src={ev.cover_image_url} alt={`${ev.title} event cover`} />
          ) : (
            <div className="evd-poster-ph" role="img" aria-label={`${ev.title} cover image unavailable`}>
              <Ticket size={48} strokeWidth={1.4} aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="fav-actions" aria-label="Event actions">
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
      </div>

      <div className="evd-intro">
        <div className="evd-intro-copy">
          <p className="evd-kicker">
            <span>{ev.category}</span>
            <span aria-hidden="true">·</span>
            <span>{ev.city}</span>
          </p>
          <h1 className="evd-title">{ev.title}</h1>
          {ev.summary && <p className="evd-lede">{ev.summary}</p>}
          <HostCard host={ev.host} label="Organised by" />
        </div>

        <div className="evd-intro-details">
          <ul className="evd-facts">
            <li>
              <CalendarDays size={19} aria-hidden="true" />
              <div>
                <b>{fmtDate(ev.starts_at, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</b>
                <span>
                  {fmtTime(ev.starts_at)} – {fmtTime(ev.ends_at)}
                  {spansDays && (
                    <> · Ends {fmtDate(ev.ends_at, { weekday: 'short', day: 'numeric', month: 'short' })}</>
                  )}
                  {ev.doors_open_at && <> · Doors {fmtTime(ev.doors_open_at)}</>}
                </span>
              </div>
            </li>
            <li>
              <MapPin size={19} aria-hidden="true" />
              <div>
                <b>{ev.venue_name}</b>
                <span>
                  {[ev.address, ev.city].filter(Boolean).join(', ')} ·{' '}
                  <a href={mapsUrl(ev)} target="_blank" rel="noreferrer">
                    Open in Maps
                  </a>
                </span>
              </div>
            </li>
          </ul>

          {canBuy && (
            <div className="evd-cta">
              <a
                className="button button-primary button-lg"
                href="#tickets"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('tickets')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                Choose tickets <ArrowRight size={18} aria-hidden="true" />
              </a>
              {ev.from_price != null && (
                <span className="evd-from">
                  {ev.has_free && ev.from_price === 0 ? (
                    'Free entry available'
                  ) : (
                    <>
                      From <b>{cedis(ev.from_price, ev.currency)}</b>
                    </>
                  )}
                </span>
              )}
            </div>
          )}
          {!canBuy && (
            <p className="evd-unavailable">
              <Clock3 size={16} aria-hidden="true" /> Ticket sales are unavailable for this event.
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
