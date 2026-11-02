import { request } from '@/lib/api';

export type FavoriteType = 'event' | 'property';
export type FavoriteIds = Record<FavoriteType, string[]>;

export const favoritesApi = {
  ids: () => request<FavoriteIds>('/favorites'),
  add: (type: FavoriteType, id: string) => request<{ favorited: true }>(`/favorites/${type}/${id}`, { method: 'PUT' }),
  remove: (type: FavoriteType, id: string) =>
    request<{ favorited: false }>(`/favorites/${type}/${id}`, { method: 'DELETE' }),
};
