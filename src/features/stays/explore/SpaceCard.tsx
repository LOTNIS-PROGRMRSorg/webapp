import { useRef, useState } from 'react';
import { BadgeCheck, Building2, ChevronLeft, ChevronRight, Heart, Star, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice, periodLabel } from '@/lib/format';
import { norm } from '@/lib/maps/places';
import { track } from '@/lib/track';
import type { CatalogCity, Property } from '@/types';
import { ShareMenu } from '@/components/share/ShareMenu';
import { propertyShare } from '@/lib/shareCopy';

const MAX_PHOTOS = 5;

/** The neighbourhood a space is in, read from its address: a known area of its city, or the
 *  place named just before the city. Returns nothing rather than guessing a road name. */
export function areaOf(p: Property, cities: CatalogCity[] = []): string | undefined {
  const parts = (p.formatted_address ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!parts.length) return undefined;
  const cityName = norm(p.city ?? '');
  const city = cities.find((c) => norm(c.name) === cityName);
  const alias = city?.aliases.find((a) => norm(a) !== cityName && parts.some((part) => norm(part) === norm(a)));
  if (alias) return alias;
  const at = parts.findIndex((part) => norm(part) === cityName || /district|municipal|metropolitan/i.test(part));
  const before = at > 0 ? parts[at - 1] : undefined;
  if (
    before &&
    before.length <= 24 &&
    norm(before) !== norm(p.name) &&
    !/\d|road|street|avenue|\bst\b|bypass|highway|post office|junction|bar|grill|hotel|residence/i.test(before)
  )
    return before;
  return undefined;
}

/** "GHS 2,000 / month", or "From GHS 100 / night" when only rooms are priced. */
export function priceOf(p: Property): { from: boolean; amount: string; per: string } | null {
  const currency = p.currency || 'GHS';
  if (p.price != null)
    return { from: false, amount: formatPrice(currency, p.price), per: periodLabel(p.pricing_period) };
  const rooms = (p.rooms ?? []).filter((r) => r.price_per_period != null);
  if (!rooms.length) return null;
  const cheapest = rooms.reduce((a, b) => (b.price_per_period < a.price_per_period ? b : a));
  return {
    from: true,
    amount: formatPrice(cheapest.currency || currency, cheapest.price_per_period),
    per: periodLabel(cheapest.pricing_period || p.pricing_period),
  };
}

export const kindOf = (p: Property) =>
  p.sub_type ? (p.sub_type.charAt(0).toUpperCase() + p.sub_type.slice(1)).replace(/-/g, ' ') : 'Space';

function dealOf(p: Property) {
  if (p.discount_label) return p.discount_label;
  if (!p.discount_value) return null;
  return p.discount_type === 'percentage'
    ? `${p.discount_value}% off`
    : `${p.currency || 'GHS'} ${p.discount_value} off`;
}

function unitsOf(p: Property) {
  const total = p.total_units ?? 0;
  const left = p.available_units;
  if (total < 2 || left == null) return null;
  if (left <= 0) return { text: 'Fully booked right now', low: false };
  return { text: `${left} of ${total} available`, low: left <= 2 };
}

const photos = (p: Property) =>
  [...(p.property_images ?? [])]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .slice(0, MAX_PHOTOS)
    .map((i) => i.public_url);

export function SpaceCard({
  property: p,
  area,
  saved,
  highlighted,
  onToggleSave,
  onHover,
  onOpen,
}: {
  property: Property;
  area?: string;
  saved: boolean;
  highlighted?: boolean;
  onToggleSave: () => void;
  onHover?: (id: string | null) => void;
  onOpen?: () => void;
}) {
  const images = photos(p);
  const [index, setIndex] = useState(0);
  const photoRow = useRef<HTMLDivElement>(null);
  const kind = kindOf(p);
  const price = priceOf(p);
  const deal = dealOf(p);
  const units = unitsOf(p);
  const href = `/stays/${p.id}`;
  const place = [area, p.city].filter(Boolean).join(', ');
  const share = propertyShare(p, price ? `${price.from ? 'From ' : ''}${price.amount} / ${price.per}` : '');

  const go = (step: number) => {
    const el = photoRow.current;
    if (!el) return;
    const next = (index + step + images.length) % images.length;
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <article
      className={`sp-card${highlighted ? ' sp-card-hl' : ''}`}
      onMouseEnter={() => onHover?.(p.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div className="sp-media">
        <Link to={href} className="sp-photos" tabIndex={-1} aria-hidden="true" onClick={onOpen}>
          {images.length ? (
            <div
              className="sp-track"
              ref={photoRow}
              onScroll={(e) =>
                setIndex(Math.round(e.currentTarget.scrollLeft / Math.max(1, e.currentTarget.clientWidth)))
              }
            >
              {images.map((src, i) => (
                <img key={src} src={src} alt="" loading={i ? 'lazy' : undefined} decoding="async" />
              ))}
            </div>
          ) : (
            <span className="sp-nophoto">
              <Building2 size={26} />
              Photos coming soon
            </span>
          )}
        </Link>
        {images.length > 1 && (
          <>
            <button type="button" className="sp-arrow sp-arrow-l" aria-label="Previous photo" onClick={() => go(-1)}>
              <ChevronLeft size={16} />
            </button>
            <button type="button" className="sp-arrow sp-arrow-r" aria-label="Next photo" onClick={() => go(1)}>
              <ChevronRight size={16} />
            </button>
            <span className="sp-dots" aria-hidden="true">
              {images.map((src, i) => (
                <i key={src} className={i === index ? 'on' : ''} />
              ))}
            </span>
          </>
        )}
        <span className="sp-kind">
          {kind}
          {p.verified && <BadgeCheck size={13} aria-label="Verified" />}
        </span>
        <div className="sp-actions">
          <ShareMenu
            url={`${window.location.origin}${href}`}
            title={share.title}
            text={share.description}
            onShare={() => track('property', p.id, 'click_share')}
          />
          <button
            type="button"
            className="sp-icon sp-save"
            aria-pressed={saved}
            aria-label={saved ? `Remove ${p.name} from saved` : `Save ${p.name}`}
            onClick={onToggleSave}
          >
            <Heart size={21} />
          </button>
        </div>
        {deal && (
          <span className="sp-deal">
            <Tag size={13} /> {deal}
          </span>
        )}
      </div>

      <Link to={href} className="sp-body" onClick={onOpen}>
        <h3>{p.name}</h3>
        <span className="sp-meta">
          {place || 'Ghana'}
          {p.distance_km != null && <b> · {p.distance_km} km away</b>}
        </span>
        <span className="sp-meta">
          {p.rating ? (
            <>
              <Star size={12} className="sp-star" /> {p.rating.toFixed(1)}
              {p.review_count ? ` (${p.review_count})` : ''}
            </>
          ) : (
            'New listing'
          )}
          {units && <b className={units.low ? 'low' : undefined}> · {units.text}</b>}
        </span>
        <span className="sp-priceline">
          {price ? (
            <>
              {price.from && 'From '}
              {price.amount} <span>/ {price.per}</span>
            </>
          ) : (
            'Price on request'
          )}
        </span>
      </Link>
    </article>
  );
}
