import { useState } from 'react';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
import type { Booking } from '@/types';
import { guestName } from './hostShared';

// ── Booking requests (host must accept/decline within 48h) ────────────────────

export function BookingRequests({ bookings, onChange }: { bookings: Booking[]; onChange: () => void }) {
  const pending = bookings.filter((b) => b.reservation_stage === 'awaiting_host_acceptance' && b.status === 'pending');
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
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
          <div className="booking-row" key={b.id}>
            <div>
              <strong>{b.property?.name || 'Reservation request'}</strong>
              <p>
                {guestName(b)} · {b.start_date} → {b.end_date}
              </p>
              {b.host_acceptance_deadline && (
                <small>Respond by {new Date(b.host_acceptance_deadline).toLocaleString()}</small>
              )}
            </div>
            <strong>{money(b.currency_snapshot, b.landlord_payout ?? b.final_amount)}</strong>
            <div className="form-actions">
              <button
                className="button button-quiet"
                disabled={busyId === b.id}
                onClick={() => {
                  const reason = window.prompt('Reason for declining this request?') || 'Not available';
                  act(b.id, () => api.hostRejectBooking(b.id, reason), 'Unable to decline');
                }}
              >
                Decline
              </button>
              <button
                className="button button-primary"
                disabled={busyId === b.id}
                onClick={() => act(b.id, () => api.hostAcceptBooking(b.id), 'Unable to accept')}
              >
                Accept
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
