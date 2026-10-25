// Dates and cedis, formatted the Ghana way (Accra time) — used by events, stays and payouts.
export const TZ = 'Africa/Accra';
export const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) =>
  new Date(iso).toLocaleDateString('en-GH', { timeZone: TZ, ...opts });
export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('en-GH', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });
export const fmtDateTime = (iso: string) => `${fmtDate(iso)} · ${fmtTime(iso)}`;
export const fmtRange = (start: string, end: string) => {
  const sameDay = fmtDate(start, { dateStyle: 'short' }) === fmtDate(end, { dateStyle: 'short' });
  return sameDay ? `${fmtDate(start)} · ${fmtTime(start)} – ${fmtTime(end)}` : `${fmtDateTime(start)} → ${fmtDateTime(end)}`;
};
/** `<input type="datetime-local">` wants local wall-clock time without a zone. */
export const toLocalInput = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
export const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : null);
export const cedis = (n: number | null | undefined, currency = 'GHS') => `${currency === 'GHS' ? 'GH₵' : currency + ' '}${Number(n ?? 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const cedisShort = (n: number | null | undefined, currency = 'GHS') => `${currency === 'GHS' ? 'GH₵' : currency + ' '}${Number(n ?? 0).toLocaleString('en-GH', { maximumFractionDigits: 2 })}`;

