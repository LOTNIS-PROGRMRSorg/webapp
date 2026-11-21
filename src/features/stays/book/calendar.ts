// Pure date and availability maths for the booking screens. Ghana is on GMT all year, so UTC is local time.
import type { BusyRange } from '@/lib/api/reservations';

export const DAY = 86_400_000;
export const HOUR = 3_600_000;
export const todayIso = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Accra' });
export const dayMs = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
export const isoOf = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const addDays = (iso: string, n: number) => isoOf(dayMs(iso) + n * DAY);
/** '14:30:00' → minutes since midnight */
export const minutesOf = (t: string) => {
  const [h, m] = t.split(':');
  return Number(h) * 60 + Number(m || 0);
};
export const clock = (mins: number) =>
  `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
/** '14:00' → '2:00 pm' */
export const prettyTime = (t: string) => {
  const mins = minutesOf(t);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${((h + 11) % 12) + 1}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'am' : 'pm'}`;
};
export const prettyDay = (
  iso: string,
  opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' },
) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GH', { timeZone: 'UTC', ...opts });

/**
 * Is [from, to) free for everything the guest wants? A room clashes with itself and with the whole space;
 * the whole space (no rooms chosen) clashes with every booking.
 */
export function isFree(busy: BusyRange[], roomIds: string[], from: number, to: number) {
  return !busy.some((b) => {
    if (roomIds.length && b.room_id && !roomIds.includes(b.room_id)) return false;
    return Date.parse(b.starts_at) < to && Date.parse(b.blocks_until) > from;
  });
}
