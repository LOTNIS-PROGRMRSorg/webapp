import type { Property } from './types';

const PERIOD_LABELS: Record<string, string> = { hour: 'hour', day: 'night', week: 'week', month: 'month', year: 'year' };

/** The backend prices stays per hour/day/week/month/year; guests read a daily price as "per night". */
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

export const money = (currency: string | null | undefined, amount: number | null | undefined) =>
  `${currency || 'GHS'} ${Number(amount ?? 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const timeAgo = (iso: string) => {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return minutes < 2 ? 'just now' : `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days < 7 ? `${days}d ago` : new Date(iso).toLocaleDateString();
};

export const policyLine = (tier: { days_before_start: number; refund_percentage: number }, previous?: { days_before_start: number }) => {
  const pct = Number(tier.refund_percentage);
  const refund = pct >= 100 ? 'full refund of the stay' : pct <= 0 ? 'no refund of the stay' : `${pct}% of the stay refunded`;
  return tier.days_before_start <= 0
    ? `Less than ${previous?.days_before_start ?? 1} day(s) before check-in: ${refund}`
    : `${tier.days_before_start}+ days before check-in: ${refund}`;
};

// ── Stay-length maths (mirrors the backend so the form can show an end date) ──
const DAY_MS = 86_400_000;
export type RentalUnitCode = 'hour' | 'day' | 'week' | 'month' | 'year';

const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
function addMonths(date: Date, months: number) {
  const total = date.getUTCFullYear() * 12 + date.getUTCMonth() + months;
  const year = Math.floor(total / 12);
  const month = total % 12;
  return new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), daysInMonth(year, month))));
}

/** Exclusive end date for `quantity` units from `start` (YYYY-MM-DD). */
export function endDateFor(start: string, unit: RentalUnitCode, quantity: number): string {
  const from = new Date(`${start}T00:00:00Z`);
  const end = unit === 'week' ? new Date(from.getTime() + quantity * 7 * DAY_MS)
    : unit === 'month' ? addMonths(from, quantity)
    : unit === 'year' ? addMonths(from, quantity * 12)
    : new Date(from.getTime() + quantity * DAY_MS);
  return end.toISOString().slice(0, 10);
}

export const unitNoun = (unit: RentalUnitCode, quantity: number) => {
  const nouns: Record<RentalUnitCode, [string, string]> = {
    hour: ['hour', 'hours'], day: ['night', 'nights'], week: ['week', 'weeks'], month: ['month', 'months'], year: ['year', 'years'],
  };
  return nouns[unit][quantity === 1 ? 0 : 1];
};
