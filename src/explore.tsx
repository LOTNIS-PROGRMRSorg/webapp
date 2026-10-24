import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BedDouble, Briefcase, Building2, Car, ChevronLeft, ChevronRight, Home, Hotel, Landmark, MapPin, PartyPopper,
  LayoutGrid, LocateFixed, Map as MapIcon, Search, SlidersHorizontal, Star, Store, Warehouse, X,
} from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from './api';
import { mapsEnabled, mountPlaceSearch } from './maps';
import { ResultsMap } from './resultsMap';
import { useReveal } from './bookingUi';
import { resolveCity } from './places';
import { breadcrumbLd, faqLd, itemListLd, Seo, webPageLd } from './seo';
import { CITY_COPY, SPACE_COPY, cityBySlug, spaceBySlug } from './seoContent';
import { PropertyCard } from './shared';
import type { CatalogOptions, Property } from './types';

const PAGE_SIZE = 12;
const TYPE_ICONS: Record<string, typeof Home> = {
  apartment: Building2, house: Home, villa: Landmark, room: BedDouble, hotel: Hotel, office: Briefcase, shop: Store, garage: Car, warehouse: Warehouse, venue: PartyPopper,
};
const UNITS = [['', 'Any'], ['day', 'Nightly'], ['week', 'Weekly'], ['month', 'Monthly'], ['year', 'Yearly']] as const;
const SORTS: Record<string, { label: string; sortBy: string; sortOrder: string }> = {
  new: { label: 'Newest', sortBy: 'created_at', sortOrder: 'desc' },
  price_asc: { label: 'Price: low to high', sortBy: 'price', sortOrder: 'asc' },
  price_desc: { label: 'Price: high to low', sortBy: 'price', sortOrder: 'desc' },
  rating: { label: 'Top rated', sortBy: 'rating', sortOrder: 'desc' },
  nearest: { label: 'Nearest first', sortBy: 'nearest', sortOrder: 'asc' },
};
const RADII = [2, 5, 10, 25, 50, 100];
const PRESETS: Record<string, Array<[string, number | undefined, number | undefined]>> = {
  day: [['Under 500', undefined, 500], ['500 – 1,000', 500, 1000], ['1,000+', 1000, undefined]],
  week: [['Under 1,500', undefined, 1500], ['1,500 – 4,000', 1500, 4000], ['4,000+', 4000, undefined]],
  month: [['Under 5,000', undefined, 5000], ['5,000 – 10,000', 5000, 10000], ['10,000+', 10000, undefined]],
  year: [['Under 30,000', undefined, 30000], ['30,000 – 60,000', 30000, 60000], ['60,000+', 60000, undefined]],
};
const unitWord: Record<string, string> = { day: 'nightly', week: 'weekly', month: 'monthly', year: 'yearly' };

type Filters = {
  query: string; subType: string; city: string; pricingPeriod: string; minPrice: string; maxPrice: string; minRating: string;
  rooms: boolean; pets: boolean; parking: boolean; sort: string; page: number;
  lat: string; lng: string; radiusKm: string; near: string; view: 'grid' | 'map';
};

function readFilters(params: URLSearchParams, typeSlug?: string, citySlug?: string): Filters {
  return {
    query: params.get('query') ?? '',
    subType: typeSlug ?? params.get('subType') ?? '',
    city: citySlug ? (cityBySlug(citySlug)?.name ?? citySlug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')) : (params.get('city') ?? ''),
    pricingPeriod: params.get('pricingPeriod') ?? '',
    minPrice: params.get('minPrice') ?? '', maxPrice: params.get('maxPrice') ?? '', minRating: params.get('minRating') ?? '',
    rooms: params.get('allowsIndividualBookings') === 'true', pets: params.get('petFriendly') === 'true', parking: params.get('parkingAvailable') === 'true',
    sort: SORTS[params.get('sort') ?? ''] ? params.get('sort')! : 'new', page: Math.max(1, Number(params.get('page')) || 1),
    lat: params.get('lat') ?? '', lng: params.get('lng') ?? '', radiusKm: params.get('radiusKm') ?? '', near: params.get('near') ?? '', view: params.get('view') === 'map' ? 'map' : 'grid',
  };
}

function toQuery(f: Filters, withPage = true): URLSearchParams {
  const p = new URLSearchParams();
  if (f.query.trim()) p.set('query', f.query.trim());
  if (f.subType) p.set('subType', f.subType);
  if (f.city) p.set('city', f.city);
  if (f.pricingPeriod) p.set('pricingPeriod', f.pricingPeriod);
  if (f.minPrice) p.set('minPrice', f.minPrice);
  if (f.maxPrice) p.set('maxPrice', f.maxPrice);
  if (f.minRating) p.set('minRating', f.minRating);
  if (f.rooms) p.set('allowsIndividualBookings', 'true');
  if (f.pets) p.set('petFriendly', 'true');
  if (f.parking) p.set('parkingAvailable', 'true');
  if (f.sort !== 'new') p.set('sort', f.sort);
  if (f.lat && f.lng) { p.set('lat', f.lat); p.set('lng', f.lng); p.set('radiusKm', f.radiusKm || '10'); if (f.near) p.set('near', f.near); }
  if (f.view === 'map') p.set('view', 'map');
  if (withPage && f.page > 1) p.set('page', String(f.page));
  return p;
}

export function ExplorePage() {
  const { type: typeSlug, city: citySlug } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const filters = useMemo(() => readFilters(params, typeSlug, citySlug), [params, typeSlug, citySlug]);
  const hasPoint = Boolean(filters.lat && filters.lng);
  const centre = hasPoint ? { lat: Number(filters.lat), lng: Number(filters.lng) } : null;
  const [results, setResults] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  // On phones and tablets the filters are a drawer: stop the page scrolling behind it and let Escape close it.
  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPanelOpen(false); };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', onKey); };
  }, [panelOpen]);
  const [text, setText] = useState(filters.query);
  const [min, setMin] = useState(filters.minPrice);
  const [max, setMax] = useState(filters.maxPrice);
  const [locations, setLocations] = useState<CatalogOptions['locations'] | null>(null);
  const placeHost = useRef<HTMLDivElement>(null);
  const reqId = useRef(0);
  useEffect(() => { api.getCatalog().then((c) => setLocations(c.locations)).catch(() => {}); }, []);
  useReveal(loading);

  // Change filters. On the clean landing routes (/rent/:type, /in/:city) a change that
  // would contradict the route moves to /explore with the full filter set in the URL.
  const commit = useCallback((patch: Partial<Filters>) => {
    const next: Filters = { ...filters, ...patch, page: patch.page ?? 1 };
    const q = toQuery(next);
    const leavesRoute = (typeSlug && next.subType !== typeSlug) || (citySlug && next.city !== filters.city);
    if ((typeSlug || citySlug) && leavesRoute) navigate(`/explore${q.size ? `?${q}` : ''}`);
    else if (typeSlug || citySlug) { const rest = toQuery({ ...next, subType: '', city: '' }); setParams(rest, { replace: true }); }
    else setParams(q, { replace: true });
  }, [filters, typeSlug, citySlug, navigate, setParams]);

  // Keep typed inputs in step with the URL, and debounce them into it.
  useEffect(() => { setText(filters.query); setMin(filters.minPrice); setMax(filters.maxPrice); }, [filters.query, filters.minPrice, filters.maxPrice]);
  useEffect(() => {
    if (text === filters.query && min === filters.minPrice && max === filters.maxPrice) return;
    const t = window.setTimeout(() => commit({ query: text, minPrice: min, maxPrice: max }), 450);
    return () => window.clearTimeout(t);
  }, [text, min, max]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const id = ++reqId.current;
    setLoading(true); setError('');
    const q = toQuery(filters, false);
    q.delete('sort'); q.set('page', String(filters.page)); q.set('limit', String(PAGE_SIZE));
    const s = SORTS[filters.sort]; q.set('sortBy', s.sortBy); q.set('sortOrder', s.sortOrder);
    q.delete('view'); q.delete('near');
    if (filters.view === 'map') { q.set('limit', '60'); q.set('page', '1'); }
    api.searchProperties(q)
      .then((r) => { if (id === reqId.current) { setResults(r.data || []); setTotal(r.total ?? 0); } })
      .catch((e) => { if (id === reqId.current) setError(e.message); })
      .finally(() => { if (id === reqId.current) setLoading(false); });
  }, [filters]);

  // ── Copy & SEO ────────────────────────────────────────────────────────────
  const space = spaceBySlug(filters.subType);
  // Curated copy exists for the main cities; every other known place gets a sensible generic page.
  const city = filters.city ? (CITY_COPY.find((c) => c.name === filters.city) ?? {
    slug: filters.city.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name: filters.city, h1: `Places to rent in ${filters.city}`,
    intro: `Rooms, homes, offices and other spaces to rent in ${filters.city}, from verified hosts with clear prices and fair refund rules.`, areas: [] as string[],
  }) : undefined;
  const h1 = space && city ? `${space.label} for rent in ${city.name}`
    : space ? space.h1 : city ? city.h1 : filters.query ? `Places matching “${filters.query}”` : 'Find your next space in Ghana';
  const noun = space ? (total === 1 ? space.slug : space.plural) : (total === 1 ? 'space' : 'spaces');
  const lead = space && !city ? space.intro : city && !space ? city.intro
    : space && city ? `Browse ${space.plural} for rent in ${city.name}. Verified hosts, the full price up front and fair, clear refund rules.`
    : 'Rooms, homes, villas, offices, shops, garages and warehouses across Ghana. Rent by the night, week, month or year — verified hosts, clear prices, pay with mobile money.';
  // A neighbourhood alias (Santasi, Osu…) shows its parent city's listings, so it points search engines at that page.
  const parentCity = city && locations ? resolveCity(locations.cities, [city.name]) : undefined;
  const baseCanonical = typeSlug ? `/rent/${typeSlug}` : citySlug ? `/in/${parentCity?.slug ?? citySlug}`
    : space && !city && !filters.pricingPeriod && !params.get('query') ? `/rent/${space.slug}`
    : city && !space ? `/in/${city.slug}` : '/explore';
  const thin = Boolean((!loading && total === 0) || hasPoint || filters.view === 'map' || filters.query || filters.minPrice || filters.maxPrice || filters.minRating || filters.rooms || filters.pets || filters.parking || filters.sort !== 'new' || filters.page > 1 || (space && city) || (filters.pricingPeriod && (space || city)));
  const canonical = !thin && filters.pricingPeriod && !space && !city ? `/explore?pricingPeriod=${filters.pricingPeriod}` : baseCanonical;
  const title = `${h1}${filters.pricingPeriod && !filters.query ? ` — ${unitWord[filters.pricingPeriod]}` : ''}`;
  const description = `${total ? `${total} ${noun} to rent${city ? ` in ${city.name}` : ' in Ghana'}. ` : ''}${lead}`;
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Explore', path: '/explore' },
    ...(space ? [{ name: space.plural.charAt(0).toUpperCase() + space.plural.slice(1), path: `/rent/${space.slug}` }] : []),
    ...(city ? [{ name: city.name, path: `/in/${city.slug}` }] : [])];

  const chips: Array<{ label: string; clear: () => void }> = [];
  if (filters.query) chips.push({ label: `“${filters.query}”`, clear: () => commit({ query: '' }) });
  if (city) chips.push({ label: city.name, clear: () => commit({ city: '' }) });
  if (filters.pricingPeriod) chips.push({ label: unitWord[filters.pricingPeriod], clear: () => commit({ pricingPeriod: '', minPrice: '', maxPrice: '' }) });
  if (filters.minPrice || filters.maxPrice) chips.push({ label: `GHS ${filters.minPrice || '0'} – ${filters.maxPrice || 'any'}`, clear: () => commit({ minPrice: '', maxPrice: '' }) });
  if (filters.minRating) chips.push({ label: `${filters.minRating}+ stars`, clear: () => commit({ minRating: '' }) });
  if (hasPoint) chips.push({ label: `${filters.near || 'Selected point'} · within ${filters.radiusKm || 10} km`, clear: () => commit({ lat: '', lng: '', near: '', radiusKm: '', sort: filters.sort === 'nearest' ? 'new' : filters.sort }) });
  if (filters.rooms) chips.push({ label: 'Rooms available', clear: () => commit({ rooms: false }) });
  if (filters.pets) chips.push({ label: 'Pet friendly', clear: () => commit({ pets: false }) });
  if (filters.parking) chips.push({ label: 'Parking', clear: () => commit({ parking: false }) });
  if (space) chips.unshift({ label: space.label, clear: () => commit({ subType: '' }) });

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const presets = filters.pricingPeriod ? PRESETS[filters.pricingPeriod] ?? [] : [];
  const submit = (e: FormEvent) => { e.preventDefault(); commit({ query: text, minPrice: min, maxPrice: max }); };
  const reset = () => { setText(''); setMin(''); setMax(''); navigate('/explore'); };
  const nearPoint = (lat: number, lng: number, label: string) => commit({ lat: String(lat), lng: String(lng), near: label, radiusKm: filters.radiusKm || '10', sort: 'nearest', city: '' });
  const nearMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => nearPoint(Number(pos.coords.latitude.toFixed(5)), Number(pos.coords.longitude.toFixed(5)), 'Near me'), () => window.alert('Allow location access to search near you, or pick a city instead.'), { timeout: 10_000 });
  };
  // Google place search (when configured): choosing an area/address searches around it.
  useEffect(() => {
    if (!mapsEnabled || !locations || !placeHost.current) return;
    let stop: (() => void) | undefined; let live = true;
    mountPlaceSearch(placeHost.current, locations.cities, (p) => nearPoint(Number(p.latitude.toFixed(5)), Number(p.longitude.toFixed(5)), p.area || p.cityRaw || p.formatted.split(',')[0] || 'Selected place'), 'Near an address or area')
      .then((cleanup) => { if (live) stop = cleanup; else cleanup(); }).catch(() => {});
    return () => { live = false; stop?.(); };
  }, [locations, panelOpen]); // eslint-disable-line react-hooks/exhaustive-deps
  const cityGroups = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const c of locations?.cities ?? []) groups.set(c.region, [...(groups.get(c.region) ?? []), c.name]);
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [locations]);
  const pageNumbers = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - filters.page) <= 1);

  const filterPanel = (
    <div className="ex-panel">
      <div className="ex-panel-head"><h2><SlidersHorizontal size={16} /> Filters</h2><button className="ex-close" onClick={() => setPanelOpen(false)} aria-label="Close filters"><X size={18} /></button></div>
      <fieldset><legend>Location</legend>
        <select className="ex-select" aria-label="City or town" value={filters.city} onChange={(e) => commit({ city: e.target.value, lat: '', lng: '', near: '', radiusKm: '' })}>
          <option value="">Anywhere in Ghana</option>
          {cityGroups.map(([region, names]) => <optgroup key={region} label={region}>{names.map((n) => <option key={n}>{n}</option>)}</optgroup>)}
        </select>
        {mapsEnabled && <div className="ex-place"><MapPin size={16} /><div ref={placeHost} /></div>}
        <button type="button" className="ex-near" onClick={nearMe}><LocateFixed size={15} /> Near me</button>
        {hasPoint && <label className="ex-radius">Within <select value={filters.radiusKm || '10'} onChange={(e) => commit({ radiusKm: e.target.value })}>{RADII.map((r) => <option key={r} value={r}>{r} km</option>)}</select> of {filters.near || 'this point'}</label>}
      </fieldset>
      <fieldset><legend>Rent by</legend>
        <div className="ex-seg" role="radiogroup" aria-label="Rental length">
          {UNITS.map(([value, label]) => <button key={value} type="button" role="radio" aria-checked={filters.pricingPeriod === value} className={filters.pricingPeriod === value ? 'on' : ''} onClick={() => commit({ pricingPeriod: value, minPrice: '', maxPrice: '' })}>{label}</button>)}
        </div>
      </fieldset>
      <fieldset><legend>Price (GHS{filters.pricingPeriod ? ` per ${filters.pricingPeriod === 'day' ? 'night' : filters.pricingPeriod}` : ''})</legend>
        <div className="ex-price"><input inputMode="numeric" placeholder="Min" aria-label="Minimum price" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ''))} /><span>–</span><input inputMode="numeric" placeholder="Max" aria-label="Maximum price" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ''))} /></div>
        {presets.length > 0 && <div className="ex-presets">{presets.map(([label, lo, hi]) => <button key={label} type="button" onClick={() => commit({ minPrice: lo ? String(lo) : '', maxPrice: hi ? String(hi) : '' })}>{label}</button>)}</div>}
      </fieldset>
      <fieldset><legend>Space type</legend>
        <div className="ex-list">
          <label><input type="radio" name="space" checked={!filters.subType} onChange={() => commit({ subType: '' })} /> Any space</label>
          {SPACE_COPY.map((s) => <label key={s.slug}><input type="radio" name="space" checked={filters.subType === s.slug} onChange={() => commit({ subType: s.slug })} /> {s.label}</label>)}
        </div>
      </fieldset>
      <fieldset><legend>Guest rating</legend>
        <div className="ex-seg">{[['', 'Any'], ['3', '3+'], ['4', '4+'], ['4.5', '4.5+']].map(([v, l]) => <button key={l} type="button" className={filters.minRating === v ? 'on' : ''} onClick={() => commit({ minRating: v })}>{v && <Star size={12} fill="currentColor" />} {l}</button>)}</div>
      </fieldset>
      <fieldset><legend>Good to have</legend>
        <div className="ex-list">
          <label><input type="checkbox" checked={filters.rooms} onChange={(e) => commit({ rooms: e.target.checked })} /> Rooms you can book separately</label>
          <label><input type="checkbox" checked={filters.parking} onChange={(e) => commit({ parking: e.target.checked })} /> Parking</label>
          <label><input type="checkbox" checked={filters.pets} onChange={(e) => commit({ pets: e.target.checked })} /> Pet friendly</label>
        </div>
      </fieldset>
      <div className="ex-panel-foot"><button className="button button-quiet" onClick={reset}>Clear all</button><button className="button button-primary" onClick={() => setPanelOpen(false)}>Show {total || ''} results</button></div>
    </div>
  );

  return (
    <div className="page explore">
      <Seo title={title} description={description} path={canonical} noindex={thin} follow={thin}
        jsonLd={[webPageLd(h1, description, canonical, 'CollectionPage'), breadcrumbLd(crumbs), results.length && !thin ? itemListLd(h1, results) : null, space && !city && !thin ? faqLd(space.faqs) : null]} />

      <nav className="crumbs" aria-label="Breadcrumb">{crumbs.map((c, i) => <span key={c.path}>{i > 0 && <ChevronRight size={14} />}{i === crumbs.length - 1 ? <b aria-current="page">{c.name}</b> : <Link to={c.path}>{c.name}</Link>}</span>)}</nav>

      <header className="ex-head">
        <div><h1>{h1}</h1><p className="lead">{lead}</p></div>
        <form className="ex-search" role="search" onSubmit={submit}>
          <MapPin size={18} /><input aria-label="Search by place or name" value={text} onChange={(e) => setText(e.target.value)} placeholder="Search by area, name or type — Osu, office, villa…" />
          <button className="button button-primary"><Search size={16} /> Search</button>
        </form>
      </header>

      <nav className="ex-types" aria-label="Space types">
        <Link to="/explore" className={!filters.subType ? 'on' : ''}><Search size={18} />All spaces</Link>
        {SPACE_COPY.map((s) => { const Icon = TYPE_ICONS[s.slug] ?? Home; return <Link key={s.slug} to={`/rent/${s.slug}`} className={filters.subType === s.slug ? 'on' : ''}><Icon size={18} />{s.label}</Link>; })}
      </nav>

      <div className="ex-layout">
        <aside className={`ex-filters ${panelOpen ? 'ex-filters-open' : ''}`} aria-label="Filters" role={panelOpen ? 'dialog' : undefined} aria-modal={panelOpen || undefined}>{filterPanel}</aside>
        {panelOpen && <div className="ex-scrim" onClick={() => setPanelOpen(false)} role="presentation" />}

        <section className="ex-results" aria-live="polite" aria-busy={loading}>
          <div className="ex-bar">
            <strong>{loading ? 'Searching…' : `${total.toLocaleString()} ${total === 1 ? 'space' : 'spaces'}${city ? ` in ${city.name}` : ''}`}</strong>
            <div className="ex-bar-tools">
              <button className="ex-filter-btn" onClick={() => setPanelOpen(true)}><SlidersHorizontal size={16} /> Filters{chips.length ? ` (${chips.length})` : ''}</button>
              {mapsEnabled && <div className="ex-view" role="group" aria-label="View"><button className={filters.view === 'grid' ? 'on' : ''} onClick={() => commit({ view: 'grid' })}><LayoutGrid size={15} /> List</button><button className={filters.view === 'map' ? 'on' : ''} onClick={() => commit({ view: 'map' })}><MapIcon size={15} /> Map</button></div>}
              <label className="ex-sort">Sort <select value={filters.sort} onChange={(e) => commit({ sort: e.target.value })}>{Object.entries(SORTS).filter(([k]) => k !== 'nearest' || hasPoint).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></label>
            </div>
          </div>
          {chips.length > 0 && <div className="ex-active">{chips.map((c) => <button key={c.label} className="ex-chip" onClick={c.clear}>{c.label} <X size={13} /></button>)}<button className="ex-clear" onClick={reset}>Clear all</button></div>}

          {error ? <div className="error-state">{error}</div>
            : loading && !results.length ? <div className="property-grid">{Array.from({ length: 6 }, (_, i) => <div className="ex-skel" key={i}><i /><b /><b /></div>)}</div>
            : results.length ? <>
              {filters.view === 'map' && mapsEnabled && <ResultsMap properties={results} centre={centre} />}
              <div className="property-grid ex-grid">{results.map((p) => <PropertyCard key={p.id} property={p} />)}</div></>
            : <div className="empty-state ex-empty"><Search size={30} /><h2>Nothing matches yet</h2><p>Try fewer filters, a wider price range, or a different space type.</p><div className="ex-empty-links">{SPACE_COPY.slice(0, 5).map((s) => <Link key={s.slug} to={`/rent/${s.slug}`}>{s.plural}</Link>)}</div><button className="button button-secondary" onClick={reset}>Clear all filters</button></div>}

          {pages > 1 && filters.view !== 'map' && (
            <nav className="ex-pages" aria-label="Pagination">
              <button disabled={filters.page <= 1} onClick={() => { commit({ page: filters.page - 1 }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-label="Previous page"><ChevronLeft size={16} /></button>
              {pageNumbers.map((n, i) => <span key={n}>{i > 0 && n - pageNumbers[i - 1] > 1 && <em>…</em>}<button className={n === filters.page ? 'on' : ''} aria-current={n === filters.page ? 'page' : undefined} onClick={() => { commit({ page: n }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>{n}</button></span>)}
              <button disabled={filters.page >= pages} onClick={() => { commit({ page: filters.page + 1 }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-label="Next page"><ChevronRight size={16} /></button>
            </nav>
          )}
        </section>
      </div>

      <section className="ex-about reveal" aria-labelledby="ex-about-title">
        <div>
          <h2 id="ex-about-title">{space ? `Renting ${space.plural} on Lotnis` : city ? `Renting in ${city.name}` : 'How renting works on Lotnis'}</h2>
          <p>{space && !city ? space.intro : city ? `${city.intro}${city.areas.length ? ` Popular areas: ${city.areas.join(', ')}.` : ''}` : 'Lotnis is a marketplace for space. Hosts list rooms, homes, villas, offices, shops, garages and warehouses; you rent exactly what you need, for as long as you need it — by the night, week, month or year.'}</p>
          <p className="muted-inline">Read how <Link to="/refund-policy">refunds and cancellations</Link> work, or our <Link to="/terms">Terms of Use</Link>.</p>
        </div>
        <ul className="ex-why-cards">{(space?.why ?? ['Every host is ID-verified and every listing is approved', 'See the full price — stay, service fee and deposit — before you pay', 'Clear refund rules, and a fair notice process if you leave early']).map((w) => <li key={w}>{w}</li>)}</ul>
        {space && space.faqs.length > 0 && !city && (
          <div className="ex-faq"><h3>Common questions about renting {space.plural}</h3>
            {space.faqs.map((f) => <details key={f.question}><summary>{f.question}</summary><p>{f.answer}</p></details>)}</div>
        )}
      </section>

      <section className="ex-links reveal" aria-label="Explore more">
        <div><h2>Browse by space</h2><ul>{SPACE_COPY.map((s) => <li key={s.slug}><Link to={`/rent/${s.slug}`}>{s.label === 'Hotel / hostel' ? 'Hotels & hostels' : `${s.label.charAt(0).toUpperCase()}${s.label.slice(1)}s`} for rent</Link></li>)}</ul></div>
        <div><h2>Browse by city</h2><ul>{CITY_COPY.map((c) => <li key={c.slug}><Link to={`/in/${c.slug}`}>Places to rent in {c.name}</Link></li>)}</ul></div>
        <div><h2>Rent by</h2><ul>{UNITS.slice(1).map(([v, l]) => <li key={v}><Link to={`/explore?pricingPeriod=${v}`}>{l} rentals</Link></li>)}</ul></div>
      </section>
    </div>
  );
}

