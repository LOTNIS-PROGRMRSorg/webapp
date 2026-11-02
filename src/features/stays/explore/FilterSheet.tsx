import { useEffect, useRef, useState } from 'react';
import { LayoutGrid, Star, X } from 'lucide-react';
import { SPACE_COPY } from '@/lib/seo/content';
import { ESSENTIALS, EXTRAS, Filters, PRESETS, RADII, TYPE_ICONS, UNITS } from './exploreFilters';

/** Everything except "where": the search box handles places, the tabs handle the broad type. */
export function FilterSheet({
  filters,
  total,
  loading,
  commit,
  reset,
  onClose,
}: {
  filters: Filters;
  total: number;
  loading: boolean;
  commit: (patch: Partial<Filters>) => void;
  reset: () => void;
  onClose: () => void;
}) {
  const [min, setMin] = useState(filters.minPrice);
  const [max, setMax] = useState(filters.maxPrice);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const hasPoint = Boolean(filters.lat && filters.lng);

  // Typed prices follow the URL, and are sent to it once typing pauses.
  useEffect(() => {
    setMin(filters.minPrice);
    setMax(filters.maxPrice);
  }, [filters.minPrice, filters.maxPrice]);
  useEffect(() => {
    if (min === filters.minPrice && max === filters.maxPrice) return;
    const t = window.setTimeout(() => commit({ minPrice: min, maxPrice: max }), 450);
    return () => window.clearTimeout(t);
  }, [min, max]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stop the page scrolling behind the sheet, let Escape close it, and start focus inside it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    closeBtn.current?.focus();
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const presets = filters.pricingPeriod ? (PRESETS[filters.pricingPeriod] ?? []) : [];
  const toggleAmenity = (key: string) =>
    commit({
      amenities: filters.amenities.includes(key)
        ? filters.amenities.filter((a) => a !== key)
        : [...filters.amenities, key],
    });

  return (
    <>
      <div className="sp-scrim" onClick={onClose} role="presentation" />
      <div className="sp-sheet" role="dialog" aria-modal="true" aria-labelledby="sp-filters-title">
        <div className="sp-sheet-head">
          <button ref={closeBtn} type="button" className="sp-sheet-x" onClick={onClose} aria-label="Close filters">
            <X size={20} />
          </button>
          <h2 id="sp-filters-title">Filters</h2>
          <span />
        </div>

        <div className="sp-sheet-body">
          {hasPoint && (
            <section className="sp-fs">
              <h3>Distance</h3>
              <p>
                How far from{' '}
                {filters.near && filters.near !== 'Map area'
                  ? filters.near.toLowerCase() === 'near me'
                    ? 'you'
                    : filters.near
                  : 'the map area'}{' '}
                to look.
              </p>
              <div className="sp-segs" role="radiogroup" aria-label="Distance">
                {RADII.map((r) => (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={(filters.radiusKm || '10') === String(r)}
                    onClick={() => commit({ radiusKm: String(r) })}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="sp-fs">
            <h3>Rent by</h3>
            <p>Hosts set their price per night, week, month or year.</p>
            <div className="sp-segs" role="radiogroup" aria-label="Rental length">
              {UNITS.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={filters.pricingPeriod === value}
                  onClick={() => commit({ pricingPeriod: value, minPrice: '', maxPrice: '' })}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section className="sp-fs">
            <h3>Budget</h3>
            <p>
              {filters.pricingPeriod
                ? `Price per ${filters.pricingPeriod === 'day' ? 'night' : filters.pricingPeriod}, in GHS.`
                : 'Pick a rental length above to compare like with like.'}
            </p>
            <div className="sp-prices">
              <label>
                Minimum
                <input
                  inputMode="numeric"
                  placeholder="GHS 0"
                  value={min}
                  onChange={(e) => setMin(e.target.value.replace(/\D/g, ''))}
                />
              </label>
              <span>–</span>
              <label>
                Maximum
                <input
                  inputMode="numeric"
                  placeholder="No limit"
                  value={max}
                  onChange={(e) => setMax(e.target.value.replace(/\D/g, ''))}
                />
              </label>
            </div>
            {presets.length > 0 && (
              <div className="sp-segs">
                {presets.map(([label, lo, hi]) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={filters.minPrice === String(lo ?? '') && filters.maxPrice === String(hi ?? '')}
                    onClick={() => commit({ minPrice: lo ? String(lo) : '', maxPrice: hi ? String(hi) : '' })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="sp-fs">
            <h3>Type of space</h3>
            <div className="sp-types">
              <button
                type="button"
                aria-pressed={!filters.subType && !filters.category}
                onClick={() => commit({ subType: '', category: '' })}
              >
                <LayoutGrid size={19} />
                Any space
              </button>
              {SPACE_COPY.map((s) => {
                const Icon = TYPE_ICONS[s.slug] ?? LayoutGrid;
                return (
                  <button
                    key={s.slug}
                    type="button"
                    aria-pressed={filters.subType === s.slug}
                    onClick={() => commit({ subType: s.slug, category: '' })}
                  >
                    <Icon size={19} />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="sp-fs">
            <h3>Power, water and security</h3>
            <p>The things worth checking before you visit.</p>
            <div className="sp-checks">
              {ESSENTIALS.map(({ key, label, icon: Icon }) => (
                <label key={key}>
                  <input
                    type="checkbox"
                    checked={filters.amenities.includes(key)}
                    onChange={() => toggleAmenity(key)}
                  />
                  <Icon size={17} /> {label}
                </label>
              ))}
            </div>
          </section>

          <section className="sp-fs">
            <h3>Good to have</h3>
            <div className="sp-checks">
              {EXTRAS.map(({ key, label, icon: Icon }) => (
                <label key={key}>
                  <input
                    type="checkbox"
                    checked={filters[key]}
                    onChange={(e) => commit({ [key]: e.target.checked } as Partial<Filters>)}
                  />
                  <Icon size={17} /> {label}
                </label>
              ))}
            </div>
          </section>

          <section className="sp-fs">
            <h3>Guest rating</h3>
            <div className="sp-segs">
              {[
                ['', 'Any'],
                ['3', '3+'],
                ['4', '4+'],
                ['4.5', '4.5+'],
              ].map(([v, l]) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={filters.minRating === v}
                  onClick={() => commit({ minRating: v })}
                >
                  {v && <Star size={12} fill="currentColor" />} {l}
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="sp-sheet-foot">
          <button type="button" className="sp-link-btn" onClick={reset}>
            Clear all
          </button>
          <button type="button" className="sp-show" onClick={onClose}>
            {loading
              ? 'Searching…'
              : total
                ? `Show ${total.toLocaleString()} ${total === 1 ? 'space' : 'spaces'}`
                : 'No spaces match'}
          </button>
        </div>
      </div>
    </>
  );
}
