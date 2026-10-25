import {
  BedDouble,
  Briefcase,
  Building2,
  Car,
  Home,
  Hotel,
  Landmark,
  PartyPopper,
  Store,
  Warehouse,
} from 'lucide-react';
import { cityBySlug } from '@/lib/seo/content';

export const PAGE_SIZE = 12;
export const TYPE_ICONS: Record<string, typeof Home> = {
  apartment: Building2,
  house: Home,
  villa: Landmark,
  room: BedDouble,
  hotel: Hotel,
  office: Briefcase,
  shop: Store,
  garage: Car,
  warehouse: Warehouse,
  venue: PartyPopper,
};
export const UNITS = [
  ['', 'Any'],
  ['day', 'Nightly'],
  ['week', 'Weekly'],
  ['month', 'Monthly'],
  ['year', 'Yearly'],
] as const;
export const SORTS: Record<string, { label: string; sortBy: string; sortOrder: string }> = {
  new: { label: 'Newest', sortBy: 'created_at', sortOrder: 'desc' },
  price_asc: { label: 'Price: low to high', sortBy: 'price', sortOrder: 'asc' },
  price_desc: { label: 'Price: high to low', sortBy: 'price', sortOrder: 'desc' },
  rating: { label: 'Top rated', sortBy: 'rating', sortOrder: 'desc' },
  nearest: { label: 'Nearest first', sortBy: 'nearest', sortOrder: 'asc' },
};
export const RADII = [2, 5, 10, 25, 50, 100];
export const PRESETS: Record<string, Array<[string, number | undefined, number | undefined]>> = {
  day: [
    ['Under 500', undefined, 500],
    ['500 – 1,000', 500, 1000],
    ['1,000+', 1000, undefined],
  ],
  week: [
    ['Under 1,500', undefined, 1500],
    ['1,500 – 4,000', 1500, 4000],
    ['4,000+', 4000, undefined],
  ],
  month: [
    ['Under 5,000', undefined, 5000],
    ['5,000 – 10,000', 5000, 10000],
    ['10,000+', 10000, undefined],
  ],
  year: [
    ['Under 30,000', undefined, 30000],
    ['30,000 – 60,000', 30000, 60000],
    ['60,000+', 60000, undefined],
  ],
};
export const unitWord: Record<string, string> = { day: 'nightly', week: 'weekly', month: 'monthly', year: 'yearly' };

export type Filters = {
  query: string;
  subType: string;
  city: string;
  pricingPeriod: string;
  minPrice: string;
  maxPrice: string;
  minRating: string;
  rooms: boolean;
  pets: boolean;
  parking: boolean;
  sort: string;
  page: number;
  lat: string;
  lng: string;
  radiusKm: string;
  near: string;
  view: 'grid' | 'map';
};

export function readFilters(params: URLSearchParams, typeSlug?: string, citySlug?: string): Filters {
  return {
    query: params.get('query') ?? '',
    subType: typeSlug ?? params.get('subType') ?? '',
    city: citySlug
      ? (cityBySlug(citySlug)?.name ??
        citySlug
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' '))
      : (params.get('city') ?? ''),
    pricingPeriod: params.get('pricingPeriod') ?? '',
    minPrice: params.get('minPrice') ?? '',
    maxPrice: params.get('maxPrice') ?? '',
    minRating: params.get('minRating') ?? '',
    rooms: params.get('allowsIndividualBookings') === 'true',
    pets: params.get('petFriendly') === 'true',
    parking: params.get('parkingAvailable') === 'true',
    sort: SORTS[params.get('sort') ?? ''] ? params.get('sort')! : 'new',
    page: Math.max(1, Number(params.get('page')) || 1),
    lat: params.get('lat') ?? '',
    lng: params.get('lng') ?? '',
    radiusKm: params.get('radiusKm') ?? '',
    near: params.get('near') ?? '',
    view: params.get('view') === 'map' ? 'map' : 'grid',
  };
}

export function toQuery(f: Filters, withPage = true): URLSearchParams {
  const p = new URLSearchParams();
  if (f.query.trim()) p.set('query', f.query.trim());
  if (f.subType) p.set('subType', f.subType);
  if (f.city) p.set('city', f.city);
  if (f.pricingPeriod) p.set('pricingPeriod', f.pricingPeriod);
  if (f.minPrice) p.set('minPrice', f.minPrice);
  if (f.maxPrice) p.set('maxPrice', f.maxPrice);
  if (f.minRating) p.set('minRating', f.minRating);
  if (f.rooms) p.set('allowsIndividualBookings', 'true');
  if (f.pets) p.set('petFriendly', 'true');
  if (f.parking) p.set('parkingAvailable', 'true');
  if (f.sort !== 'new') p.set('sort', f.sort);
  if (f.lat && f.lng) {
    p.set('lat', f.lat);
    p.set('lng', f.lng);
    p.set('radiusKm', f.radiusKm || '10');
    if (f.near) p.set('near', f.near);
  }
  if (f.view === 'map') p.set('view', 'map');
  if (withPage && f.page > 1) p.set('page', String(f.page));
  return p;
}
