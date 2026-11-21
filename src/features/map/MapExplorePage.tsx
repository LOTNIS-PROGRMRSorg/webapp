import { Building2, Search, Ticket, Wrench, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MarkerMap, markerKey, pinLabel } from '@/components/maps/MarkerMap';
import { emojiFor } from '@/components/maps/categoryIcons';
import { PillTabs, PillToggles } from '@/components/tabs';
import { Seo } from '@/lib/seo/seo';
import { mapApi, marketApi, type MapArea, type MapMarker, type ServiceCategory } from '@/lib/api/market';
import { mapsEnabled } from '@/lib/maps/maps';
import { GHANA_CENTER } from '@/lib/maps/places';
import './map.css';

type Kind = 'stays' | 'events' | 'services';
const KIND_ITEMS = [
  { key: 'stays' as Kind, label: 'Stays', icon: <Building2 size={16} /> },
  { key: 'events' as Kind, label: 'Events', icon: <Ticket size={16} /> },
  { key: 'services' as Kind, label: 'Services', icon: <Wrench size={16} /> },
];
const GHANA_AREA: MapArea = { minLat: 4.6, maxLat: 11.2, minLng: -3.3, maxLng: 1.3 };
const kmBetween = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const r = (d: number) => (d * Math.PI) / 180;
  const h =
    Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};
const KIND_LABEL = { stay: 'Stay', event: 'Event', service: 'Service' } as const;

/** One map for everything Lotnis offers near you: places to stay, events and people who can do a job. */
export default function MapExplorePage() {
  const [params, setParams] = useSearchParams();
  const kinds = (params.get('kinds') ? params.get('kinds')!.split(',') : ['stays', 'events', 'services']).filter(
    (k): k is Kind => ['stays', 'events', 'services'].includes(k),
  );
  const q = params.get('q') ?? '';
  const category = params.get('category') ?? '';
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [capped, setCapped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapDown, setMapDown] = useState(!mapsEnabled);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [area, setArea] = useState<MapArea | null>(null);
  const [sheet, setSheet] = useState(false);
  const centre = useRef({ lat: GHANA_CENTER.lat, lng: GHANA_CENTER.lng });
  const list = useRef<HTMLDivElement>(null);
  const [text, setText] = useState(q);

  useEffect(() => {
    marketApi
      .categories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };

  const load = useCallback(
    (a: MapArea) => {
      setLoading(true);
      setError('');
      mapApi
        .markers(a, kinds, q || undefined, category || undefined)
        .then((r) => {
          setMarkers(r.markers);
          setCounts(r.counts);
          setCapped(r.capped);
        })
        .catch((e) => setError(e instanceof Error ? e.message : 'Could not load the map'))
        .finally(() => setLoading(false));
    },
    [kinds.join(','), q, category], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // without a working map the list covers the whole country
  useEffect(() => {
    if (mapDown) load(GHANA_AREA);
  }, [mapDown, load]);
  useEffect(() => {
    if (area) load(area);
  }, [load]); // eslint-disable-line react-hooks/exhaustive-deps

  const onArea = (a: MapArea) => {
    setArea(a);
    centre.current = { lat: (a.minLat + a.maxLat) / 2, lng: (a.minLng + a.maxLng) / 2 };
    load(a);
  };

  const sorted = useMemo(
    () => [...markers].sort((a, b) => kmBetween(centre.current, a) - kmBetween(centre.current, b)),
    [markers], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // bring the selected card into view in the list
  useEffect(() => {
    if (!selected) return;
    list.current
      ?.querySelector<HTMLElement>(`[data-key="${CSS.escape(selected)}"]`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selected]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    set({ q: text.trim() || null });
  };

  return (
    <div className="mx">
      <Seo title="Explore the map" description="Stays, events and services near you on one map." path="/map" />
      <header className="mx-top">
        <form className="mx-search" role="search" onSubmit={onSearch}>
          <Search size={18} />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search stays, events, plumbers, photographers…"
            aria-label="Search the map"
          />
          {q && (
            <button
              type="button"
              aria-label="Clear"
              onClick={() => {
                setText('');
                set({ q: null });
              }}
            >
              <X size={16} />
            </button>
          )}
        </form>
        <PillToggles
          label="What to show"
          items={KIND_ITEMS.map((k) => ({ ...k, count: counts[k.key] }))}
          value={kinds}
          onChange={(next) => set({ kinds: next.length === 3 || next.length === 0 ? null : next.join(',') })}
        />
        {kinds.includes('services') && categories.length > 0 && (
          <PillTabs
            label="Service type"
            role="group"
            value={category}
            onChange={(v) => set({ category: v || null })}
            tabs={[
              { key: '', label: 'All services' },
              ...categories.map((c) => ({ key: c.slug, label: c.name, icon: <span>{emojiFor(c.icon)}</span> })),
            ]}
          />
        )}
      </header>

      <div className={`mx-body ${sheet ? 'mx-sheet-open' : ''} ${mapDown ? 'mx-nomap' : ''}`}>
        <aside className="mx-list" ref={list} aria-label="Results">
          <div className="mx-list-head">
            <strong>
              {loading ? 'Looking around…' : `${sorted.length} place${sorted.length === 1 ? '' : 's'} in view`}
            </strong>
            {capped && <small>Zoom in to see more</small>}
          </div>
          {error && <p className="error-state">{error}</p>}
          {!loading && !sorted.length && !error && (
            <p className="mx-empty">Nothing here yet. Try zooming out, or turn another kind back on.</p>
          )}
          {sorted.map((m) => {
            const key = markerKey(m);
            return (
              <Link
                key={key}
                to={m.href}
                data-key={key}
                className={`mx-item ${selected === key ? 'on' : ''}`}
                onMouseEnter={() => setHover(key)}
                onMouseLeave={() => setHover(null)}
                onClick={(e) => {
                  if (!mapDown && window.matchMedia('(min-width: 900px)').matches && selected !== key) {
                    e.preventDefault();
                    setSelected(key);
                  }
                }}
              >
                <span className="mx-item-img">
                  {m.image ? (
                    <img src={m.image} alt="" loading="lazy" />
                  ) : (
                    <span>{m.kind === 'service' ? emojiFor(m.icon) : m.kind === 'event' ? '🎟️' : '🏠'}</span>
                  )}
                </span>
                <span className="mx-item-text">
                  <small className={`mx-kind mx-kind-${m.kind}`}>{KIND_LABEL[m.kind]}</small>
                  <strong>{m.title}</strong>
                  <span>{m.subtitle}</span>
                  <b>{pinLabel(m).replace(/^[^\w₵]+/u, '')}</b>
                </span>
              </Link>
            );
          })}
        </aside>

        {!mapDown && (
          <section className="mx-map" aria-label="Map">
            <MarkerMap
              markers={sorted}
              selectedKey={selected}
              highlightKey={hover}
              onSelect={setSelected}
              onHover={setHover}
              onAreaChange={onArea}
              onUnavailable={() => setMapDown(true)}
              onLocate={(p) => {
                centre.current = p;
              }}
              loading={loading}
            />
          </section>
        )}
        {!mapDown && (
          <button type="button" className="mx-toggle" onClick={() => setSheet((v) => !v)}>
            {sheet ? 'Show map' : `Show list · ${sorted.length}`}
          </button>
        )}
      </div>
    </div>
  );
}
