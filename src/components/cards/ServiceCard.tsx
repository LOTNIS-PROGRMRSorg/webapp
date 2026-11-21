import { BadgeCheck, MapPin, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ServiceCard as ServiceCardData } from '@/lib/api/market';
import { UNIT_NOUN } from '@/lib/api/market';
import { money } from '@/lib/format';
import { emojiFor } from '@/components/maps/categoryIcons';

/** A provider's service in a grid: photo, what it is, who offers it, the rate and how far away they are. */
export function ServiceCard({ s, onHover }: { s: ServiceCardData; onHover?: (id: string | null) => void }) {
  return (
    <Link
      className="svc-card"
      to={`/services/${s.id}`}
      onMouseEnter={() => onHover?.(s.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div className="svc-card-img">
        {s.photos[0] ? (
          <img src={s.photos[0]} alt={s.title} loading="lazy" decoding="async" />
        ) : (
          <span className="svc-card-ph">{emojiFor(s.category?.icon)}</span>
        )}
        <span className="svc-card-cat">
          {emojiFor(s.category?.icon)} {s.category?.name ?? 'Service'}
        </span>
        {s.serves_you && <span className="svc-card-serves">Comes to you</span>}
      </div>
      <div className="svc-card-body">
        <h3>{s.title}</h3>
        <p className="svc-card-who">
          {s.provider?.name ?? 'Provider'}
          {s.provider?.verified && <BadgeCheck size={14} className="verified" aria-label="Verified" />}
          {s.rating != null && (
            <span className="svc-card-rate">
              <Star size={13} fill="currentColor" /> {s.rating.toFixed(1)} <small>({s.review_count})</small>
            </span>
          )}
        </p>
        <p className="svc-card-where">
          <MapPin size={13} /> {s.city || 'Ghana'}
          {s.distance_km != null && ` · ${s.distance_km} km away`}
        </p>
        <p className="svc-card-price">
          <strong>{money(s.currency, s.rate)}</strong> / {UNIT_NOUN[s.pricing_unit]}
          {s.allow_negotiation && <em>Negotiable</em>}
        </p>
      </div>
    </Link>
  );
}
