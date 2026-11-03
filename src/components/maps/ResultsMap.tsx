import { colors } from '@/theme';
import { useEffect, useRef, useState } from 'react';
import { loadMaps, mapsAuthFailed, mapsEnabled } from '@/lib/maps/maps';
import { GHANA_CENTER } from '@/lib/maps/places';
import { primaryImage } from '@/lib/format';
import { resizedPhoto } from '@/lib/images';
import type { Property } from '@/types';

type G = any; // Google Maps types are loaded at runtime, not bundled

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

// HTML price pins drawn in an overlay, so they can be styled and highlighted without a cloud map ID.
let PinClass: any;
function pinClass(google: G) {
  if (PinClass) return PinClass;
  PinClass = class extends google.maps.OverlayView {
    position: any;
    el: HTMLButtonElement;
    constructor(position: any, el: HTMLButtonElement) {
      super();
      this.position = position;
      this.el = el;
    }
    onAdd() {
      this.getPanes().overlayMouseTarget.appendChild(this.el);
    }
    draw() {
      const point = this.getProjection()?.fromLatLngToDivPixel(this.position);
      if (point) {
        this.el.style.left = `${point.x}px`;
        this.el.style.top = `${point.y}px`;
      }
    }
    onRemove() {
      this.el.remove();
    }
  };
  return PinClass;
}

/** Info card built with DOM text (never HTML strings), because names and addresses are written by hosts. */
function infoCard(p: Property) {
  const card = document.createElement('a');
  card.href = `/stays/${p.id}`;
  card.className = 'sp-mapcard';
  const img = primaryImage(p);
  if (img) {
    const i = document.createElement('img');
    i.src = resizedPhoto(img, 640);
    i.onerror = () => {
      i.onerror = null;
      i.src = img;
    };
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
  /** Called when Google Maps can't be used (bad key, blocked script), so the page can show the list alone. */
  onUnavailable?: () => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const state = useRef<{ map?: G; info?: G; pins: Map<string, { overlay: G; el: HTMLButtonElement }>; auto: boolean }>({
    pins: new Map(),
    auto: false,
  });
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [moved, setMoved] = useState(false);
  const withCoords = properties.filter((p) => p.latitude != null && p.longitude != null);

  // Google reports a rejected key after the script loads; treat it like a failed load.
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
      .then(async (google) => {
        if (!live || !el.current) return;
        const { Map } = await google.maps.importLibrary('maps');
        const map = new Map(el.current, {
          center: centre ?? GHANA_CENTER,
          zoom: centre ? 11 : 7,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          gestureHandling: 'greedy',
          styles: [
            { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
            { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
          ],
        });
        state.current.map = map;
        state.current.info = new google.maps.InfoWindow({ disableAutoPan: false });
        // Only moves the person makes count; our own fitBounds/setCenter calls set `auto` first.
        map.addListener('dragstart', () => setMoved(true));
        map.addListener('zoom_changed', () => {
          if (!state.current.auto) setMoved(true);
        });
        map.addListener('idle', () => {
          state.current.auto = false;
        });
        setReady(true);
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
    const { map, info, pins } = state.current;
    if (!ready || !map) return;
    const google = (window as any).google;
    const Pin = pinClass(google);
    pins.forEach(({ overlay }) => overlay.setMap(null));
    pins.clear();
    for (const p of withCoords) {
      const position = new google.maps.LatLng(Number(p.latitude), Number(p.longitude));
      const pin = document.createElement('button');
      pin.type = 'button';
      pin.className = 'sp-pin';
      pin.textContent = pinPrice(p);
      pin.setAttribute('aria-label', `${p.name}, ${pinPrice(p)}`);
      pin.addEventListener('mouseenter', () => onHover?.(p.id));
      pin.addEventListener('mouseleave', () => onHover?.(null));
      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        info.setContent(infoCard(p));
        info.setPosition(position);
        info.setOptions({ pixelOffset: new google.maps.Size(0, -16) });
        info.open({ map });
      });
      const overlay = new Pin(position, pin);
      overlay.setMap(map);
      pins.set(p.id, { overlay, el: pin });
    }
    state.current.auto = true;
    setMoved(false);
    if (withCoords.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      withCoords.forEach((p) => bounds.extend({ lat: Number(p.latitude), lng: Number(p.longitude) }));
      if (centre) bounds.extend(centre);
      map.fitBounds(bounds, 64);
    } else if (withCoords.length === 1) {
      map.setCenter({ lat: Number(withCoords[0].latitude), lng: Number(withCoords[0].longitude) });
      map.setZoom(14);
    } else if (centre) {
      map.setCenter(centre);
      map.setZoom(12);
    }
  }, [ready, properties]); // eslint-disable-line react-hooks/exhaustive-deps

  // Highlight the pin of the card under the pointer.
  useEffect(() => {
    state.current.pins.forEach(({ el }, id) => el.classList.toggle('on', id === highlightId));
  }, [highlightId, ready, properties]);

  const searchHere = () => {
    const { map } = state.current;
    const c = map?.getCenter();
    const ne = map?.getBounds()?.getNorthEast();
    if (!c || !ne) return;
    const centrePoint = { lat: c.lat(), lng: c.lng() };
    const radiusKm = Math.min(200, Math.max(1, Math.round(distanceKm(centrePoint, { lat: ne.lat(), lng: ne.lng() }))));
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
