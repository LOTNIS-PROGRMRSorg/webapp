import {
  BedDouble,
  Briefcase,
  Building2,
  Car,
  Cctv,
  DoorOpen,
  Droplets,
  Gauge,
  Home,
  Hotel,
  Landmark,
  LayoutGrid,
  Moon,
  PartyPopper,
  PawPrint,
  ShieldCheck,
  Store,
  Warehouse,
  Wifi,
  Zap,
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
// The search API can only sort by these columns (see SORT_COLUMNS in the backend's browse routes).
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

// ── What the space is for ───────────────────────────────────────────────────
// Each tab is a shortcut for filters the search API already understands. "Homes" uses the
// residential category; "Short stays" is anything priced per night; the rest are single types.
export type IntentKey = 'all' | 'homes' | 'stays' | 'office' | 'shop' | 'warehouse' | 'venue';
export const INTENTS: Array<{ key: IntentKey; label: string; icon: typeof Home; patch: Partial<Filters> }> = [
  { key: 'all', label: 'All', icon: LayoutGrid, patch: {} },
  { key: 'homes', label: 'Homes', icon: Home, patch: { category: 'residential' } },
  { key: 'stays', label: 'Short stays', icon: Moon, patch: { pricingPeriod: 'day' } },
  { key: 'office', label: 'Offices', icon: Briefcase, patch: { subType: 'office' } },
  { key: 'shop', label: 'Shops', icon: Store, patch: { subType: 'shop' } },
  { key: 'warehouse', label: 'Warehouses', icon: Warehouse, patch: { subType: 'warehouse' } },
  { key: 'venue', label: 'Venues', icon: PartyPopper, patch: { subType: 'venue' } },
];

export function intentOf(f: Filters): IntentKey | null {
  if (f.subType) return (INTENTS.find((i) => i.patch.subType === f.subType)?.key as IntentKey) ?? null;
  if (f.category === 'residential') return 'homes';
  if (f.category) return null;
  if (f.pricingPeriod === 'day') return 'stays';
  return 'all';
}

/** Filters to apply when a tab is picked: clear the other tabs' filters, then add this tab's. */
export function intentPatch(key: IntentKey, f: Filters): Partial<Filters> {
  const reset: Partial<Filters> = { subType: '', category: '' };
  // Leaving "Short stays" also drops its nightly filter (and any nightly budget).
  if (intentOf(f) === 'stays' && key !== 'stays')
    Object.assign(reset, { pricingPeriod: '', minPrice: '', maxPrice: '' });
  return { ...reset, ...INTENTS.find((i) => i.key === key)!.patch };
}

// ── Power, water and security ───────────────────────────────────────────────
// Amenity keys are chosen by hosts in the mobile app. These are the keys seen on live listings;
// the search API returns spaces that have every key asked for.
export const ESSENTIALS: Array<{ key: string; label: string; icon: typeof Home; tone?: 'power' | 'water' | 'safe' }> = [
  { key: 'backup_generator', label: 'Backup power', icon: Zap, tone: 'power' },
  { key: 'borehole_water', label: 'Borehole water', icon: Droplets, tone: 'water' },
  { key: 'prepaid_meter', label: 'Prepaid meter', icon: Gauge },
  { key: 'security_guard', label: 'Security guard', icon: ShieldCheck, tone: 'safe' },
  { key: 'cctv', label: 'CCTV', icon: Cctv, tone: 'safe' },
  { key: 'wifi_common', label: 'Wi-Fi', icon: Wifi },
];
export const essentialByKey = (key: string) => ESSENTIALS.find((e) => e.key === key);

export const EXTRAS: Array<{ key: 'parking' | 'pets' | 'rooms'; label: string; icon: typeof Home }> = [
  { key: 'parking', label: 'Parking', icon: Car },
  { key: 'pets', label: 'Pet friendly', icon: PawPrint },
  { key: 'rooms', label: 'Book a single room', icon: DoorOpen },
];

export type Filters = {
  query: string;
  subType: string;
  category: string;
  city: string;
  pricingPeriod: string;
  minPrice: string;
  maxPrice: string;
  minRating: string;
  amenities: string[];
  rooms: boolean;
  pets: boolean;
  parking: boolean;
  sort: string;
  page: number;
  lat: string;
  lng: string;
  radiusKm: string;
  near: string;
};

export function readFilters(params: URLSearchParams, typeSlug?: string, citySlug?: string): Filters {
  return {
    query: params.get('query') ?? '',
    subType: typeSlug ?? params.get('subType') ?? '',
    category: params.get('category') ?? '',
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
    amenities: (params.get('amenities') ?? '').split(',').filter(Boolean),
    rooms: params.get('allowsIndividualBookings') === 'true',
    pets: params.get('petFriendly') === 'true',
    parking: params.get('parkingAvailable') === 'true',
    sort: SORTS[params.get('sort') ?? ''] ? params.get('sort')! : 'new',
    page: Math.max(1, Number(params.get('page')) || 1),
    lat: params.get('lat') ?? '',
    lng: params.get('lng') ?? '',
    radiusKm: params.get('radiusKm') ?? '',
    near: params.get('near') ?? '',
  };
}

export function toQuery(f: Filters, withPage = true): URLSearchParams {
  const p = new URLSearchParams();
  if (f.query.trim()) p.set('query', f.query.trim());
  if (f.subType) p.set('subType', f.subType);
  if (f.category) p.set('category', f.category);
  if (f.city) p.set('city', f.city);
  if (f.pricingPeriod) p.set('pricingPeriod', f.pricingPeriod);
  if (f.minPrice) p.set('minPrice', f.minPrice);
  if (f.maxPrice) p.set('maxPrice', f.maxPrice);
  if (f.minRating) p.set('minRating', f.minRating);
  if (f.amenities.length) p.set('amenities', f.amenities.join(','));
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
  if (withPage && f.page > 1) p.set('page', String(f.page));
  return p;
}

/** The query string the search API expects for these filters. */
export function apiQuery(f: Filters, page = f.page, limit = PAGE_SIZE): URLSearchParams {
  const q = toQuery(f, false);
  q.delete('sort');
  q.delete('near');
  q.set('page', String(page));
  q.set('limit', String(limit));
  const s = SORTS[f.sort];
  q.set('sortBy', s.sortBy);
  q.set('sortOrder', s.sortOrder);
  return q;
}
