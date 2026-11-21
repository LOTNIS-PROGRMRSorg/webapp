import { UNIT_MINUTES, type PricingUnit, type ServiceDetail } from '@/lib/api/market';

/** Ghana is on GMT all year, so a time on the clock is the same as UTC and a date string is unambiguous. */
const iso = (date: string, hhmm: string) => `${date}T${hhmm}:00.000Z`;
const pad = (n: number) => String(n).padStart(2, '0');
export const minutesFor = (unit: PricingUnit, units: number, jobMinutes: number) =>
  unit === 'per_job' ? jobMinutes : UNIT_MINUTES[unit] * units;

/** The next `days` calendar dates (YYYY-MM-DD), starting today. */
export function nextDates(days = 21): string[] {
  const out: string[] = [];
  const base = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() + i));
    out.push(`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`);
  }
  return out;
}

/**
 * Start times a customer can ask for on one day: inside the provider's hours, long enough for the job,
 * not clashing with an agreed job or time off, and at least an hour away.
 */
export function slotsFor(s: Pick<ServiceDetail, 'availability' | 'busy'>, date: string, minutes: number, stepMin = 30) {
  const weekday = new Date(`${date}T12:00:00.000Z`).getUTCDay();
  const windows = s.availability.filter((w) => w.weekday === weekday);
  const noSchedule = s.availability.length === 0;
  const earliest = Date.now() + 3_600_000;
  const out: string[] = [];
  const spans = noSchedule ? [{ start_time: '08:00', end_time: '18:00' }] : windows;
  for (const w of spans) {
    const [sh, sm] = w.start_time.slice(0, 5).split(':').map(Number);
    const [eh, em] = w.end_time.slice(0, 5).split(':').map(Number);
    const winStart = sh * 60 + sm;
    const winEnd = eh * 60 + em;
    for (let t = winStart; t + minutes <= winEnd; t += stepMin) {
      const start = new Date(iso(date, `${pad(Math.floor(t / 60))}:${pad(t % 60)}`)).getTime();
      const end = start + minutes * 60_000;
      if (start < earliest) continue;
      if (s.busy.some((b) => new Date(b.starts_at).getTime() < end && new Date(b.ends_at).getTime() > start)) continue;
      out.push(new Date(start).toISOString());
    }
  }
  return out;
}

export const hhmm = (isoString: string) => new Date(isoString).toISOString().slice(11, 16);
export const prettyDate = (date: string) =>
  new Date(`${date}T12:00:00.000Z`).toLocaleDateString('en-GH', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
