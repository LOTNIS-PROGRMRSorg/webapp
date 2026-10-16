import type { Property } from './types';

const PERIOD_LABELS: Record<string, string> = { day: 'night', month: 'month', year: 'year' };

/** The backend prices stays per day/month/year; guests read a daily price as "per night". */
export function periodLabel(period?: string | null) {
  return PERIOD_LABELS[period || 'day'] || period || 'night';
}

export function formatPrice(currency?: string | null, amount?: number | null) {
  if (amount == null) return 'Price on request';
  return `${currency || 'GHS'} ${amount.toLocaleString()}`;
}

export function primaryImage(property: Property) {
  const images = [...(property.property_images || [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  return images[0]?.public_url;
}
