import { useState } from 'react';
import { Camera, Check, Plus } from 'lucide-react';
import { Lightbox, GalleryImage } from '@/components/gallery/Lightbox';
import { periodLabel, money } from '@/lib/format';
import { sortedImages } from '@/features/stays/bookingUi';
import type { Property, Room } from '@/types';

const gallery = (images?: Property['property_images']): GalleryImage[] =>
  sortedImages(images).map((i) => ({ url: i.public_url, caption: (i as { caption?: string | null }).caption }));
export const roomUnit = (r: Room, p: Property) => r.pricing_period || p.pricing_period || 'day';

type Option = {
  key: string;
  title: string;
  line: string;
  price: string;
  per: string;
  images: GalleryImage[];
  on: boolean;
  note?: string;
  onPick: () => void;
};

function Row({ o, onOpen }: { o: Option; onOpen: () => void }) {
  return (
    <li className={`rv-row${o.on ? ' on' : ''}${o.note ? ' dim' : ''}`}>
      <button type="button" className="rv-thumb" onClick={onOpen} aria-label={`See photos of ${o.title}`}>
        {o.images[0] ? <img src={o.images[0].url} alt="" loading="lazy" /> : <span className="rv-thumb-empty" />}
        {o.images.length > 1 && (
          <span>
            <Camera size={11} /> {o.images.length}
          </span>
        )}
      </button>
      <div className="rv-row-main">
        <b>{o.title}</b>
        <small>{o.note ?? o.line}</small>
      </div>
      <div className="rv-row-price">
        <b>{o.price}</b>
        <small>/ {o.per}</small>
      </div>
      {o.note ? null : (
        <button type="button" className={`rv-toggle${o.on ? ' on' : ''}`} onClick={o.onPick} aria-pressed={o.on}>
          {o.on ? (
            <>
              <Check size={15} /> Added
            </>
          ) : (
            <>
              <Plus size={15} /> Add
            </>
          )}
        </button>
      )}
    </li>
  );
}

const join = (parts: Array<string | number | null | undefined | false>) => parts.filter(Boolean).join(' · ');

/** Choose the whole place or one or more rooms, as a short list: small photo, key facts, price, one tap to add. */
export function SpaceStep({
  property,
  rooms,
  mode,
  whole,
  ids,
  onWhole,
  onToggle,
}: {
  property: Property;
  rooms: Room[];
  mode: string;
  whole: boolean;
  ids: string[];
  onWhole: () => void;
  onToggle: (id: string) => void;
}) {
  const [view, setView] = useState<{ title: string; images: GalleryImage[]; i: number } | null>(null);
  const picked = rooms.find((r) => ids.includes(r.id));
  const lockedUnit = picked ? roomUnit(picked, property) : null;
  const currency = property.currency;

  const options: Option[] = [];
  if (mode === 'both' && property.price != null)
    options.push({
      key: 'whole',
      title: 'The whole place',
      line: join([
        property.max_guests && `Sleeps ${property.max_guests}`,
        property.bedrooms != null && `${property.bedrooms} bed`,
        property.bathrooms != null && `${property.bathrooms} bath`,
        'Exclusive use',
      ]),
      price: money(currency, property.price).replace(/\.00$/, ''),
      per: periodLabel(property.pricing_period),
      images: gallery(property.property_images),
      on: whole,
      onPick: onWhole,
    });
  for (const r of rooms) {
    const unit = roomUnit(r, property);
    const own = gallery(r.room_images);
    options.push({
      key: r.id,
      title: r.room_label || 'Room',
      line: join([
        r.capacity && `Sleeps ${r.capacity}`,
        r.bed_type,
        r.private_bathroom != null && (r.private_bathroom ? 'Private bath' : 'Shared bath'),
        r.size_sqm && `${r.size_sqm} m²`,
      ]),
      price: money(r.currency || currency, r.price_per_period).replace(/\.00$/, ''),
      per: periodLabel(unit),
      images: own.length ? own : gallery(property.property_images),
      on: ids.includes(r.id),
      note:
        !ids.includes(r.id) && lockedUnit !== null && unit !== lockedUnit
          ? `Let by the ${periodLabel(unit)} — book it separately`
          : undefined,
      onPick: () => onToggle(r.id),
    });
  }

  return (
    <section className="rv-step">
      <h1>{mode === 'rooms' ? 'Choose your rooms' : 'What would you like to book?'}</h1>
      <p className="rv-lead">
        {mode === 'rooms'
          ? 'Add one room or several. They are held together and paid once.'
          : 'Take the whole place, or just the rooms you need.'}
      </p>
      <ul className="rv-rows">
        {options.map((o) => (
          <Row key={o.key} o={o} onOpen={() => setView({ title: o.title, images: o.images, i: 0 })} />
        ))}
      </ul>
      {mode === 'both' && !whole && ids.length > 0 && (
        <p className="rv-note">Booking rooms also keeps the whole place off the market for those dates.</p>
      )}
      {view && view.images.length > 0 && (
        <Lightbox
          images={view.images}
          index={view.i}
          title={view.title}
          onIndex={(i) => setView((v) => (v ? { ...v, i } : v))}
          onClose={() => setView(null)}
        />
      )}
    </section>
  );
}
