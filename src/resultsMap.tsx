import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadMaps, mapsEnabled } from './maps';
import { GHANA_CENTER } from './places';
import { startingPrice } from './shared';
import { primaryImage } from './format';
import type { Property } from './types';

/** Listings as pins on a Google map. Info cards are built with DOM text (never HTML strings),
 *  because listing names and addresses are written by hosts. */
export function ResultsMap({ properties, centre }: { properties: Property[]; centre?: { lat: number; lng: number } | null }) {
  const el = useRef<HTMLDivElement>(null);
  const state = useRef<{ map?: any; markers: any[]; info?: any }>({ markers: [] });
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const withCoords = properties.filter((p) => p.latitude != null && p.longitude != null);

  useEffect(() => {
    if (!mapsEnabled || !el.current) return;
    let live = true;
    loadMaps().then(async (google) => {
      if (!live || !el.current) return;
      const { Map } = await google.maps.importLibrary('maps');
      state.current.map = new Map(el.current, { center: centre ?? GHANA_CENTER, zoom: centre ? 11 : 7, streetViewControl: false, mapTypeControl: false, gestureHandling: 'cooperative' });
      state.current.info = new google.maps.InfoWindow();
      setReady(true);
    }).catch(() => live && setFailed(true));
    return () => { live = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const { map, info } = state.current;
    if (!ready || !map) return;
    const google = (window as any).google;
    state.current.markers.forEach((m) => m.setMap(null));
    state.current.markers = withCoords.map((p) => {
      const marker = new google.maps.Marker({ map, position: { lat: Number(p.latitude), lng: Number(p.longitude) }, title: p.name });
      marker.addListener('click', () => {
        const card = document.createElement('div'); card.style.cssText = 'font:14px system-ui;max-width:220px;display:grid;gap:4px';
        const img = primaryImage(p);
        if (img) { const i = document.createElement('img'); i.src = img; i.alt = ''; i.style.cssText = 'width:100%;height:110px;object-fit:cover;border-radius:8px'; card.appendChild(i); }
        const t = document.createElement('strong'); t.textContent = p.name;
        const m = document.createElement('span'); m.textContent = `${startingPrice(p)}${p.distance_km != null ? ` · ${p.distance_km} km away` : ''}`;
        const a = document.createElement('a'); a.href = `/stays/${p.id}`; a.textContent = 'View space →'; a.style.cssText = 'font-weight:600;color:#173b37';
        card.append(t, m, a); info.setContent(card); info.open({ map, anchor: marker });
      });
      return marker;
    });
    if (withCoords.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      withCoords.forEach((p) => bounds.extend({ lat: Number(p.latitude), lng: Number(p.longitude) }));
      if (centre) bounds.extend(centre);
      map.fitBounds(bounds, 60);
    } else if (withCoords.length === 1) { map.setCenter({ lat: Number(withCoords[0].latitude), lng: Number(withCoords[0].longitude) }); map.setZoom(14); }
  }, [ready, properties]); // eslint-disable-line react-hooks/exhaustive-deps

  if (failed) return <div className="empty-state">The map couldn't load. <Link to="/explore">Switch to the list</Link>.</div>;
  return (
    <div className="ex-mapwrap">
      <div ref={el} className="ex-map" aria-label="Map of results" />
      {!ready && <div className="loc-map-loading">Loading map…</div>}
      {ready && withCoords.length < properties.length && <p className="ex-map-note">{properties.length - withCoords.length} result(s) have no map pin and are only in the list.</p>}
    </div>
  );
}
