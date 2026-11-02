import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BadgeCheck,
  ChevronRight,
  Heart,
  List,
  Map as MapIcon,
  ReceiptText,
  Search,
  SlidersHorizontal,
  Smartphone,
  X,
} from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { mapsAuthFailed, mapsEnabled } from '@/lib/maps/maps';
import { ResultsMap } from '@/components/maps/ResultsMap';
import { useReveal } from '@/features/stays/bookingUi';
import { resolveCity } from '@/lib/maps/places';
import { breadcrumbLd, faqLd, itemListLd, Seo, webPageLd } from '@/lib/seo/seo';
import { CITY_COPY, spaceBySlug } from '@/lib/seo/content';
import type { CatalogOptions, Property } from '@/types';
import {
  apiQuery,
  essentialByKey,
  EXTRAS,
  Filters,
  INTENTS,
  intentOf,
  intentPatch,
  PAGE_SIZE,
  SORTS,
  readFilters,
  toQuery,
  unitWord,
} from './exploreFilters';
import { AboutSection } from './AboutSection';
import { BrowseLinks } from './BrowseLinks';
import { FilterSheet } from './FilterSheet';
import { ResultsPagination } from './ResultsPagination';
import { SearchBar } from './SearchBar';
import { areaOf, priceOf, SpaceCard } from './SpaceCard';
import { rememberViewed, useRecentSpaces, useSavedSpaces } from './spaceMemory';
import { MustHaves } from './MustHaves';
import { HostPrompt, WidenSearch } from './WidenSearch';
import './explore.css';

const MAP_PREF = 'lotnis_explore_map';
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

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
  const [attempt, setAttempt] = useState(0);
  const [notice, setNotice] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  // Desktop: the map sits beside the list unless the person hid it. Phones: a full-screen map on demand.
  const [mapOn, setMapOn] = useState(() => {
    try {
      return localStorage.getItem(MAP_PREF) !== 'off';
    } catch {
      return true;
    }
  });
  const [mobileMap, setMobileMap] = useState(params.get('view') === 'map');
  // A rejected or missing Google key: show the list on its own rather than an error box.
  const [mapBroken, setMapBroken] = useState(() => !mapsEnabled || mapsAuthFailed());
  const [locations, setLocations] = useState<CatalogOptions['locations'] | null>(null);
  const cities = locations?.cities ?? [];
  const { saved, isSaved, toggle } = useSavedSpaces();
  const recent = useRecentSpaces();

  useEffect(() => {
    api
      .getCatalog()
      .then((c) => setLocations(c.locations))
      .catch(() => {});
  }, []);
  useReveal(loading);

  // Change filters. On the clean landing routes (/rent/:type, /in/:city) a change that
  // would contradict the route moves to /explore with the full filter set in the URL.
  const commit = useCallback(
    (patch: Partial<Filters>) => {
      const next: Filters = { ...filters, ...patch, page: patch.page ?? 1 };
      const q = toQuery(next);
      const leavesRoute = (typeSlug && next.subType !== typeSlug) || (citySlug && next.city !== filters.city);
      if ((typeSlug || citySlug) && leavesRoute) navigate(`/explore${q.size ? `?${q}` : ''}`);
      else if (typeSlug || citySlug) setParams(toQuery({ ...next, subType: '', city: '' }), { replace: true });
      else setParams(q, { replace: true });
      setShowSaved(false);
    },
    [filters, typeSlug, citySlug, navigate, setParams],
  );

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    api
      .searchProperties(apiQuery(filters))
      .then((r) => {
        if (!live) return;
        setResults(r.data || []);
        setTotal(r.total ?? 0);
      })
      .catch((e) => live && setError(e.message))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [filters, attempt]);

  // ── Copy & SEO ────────────────────────────────────────────────────────────
  const space = spaceBySlug(filters.subType);
  const intent = intentOf(filters);
  // Curated copy exists for the main cities; every other known place gets a sensible generic page.
  const city = filters.city
    ? (CITY_COPY.find((c) => c.name === filters.city) ?? {
        slug: filters.city.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: filters.city,
        h1: `Places to rent in ${filters.city}`,
        intro: `Rooms, homes, offices and other spaces to rent in ${filters.city}, from verified hosts with clear prices and fair refund rules.`,
        areas: [] as string[],
      })
    : undefined;
  // A search for a neighbourhood inside a city reads "in Santasi, Kumasi".
  const place = city ? (filters.query ? `${filters.query}, ${city.name}` : city.name) : '';
  const where = place ? ` in ${place}` : '';
  const h1 =
    space && city
      ? `${cap(space.plural)} for rent in ${city.name}`
      : space
        ? space.h1
        : intent === 'homes'
          ? `Homes to rent${where || ' in Ghana'}`
          : intent === 'stays'
            ? `Short stays${where || ' in Ghana'}`
            : city && filters.query
              ? `Places to rent in ${place}`
              : city
                ? city.h1
                : filters.query
                  ? `Places matching “${filters.query}”`
                  : 'Find your next space in Ghana';
  const noun = space
    ? total === 1
      ? space.label.toLowerCase()
      : space.plural
    : intent === 'homes'
      ? total === 1
        ? 'home'
        : 'homes'
      : total === 1
        ? 'space'
        : 'spaces';
  const lead =
    space && !city
      ? space.intro
      : city && !space
        ? city.intro
        : space && city
          ? `Browse ${space.plural} for rent in ${city.name}. Verified hosts, the full price up front and fair, clear refund rules.`
          : 'Homes, rooms, offices, shops, warehouses and venues from verified hosts. Rent by the night, week, month or year.';
  // A neighbourhood alias (Santasi, Osu…) shows its parent city's listings, so it points search engines at that page.
  const parentCity = city && locations ? resolveCity(locations.cities, [city.name]) : undefined;
  const baseCanonical = typeSlug
    ? `/rent/${typeSlug}`
    : citySlug
      ? `/in/${parentCity?.slug ?? citySlug}`
      : space && !city && !filters.pricingPeriod && !params.get('query')
        ? `/rent/${space.slug}`
        : city && !space
          ? `/in/${city.slug}`
          : '/explore';
  const thin = Boolean(
    (!loading && total === 0) ||
    hasPoint ||
    filters.query ||
    filters.category ||
    filters.amenities.length ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.minRating ||
    filters.rooms ||
    filters.pets ||
    filters.parking ||
    filters.sort !== 'new' ||
    filters.page > 1 ||
    (space && city) ||
    (filters.pricingPeriod && (space || city)),
  );
  const canonical =
    !thin && filters.pricingPeriod && !space && !city
      ? `/explore?pricingPeriod=${filters.pricingPeriod}`
      : baseCanonical;
  const title = `${h1}${filters.pricingPeriod && !filters.query && intent !== 'stays' ? ` — ${unitWord[filters.pricingPeriod]}` : ''}`;
  const description = `${total ? `${total} ${noun} to rent${city ? ` in ${city.name}` : ' in Ghana'}. ` : ''}${lead}`;
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Spaces', path: '/explore' },
    ...(space ? [{ name: cap(space.plural), path: `/rent/${space.slug}` }] : []),
    ...(city ? [{ name: city.name, path: `/in/${city.slug}` }] : []),
  ];

  // ── Active filters as removable chips ────────────────────────────────────
  const chips: Array<{ label: string; clear: () => void }> = [];
  if (space) chips.push({ label: space.label, clear: () => commit({ subType: '' }) });
  if (filters.category === 'residential') chips.push({ label: 'Homes', clear: () => commit({ category: '' }) });
  if (filters.query) chips.push({ label: `“${filters.query}”`, clear: () => commit({ query: '' }) });
  if (city) chips.push({ label: city.name, clear: () => commit({ city: '' }) });
  if (filters.pricingPeriod)
    chips.push({
      label: cap(unitWord[filters.pricingPeriod] ?? filters.pricingPeriod),
      clear: () => commit({ pricingPeriod: '', minPrice: '', maxPrice: '' }),
    });
  const ghs = (v: string) => `GHS ${Number(v).toLocaleString()}`;
  const budgetText =
    filters.minPrice && filters.maxPrice
      ? `${ghs(filters.minPrice)} – ${Number(filters.maxPrice).toLocaleString()}`
      : filters.maxPrice
        ? `Under ${ghs(filters.maxPrice)}`
        : `${ghs(filters.minPrice || '0')}+`;
  if (filters.minPrice || filters.maxPrice)
    chips.push({
      label: budgetText,
      clear: () => commit({ minPrice: '', maxPrice: '' }),
    });
  for (const key of filters.amenities)
    chips.push({
      label: essentialByKey(key)?.label ?? key.replace(/_/g, ' '),
      clear: () => commit({ amenities: filters.amenities.filter((a) => a !== key) }),
    });
  if (filters.minRating) chips.push({ label: `${filters.minRating}+ stars`, clear: () => commit({ minRating: '' }) });
  if (hasPoint)
    chips.push({
      label: `${filters.near || 'Selected point'} · within ${filters.radiusKm || 10} km`,
      clear: () =>
        commit({ lat: '', lng: '', near: '', radiusKm: '', sort: filters.sort === 'nearest' ? 'new' : filters.sort }),
    });
  for (const extra of EXTRAS)
    if (filters[extra.key])
      chips.push({ label: extra.label, clear: () => commit({ [extra.key]: false } as Partial<Filters>) });
  // Type/intent show in the tabs and must-haves on their own button, so neither counts towards Filters.
  const filterCount = chips.length - (space ? 1 : 0) - (filters.category ? 1 : 0) - filters.amenities.length;

  const summary = [
    filters.pricingPeriod && cap(unitWord[filters.pricingPeriod] ?? ''),
    (filters.minPrice || filters.maxPrice) &&
      (filters.maxPrice && !filters.minPrice
        ? `under GHS ${Number(filters.maxPrice).toLocaleString()}`
        : `GHS ${filters.minPrice || '0'} – ${filters.maxPrice || 'any'}`),
    filters.amenities.length > 0 &&
      `with ${filters.amenities.map((a) => essentialByKey(a)?.label.toLowerCase() ?? a).join(', ')}`,
  ]
    .filter(Boolean)
    .join(' · ');

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageNumbers = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === pages || Math.abs(n - filters.page) <= 1,
  );
  const reset = () => navigate('/explore');
  const nearPoint = (lat: number, lng: number, label: string) =>
    commit({
      lat: String(lat),
      lng: String(lng),
      near: label,
      radiusKm: filters.radiusKm || '10',
      sort: 'nearest',
      city: '',
      query: '',
    });
  const nearMe = () => {
    setNotice('');
    if (!navigator.geolocation) return setNotice('Your browser can’t share its location. Pick a city or area instead.');
    navigator.geolocation.getCurrentPosition(
      (pos) => nearPoint(Number(pos.coords.latitude.toFixed(5)), Number(pos.coords.longitude.toFixed(5)), 'Near me'),
      () => setNotice('Allow location access to search near you, or pick a city or area instead.'),
      { timeout: 10_000 },
    );
  };
  const toggleMap = () => {
    setMapOn((on) => {
      try {
        localStorage.setItem(MAP_PREF, on ? 'off' : 'on');
      } catch {
        /* preference only */
      }
      return !on;
    });
  };
  const toggleAmenity = (key: string) =>
    commit({
      amenities: filters.amenities.includes(key)
        ? filters.amenities.filter((a) => a !== key)
        : [...filters.amenities, key],
    });
  const closePanel = useCallback(() => setPanelOpen(false), []);
  // After a search: flash the result count, and bring the results into view if they're below.
  const resultsTop = useRef<HTMLElement>(null);
  const [flash, setFlash] = useState(0);
  const showResults = () => {
    setFlash((n) => n + 1);
    const top = resultsTop.current?.getBoundingClientRect().top ?? 0;
    if (top > window.innerHeight * 0.6) resultsTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const canMap = !mapBroken && !showSaved;
  const showMap = canMap && mapOn;
  const few = !loading && !error && total > 0 && total < 4;
  const none = !loading && !error && total === 0;
  const areas =
    city && !filters.query ? (city.areas.length ? city.areas : (parentCity?.aliases ?? []).slice(0, 6)) : [];
  const cardFor = (p: Property) => (
    <SpaceCard
      key={p.id}
      property={p}
      area={areaOf(p, cities)}
      saved={isSaved(p.id)}
      highlighted={hovered === p.id}
      onToggleSave={() => toggle(p)}
      onHover={setHovered}
      onOpen={() => rememberViewed(p)}
    />
  );
  return (
    <div className={`page explore sp-page${showMap ? ' sp-has-map' : ''}`}>
      <Seo
        title={title}
        description={description}
        path={canonical}
        noindex={thin}
        follow={thin}
        jsonLd={[
          webPageLd(h1, description, canonical, 'CollectionPage'),
          breadcrumbLd(crumbs),
          results.length && !thin ? itemListLd(h1, results) : null,
          space && !city && !thin ? faqLd(space.faqs) : null,
        ]}
      />

      <nav className="crumbs" aria-label="Breadcrumb">
        {crumbs.map((c, i) => (
          <span key={c.path}>
            {i > 0 && <ChevronRight size={14} />}
            {i === crumbs.length - 1 ? <b aria-current="page">{c.name}</b> : <Link to={c.path}>{c.name}</Link>}
          </span>
        ))}
      </nav>

      <header className="sp-headline">
        {/* The longer intro for this page is in the About section below and the meta description. */}
        <h1>{h1}</h1>
        <ul className="sp-proof" aria-label="Why rent on Lotnis">
          <li>
            <BadgeCheck size={16} /> Verified hosts
          </li>
          <li>
            <ReceiptText size={16} /> Full price upfront
          </li>
          <li>
            <Smartphone size={16} /> MoMo or card
          </li>
        </ul>
      </header>

      <div className="sp-search">
        <SearchBar filters={filters} cities={cities} commit={commit} onNearMe={nearMe} onSearched={showResults} />
      </div>

      <div className="sp-intents">
        <nav className="sp-tabs" aria-label="What is the space for?">
          {INTENTS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              aria-pressed={intent === key}
              onClick={() => commit(intentPatch(key, filters))}
            >
              <Icon size={17} strokeWidth={1.9} />
              {label}
            </button>
          ))}
        </nav>
        <div className="sp-tools">
          {saved.length > 0 && (
            <button
              type="button"
              className={`sp-tool${showSaved ? ' on' : ''}`}
              onClick={() => setShowSaved((s) => !s)}
            >
              <Heart size={16} /> <span>Saved</span> <b>{saved.length}</b>
            </button>
          )}
          <MustHaves selected={filters.amenities} onToggle={toggleAmenity} onClear={() => commit({ amenities: [] })} />
          <button type="button" className="sp-tool" onClick={() => setPanelOpen(true)}>
            <SlidersHorizontal size={16} /> <span>Filters</span>
            {filterCount > 0 && <b>{filterCount}</b>}
          </button>
          {!mapBroken && (
            <button type="button" className="sp-tool sp-maptoggle" onClick={toggleMap} aria-pressed={mapOn}>
              <MapIcon size={16} /> <span>{mapOn ? 'Hide map' : 'Show map'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="sp-split">
        <section className="sp-results" aria-live="polite" aria-busy={loading} ref={resultsTop}>
          {showSaved ? (
            <>
              <div className="sp-bar">
                <div>
                  <strong>Saved spaces</strong>
                  <small>Kept on this device</small>
                </div>
                <button type="button" className="sp-link-btn" onClick={() => setShowSaved(false)}>
                  Back to results
                </button>
              </div>
              <div className="sp-grid">{saved.map(cardFor)}</div>
            </>
          ) : (
            <>
              <div className="sp-bar" key={flash} data-flash={flash > 0 || undefined}>
                <div>
                  <strong>
                    {loading
                      ? 'Searching…'
                      : error
                        ? 'Couldn’t load spaces'
                        : `${total.toLocaleString()} ${noun}${where}`}
                  </strong>
                  {summary && <small>{summary}</small>}
                </div>
                <label className="sp-sort">
                  Sort
                  <select value={filters.sort} onChange={(e) => commit({ sort: e.target.value })}>
                    {Object.entries(SORTS)
                      .filter(([k]) => k !== 'nearest' || hasPoint)
                      .map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.label}
                        </option>
                      ))}
                  </select>
                </label>
              </div>
              {notice && (
                <p className="sp-notice" role="status">
                  {notice}
                </p>
              )}
              {chips.length > 0 && (
                <div className="sp-active">
                  {chips.map((c) => (
                    <button
                      key={c.label}
                      type="button"
                      className="sp-achip"
                      onClick={c.clear}
                      aria-label={`Remove ${c.label}`}
                    >
                      {c.label} <X size={13} />
                    </button>
                  ))}
                  <button type="button" className="sp-link-btn" onClick={reset}>
                    Clear all
                  </button>
                </div>
              )}

              {error ? (
                <div className="error-state">
                  We couldn’t load spaces just now. This is usually a brief connection problem.
                  <p>
                    <button type="button" className="button button-primary" onClick={() => setAttempt((n) => n + 1)}>
                      Try again
                    </button>
                  </p>
                </div>
              ) : loading && !results.length ? (
                <div className="sp-grid">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div className="sp-skel" key={i} aria-hidden="true">
                      <i />
                      <b />
                      <b />
                    </div>
                  ))}
                </div>
              ) : results.length ? (
                <div className={`sp-grid${loading ? ' sp-grid-busy' : ''}`}>
                  {results.map((p, i) => (
                    <Fragment key={p.id}>
                      {cardFor(p)}
                      {i === 3 && results.length >= 6 && areas.length > 0 && (
                        <section className="sp-areas sp-wide" aria-label={`Popular areas in ${city!.name}`}>
                          <div>
                            <h2>Popular areas in {city!.name}</h2>
                            <p>Jump straight to a neighbourhood.</p>
                          </div>
                          <div className="sp-areas-list">
                            {areas.map((a) => (
                              <button key={a} type="button" onClick={() => commit({ query: a })}>
                                {a}
                              </button>
                            ))}
                          </div>
                        </section>
                      )}
                    </Fragment>
                  ))}
                  {!few && filters.page === 1 && (
                    <div className="sp-wide">
                      <HostPrompt city={city?.name} space={space} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="sp-empty">
                  <span>
                    <Search size={26} />
                  </span>
                  <h2>
                    {space || city ? `No ${space ? space.plural : noun}${where} match yet` : 'Nothing matches yet'}
                  </h2>
                  <p>New spaces are listed every week. Try one of the suggestions below.</p>
                </div>
              )}

              {(few || none) && (
                <>
                  <WidenSearch filters={filters} total={total} space={space} cities={cities} commit={commit} />
                  <HostPrompt city={city?.name} space={space} empty={none} />
                </>
              )}

              <ResultsPagination filters={filters} pages={pages} pageNumbers={pageNumbers} commit={commit} />
            </>
          )}
        </section>

        {canMap && (
          <aside className={`sp-mapcol${mobileMap ? ' open' : ''}`} aria-label="Map of results">
            {(showMap || mobileMap) && (
              <ResultsMap
                properties={results}
                centre={centre}
                highlightId={hovered}
                onHover={setHovered}
                onSearchArea={({ lat, lng, radiusKm }) =>
                  commit({
                    lat: String(lat),
                    lng: String(lng),
                    radiusKm: String(radiusKm),
                    near: 'Map area',
                    city: '',
                    query: '',
                  })
                }
                onUnavailable={() => {
                  setMapBroken(true);
                  setMobileMap(false);
                }}
              />
            )}
          </aside>
        )}
      </div>

      {canMap && (
        <button type="button" className="sp-mapfab" onClick={() => setMobileMap((m) => !m)}>
          {mobileMap ? <List size={17} /> : <MapIcon size={17} />} {mobileMap ? 'List' : 'Map'}
        </button>
      )}

      {recent.length > 0 && (
        <section className="sp-recent reveal" aria-labelledby="sp-recent-title">
          <div className="sp-recent-head">
            <h2 id="sp-recent-title">Recently viewed</h2>
            <small>Kept on this device</small>
          </div>
          <div className="sp-recent-list">
            {recent.slice(0, 4).map((p) => {
              const price = priceOf(p);
              const img = [...(p.property_images ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]
                ?.public_url;
              return (
                <Link key={p.id} to={`/stays/${p.id}`} className="sp-recent-item">
                  {img ? <img src={img} alt="" loading="lazy" /> : <span className="sp-recent-noimg" />}
                  <span>
                    <b>{p.name}</b>
                    <small>{price ? `${price.from ? 'From ' : ''}${price.amount} / ${price.per}` : p.city}</small>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <AboutSection space={space} city={city} />

      <BrowseLinks />

      {panelOpen && (
        <FilterSheet
          filters={filters}
          total={total}
          loading={loading}
          commit={commit}
          reset={reset}
          onClose={closePanel}
        />
      )}
    </div>
  );
}
