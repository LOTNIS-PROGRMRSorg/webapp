import { colors } from '@/theme';
import { useEffect, useRef, useState } from 'react';
import { createMap, htmlMarker, loadMaps, mapsAuthFailed, mapsEnabled, type MapLibre } from '@/lib/maps/maps';
import { GHANA_CENTER } from '@/lib/maps/places';
import { stayEmoji } from './categoryIcons';
import { primaryImage } from '@/lib/format';
import type { Property } from '@/types';

type G = any; // map objects are created at runtime

/** "₵4.5k", "₵850": short enough to sit on a map pin. */
export function pinPrice(p: Property): string {
  const amount =
    p.price ??
    (p.rooms ?? []).reduce<number | null>(
      (min, r) => (min == null || r.price_per_period < min ? r.price_per_period : min),
      null,
    );
  if (amount == null) return 'View';
  if (amount >= 1000) return `₵${(amount / 1000).toFixed(amount >= 10000 || amount % 1000 === 0 ? 0 : 1)}k`;
  return `₵${Math.round(amount)}`;
}

const distanceKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const rad = (d: number) => (d * Math.PI) / 180;
  const h =
    Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};

/** Info card built with DOM text (never HTML strings), because names and addresses are written by hosts. */
function infoCard(p: Property) {
  const card = document.createElement('a');
  card.href = `/stays/${p.id}`;
  card.className = 'sp-mapcard';
  const img = primaryImage(p);
  if (img) {
    const i = document.createElement('img');
    i.src = img;
    i.alt = '';
    card.appendChild(i);
  }
  const body = document.createElement('span');
  const name = document.createElement('strong');
  name.textContent = p.name;
  const meta = document.createElement('span');
  const amount = p.price != null ? `${p.currency || 'GHS'} ${p.price.toLocaleString()}` : 'See prices';
  meta.textContent = `${amount}${p.distance_km != null ? ` · ${p.distance_km} km away` : ''}`;
  const more = document.createElement('em');
  more.textContent = 'View space →';
  more.style.color = colors.ink;
  body.append(name, meta, more);
  card.appendChild(body);
  return card;
}

export function ResultsMap({
  properties,
  centre,
  highlightId,
  onHover,
  onSearchArea,
  onUnavailable,
}: {
  properties: Property[];
  centre?: { lat: number; lng: number } | null;
  highlightId?: string | null;
  onHover?: (id: string | null) => void;
  /** Called with the visible area when the person asks to search where they've moved the map. */
  onSearchArea?: (area: { lat: number; lng: number; radiusKm: number }) => void;
  /** Called when the map can't be used (bad key, blocked script), so the page can show the list alone. */
  onUnavailable?: () => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const state = useRef<{
    lib?: MapLibre;
    map?: G;
    info?: G;
    pins: Map<string, { marker: G; el: HTMLButtonElement }>;
    auto: boolean;
  }>({
    pins: new Map(),
    auto: false,
  });
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [moved, setMoved] = useState(false);
  const withCoords = properties.filter((p) => p.latitude != null && p.longitude != null);

  // MapTiler reports a rejected key once tiles are requested; treat it like a failed load.
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
    if (!mapsEnabled || !el.current) return;
    let live = true;
    loadMaps()
      .then((lib) => {
        if (!live || !el.current) return;
        const map = createMap(lib, el.current, { center: centre ?? GHANA_CENTER, zoom: centre ? 10 : 6 });
        map.addControl(new lib.NavigationControl({ showCompass: false }), 'bottom-right');
        state.current.lib = lib;
        state.current.map = map;
        state.current.info = new lib.Popup({
          closeButton: false,
          offset: 18,
          maxWidth: '300px',
          className: 'mm-popup',
        });
        // Only moves the person makes count; our own fitBounds/setCenter calls set `auto` first.
        map.on('dragstart', () => setMoved(true));
        map.on('zoomstart', (e: { originalEvent?: unknown }) => {
          if (e.originalEvent && !state.current.auto) setMoved(true);
        });
        map.on('moveend', () => {
          state.current.auto = false;
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
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Draw a pin per result and fit the map to them.
  useEffect(() => {
    const { map, info, pins, lib } = state.current;
    if (!ready || !map || !lib) return;
    pins.forEach(({ marker }) => marker.remove());
    pins.clear();
    for (const p of withCoords) {
      const lat = Number(p.latitude);
      const lng = Number(p.longitude);
      const pin = document.createElement('button');
      pin.type = 'button';
      pin.className = 'sp-pin';
      pin.textContent = `${stayEmoji(p.sub_type)} ${pinPrice(p)}`;
      pin.setAttribute('aria-label', `${p.name}, ${pinPrice(p)}`);
      pin.addEventListener('mouseenter', () => onHover?.(p.id));
      pin.addEventListener('mouseleave', () => onHover?.(null));
      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        info.setDOMContent(infoCard(p)).setLngLat([lng, lat]).addTo(map);
      });
      pins.set(p.id, { marker: htmlMarker(lib, map, pin, lat, lng), el: pin });
    }
    state.current.auto = true;
    setMoved(false);
    if (withCoords.length > 1) {
      const bounds = new lib.LngLatBounds();
      withCoords.forEach((p) => bounds.extend([Number(p.longitude), Number(p.latitude)]));
      if (centre) bounds.extend([centre.lng, centre.lat]);
      map.fitBounds(bounds, { padding: 64, maxZoom: 16, duration: 0 });
    } else if (withCoords.length === 1) {
      map.jumpTo({ center: [Number(withCoords[0].longitude), Number(withCoords[0].latitude)], zoom: 13 });
    } else if (centre) {
      map.jumpTo({ center: [centre.lng, centre.lat], zoom: 11 });
    }
  }, [ready, properties]); // eslint-disable-line react-hooks/exhaustive-deps

  // Highlight the pin of the card under the pointer.
  useEffect(() => {
    state.current.pins.forEach(({ el }, id) => el.classList.toggle('on', id === highlightId));
  }, [highlightId, ready, properties]);

  const searchHere = () => {
    const { map } = state.current;
    if (!map) return;
    const c = map.getCenter();
    const ne = map.getBounds().getNorthEast();
    const centrePoint = { lat: c.lat, lng: c.lng };
    const radiusKm = Math.min(200, Math.max(1, Math.round(distanceKm(centrePoint, { lat: ne.lat, lng: ne.lng }))));
    setMoved(false);
    onSearchArea?.({ lat: Number(centrePoint.lat.toFixed(5)), lng: Number(centrePoint.lng.toFixed(5)), radiusKm });
  };

  if (failed)
    return (
      <div className="sp-map sp-map-failed">
        <p>The map couldn't load. The list still shows every result.</p>
      </div>
    );
  return (
    <div className="sp-map">
      <div ref={el} className="sp-map-canvas" aria-label="Map of results" />
      {!ready && <div className="sp-map-loading">Loading map…</div>}
      {ready && moved && onSearchArea && (
        <button type="button" className="sp-map-redo" onClick={searchHere}>
          Search this area
        </button>
      )}
      {ready && withCoords.length < properties.length && (
        <p className="sp-map-note">
          {properties.length - withCoords.length} of these spaces{' '}
          {properties.length - withCoords.length === 1 ? 'has' : 'have'} no map pin and only appear in the list.
        </p>
      )}
    </div>
  );
}
