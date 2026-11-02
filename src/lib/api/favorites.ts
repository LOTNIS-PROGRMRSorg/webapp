import { request } from '@/lib/api';
import type { EventCard } from '@/lib/api/events';
import type { Property } from '@/types';

export type FavoriteType = 'event' | 'property';
export type FavoriteIds = Record<FavoriteType, string[]>;

export const favoritesApi = {
  /** Saved events and spaces with everything a card needs. */
  items: () => request<{ events: EventCard[]; properties: Property[] }>('/favorites/items'),
  ids: () => request<FavoriteIds>('/favorites'),
  add: (type: FavoriteType, id: string) => request<{ favorited: true }>(`/favorites/${type}/${id}`, { method: 'PUT' }),
  remove: (type: FavoriteType, id: string) =>
    request<{ favorited: false }>(`/favorites/${type}/${id}`, { method: 'DELETE' }),
};
