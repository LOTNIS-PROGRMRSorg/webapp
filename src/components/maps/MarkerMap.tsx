import { useEffect, useMemo, useRef, useState } from 'react';
import { LocateFixed } from 'lucide-react';
import {
  createMap,
  drawCircle,
  htmlMarker,
  loadMaps,
  mapsAuthFailed,
  mapsEnabled,
  removeCircle,
  type MapLibre,
} from '@/lib/maps/maps';
import { GHANA_CENTER } from '@/lib/maps/places';
import type { MapArea, MapMarker } from '@/lib/api/market';
import { emojiFor, stayEmoji } from './categoryIcons';
import './markermap.css';

type G = any; // the map objects are created at runtime

export const markerKey = (m: Pick<MapMarker, 'kind' | 'id'>) => `${m.kind}:${m.id}`;

const short = (n: number) =>
  n >= 1000 ? `₵${(n / 1000).toFixed(n >= 10000 || n % 1000 === 0 ? 0 : 1)}k` : `₵${Math.round(n)}`;
const UNIT: Record<string, string> = {
  per_30min: '/30m',
  per_hour: '/hr',
  per_day: '/day',
  per_job: '/job',
  day: '',
  week: '/wk',
  month: '/mo',
  year: '/yr',
};
const dateBadge = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' }) : '';

/** What a pin says: stays show the price, events the date and entry price, services the icon and rate. */
export function pinLabel(m: MapMarker): string {
  if (m.kind === 'stay')
    return `${stayEmoji(m.icon)} ${m.price != null ? `${short(m.price)}${UNIT[m.unit ?? ''] ?? ''}` : 'View'}`;
  if (m.kind === 'event')
    return `${dateBadge(m.starts_at)} · ${m.price == null ? 'Tickets' : m.price === 0 ? 'Free' : short(m.price)}`;
  return `${emojiFor(m.icon)} ${m.price != null ? short(m.price) : ''}${UNIT[m.unit ?? ''] ?? ''}`;
}

/** Group pins that would overlap on screen at this zoom, so a busy area shows a count instead of a pile. */
function cluster(lib: MapLibre, map: G, markers: MapMarker[]) {
  const zoom = map.getZoom();
  const alone = markers.map((m) => ({ items: [m], lat: m.lat, lng: m.lng }));
  // beyond street level every pin stands alone
  if (zoom >= 16) return alone;
  const world = 512 * 2 ** zoom;
  const cell = 64; // px
  const groups = new Map<string, MapMarker[]>();
  for (const m of markers) {
    const p = lib.MercatorCoordinate.fromLngLat([m.lng, m.lat]);
    const key = `${Math.floor((p.x * world) / cell)}:${Math.floor((p.y * world) / cell)}`;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(m);
  }
  return [...groups.values()].map((items) => ({
    items,
    lat: items.reduce((a, m) => a + m.lat, 0) / items.length,
    lng: items.reduce((a, m) => a + m.lng, 0) / items.length,
  }));
}

function previewCard(m: MapMarker) {
  const card = document.createElement('a');
  card.href = m.href;
  card.className = `mm-card mm-card-${m.kind}`;
  if (m.image) {
    const img = document.createElement('img');
    img.src = m.image;
    img.alt = '';
    card.appendChild(img);
  }
  const body = document.createElement('span');
  const kind = document.createElement('small');
  kind.textContent = m.kind === 'stay' ? 'Stay' : m.kind === 'event' ? 'Event' : 'Service';
  const name = document.createElement('strong');
  name.textContent = m.title;
  const sub = document.createElement('span');
  sub.textContent = m.subtitle;
  const price = document.createElement('b');
  price.textContent =
    m.price == null
      ? ''
      : m.price === 0
        ? 'Free'
        : `${m.currency || 'GHS'} ${m.price.toLocaleString()}${UNIT[m.unit ?? ''] ?? ''}`;
  body.append(kind, name, sub, price);
  card.appendChild(body);
  return card;
}

export function MarkerMap({
  markers,
  selectedKey,
  highlightKey,
  onSelect,
  onHover,
  onAreaChange,
  onUnavailable,
  onLocate,
  initialCentre,
  loading,
}: {
  markers: MapMarker[];
  selectedKey?: string | null;
  highlightKey?: string | null;
  onSelect?: (key: string | null) => void;
  onHover?: (key: string | null) => void;
  /** Called (debounced) whenever the visible area changes, so the page can load the pins for it. */
  onAreaChange?: (area: MapArea, zoom: number) => void;
  onUnavailable?: () => void;
  onLocate?: (pos: { lat: number; lng: number }) => void;
  initialCentre?: { lat: number; lng: number; zoom?: number } | null;
  loading?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const S = useRef<{ lib?: MapLibre; map?: G; info?: G; overlays: any[]; you?: G; timer?: number }>({ overlays: [] });
  const cb = useRef({ onSelect, onHover, onAreaChange });
  cb.current = { onSelect, onHover, onAreaChange };
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [version, setVersion] = useState(0); // bumps when the map moves, to re-cluster
  const [locating, setLocating] = useState(false);
  const valid = useMemo(() => markers.filter((m) => m.lat != null && m.lng != null), [markers]);

  useEffect(() => {
    const fail = () => {
      setFailed(true);
      onUnavailable?.();
    };
    if (mapsAuthFailed()) fail();
    window.addEventListener('lotnis-maps-auth-failed', fail);
    return () => window.removeEventListener('lotnis-maps-auth-failed', fail);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mapsEnabled || !host.current) return;
    let live = true;
    loadMaps()
      .then((lib) => {
        if (!live || !host.current) return;
        const c = initialCentre ?? GHANA_CENTER;
        // MapLibre's zoom runs one level ahead of Google's for the same view
        const map = createMap(lib, host.current, {
          center: c,
          zoom: (initialCentre?.zoom ?? (initialCentre ? 12 : 7)) - 1,
        });
        map.addControl(new lib.NavigationControl({ showCompass: false }), 'bottom-right');
        S.current.lib = lib;
        S.current.map = map;
        S.current.info = new lib.Popup({ closeButton: false, offset: 24, maxWidth: '300px', className: 'mm-popup' });
        map.on('click', () => {
          S.current.info?.remove();
          cb.current.onSelect?.(null);
        });
        map.on('moveend', () => {
          setVersion((v) => v + 1);
          window.clearTimeout(S.current.timer);
          S.current.timer = window.setTimeout(() => {
            const b = map.getBounds();
            cb.current.onAreaChange?.(
              { minLat: b.getSouth(), maxLat: b.getNorth(), minLng: b.getWest(), maxLng: b.getEast() },
              map.getZoom() + 1,
            );
          }, 350);
        });
        map.once('load', () => live && setReady(true));
      })
      .catch(() => {
        if (!live) return;
        setFailed(true);
        onUnavailable?.();
      });
    return () => {
      live = false;
      window.clearTimeout(S.current.timer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // draw the pins (clustered) whenever the data or the zoom changes
  useEffect(() => {
    const { map, lib } = S.current;
    if (!ready || !map || !lib) return;
    S.current.overlays.forEach((o) => o.remove());
    S.current.overlays = [];
    for (const g of cluster(lib, map, valid)) {
      const el = document.createElement('button');
      el.type = 'button';
      if (g.items.length > 1) {
        el.className = 'mm-cluster';
        el.textContent = String(g.items.length);
        el.setAttribute('aria-label', `${g.items.length} places here — zoom in`);
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const bounds = new lib.LngLatBounds();
          g.items.forEach((m) => bounds.extend([m.lng, m.lat]));
          map.fitBounds(bounds, { padding: 80, maxZoom: 17 });
        });
      } else {
        const m = g.items[0];
        const key = markerKey(m);
        el.className = `mm-pin mm-${m.kind}${key === selectedKey ? ' on' : ''}${key === highlightKey ? ' hl' : ''}`;
        el.textContent = pinLabel(m);
        el.setAttribute('aria-label', `${m.title}, ${m.subtitle}`);
        el.addEventListener('mouseenter', () => cb.current.onHover?.(key));
        el.addEventListener('mouseleave', () => cb.current.onHover?.(null));
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          cb.current.onSelect?.(key);
        });
      }
      S.current.overlays.push(htmlMarker(lib, map, el, g.lat, g.lng));
    }
  }, [ready, valid, version, selectedKey, highlightKey]);

  // the selected pin: a preview card, plus the area a provider covers
  useEffect(() => {
    const { map, info } = S.current;
    if (!ready || !map || !info) return;
    removeCircle(map, 'mm-radius');
    const m = selectedKey ? valid.find((x) => markerKey(x) === selectedKey) : null;
    if (!m) {
      info.remove();
      return;
    }
    info.setDOMContent(previewCard(m)).setLngLat([m.lng, m.lat]).addTo(map);
    if (m.kind === 'service' && m.radius_km)
      drawCircle(map, 'mm-radius', m.lat, m.lng, m.radius_km * 1000, {
        line: '#c94f35',
        fill: '#ed7256',
        fillOpacity: 0.1,
        lineOpacity: 0.55,
      });
  }, [ready, selectedKey, valid]);

  const locate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const { map, lib } = S.current;
        if (map && lib) {
          map.flyTo({ center: [p.lng, p.lat], zoom: 12 });
          S.current.you?.remove();
          const dot = document.createElement('span');
          dot.className = 'mm-you';
          S.current.you = htmlMarker(lib, map, dot, p.lat, p.lng);
        }
        onLocate?.(p);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  if (failed)
    return (
      <div className="mm mm-failed">
        <p>The map couldn't load. The list shows everything that is nearby.</p>
      </div>
    );
  return (
    <div className="mm">
      <div ref={host} className="mm-canvas" aria-label="Map" />
      {!ready && <div className="mm-loading">Loading map…</div>}
      {ready && loading && <div className="mm-busy">Looking around…</div>}
      {ready && (
        <button
          type="button"
          className="mm-locate"
          onClick={locate}
          disabled={locating}
          aria-label="Show what is near me"
        >
          <LocateFixed size={18} />
        </button>
      )}
    </div>
  );
}
