// Recently viewed spaces, kept on this device (no account needed); saved spaces come from the account.
// We store the search-result snapshot of each space so the lists render without another request.
import { useCallback, useEffect, useState } from 'react';
import type { Property } from '@/types';
import { useFavorites } from '@/features/favorites/Favorites';

const RECENT_KEY = 'lotnis_recent_spaces';
const RECENT_LIMIT = 8;
const CHANGED = 'lotnis-space-memory';

function read(key: string): Property[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function write(key: string, list: Property[]) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // Storage full or blocked (private mode): saving is a convenience, so carry on without it.
  }
  window.dispatchEvent(new Event(CHANGED));
}

/** Keep only what a card needs, so stored snapshots stay small. */
const snapshot = (p: Property): Property => ({
  id: p.id,
  name: p.name,
  tagline: p.tagline,
  sub_type: p.sub_type,
  category: p.category,
  city: p.city,
  formatted_address: p.formatted_address,
  price: p.price,
  pricing_period: p.pricing_period,
  currency: p.currency,
  rating: p.rating,
  review_count: p.review_count,
  verified: p.verified,
  property_images: (p.property_images ?? []).slice(0, 5),
  rooms: p.rooms,
  selected_amenities: p.selected_amenities,
  discount_label: p.discount_label,
  discount_type: p.discount_type,
  discount_value: p.discount_value,
  available_units: p.available_units,
  total_units: p.total_units,
  latitude: p.latitude,
  longitude: p.longitude,
});

function useStored(key: string) {
  const [list, setList] = useState<Property[]>(() => read(key));
  useEffect(() => {
    const sync = () => setList(read(key));
    window.addEventListener(CHANGED, sync);
    window.addEventListener('storage', sync); // other tabs
    return () => {
      window.removeEventListener(CHANGED, sync);
      window.removeEventListener('storage', sync);
    };
  }, [key]);
  return list;
}

/** Saved spaces live on the account (see features/favorites), so they follow the person across devices. */
export function useSavedSpaces() {
  const { has, toggle, ids } = useFavorites();
  const isSaved = useCallback((id: string) => has('property', id), [has]);
  const toggleSaved = useCallback((p: Property) => toggle('property', p.id), [toggle]);
  return { saved: ids('property'), isSaved, toggle: toggleSaved };
}

export function useRecentSpaces() {
  return useStored(RECENT_KEY);
}

export function rememberViewed(p: Property) {
  write(RECENT_KEY, [snapshot(p), ...read(RECENT_KEY).filter((s) => s.id !== p.id)].slice(0, RECENT_LIMIT));
}
