import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
import { CancelDialog } from '@/features/stays/CancelDialog';
import { STATUS_LABEL } from '@/features/exits/labels';
import { ReportDialog } from '@/components/modals';
import type { Booking, ExitCaseSummary } from '@/types';

export const REFUND_COPY: Record<string, string> = {
  pending: 'Refund pending — Lotnis is reviewing it',
  processing: 'Refund being sent',
  processed: 'Refund sent',
  failed: 'Refund hit a problem — Lotnis is resolving it',
};

export function TripsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState<Booking | null>(null);
  const [reporting, setReporting] = useState<Booking | null>(null);
  const [notice, setNotice] = useState('');
  const [exits, setExits] = useState<Record<string, ExitCaseSummary>>({});
  const todayAccra = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Accra' });
  const load = () => {
    api
      .getMyBookings()
      .then((result) => setBookings(result.data || []))
      .catch((err) => setError(err.message));
    api
      .getMyExits()
      .then((list) => setExits(Object.fromEntries(list.map((x) => [x.booking_id, x]))))
      .catch(() => {});
  };
  useEffect(() => {
    load();
  }, []);
  return (
    <section className="section dashboard-page">
      <span className="eyebrow">Your travel</span>
      <h1>My trips</h1>
      {notice && (
        <div className="notice">
          <Check size={16} />
          <span>{notice}</span>
        </div>
      )}
      {error ? (
        <div className="error-state">{error}</div>
      ) : bookings.length ? (
        <div className="booking-list">
          {bookings.map((booking) => {
            const needsPayment =
              booking.reservation_stage === 'awaiting_payment' ||
              (!booking.reservation_stage && booking.status === 'pending' && !booking.payment_reference);
            const started = booking.start_date <= todayAccra;
            const exit = exits[booking.id];
            const canCancel = booking.status === 'pending' || (booking.status === 'confirmed' && !started);
            const canLeave = (booking.status === 'confirmed' || booking.status === 'active') && started && !exit;
            const daysSince = (Date.parse(todayAccra) - Date.parse(booking.start_date)) / 86_400_000;
            const canReport =
              (booking.status === 'confirmed' || booking.status === 'active') && started && daysSince <= 2;
            return (
              <div className="booking-row" key={booking.id}>
                <div>
                  <strong>{booking.property?.name || 'Accommodation reservation'}</strong>
                  <p>
                    {booking.start_date} → {booking.end_date}
                  </p>
                  <small>
                    {booking.platform_fee != null
                      ? `Includes ${booking.currency_snapshot} ${booking.platform_fee.toLocaleString()} Lotnis service fee`
                      : 'Price confirmed at checkout'}
                  </small>
                  {booking.refund && (
                    <small className="refund-line">
                      {money(booking.refund.currency, booking.refund.refund_amount)} ·{' '}
                      {REFUND_COPY[booking.refund.status]}
                      {booking.refund.refund_reference ? ` (ref ${booking.refund.refund_reference})` : ''}
                    </small>
                  )}
                  {booking.status === 'cancelled' && booking.cancellation_reason && (
                    <small>Reason: {booking.cancellation_reason}</small>
                  )}
                </div>
                <span className={`status status-${booking.status}`}>
                  {booking.reservation_stage === 'awaiting_host_acceptance' ? 'Awaiting host' : booking.status}
                </span>
                <strong>
                  {booking.currency_snapshot} {booking.final_amount.toLocaleString()}
                </strong>
                <div className="form-actions">
                  {needsPayment && (
                    <Link className="button button-secondary" to={`/pay/${booking.id}`}>
                      Pay now
                    </Link>
                  )}
                  {canCancel && (
                    <button className="button button-quiet" onClick={() => setCancelling(booking)}>
                      Cancel
                    </button>
                  )}
                  {canReport && (
                    <button className="button button-quiet" onClick={() => setReporting(booking)}>
                      Report a problem
                    </button>
                  )}
                  {canLeave && (
                    <Link className="button button-quiet" to={`/trips/${booking.id}/leave`}>
                      Leave early
                    </Link>
                  )}
                  {exit && (
                    <Link className="button button-secondary" to={`/moveouts/${exit.id}`}>
                      Move-out: {STATUS_LABEL[exit.status]}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">Your reservations will appear here.</div>
      )}
      {reporting && (
        <ReportDialog
          kind="booking"
          target={{ booking_id: reporting.id }}
          title={`Report a problem: ${reporting.property?.name || 'your stay'}`}
          audienceNote="You have 24–48 hours after checking in to tell us. We pause the host's payout while we look into it and email you what we decide."
          onClose={() => setReporting(null)}
          onDone={() => setNotice('Thanks — we are looking into it.')}
        />
      )}
      {cancelling && (
        <CancelDialog
          bookingId={cancelling.id}
          role="guest"
          propertyName={cancelling.property?.name || 'Your reservation'}
          onClose={() => setCancelling(null)}
          onDone={() => {
            setCancelling(null);
            setNotice(
              'Booking cancelled. If a refund is due you will see it here and get a notification when it is sent.',
            );
            load();
          }}
        />
      )}
    </section>
  );
}
