import { useEffect, useState } from 'react';
import { Building2, Ticket, UtensilsCrossed, Wrench } from 'lucide-react';
import { api } from '@/lib/api';
import { type LineKey } from '@/lib/lines';
import { eventApi, type EventCard } from '@/lib/api/events';
import type { Property } from '@/types';

export const IMAGES = '/images/landing';

export const LINE_ICON: Record<LineKey, typeof Building2> = {
  spaces: Building2,
  food: UtensilsCrossed,
  services: Wrench,
  events: Ticket,
};

export type Period = 'day' | 'week' | 'month' | 'year';
export const PERIODS: { value: Period; label: string }[] = [
  { value: 'day', label: 'Nightly' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
];

export const SPACE_TYPES = [
  { slug: 'apartment', label: 'Apartment' },
  { slug: 'house', label: 'House' },
  { slug: 'villa', label: 'Villa' },
  { slug: 'room', label: 'Room' },
  { slug: 'hotel', label: 'Hotel / hostel' },
  { slug: 'office', label: 'Office' },
  { slug: 'shop', label: 'Shop' },
  { slug: 'garage', label: 'Garage' },
  { slug: 'warehouse', label: 'Warehouse' },
  { slug: 'venue', label: 'Venue' },
];

export type StaySource = 'featured' | 'newest';

/** The next few events on sale. Quietly empty if events aren't available yet, so the page never breaks. */
export function useHomeEvents() {
  const [state, setState] = useState<{ events: EventCard[]; loading: boolean }>({ events: [], loading: true });
  useEffect(() => {
    let live = true;
    eventApi
      .list({ limit: 8 })
      .then((r) => live && setState({ events: r.data, loading: false }))
      .catch(() => live && setState({ events: [], loading: false }));
    return () => {
      live = false;
    };
  }, []);
  return state;
}

/** Featured stays, falling back to the newest approved stays when nothing is featured yet. */
export function useHomeStays() {
  const [state, setState] = useState<{ stays: Property[]; source: StaySource; loading: boolean }>({
    stays: [],
    source: 'featured',
    loading: true,
  });
  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<{ stays: Property[]; source: StaySource }> => {
      const featured = await api.getFeaturedProperties(8).catch(() => [] as Property[]);
      if (featured.length) return { stays: featured, source: 'featured' };
      const newest = await api
        .searchProperties(new URLSearchParams({ page: '1', limit: '8', sortBy: 'created_at', sortOrder: 'desc' }))
        .catch(() => null);
      return { stays: newest?.data || [], source: 'newest' };
    };
    load().then((result) => {
      if (!cancelled) setState({ ...result, loading: false });
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return state;
}
