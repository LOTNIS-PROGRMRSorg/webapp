import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { CancelDialog } from '@/features/stays/CancelDialog';
import { money } from '@/lib/format';
import type { Booking } from '@/types';
import { PageHeader } from '@/components/ui';
import { guestName, useHostBookings } from './hostShared';
import { BookingRequests } from './BookingRequests';

export type BookingTab = 'requests' | 'upcoming' | 'past' | 'cancelled';
export function HostBookings() {
  const { bookings, error, loading, reload } = useHostBookings();
  const [tab, setTab] = useState<BookingTab>('requests');
  const [cancelling, setCancelling] = useState<Booking | null>(null);
  const navigate = useNavigate();
  const todayAccra = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Accra' });
  const startCheckout = async (bookingId: string) => {
    try {
      const d = await api.startCheckout(bookingId);
      navigate(`/moveouts/${d.exit.id}`);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Unable to start checkout');
    }
  };
  const groups = useMemo(
    () => ({
      requests: bookings.filter((b) => b.reservation_stage === 'awaiting_host_acceptance' && b.status === 'pending'),
      upcoming: bookings.filter((b) => b.status === 'confirmed' || b.status === 'active'),
      past: bookings.filter((b) => b.status === 'completed'),
      cancelled: bookings.filter((b) => b.status === 'cancelled' || b.status === 'no_show'),
    }),
    [bookings],
  );
  const list = groups[tab];
  return (
    <section className="host-page">
      <PageHeader eyebrow="Bookings" title="Reservations" />
      <div className="notif-toolbar">
        {(['requests', 'upcoming', 'past', 'cancelled'] as BookingTab[]).map((key) => (
          <button
            key={key}
            className={`chip ${tab === key ? 'chip-active' : ''}`}
            onClick={() => setTab(key)}
            style={{ textTransform: 'capitalize' }}
          >
            {key} ({groups[key].length})
          </button>
        ))}
      </div>
      {error ? (
        <div className="error-state">{error}</div>
      ) : loading ? (
        <div className="empty-state">Loading…</div>
      ) : tab === 'requests' ? (
        list.length ? (
          <BookingRequests bookings={bookings} onChange={reload} />
        ) : (
          <div className="empty-state">No requests are waiting for you.</div>
        )
      ) : list.length ? (
        <div className="booking-list">
          {list.map((b) => (
            <div className="booking-row" key={b.id}>
              <div>
                <strong>{b.property?.name || 'Reservation'}</strong>
                <p>
                  {guestName(b)} · {b.start_date} → {b.end_date}
                </p>
                <small>
                  {b.status === 'cancelled'
                    ? `${b.cancellation_reason ? `Cancelled: ${b.cancellation_reason}. ` : 'Cancelled. '}${b.refund ? `Guest refund ${money(b.refund.currency, b.refund.refund_amount)} · you receive ${money(b.refund.currency, b.refund.host_receives)}.` : ''}`
                    : `Your payout: ${money(b.currency_snapshot, b.landlord_payout)} after check-in`}
                </small>
              </div>
              <span className={`status status-${b.status}`}>{b.status}</span>
              <strong>{money(b.currency_snapshot, b.final_amount)}</strong>
              <div className="form-actions">
                {b.status === 'confirmed' && b.start_date > todayAccra && (
                  <button className="button button-quiet" onClick={() => setCancelling(b)}>
                    Cancel
                  </button>
                )}
                {(b.status === 'confirmed' || b.status === 'active') && b.start_date <= todayAccra && (
                  <button className="button button-secondary" onClick={() => startCheckout(b.id)}>
                    Start checkout
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">Nothing here yet.</div>
      )}
      {cancelling && (
        <CancelDialog
          bookingId={cancelling.id}
          role="host"
          propertyName={cancelling.property?.name || 'Reservation'}
          onClose={() => setCancelling(null)}
          onDone={() => {
            setCancelling(null);
            reload();
          }}
        />
      )}
    </section>
  );
}
