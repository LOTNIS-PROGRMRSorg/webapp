import { useEffect, useState } from 'react';
import { loadPaystackScript } from '@/features/stays/pay';
import { EVENT_STATUS_LABEL, TICKET_STATUS_LABEL } from '@/lib/api/events';

import { fmtDate } from '@/lib/dates';
export * from '@/lib/dates';
export function QrImage({ value, size = 220, label }: { value: string; size?: number; label?: string }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let live = true;
    import('qrcode')
      .then((m) => m.toDataURL(value, { width: size * 2, margin: 1, errorCorrectionLevel: 'M' }))
      .then((url) => live && setSrc(url))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [value, size]);
  return src ? (
    <img className="qr" src={src} width={size} height={size} alt={label || 'Ticket QR code'} />
  ) : (
    <div className="qr qr-empty" style={{ width: size, height: size }} />
  );
}

export const EventStatusPill = ({ status }: { status: string }) => (
  <span className={`pill ev-pill-${status}`}>{EVENT_STATUS_LABEL[status] || status}</span>
);
export const TicketStatusPill = ({ status }: { status: string }) => (
  <span className={`pill ev-tk-${status}`}>{TICKET_STATUS_LABEL[status] || status}</span>
);

/** Opens the Paystack popup for an order the API created. Resolves with the reference on success, null if the buyer closed it. */
export async function payWithPaystack(opts: {
  email: string;
  amountPesewas: number;
  currency: string;
  reference: string;
  orderId: string;
}): Promise<string | null> {
  const key = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string | undefined;
  if (!key) throw new Error('Payments are not configured yet. Please contact Lotnis support.');
  await loadPaystackScript();
  return new Promise((resolve) => {
    const handler = (window as any).PaystackPop.setup({
      key,
      email: opts.email,
      amount: opts.amountPesewas,
      currency: opts.currency || 'GHS',
      ref: opts.reference,
      metadata: {
        event_order_id: opts.orderId,
        custom_fields: [{ display_name: 'Order', variable_name: 'event_order_id', value: opts.orderId }],
      },
      callback: (response: { reference: string }) => resolve(response.reference),
      onClose: () => resolve(null),
    });
    handler.openIframe();
  });
}

const PENDING_KEY = 'lotnis_event_pending';
/** Remember an unconfirmed payment so the order page can finish it if the tab was closed mid-confirm. */
export const rememberPayment = (orderId: string, reference: string, token: string) => {
  try {
    sessionStorage.setItem(`${PENDING_KEY}:${orderId}`, JSON.stringify({ reference, token }));
  } catch {
    /* private mode */
  }
};
export const recallPayment = (orderId: string): { reference: string; token: string } | null => {
  try {
    const v = sessionStorage.getItem(`${PENDING_KEY}:${orderId}`);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
};
export const forgetPayment = (orderId: string) => {
  try {
    sessionStorage.removeItem(`${PENDING_KEY}:${orderId}`);
  } catch {
    /* ignore */
  }
};
