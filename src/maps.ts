// ─────────────────────────────────────────────────────────────────────────────
// maps.ts — loads Google Maps on demand and turns a Google place into Lotnis fields.
//
// Needs VITE_GOOGLE_MAPS_API_KEY with these APIs enabled: Maps JavaScript API,
// Places API (New) and Geocoding API. Without a key everything falls back to the
// region/city pickers, so hosting and searching still work (just without a map).
// ─────────────────────────────────────────────────────────────────────────────
import { resolveCity } from './places';
import type { CatalogCity } from './types';

const KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim();
export const mapsEnabled = Boolean(KEY);

type G = any; // the Google Maps namespace is loaded at runtime; its types are not bundled
let loader: Promise<G> | null = null;
let authFailed = false;
export const mapsAuthFailed = () => authFailed;

export function loadMaps(): Promise<G> {
  if (!KEY) return Promise.reject(new Error('Google Maps is not configured'));
  if (loader) return loader;
  loader = new Promise((resolve, reject) => {
    const w = window as any;
    if (w.google?.maps?.importLibrary) { resolve(w.google); return; }
    w.__lotnisMapsReady = () => resolve(w.google);
    w.gm_authFailure = () => { authFailed = true; window.dispatchEvent(new Event('lotnis-maps-auth-failed')); };
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(KEY)}&v=weekly&loading=async&language=en&region=GH&callback=__lotnisMapsReady`;
    script.async = true;
    script.onerror = () => { loader = null; reject(new Error('Google Maps failed to load')); };
    document.head.appendChild(script);
  });
  return loader;
}

export type PickedPlace = {
  streetAddress: string; area: string; cityRaw: string; city?: CatalogCity; regionRaw: string; postalCode: string;
  latitude: number; longitude: number; formatted: string;
};

type Comp = { types: string[]; long: string; short: string };
// Geocoder results use long_name/short_name; the newer Place class uses longText/shortText.
const comps = (list: any[] = []): Comp[] => list.map((c) => ({ types: c.types ?? [], long: c.long_name ?? c.longText ?? '', short: c.short_name ?? c.shortText ?? '' }));
const pick = (list: Comp[], ...types: string[]) => { for (const t of types) { const hit = list.find((c) => c.types.includes(t)); if (hit) return hit.long; } return ''; };

export function parsePlace(rawComponents: any[], lat: number, lng: number, formatted: string, cities: CatalogCity[]): PickedPlace {
  const c = comps(rawComponents);
  const locality = pick(c, 'locality');
  const area = pick(c, 'sublocality_level_1', 'sublocality', 'neighborhood', 'sublocality_level_2');
  const district = pick(c, 'administrative_area_level_2');
  // Try the most specific name first; any of them can be a known place (e.g. Osu → Accra).
  const city = resolveCity(cities, [locality, area, district, pick(c, 'administrative_area_level_3')]);
  return {
    streetAddress: [pick(c, 'street_number'), pick(c, 'route')].filter(Boolean).join(' '),
    area, cityRaw: city?.name ?? (locality || district), city,
    regionRaw: pick(c, 'administrative_area_level_1'), postalCode: pick(c, 'postal_code'),
    latitude: lat, longitude: lng, formatted,
  };
}

export async function reverseGeocode(lat: number, lng: number, cities: CatalogCity[]): Promise<PickedPlace | null> {
  const google = await loadMaps();
  const { Geocoder } = await google.maps.importLibrary('geocoding');
  const { results } = await new Geocoder().geocode({ location: { lat, lng } });
  const best = results?.find((r: any) => r.types?.some((t: string) => ['street_address', 'premise', 'route', 'neighborhood', 'sublocality'].includes(t))) ?? results?.[0];
  return best ? parsePlace(best.address_components, lat, lng, best.formatted_address, cities) : null;
}

/** Mounts Google's place search into `host`; calls onPick with a normalised place. Returns a cleanup. */
export async function mountPlaceSearch(host: HTMLElement, cities: CatalogCity[], onPick: (p: PickedPlace) => void, placeholder = 'Search for the address or area'): Promise<() => void> {
  const google = await loadMaps();
  const { PlaceAutocompleteElement } = await google.maps.importLibrary('places');
  const el = new PlaceAutocompleteElement({ componentRestrictions: { country: ['gh'] } });
  try { el.setAttribute('placeholder', placeholder); (el as any).placeholder = placeholder; } catch { /* older builds have no placeholder */ }
  host.appendChild(el);
  const handle = async (place: any) => {
    await place.fetchFields({ fields: ['addressComponents', 'location', 'formattedAddress', 'displayName'] });
    const loc = place.location; if (!loc) return;
    onPick(parsePlace(place.addressComponents, loc.lat(), loc.lng(), place.formattedAddress ?? place.displayName ?? '', cities));
  };
  const onSelect = (e: any) => handle(e.placePrediction ? e.placePrediction.toPlace() : e.place);   // "gmp-select" (current) / "gmp-placeselect" (older)
  el.addEventListener('gmp-select', onSelect);
  el.addEventListener('gmp-placeselect', onSelect);
  return () => { el.removeEventListener('gmp-select', onSelect); el.removeEventListener('gmp-placeselect', onSelect); el.remove(); };
}
