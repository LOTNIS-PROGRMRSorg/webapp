import { useState } from 'react';
import { Clock } from 'lucide-react';
import { FieldDialog } from '@/components/modals';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
import { fmtDateTime, fmtStay } from '@/lib/dates';
import type { Booking } from '@/types';
import { guestName } from './hostShared';

// ── Booking requests (host must accept/decline within 48h) ────────────────────

export function BookingRequests({ bookings, onChange }: { bookings: Booking[]; onChange: () => void }) {
  const pending = bookings.filter((b) => b.reservation_stage === 'awaiting_host_acceptance' && b.status === 'pending');
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [declining, setDeclining] = useState<Booking | null>(null);
  if (!pending.length) return null;
  const act = async (id: string, work: () => Promise<unknown>, failure: string) => {
    setBusyId(id);
    setError('');
    try {
      await work();
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : failure);
    } finally {
      setBusyId('');
    }
  };
  return (
    <>
      <h2 className="subsection-heading">Requests awaiting your response</h2>
      {error && <div className="form-error">{error}</div>}
      <div className="booking-list">
        {pending.map((b) => (
          <div className="booking-row booking-request" key={b.id}>
            <div className="booking-request-main">
              <strong>{b.property?.name || 'Reservation request'}</strong>
              <p>
                {guestName(b)} · {fmtStay(b.start_date, b.end_date)}
              </p>
              {b.host_acceptance_deadline && (
                <small className="booking-request-deadline">
                  <Clock size={13} aria-hidden="true" /> Respond by {fmtDateTime(b.host_acceptance_deadline)}
                </small>
              )}
            </div>
            <div className="booking-request-amount">
              <small>You receive</small>
              <strong>{money(b.currency_snapshot, b.landlord_payout ?? b.final_amount)}</strong>
            </div>
            <div className="form-actions">
              <button className="button button-secondary" disabled={busyId === b.id} onClick={() => setDeclining(b)}>
                Decline
              </button>
              <button
                className="button button-primary"
                disabled={busyId === b.id}
                aria-busy={busyId === b.id || undefined}
                onClick={() => act(b.id, () => api.hostAcceptBooking(b.id), 'Unable to accept')}
              >
                {busyId === b.id ? 'Saving…' : 'Accept'}
              </button>
            </div>
          </div>
        ))}
      </div>
      {declining && (
        <FieldDialog
          title="Decline this request?"
          intro={`${guestName(declining)} hasn't been charged yet. We'll let them know these dates aren't available.`}
          fields={[
            {
              name: 'reason',
              label: 'Reason',
              type: 'textarea',
              rows: 3,
              hint: 'Optional · shared with the guest',
              placeholder: 'e.g. The space is being repaired that week',
            },
          ]}
          submitLabel="Decline request"
          danger
          onClose={() => setDeclining(null)}
          onSubmit={async (v) => {
            await api.hostRejectBooking(declining.id, String(v.reason || '').trim());
            setDeclining(null);
            onChange();
          }}
        />
      )}
    </>
  );
}
