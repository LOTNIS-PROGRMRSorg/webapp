import { Check, ShieldCheck } from 'lucide-react';
import { PhotoStrip } from '@/components/gallery/PhotoStrip';
import { money, periodLabel } from '@/lib/format';
import { sortedImages } from '@/features/stays/bookingUi';
import type { Property, Room } from '@/types';
import './spaces.css';

const photos = (images?: Property['property_images']) =>
  sortedImages(images).map((i) => ({ url: i.public_url, caption: (i as { caption?: string | null }).caption }));

function Card({
  badge,
  title,
  meta,
  images,
  price,
  per,
  selected,
  cta,
  onSelect,
}: {
  badge?: string;
  title: string;
  meta: string[];
  images: ReturnType<typeof photos>;
  price: string;
  per: string;
  selected: boolean;
  cta: string;
  onSelect: () => void;
}) {
  return (
    <article className={`ssc-card${selected ? ' on' : ''}`}>
      <div className="ssc-photo">
        <PhotoStrip images={images} title={title} ratio="1 / 0.95" />
        {badge && <span className="ssc-badge">{badge}</span>}
      </div>
      <div className="ssc-body">
        <h3>{title}</h3>
        {meta.map((m) => (
          <p key={m} className="ssc-meta">
            {m}
          </p>
        ))}
        <p className="ssc-priceline">
          {price} <span>/ {per}</span>
        </p>
        <button
          type="button"
          className={`ssc-select${selected ? ' on' : ''}`}
          onClick={onSelect}
          aria-pressed={selected}
        >
          {selected ? (
            <>
              <Check size={15} /> Selected
            </>
          ) : (
            cta
          )}
        </button>
      </div>
    </article>
  );
}

/**
 * For places with more than one thing to rent: a showcase right under "About this space". The whole place
 * leads when it can be booked as one (best for groups), then each room with its own photos, details and price.
 * Choosing one fills in the booking card.
 */
export function SpacesShowcase({
  property,
  rooms,
  canBookWhole,
  selected,
  onPick,
}: {
  property: Property;
  rooms: Room[];
  canBookWhole: boolean;
  /** '' = the whole place, a room id, or undefined for nothing chosen yet */
  selected?: string;
  onPick: (roomId: string) => void;
}) {
  const wholeUnit = property.pricing_period;
  const cheapest = rooms.length ? rooms.reduce((a, b) => (b.price_per_period < a.price_per_period ? b : a)) : null;
  const count = rooms.length + (canBookWhole ? 1 : 0);

  return (
    <section id="spaces" className="stay-section ssc">
      <header className="ssc-head reveal">
        <div>
          <h2>{canBookWhole ? 'Book it all, or just a room' : 'Choose your room'}</h2>
          <p>
            {count} ways to book here
            {cheapest && (
              <>
                {' '}
                · rooms from{' '}
                <b>
                  {money(cheapest.currency || property.currency, cheapest.price_per_period).replace(/\.00$/, '')}
                </b> / {periodLabel(cheapest.pricing_period || wholeUnit)}
              </>
            )}
          </p>
        </div>
        <span className="ssc-safe">
          <ShieldCheck size={15} /> Booked rooms never overlap
        </span>
      </header>

      <div className="ssc-grid">
        {canBookWhole && property.price != null && (
          <Card
            badge="Whole place"
            title="The whole place"
            meta={[
              [
                property.max_guests && `Sleeps ${property.max_guests}`,
                property.bedrooms != null && `${property.bedrooms} bed`,
                property.bathrooms != null && `${property.bathrooms} bath`,
              ]
                .filter(Boolean)
                .join(' · ') || 'Exclusive use',
              'Best for groups',
            ]}
            images={photos(property.property_images)}
            price={money(property.currency, property.price).replace(/\.00$/, '')}
            per={periodLabel(wholeUnit)}
            selected={selected === ''}
            cta="Choose"
            onSelect={() => onPick('')}
          />
        )}
        {rooms.map((r) => {
          const unit = r.pricing_period || wholeUnit;
          const own = photos(r.room_images);
          const facts = [
            r.capacity && `Sleeps ${r.capacity}`,
            r.bed_type,
            r.private_bathroom != null && (r.private_bathroom ? 'Private bath' : 'Shared bath'),
            r.size_sqm && `${r.size_sqm} m²`,
          ].filter(Boolean) as string[];
          return (
            <Card
              key={r.id}
              title={r.room_label || 'Room'}
              meta={[
                facts.slice(0, 2).join(' · '),
                r.min_stay && r.min_stay > 1
                  ? `Min ${r.min_stay} ${periodLabel(unit)}s`
                  : facts.slice(2, 4).join(' · '),
              ].filter(Boolean)}
              images={own.length ? own : photos(property.property_images)}
              price={money(r.currency || property.currency, r.price_per_period).replace(/\.00$/, '')}
              per={periodLabel(unit)}
              selected={selected === r.id}
              cta="Choose"
              onSelect={() => onPick(r.id)}
            />
          );
        })}
      </div>
      {canBookWhole && (
        <p className="ssc-note">
          Booking a room keeps the whole place off the market for those dates, and booking the whole place blocks every
          room.
        </p>
      )}
    </section>
  );
}
