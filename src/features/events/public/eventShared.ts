export const errText = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

/** A Google Maps link for the venue — exact pin when we have coordinates, otherwise a search. */
export const mapsUrl = (ev: { latitude?: number | null; longitude?: number | null; venue_name: string; city: string }) =>
  ev.latitude && ev.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${ev.latitude},${ev.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${ev.venue_name} ${ev.city} Ghana`)}`;
