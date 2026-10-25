// ─────────────────────────────────────────────────────────────────────────────
// places.ts — client side of the canonical place list.
//
// The list itself lives on the server (GET /api/catalog/options → locations) so the
// host form, the explore filters and the landing pages can never disagree. These
// helpers resolve whatever Google (or a user) calls a place to that list, using the
// same normalisation the server applies on save.
// ─────────────────────────────────────────────────────────────────────────────
import type { CatalogCity } from '@/types';

export const norm = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\b(metropolis|metropolitan|municipal|municipality|district|region|city)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export function indexCities(cities: CatalogCity[]) {
  const map = new Map<string, CatalogCity>();
  for (const c of cities) map.set(norm(c.name), c);
  for (const c of cities) for (const a of c.aliases) if (!map.has(norm(a))) map.set(norm(a), c);
  return map;
}

/** First candidate (locality, neighbourhood, district…) that is a known place. */
export function resolveCity(
  cities: CatalogCity[],
  candidates: Array<string | undefined | null>,
): CatalogCity | undefined {
  const index = indexCities(cities);
  for (const candidate of candidates) {
    const hit = candidate ? index.get(norm(candidate)) : undefined;
    if (hit) return hit;
  }
  return undefined;
}

export const findRegion = (regions: string[], value?: string | null) =>
  value ? regions.find((r) => norm(r) === norm(value)) : undefined;

export const GHANA_CENTER = { lat: 7.95, lng: -1.03 };
export const inGhana = (lat: number, lng: number) => lat >= 4.5 && lat <= 11.3 && lng >= -3.4 && lng <= 1.3;

export const mapsLink = (lat: number, lng: number) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
