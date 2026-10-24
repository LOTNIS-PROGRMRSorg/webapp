import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, LocateFixed, MapPin, TriangleAlert } from 'lucide-react';
import { loadMaps, mapsAuthFailed, mapsEnabled, mountPlaceSearch, reverseGeocode, type PickedPlace } from './maps';
import { findRegion, GHANA_CENTER, inGhana } from './places';
import type { CatalogOptions } from './types';

type Catalog = CatalogOptions['locations'];
const OTHER = '__other__';

export type LocationValue = {
  region: string; city: string; cityOther: string; area: string; street: string; postalCode: string;
  lat: number | null; lng: number | null; formatted: string;
};
export const emptyLocation: LocationValue = { region: '', city: '', cityOther: '', area: '', street: '', postalCode: '', lat: null, lng: null, formatted: '' };

const pinRequired = () => mapsEnabled && !mapsAuthFailed();

/** What the host must still fix, in plain words — or '' when the location is good. */
export function validateLocation(v: LocationValue): string {
  if (!v.region) return 'Choose the region of your property.';
  if (!v.city || (v.city === OTHER && !v.cityOther.trim())) return 'Choose the city or town of your property.';
  if (!v.street.trim()) return 'Enter the street address or the name of the building.';
  if (pinRequired() && (v.lat === null || v.lng === null)) return 'Pin your property on the map so guests can find it.';
  if (v.lat !== null && v.lng !== null && !inGhana(v.lat, v.lng)) return 'The map pin is outside Ghana — move it onto your property.';
  return '';
}

/** Shape the API expects (it re-normalises the same way, so both sides always agree). */
export function locationPayload(v: LocationValue) {
  const city = v.city === OTHER ? v.cityOther.trim() : v.city;
  return {
    streetAddress: v.street.trim(), city, state: v.region, country: 'Ghana', postalCode: v.postalCode || undefined,
    latitude: v.lat ?? undefined, longitude: v.lng ?? undefined,
    formatted: v.formatted || [v.street.trim(), v.area.trim(), city, v.region, 'Ghana'].filter(Boolean).join(', '),
  };
}

export function LocationPicker({ catalog, value, onChange }: { catalog: Catalog; value: LocationValue; onChange: (v: LocationValue) => void }) {
  const searchRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const marker = useRef<any>(null);
  const latest = useRef({ value, onChange, catalog });
  latest.current = { value, onChange, catalog };
  const [status, setStatus] = useState<'off' | 'loading' | 'ready' | 'error'>(mapsEnabled ? 'loading' : 'off');
  const [notice, setNotice] = useState('');

  const cities = useMemo(() => catalog.cities.filter((c) => c.region === value.region).sort((a, b) => a.name.localeCompare(b.name)), [catalog, value.region]);
  const set = (patch: Partial<LocationValue>) => onChange({ ...value, ...patch });

  // A picked place (from search, a map click or "use my location") fills every field consistently.
  const applyPlace = useCallback((p: PickedPlace) => {
    const { value: cur, onChange: emit, catalog: cat } = latest.current;
    const region = p.city?.region ?? findRegion(cat.regions, p.regionRaw) ?? cur.region;
    setNotice(p.city || region ? '' : 'We couldn\'t tell the region from that spot — please choose it below.');
    emit({
      ...cur, region, city: p.city ? p.city.name : (p.cityRaw ? OTHER : ''), cityOther: p.city ? '' : p.cityRaw,
      area: p.area || cur.area, street: p.streetAddress || cur.street, postalCode: p.postalCode || cur.postalCode,
      lat: p.latitude, lng: p.longitude, formatted: p.formatted || cur.formatted,
    });
  }, []);

  const placePin = useCallback(async (lat: number, lng: number) => {
    const { value: cur, onChange: emit, catalog: cat } = latest.current;
    emit({ ...cur, lat, lng });
    try { const place = await reverseGeocode(lat, lng, cat.cities); if (place) applyPlace({ ...place, latitude: lat, longitude: lng }); }
    catch { setNotice('The pin is set. We couldn\'t look up the address, so please check the fields below.'); }
  }, [applyPlace]);

  // Build the map and the search box once Google has loaded.
  useEffect(() => {
    if (!mapsEnabled) return;
    let cancelled = false; let stopSearch: (() => void) | undefined;
    const onAuthFail = () => setStatus('error');
    window.addEventListener('lotnis-maps-auth-failed', onAuthFail);
    loadMaps().then(async (google) => {
      if (cancelled || !mapRef.current || !searchRef.current) return;
      const { Map } = await google.maps.importLibrary('maps');
      const cur = latest.current.value;
      map.current = new Map(mapRef.current, {
        center: cur.lat !== null && cur.lng !== null ? { lat: cur.lat, lng: cur.lng } : GHANA_CENTER, zoom: cur.lat !== null ? 16 : 7,
        streetViewControl: false, mapTypeControl: false, fullscreenControl: true, gestureHandling: 'cooperative',
        restriction: { latLngBounds: { north: 11.4, south: 4.4, west: -3.5, east: 1.4 }, strictBounds: false },
      });
      marker.current = new google.maps.Marker({ map: map.current, draggable: true, position: cur.lat !== null && cur.lng !== null ? { lat: cur.lat, lng: cur.lng } : null, title: 'Your property' });
      marker.current.addListener('dragend', (e: any) => placePin(e.latLng.lat(), e.latLng.lng()));
      map.current.addListener('click', (e: any) => placePin(e.latLng.lat(), e.latLng.lng()));
      stopSearch = await mountPlaceSearch(searchRef.current, latest.current.catalog.cities, applyPlace);
      if (!cancelled) setStatus('ready');
    }).catch(() => !cancelled && setStatus('error'));
    return () => { cancelled = true; stopSearch?.(); window.removeEventListener('lotnis-maps-auth-failed', onAuthFail); };
  }, [applyPlace, placePin]);

  // Keep the pin in step with the form, and help the host find their area when they pick a city first.
  useEffect(() => {
    if (!map.current || !marker.current) return;
    if (value.lat !== null && value.lng !== null) {
      const pos = { lat: value.lat, lng: value.lng };
      marker.current.setPosition(pos); marker.current.setMap(map.current);
      map.current.panTo(pos); if ((map.current.getZoom() ?? 0) < 14) map.current.setZoom(16);
    } else {
      const city = catalog.cities.find((c) => c.name === value.city);
      if (city) { map.current.panTo({ lat: city.lat, lng: city.lng }); map.current.setZoom(12); }
      marker.current.setMap(null);
    }
  }, [value.lat, value.lng, value.city, catalog.cities]);

  const locateMe = () => {
    if (!navigator.geolocation) { setNotice('Your browser can\'t share its location.'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => (mapsEnabled ? placePin(pos.coords.latitude, pos.coords.longitude) : set({ lat: pos.coords.latitude, lng: pos.coords.longitude })),
      () => setNotice('We couldn\'t get your location — allow location access, or search for the address instead.'),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const mapsOn = mapsEnabled && status !== 'error';
  const pinned = value.lat !== null && value.lng !== null;

  return (
    <div className="loc">
      {mapsOn && <>
        <div className="loc-search"><MapPin size={18} /><div ref={searchRef} className="loc-search-host" /></div>
        <div className="loc-map-wrap">
          <div ref={mapRef} className="loc-map" aria-label="Map — click or drag the pin to your property's entrance" />
          {status === 'loading' && <div className="loc-map-loading">Loading map…</div>}
          <button type="button" className="loc-locate" onClick={locateMe}><LocateFixed size={16} /> I'm at the property</button>
        </div>
        <p className={`loc-pin ${pinned ? 'ok' : 'todo'}`}>{pinned ? <><CheckCircle2 size={16} /> Pinned — drag the pin to fine-tune the exact entrance.</> : <><TriangleAlert size={16} /> Search for the address, or click the map to drop a pin.</>}</p>
      </>}
      {status === 'error' && mapsEnabled && <p className="loc-pin todo"><TriangleAlert size={16} /> The map couldn't load, so choose the location below.</p>}
      {notice && <p className="loc-pin todo"><TriangleAlert size={16} /> {notice}</p>}

      <div className="form-grid loc-fields">
        <label>Region
          <select value={value.region} onChange={(e) => set({ region: e.target.value, city: '', cityOther: '' })} required>
            <option value="" disabled>Choose a region…</option>
            {catalog.regions.map((r) => <option key={r}>{r}</option>)}
          </select>
        </label>
        <label>City / town
          <select value={value.city} onChange={(e) => set({ city: e.target.value, cityOther: '' })} disabled={!value.region} required>
            <option value="" disabled>{value.region ? 'Choose a city or town…' : 'Choose a region first'}</option>
            {cities.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}
            {value.region && <option value={OTHER}>Another town…</option>}
          </select>
        </label>
        {value.city === OTHER && <label>Town name<input value={value.cityOther} onChange={(e) => set({ cityOther: e.target.value })} placeholder="e.g. New Abirem" required /></label>}
        <label>Area / neighbourhood<input value={value.area} onChange={(e) => set({ area: e.target.value })} placeholder="e.g. Osu, Santasi (optional)" /></label>
        <label className="loc-wide">Street address or building name<input value={value.street} onChange={(e) => set({ street: e.target.value })} required placeholder="e.g. 12 Oxford Street, or Palm Court Block B" /></label>
      </div>
      {!mapsEnabled && <button type="button" className="button button-quiet loc-fallback-locate" onClick={locateMe}><LocateFixed size={16} /> Use my current location as the pin</button>}
      {!mapsEnabled && pinned && <p className="loc-pin ok"><CheckCircle2 size={16} /> Location saved ({value.lat?.toFixed(4)}, {value.lng?.toFixed(4)}).</p>}
    </div>
  );
}
