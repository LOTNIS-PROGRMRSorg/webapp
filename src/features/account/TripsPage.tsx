import { useEffect, useState } from 'react';
import { CalendarDays, Check, Luggage } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
import { fmtStay } from '@/lib/dates';
import { CancelDialog } from '@/features/stays/CancelDialog';
import { STATUS_LABEL } from '@/features/exits/labels';
import { ReportDialog } from '@/components/modals';
import { EmptyState, LoadingState, PageHeader, Pill, StatusPill } from '@/components/ui';
import type { Booking, ExitCaseSummary } from '@/types';

export const REFUND_COPY: Record<string, string> = {
  pending: 'Refund pending — Lotnis is reviewing it',
  processing: 'Refund being sent',
  processed: 'Refund sent',
  failed: 'Refund hit a problem — Lotnis is resolving it',
};

export function TripsPage() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
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
    <section className="page trips-page">
      <PageHeader eyebrow="Your travel" title="My trips">
        <Link className="button button-secondary" to="/explore">
          Find a space
        </Link>
      </PageHeader>
      {notice && (
        <div className="notice">
          <Check size={16} />
          <span>{notice}</span>
        </div>
      )}
      {error ? (
        <div className="error-state">{error}</div>
      ) : !bookings ? (
        <LoadingState>Loading your trips…</LoadingState>
      ) : bookings.length ? (
        <div className="trip-list">
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
              <article className="trip-card" key={booking.id}>
                <div className="trip-card-main">
                  <h2>
                    {booking.property?.id ? (
                      <Link to={`/stays/${booking.property.id}`}>{booking.property.name || 'Your stay'}</Link>
                    ) : (
                      booking.property?.name || 'Accommodation reservation'
                    )}
                  </h2>
                  <p className="trip-card-dates">
                    <CalendarDays size={15} aria-hidden="true" />
                    {fmtStay(booking.start_date, booking.end_date)}
                    {booking.property?.city ? ` · ${booking.property.city}` : ''}
                  </p>
                  <small>
                    {booking.platform_fee != null
                      ? `Includes ${money(booking.currency_snapshot, booking.platform_fee)} Lotnis service fee`
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
                <div className="trip-card-side">
                  {booking.reservation_stage === 'awaiting_host_acceptance' ? (
                    <Pill tone="warn">Awaiting host</Pill>
                  ) : (
                    <StatusPill status={booking.status} />
                  )}
                  <strong className="trip-card-total">{money(booking.currency_snapshot, booking.final_amount)}</strong>
                </div>
                <div className="trip-card-actions">
                  {needsPayment && (
                    <Link className="button button-primary button-sm" to={`/pay/${booking.id}`}>
                      Pay now
                    </Link>
                  )}
                  {canCancel && (
                    <button className="button button-quiet button-sm" onClick={() => setCancelling(booking)}>
                      Cancel
                    </button>
                  )}
                  {canReport && (
                    <button className="button button-quiet button-sm" onClick={() => setReporting(booking)}>
                      Report a problem
                    </button>
                  )}
                  {canLeave && (
                    <Link className="button button-quiet button-sm" to={`/trips/${booking.id}/leave`}>
                      Leave early
                    </Link>
                  )}
                  {exit && (
                    <Link className="button button-secondary button-sm" to={`/moveouts/${exit.id}`}>
                      Move-out: {STATUS_LABEL[exit.status]}
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Luggage />}
          action={
            <Link className="button button-primary" to="/explore">
              Browse spaces
            </Link>
          }
        >
          No trips yet. When you book a space, your dates, payments and refunds show up here.
        </EmptyState>
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
