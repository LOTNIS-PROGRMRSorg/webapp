// ─────────────────────────────────────────────────────────────────────────────
// maps.ts — MapLibre GL (free, open source) drawing MapTiler maps, plus MapTiler's address search.
//
// Needs VITE_MAPTILER_KEY (a MapTiler Cloud key; its free plan covers development, and paid use is
// priced per request, well below Google). Without a key the map is simply off: hosts pick region and
// town from the shared list, and searching still works from the list view.
// ─────────────────────────────────────────────────────────────────────────────
import { resolveCity } from '@/lib/maps/places';
import type { CatalogCity } from '@/types';

const KEY = (import.meta.env.VITE_MAPTILER_KEY as string | undefined)?.trim();
export const mapsEnabled = Boolean(KEY);

let authFailed = false;
export const mapsAuthFailed = () => authFailed;
const reportAuthFailure = () => {
  if (authFailed) return;
  authFailed = true;
  window.dispatchEvent(new Event('lotnis-maps-auth-failed'));
};

export type MapLibre = typeof import('maplibre-gl');
let loader: Promise<MapLibre> | null = null;

/** Loads the map library on demand, so pages without a map never download it. */
export function loadMaps(): Promise<MapLibre> {
  if (!KEY) return Promise.reject(new Error('Maps are not configured'));
  loader ??= Promise.all([import('maplibre-gl'), import('maplibre-gl/dist/maplibre-gl.css')])
    .then(([mod]) => ((mod as { default?: MapLibre }).default ?? mod) as MapLibre)
    .catch((e) => {
      loader = null;
      throw e;
    });
  return loader;
}

const STYLE = () => `https://api.maptiler.com/maps/streets-v2/style.json?key=${encodeURIComponent(KEY ?? '')}`;

/** A map on `container`, using the shared style; a key MapTiler refuses is reported like any other map failure. */
export function createMap(
  lib: MapLibre,
  container: HTMLElement,
  opts: { center: { lat: number; lng: number }; zoom: number; interactive?: boolean; scrollZoom?: boolean },
) {
  const map = new lib.Map({
    container,
    style: STYLE(),
    center: [opts.center.lng, opts.center.lat],
    zoom: opts.zoom,
    attributionControl: { compact: true },
    interactive: opts.interactive ?? true,
    cooperativeGestures: opts.scrollZoom === false,
    maxBounds: [
      [-6, 3],
      [3.5, 12.5],
    ],
  } as ConstructorParameters<MapLibre['Map']>[0]);
  map.on('error', (e: { error?: { status?: number } }) => {
    if (e.error?.status === 401 || e.error?.status === 403) reportAuthFailure();
  });
  return map;
}

/** A GeoJSON polygon approximating a circle, for "about this area" and a provider's service radius. */
export function circlePolygon(lat: number, lng: number, radiusMeters: number, steps = 64) {
  const dLat = radiusMeters / 111_320;
  const dLng = radiusMeters / (111_320 * Math.cos((lat * Math.PI) / 180));
  const ring = Array.from({ length: steps + 1 }, (_, i) => {
    const a = (i / steps) * 2 * Math.PI;
    return [lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)];
  });
  return { type: 'Feature' as const, properties: {}, geometry: { type: 'Polygon' as const, coordinates: [ring] } };
}

/** Draws (or redraws) a filled, outlined circle on the map once its style is ready. */
export function drawCircle(
  map: any,
  id: string,
  lat: number,
  lng: number,
  radiusMeters: number,
  colors: { line: string; fill: string; fillOpacity: number; lineOpacity?: number },
) {
  const apply = () => {
    const data = circlePolygon(lat, lng, radiusMeters);
    const source = map.getSource(id);
    if (source) return source.setData(data);
    map.addSource(id, { type: 'geojson', data });
    map.addLayer({
      id: `${id}-fill`,
      type: 'fill',
      source: id,
      paint: { 'fill-color': colors.fill, 'fill-opacity': colors.fillOpacity },
    });
    map.addLayer({
      id: `${id}-line`,
      type: 'line',
      source: id,
      paint: { 'line-color': colors.line, 'line-width': 2, 'line-opacity': colors.lineOpacity ?? 0.9 },
    });
  };
  if (map.isStyleLoaded()) apply();
  else map.once('load', apply);
}

export function removeCircle(map: any, id: string) {
  for (const layer of [`${id}-fill`, `${id}-line`]) if (map.getLayer(layer)) map.removeLayer(layer);
  if (map.getSource(id)) map.removeSource(id);
}

/** An HTML pin anchored at a point: a zero-size wrapper at the coordinate, with the pin drawn above it. */
export function htmlMarker(lib: MapLibre, map: any, el: HTMLElement, lat: number, lng: number) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'width:0;height:0;';
  wrap.appendChild(el);
  return new lib.Marker({ element: wrap, anchor: 'top-left' }).setLngLat([lng, lat]).addTo(map);
}

// ── Address search (MapTiler Geocoding) ──────────────────────────────────────
export type PickedPlace = {
  streetAddress: string;
  area: string;
  cityRaw: string;
  city?: CatalogCity;
  regionRaw: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  formatted: string;
};

type Ctx = { id?: string; text?: string };
const ctxOf = (context: Ctx[] = [], ...kinds: string[]) => {
  for (const k of kinds) {
    const hit = context.find((c) => c.id?.split('.')[0] === k);
    if (hit?.text) return hit.text;
  }
  return '';
};

/** One MapTiler feature → the fields Lotnis stores. A place's own name counts as its town when it is one. */
export function parseFeature(f: any, cities: CatalogCity[]): PickedPlace {
  const [lng, lat] = f.center ?? f.geometry?.coordinates ?? [0, 0];
  const type: string = (f.place_type ?? [])[0] ?? '';
  const ctx: Ctx[] = [...(f.context ?? [])];
  // the feature itself is the most specific level, so it joins the list its own type names
  ctx.unshift({ id: `${type}.self`, text: f.text });
  const area = ctxOf(ctx, 'neighbourhood', 'neighborhood', 'suburb', 'locality', 'municipal_district');
  const locality = ctxOf(ctx, 'place', 'municipality', 'joint_municipality', 'city');
  const county = ctxOf(ctx, 'county', 'district');
  const city = resolveCity(cities, [locality, area, county, f.text]);
  const street = type === 'address' ? [f.address, f.text].filter(Boolean).join(' ') : '';
  return {
    streetAddress: street,
    area,
    cityRaw: city?.name ?? (locality || county),
    city,
    regionRaw: ctxOf(ctx, 'region', 'state'),
    postalCode: ctxOf(ctx, 'postal_code', 'postcode'),
    latitude: lat,
    longitude: lng,
    formatted: f.place_name ?? f.text ?? '',
  };
}

const GEOCODE = 'https://api.maptiler.com/geocoding';
async function geocodeRequest(path: string, params: Record<string, string>) {
  const url = `${GEOCODE}/${path}.json?${new URLSearchParams({ key: KEY ?? '', language: 'en', ...params })}`;
  const res = await fetch(url);
  if (res.status === 401 || res.status === 403) {
    reportAuthFailure();
    throw new Error('Map search is not authorised');
  }
  if (!res.ok) throw new Error('Map search failed');
  return (await res.json()) as { features?: any[] };
}

export async function reverseGeocode(lat: number, lng: number, cities: CatalogCity[]): Promise<PickedPlace | null> {
  const { features = [] } = await geocodeRequest(`${lng},${lat}`, { limit: '5' });
  const best = features.find((f) => ['address', 'poi'].includes(f.place_type?.[0])) ?? features[0];
  if (!best) return null;
  const place = parseFeature(best, cities);
  // merge the broader levels (town, region) from the other results when the best hit lacks them
  for (const f of features) {
    const p = parseFeature(f, cities);
    place.area ||= p.area;
    place.city ||= p.city;
    place.cityRaw ||= p.cityRaw;
    place.regionRaw ||= p.regionRaw;
    place.postalCode ||= p.postalCode;
  }
  return { ...place, latitude: lat, longitude: lng };
}

/** An address box with suggestions, mounted into `host`. Calls onPick with a normalised place; returns a cleanup. */
export async function mountPlaceSearch(
  host: HTMLElement,
  cities: CatalogCity[],
  onPick: (p: PickedPlace) => void,
  placeholder = 'Search for the address or area',
): Promise<() => void> {
  const input = document.createElement('input');
  input.type = 'search';
  input.className = 'loc-ac-input';
  input.placeholder = placeholder;
  input.autocomplete = 'off';
  input.setAttribute('aria-label', placeholder);
  const list = document.createElement('ul');
  list.className = 'loc-ac-list';
  list.hidden = true;
  host.append(input, list);

  let timer = 0;
  let seq = 0;
  const close = () => {
    list.hidden = true;
    list.replaceChildren();
  };
  const run = async () => {
    const q = input.value.trim();
    if (q.length < 3) return close();
    const mine = ++seq;
    try {
      const { features = [] } = await geocodeRequest(encodeURIComponent(q), {
        country: 'gh',
        limit: '6',
        autocomplete: 'true',
      });
      if (mine !== seq) return;
      list.replaceChildren(
        ...features.map((f) => {
          const li = document.createElement('li');
          const b = document.createElement('button');
          b.type = 'button';
          const name = document.createElement('b');
          name.textContent = f.text ?? '';
          const rest = document.createElement('small');
          rest.textContent = String(f.place_name ?? '').replace(
            new RegExp(`^${String(f.text ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')},?\\s*`),
            '',
          );
          b.append(name, rest);
          b.addEventListener('click', () => {
            input.value = f.place_name ?? '';
            close();
            onPick(parseFeature(f, cities));
          });
          li.appendChild(b);
          return li;
        }),
      );
      list.hidden = features.length === 0;
    } catch {
      close();
    }
  };
  const onInput = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(run, 250);
  };
  const onDocClick = (e: MouseEvent) => {
    if (!host.contains(e.target as Node)) close();
  };
  input.addEventListener('input', onInput);
  document.addEventListener('click', onDocClick);
  return () => {
    window.clearTimeout(timer);
    document.removeEventListener('click', onDocClick);
    input.remove();
    list.remove();
  };
}
