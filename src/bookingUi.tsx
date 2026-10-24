import { useEffect } from 'react';
import { Check } from 'lucide-react';
import type { Property, PropertyImage, Room } from './types';

export const sortedImages = (images?: PropertyImage[]) =>
  [...(images ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

export const liveRooms = (property: Property): Room[] =>
  (property.rooms ?? []).filter((r) => !r.deleted_at && r.is_available !== false);

export const bookingMode = (property: Property) =>
  property.booking_mode ?? (property.allows_individual_bookings ? (property.price == null ? 'rooms' : 'both') : 'entire');

/** Reveal-on-scroll: elements with class "reveal" fade up once as they enter the viewport. */
export function useReveal(dep?: unknown) {
  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>('.reveal:not(.reveal-in)'));
    if (!items.length || typeof IntersectionObserver === 'undefined') { items.forEach((el) => el.classList.add('reveal-in')); return; }
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add('reveal-in'); io.unobserve(entry.target); }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [dep]);
}

const STEPS = ['Dates', 'Pay', 'Confirmed'];
/** Three calm steps; the connecting line fills as you progress. */
export function BookingProgress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <ol className="bk-progress" aria-label="Booking progress">
      {STEPS.map((label, i) => {
        const n = i + 1;
        return (
          <li key={label} className={`bk-step ${n < step ? 'bk-done' : ''} ${n === step ? 'bk-now' : ''}`} aria-current={n === step ? 'step' : undefined}>
            <span className="bk-dot">{n < step ? <Check size={14} strokeWidth={3} /> : n}</span><span className="bk-label">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function Photo({ src, alt = '', className = '' }: { src?: string | null; alt?: string; className?: string }) {
  return src
    ? <img className={`ph ${className}`} src={src} alt={alt} loading="lazy" />
    : <div className={`ph ph-empty ${className}`} role="img" aria-label={alt || 'No photo yet'} />;
}
