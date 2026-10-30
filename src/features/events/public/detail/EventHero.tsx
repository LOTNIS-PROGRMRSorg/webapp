import { ArrowRight, Clock, MapPin, Ticket } from 'lucide-react';
import { cedis, fmtDate, fmtTime } from '@/features/events/eventUi';
import type { EventDetail } from '@/lib/api/events';
import { mapsUrl } from '../eventShared';
import { Countdown } from './Countdown';

/** Poster on the left, everything a buyer needs to decide on the right. */
export function EventHero({ ev, canBuy }: { ev: EventDetail; canBuy: boolean }) {
  const gateAt = ev.doors_open_at || ev.starts_at;
  return (
    <header className="evd-hero">
      <div className="evd-poster-wrap">
        <div className="evd-poster">
          {ev.cover_image_url ? (
            <img src={ev.cover_image_url} alt={ev.title} />
          ) : (
            <div className="evd-poster-ph">
              <Ticket size={56} strokeWidth={1.3} />
            </div>
          )}
          <span className="evd-poster-chip">{ev.category}</span>
        </div>
        <div className="evd-sticker" aria-hidden="true">
          <span>{fmtDate(ev.starts_at, { month: 'short' })}</span>
          <b>{fmtDate(ev.starts_at, { day: 'numeric' })}</b>
          <small>{fmtDate(ev.starts_at, { weekday: 'short' })}</small>
        </div>
      </div>

      <div className="evd-hero-info">
        <p className="evd-kicker">
          {ev.category} · {ev.city}
        </p>
        <h1 className="evd-title">{ev.title}</h1>
        {ev.summary && <p className="evd-lede">{ev.summary}</p>}

        <ul className="evd-facts">
          <li>
            <span className="evd-fact-icon">
              <Clock size={18} />
            </span>
            <div>
              <b>{fmtDate(ev.starts_at, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</b>
              <span>
                {fmtTime(ev.starts_at)} – {fmtTime(ev.ends_at)}
                {ev.doors_open_at && <> · Doors {fmtTime(ev.doors_open_at)}</>}
              </span>
            </div>
          </li>
          <li>
            <span className="evd-fact-icon">
              <MapPin size={18} />
            </span>
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

        <Countdown gateAt={gateAt} endsAt={ev.ends_at} />

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
              Get tickets <ArrowRight size={18} />
            </a>
            {ev.from_price != null && (
              <span className="evd-from">
                {ev.has_free && ev.from_price === 0 ? 'Free entry available' : <>From <b>{cedis(ev.from_price, ev.currency)}</b></>}
              </span>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
