import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { api } from './api';
import { money, policyLine } from './format';
import type { CancellationPreview } from './types';

/**
 * Shows exactly what a cancellation would refund BEFORE the person confirms.
 * The numbers come from the same database function that performs the real
 * cancellation, using the refund policy the host selected for the listing.
 */
export function CancelDialog({ bookingId, role, propertyName, onClose, onDone }: {
  bookingId: string; role: 'guest' | 'host'; propertyName: string; onClose: () => void; onDone: () => void;
}) {
  const [preview, setPreview] = useState<CancellationPreview | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (role === 'guest' ? api.previewTripCancellation(bookingId) : api.previewHostCancellation(bookingId))
      .then(setPreview).catch((err) => setError(err instanceof Error ? err.message : 'Unable to calculate your refund'));
  }, [bookingId, role]);

  const confirm = async () => {
    if (role === 'host' && !reason.trim()) { setError('Please tell the guest why you are cancelling.'); return; }
    setBusy(true); setError('');
    try {
      await (role === 'guest' ? api.cancelTrip(bookingId, reason.trim() || undefined) : api.hostCancelBooking(bookingId, reason.trim()));
      onDone();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to cancel'); setBusy(false); }
  };

  const c = preview?.currency;
  return (
    <div className="dialog-overlay" onClick={onClose} role="presentation">
      <div className="dialog" role="dialog" aria-modal="true" aria-label="Cancel booking" onClick={(e) => e.stopPropagation()}>
        <button className="dialog-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        <span className="eyebrow">{role === 'guest' ? 'Cancel your booking' : 'Cancel as host'}</span>
        <h2>{propertyName}</h2>

        {!preview && !error && <div className="empty-state">Calculating your refund…</div>}
        {preview && !preview.is_paid && <div className="notice"><span>You haven't paid for this booking yet, so nothing will be charged or refunded.</span></div>}
        {preview && preview.is_paid && <>
          <div className="refund-hero">
            <small>{role === 'guest' ? 'You would get back' : 'The guest will be refunded'}</small>
            <strong>{money(c, preview.tenant_refund)}</strong>
            <small>{preview.full_refund
              ? 'Everything they paid, including the service fee.'
              : `${preview.days_until_checkin} day(s) before check-in under the host's “${preview.policy_name}” policy → ${preview.refund_percentage}% of the stay.`}</small>
          </div>
          <div className="price-breakdown">
            <div><span>You paid</span><strong>{money(c, preview.total_paid)}</strong></div>
            <div><span>Stay ({money(c, preview.property_amount)} × {preview.refund_percentage}%)</span><strong>{money(c, preview.refund_property_amount)}</strong></div>
            <div><span>Lotnis service fee</span><strong>{preview.refund_fee_amount > 0 ? money(c, preview.refund_fee_amount) : 'Not refundable'}</strong></div>
            {preview.security_deposit > 0 && <div><span>Security deposit</span><strong>{money(c, preview.refund_deposit_amount)}</strong></div>}
            <div className="price-breakdown-total"><span>Refund</span><strong>{money(c, preview.tenant_refund)}</strong></div>
          </div>
          {role === 'host' && <div className="notice"><span>Cancelling a confirmed booking cancels your payout for it. Lotnis reviews the refund and sends it to the guest.</span></div>}
          {role === 'guest' && !preview.full_refund && preview.policy_tiers.length > 0 && (
            <details className="policy-detail"><summary>See this listing's refund policy</summary>
              <ul>{preview.policy_tiers.map((t, i) => <li key={t.days_before_start} className={preview.days_until_checkin >= t.days_before_start && (i === 0 || preview.days_until_checkin < preview.policy_tiers[i - 1].days_before_start) ? 'tier-hit' : ''}>{policyLine(t, preview.policy_tiers[i - 1])}</li>)}</ul>
            </details>
          )}
          <p className="muted-inline">Refunds are reviewed and sent by Lotnis — you'll get a notification when yours is on its way.</p>
        </>}

        {preview && <label className="dialog-label">{role === 'host' ? 'Reason (sent to the guest)' : 'Reason (optional)'}
          <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>}
        {error && <div className="form-error">{error}</div>}
        <div className="form-actions">
          <button className="button button-quiet" onClick={onClose}>Keep booking</button>
          <button className="button button-danger" onClick={confirm} disabled={busy || !preview}>{busy ? 'Cancelling…' : 'Confirm cancellation'}</button>
        </div>
      </div>
    </div>
  );
}
