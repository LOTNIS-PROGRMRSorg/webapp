import { FormEvent, Fragment, useEffect, useId, useMemo, useRef, useState } from 'react';
import { LayoutGrid, LocateFixed, MapPin, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { photoProps } from '@/lib/images';
import { norm } from '@/lib/maps/places';
import { CITY_COPY, SPACE_COPY } from '@/lib/seo/content';
import type { CatalogCity, Property } from '@/types';
import { Filters } from './exploreFilters';
import { areaOf, kindOf, priceOf } from './SpaceCard';
import { rememberViewed } from './spaceMemory';

type Option =
  | { kind: 'near'; label: string }
  | { kind: 'city'; label: string; city: CatalogCity }
  | { kind: 'area'; label: string; city: CatalogCity }
  | { kind: 'space'; label: string; property: Property }
  | { kind: 'text'; label: string };

const placeText = (f: Pick<Filters, 'city' | 'query' | 'near' | 'lat'>) =>
  f.near && f.lat ? f.near : f.query && f.city ? `${f.query}, ${f.city}` : f.query || f.city;
const clearPlace = { city: '', query: '', lat: '', lng: '', near: '', radiusKm: '' };

/** 0 exact, 1 starts with, 2 a word starts with, 3 merely contains. */
function matchScore(label: string, q: string) {
  const l = norm(label);
  if (l === q) return 0;
  if (l.startsWith(q)) return 1;
  if (l.split(' ').some((w) => w.startsWith(q))) return 2;
  return 3;
}

const STOP_WORDS = new Set([
  'in',
  'at',
  'near',
  'around',
  'for',
  'to',
  'rent',
  'let',
  'a',
  'an',
  'the',
  'and',
  'of',
  'space',
  'spaces',
]);
const TYPE_WORDS: Record<string, string> = {
  hostel: 'hotel',
  hostels: 'hotel',
  guesthouse: 'hotel',
  store: 'shop',
  stores: 'shop',
};

/** Read a typed phrase like "offices in Kumasi" or "apartment Osu" into filters; leftover words search names. */
export function parseFreeText(text: string, cities: CatalogCity[]): Partial<Filters> {
  let rest = ` ${norm(text)} `;
  const patch: Partial<Filters> = {};
  // The most specific place first: a neighbourhood, then a city (longest names first, e.g. "cape coast").
  const places = cities
    .flatMap((c) => [
      ...c.aliases
        .filter((a) => !/metropolis|municipal|greater|region/i.test(a))
        .map((a) => ({ name: a, city: c, area: true })),
      { name: c.name, city: c, area: false },
    ])
    .sort((a, b) => Number(a.area === false) - Number(b.area === false) || norm(b.name).length - norm(a.name).length);
  const place = places.find((p) => norm(p.name) && rest.includes(` ${norm(p.name)} `));
  if (place) {
    rest = rest.replace(` ${norm(place.name)} `, ' ');
    patch.city = place.city.name;
    if (place.area) patch.query = place.name;
  }
  const words = rest.split(' ').filter(Boolean);
  const typeSlug = (w: string) =>
    TYPE_WORDS[w] ?? SPACE_COPY.find((s) => s.slug === w || `${s.slug}s` === w || s.plural === w)?.slug;
  const typeWord = words.find((w) => typeSlug(w));
  if (typeWord) {
    patch.subType = typeSlug(typeWord)!;
    patch.category = '';
  }
  const leftover = words.filter((w) => w !== typeWord && !STOP_WORDS.has(w)).join(' ');
  // Words we couldn't place (a listing name, a landmark…) search names, descriptions and addresses.
  if (leftover && !patch.query) patch.query = place || typeWord ? leftover : text.trim();
  return patch;
}

function SpaceThumb({ property }: { property: Property }) {
  const img = [...(property.property_images ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]
    ?.public_url;
  return img ? (
    <img className="sp-opt-thumb" {...photoProps(img, '64px')} alt="" />
  ) : (
    <span className="sp-opt-icon">
      <LayoutGrid size={16} />
    </span>
  );
}

function SpacePrice({ property }: { property: Property }) {
  const price = priceOf(property);
  return price ? (
    <span className="sp-opt-price">
      {price.from && 'From '}
      <b>{price.amount}</b>
      <small>/ {price.per}</small>
    </span>
  ) : null;
}

/** One search box for places and space names. Type, length and budget live in the tabs and Filters. */
export function SearchBar({
  filters,
  cities,
  commit,
  onNearMe,
  onSearched,
}: {
  filters: Filters;
  cities: CatalogCity[];
  commit: (patch: Partial<Filters>) => void;
  onNearMe: () => void;
  /** Called after a search is applied (flashes the result count, brings results into view). */
  onSearched?: () => void;
}) {
  const shown = placeText(filters);
  const [text, setText] = useState(shown);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [spaceHits, setSpaceHits] = useState<Property[]>([]);
  const lookup = useRef(0);
  const listId = useId();
  const box = useRef<HTMLFormElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // When the place changes elsewhere (chips, clear all, map), the box shows it again.
  useEffect(() => setText(shown), [shown]);

  // Close the suggestions on a click outside the box, or Escape.
  useEffect(() => {
    if (!open) return;
    const outside = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', outside);
    window.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', outside);
      window.removeEventListener('keydown', escape);
    };
  }, [open]);

  const typed = text.trim() !== shown;
  const q = norm(typed ? text : '');

  // Spaces whose name matches what's typed, fetched once typing pauses. Only name matches are listed here;
  // the full search (Enter) still covers areas and descriptions too.
  useEffect(() => {
    const id = ++lookup.current;
    if (q.length < 2) {
      setSpaceHits([]);
      return;
    }
    const t = window.setTimeout(() => {
      api
        .searchProperties(new URLSearchParams({ query: text.trim(), page: '1', limit: '8' }))
        .then((r) => {
          if (id === lookup.current) setSpaceHits((r.data ?? []).filter((p) => norm(p.name).includes(q)).slice(0, 4));
        })
        .catch(() => {
          if (id === lookup.current) setSpaceHits([]);
        });
    }, 250);
    return () => window.clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const options = useMemo<Option[]>(() => {
    if (!q) return [];
    const cityHits = cities
      .filter((c) => norm(c.name).includes(q))
      .map((c): Option => ({ kind: 'city', label: c.name, city: c }));
    const areaHits = cities.flatMap((c) =>
      c.aliases
        .filter(
          (a) => norm(a).includes(q) && norm(a) !== norm(c.name) && !/metropolis|municipal|greater|region/i.test(a),
        )
        .map((a): Option => ({ kind: 'area', label: a, city: c })),
    );
    // Best match first across cities and areas: exact, then starts-with, then a word starting with it.
    const places = [...cityHits, ...areaHits]
      .map((o, i) => ({ o, score: matchScore(o.label, q) + (o.kind === 'area' ? 0.5 : 0), i }))
      .sort((a, b) => a.score - b.score || a.i - b.i)
      .slice(0, 5)
      .map((x) => x.o);
    const spaces = spaceHits.map((p): Option => ({ kind: 'space', label: p.name, property: p }));
    return [...places, ...spaces, { kind: 'text', label: text.trim() }];
  }, [q, text, cities, spaceHits]);
  // Only a place whose name starts with the text is pre-selected ("kum" → Kumasi, "aso" → Asokwa);
  // otherwise Enter searches the words as typed, which also finds spaces by name ("ju" → Junia).
  const strongTop =
    options.length > 1 &&
    (options[0].kind === 'city' || options[0].kind === 'area') &&
    matchScore(options[0].label, q) < 2;
  const current = picked ?? (options.length ? (strongTop ? 0 : options.length - 1) : -1);

  const sortFor = (patch: Partial<Filters>) => (filters.sort === 'nearest' && !patch.lat ? 'new' : filters.sort);
  const apply = (patch: Partial<Filters>) => {
    commit({ ...patch, sort: sortFor(patch) });
    setOpen(false);
    setPicked(null);
    input.current?.blur();
    onSearched?.();
  };
  const choose = (o: Option) => {
    if (o.kind === 'near') {
      setOpen(false);
      return onNearMe();
    }
    if (o.kind === 'space') {
      rememberViewed(o.property);
      setOpen(false);
      return navigate(`/stays/${o.property.id}`);
    }
    if (o.kind === 'city') return apply({ ...clearPlace, city: o.city.name });
    if (o.kind === 'area') return apply({ ...clearPlace, city: o.city.name, query: o.label });
    apply({ ...clearPlace, ...parseFreeText(o.label, cities) });
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const o = typed ? options[current] : undefined;
    if (o) return choose(o);
    // Nothing new typed (or the box was cleared): search what the box says.
    apply(text.trim() ? {} : clearPlace);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' && options.length) {
      e.preventDefault();
      setOpen(true);
      setPicked(Math.min(options.length - 1, current + 1));
    } else if (e.key === 'ArrowUp' && options.length) {
      e.preventDefault();
      setPicked(Math.max(0, current - 1));
    }
  };

  const currentCity = cities.find((c) => c.name === filters.city);
  const popularAreas = (CITY_COPY.find((c) => c.name === filters.city)?.areas ?? currentCity?.aliases ?? []).slice(
    0,
    6,
  );
  const topCities = CITY_COPY.map((c) => cities.find((x) => x.name === c.name)).filter(Boolean) as CatalogCity[];

  return (
    <form className={`sp-sbar${open ? ' open' : ''}`} role="search" onSubmit={submit} ref={box}>
      <div className="sp-sbox" onClick={() => input.current?.focus()}>
        <Search size={20} />
        <input
          ref={input}
          value={text}
          placeholder="Search by area, city or space name"
          aria-label="Search by area, city or space name"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && current >= 0 ? `${listId}-${current}` : undefined}
          autoComplete="off"
          enterKeyHint="search"
          onFocus={() => {
            setOpen(true);
            setPicked(null);
          }}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
            setPicked(null);
          }}
          onKeyDown={onKey}
        />
        {text && (
          <button
            type="button"
            className="sp-clear-x"
            aria-label="Clear search"
            onClick={(e) => {
              e.stopPropagation();
              setText('');
              input.current?.focus();
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>
      <button className={`sp-go${typed ? ' dirty' : ''}`} type="submit" aria-label="Search">
        <Search size={18} /> <span>Search</span>
      </button>

      {open && (
        <div className="sp-panel sp-panel-where" id={listId} role="listbox" aria-label="Suggestions">
          {options.length > 0 ? (
            <ul className="sp-opts">
              {options.map((o, i) => (
                <Fragment
                  key={`${o.kind}-${o.label}-${'city' in o ? o.city.name : 'property' in o ? o.property.id : ''}`}
                >
                  {o.kind !== 'text' &&
                    (i === 0 || options[i - 1].kind === 'city' || options[i - 1].kind === 'area') &&
                    (i === 0 || o.kind === 'space') && (
                      <li className="sp-opt-head" role="presentation">
                        {o.kind === 'space' ? 'Spaces' : 'Places'}
                      </li>
                    )}
                  <li
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === current}
                    className={i === current ? 'on' : ''}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      choose(o);
                    }}
                    onMouseEnter={() => setPicked(i)}
                  >
                    {o.kind === 'space' ? (
                      <SpaceThumb property={o.property} />
                    ) : (
                      <span className={`sp-opt-icon${o.kind === 'text' ? ' text' : ''}`}>
                        {o.kind === 'text' ? <Search size={16} /> : <MapPin size={16} />}
                      </span>
                    )}
                    <span className="sp-opt-t">
                      <b>{o.kind === 'text' ? `Search for “${o.label}”` : o.label}</b>
                      <small>
                        {o.kind === 'text'
                          ? 'Names, areas and descriptions'
                          : o.kind === 'space'
                            ? [kindOf(o.property), areaOf(o.property, cities) ?? o.property.city]
                                .filter(Boolean)
                                .join(' · ')
                            : o.kind === 'area'
                              ? `Area in ${o.city.name}`
                              : o.kind === 'city'
                                ? o.city.region
                                : ''}
                      </small>
                    </span>
                    {o.kind === 'space' ? (
                      <SpacePrice property={o.property} />
                    ) : (
                      o.kind !== 'text' && <em className="sp-opt-tag">{o.kind === 'area' ? 'Area' : 'City'}</em>
                    )}
                  </li>
                </Fragment>
              ))}
            </ul>
          ) : (
            <div className="sp-where-home">
              <button type="button" className="sp-near" onClick={() => choose({ kind: 'near', label: 'Near me' })}>
                <span>
                  <LocateFixed size={18} />
                </span>
                <span className="sp-opt-t">
                  <b>Near me</b>
                  <small>Spaces closest to where you are now</small>
                </span>
              </button>
              {currentCity && popularAreas.length > 0 && (
                <>
                  <h4>Popular in {currentCity.name}</h4>
                  <div className="sp-area-chips">
                    {popularAreas.map((a) => (
                      <button
                        type="button"
                        key={a}
                        onClick={() => choose({ kind: 'area', label: a, city: currentCity })}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </>
              )}
              <h4>Popular cities</h4>
              <div className="sp-city-grid">
                {topCities.map((c) => (
                  <button
                    type="button"
                    key={c.name}
                    className={filters.city === c.name && !filters.query ? 'on' : ''}
                    onClick={() => choose({ kind: 'city', label: c.name, city: c })}
                  >
                    <b>{c.name}</b>
                    <small>{c.region.replace(/ Region$/, '')}</small>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
