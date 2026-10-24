import { useEffect, useState } from 'react';
import { loadPaystackScript } from './pay';
import { EVENT_STATUS_LABEL, TICKET_STATUS_LABEL } from './eventApi';

const TZ = 'Africa/Accra';
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

export function QrImage({ value, size = 220, label }: { value: string; size?: number; label?: string }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let live = true;
    import('qrcode').then((m) => m.toDataURL(value, { width: size * 2, margin: 1, errorCorrectionLevel: 'M' })).then((url) => live && setSrc(url)).catch(() => {});
    return () => { live = false; };
  }, [value, size]);
  return src ? <img className="ev-qr" src={src} width={size} height={size} alt={label || 'Ticket QR code'} /> : <div className="ev-qr ev-qr-empty" style={{ width: size, height: size }} />;
}

export const EventStatusPill = ({ status }: { status: string }) => <span className={`pill ev-pill-${status}`}>{EVENT_STATUS_LABEL[status] || status}</span>;
export const TicketStatusPill = ({ status }: { status: string }) => <span className={`pill ev-tk-${status}`}>{TICKET_STATUS_LABEL[status] || status}</span>;

/** Opens the Paystack popup for an order the API created. Resolves with the reference on success, null if the buyer closed it. */
export async function payWithPaystack(opts: { email: string; amountPesewas: number; currency: string; reference: string; orderId: string }): Promise<string | null> {
  const key = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string | undefined;
  if (!key) throw new Error('Payments are not configured yet. Please contact Lotnis support.');
  await loadPaystackScript();
  return new Promise((resolve) => {
    const handler = (window as any).PaystackPop.setup({
      key, email: opts.email, amount: opts.amountPesewas, currency: opts.currency || 'GHS', ref: opts.reference,
      metadata: { event_order_id: opts.orderId, custom_fields: [{ display_name: 'Order', variable_name: 'event_order_id', value: opts.orderId }] },
      callback: (response: { reference: string }) => resolve(response.reference),
      onClose: () => resolve(null),
    });
    handler.openIframe();
  });
}

const PENDING_KEY = 'lotnis_event_pending';
/** Remember an unconfirmed payment so the order page can finish it if the tab was closed mid-confirm. */
export const rememberPayment = (orderId: string, reference: string, token: string) => { try { sessionStorage.setItem(`${PENDING_KEY}:${orderId}`, JSON.stringify({ reference, token })); } catch { /* private mode */ } };
export const recallPayment = (orderId: string): { reference: string; token: string } | null => { try { const v = sessionStorage.getItem(`${PENDING_KEY}:${orderId}`); return v ? JSON.parse(v) : null; } catch { return null; } };
export const forgetPayment = (orderId: string) => { try { sessionStorage.removeItem(`${PENDING_KEY}:${orderId}`); } catch { /* ignore */ } };
