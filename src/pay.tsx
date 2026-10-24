import { useEffect, useState } from 'react';
import { ArrowRight, CalendarCheck, CheckCircle2, Clock, Lock, ShieldCheck, Smartphone } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, getSession } from './api';
import { BookingProgress, Photo, sortedImages } from './bookingUi';
import { money } from './format';
import type { Booking } from './types';

function loadPaystackScript(): Promise<void> {
  if ((window as any).PaystackPop) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.getElementById('paystack-inline-js');
    if (existing) { existing.addEventListener('load', () => resolve()); return; }
    const script = document.createElement('script');
    script.id = 'paystack-inline-js'; script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => resolve(); script.onerror = () => reject(new Error('Unable to load the Paystack payment script.'));
    document.body.appendChild(script);
  });
}

function Summary({ booking }: { booking: Booking }) {
  const c = booking.currency_snapshot;
  const cover = sortedImages(booking.property?.property_images)[0];
  return (
    <div className="sum-card">
      <div className="sum-photo"><Photo src={cover?.public_url} alt="" /></div>
      <div className="sum-body">
        <small className="eyebrow">Your reservation</small>
        <h3>{booking.property?.name || 'Reservation'}</h3>
        <p>{booking.start_date} → {booking.end_date}</p>
        <div className="sum-lines">
          <div><span>Stay</span><b>{money(c, booking.total_amount ?? booking.final_amount)}</b></div>
          {booking.guest_service_fee ? <div><span>Lotnis service fee</span><b>{money(c, booking.guest_service_fee)}</b></div> : null}
          {booking.security_deposit ? <div><span>Refundable deposit</span><b>{money(c, booking.security_deposit)}</b></div> : null}
          <div className="sum-total"><span>Total</span><b>{money(c, booking.final_amount)}</b></div>
        </div>
      </div>
    </div>
  );
}

/** Step 2 of 3 — pay. */
export function PayPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const session = getSession();
  useEffect(() => { api.getMyBooking(id).then(setBooking).catch((err) => setError(err instanceof Error ? err.message : 'Unable to load reservation')); }, [id]);

  const payNow = async () => {
    if (!booking) return;
    const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string | undefined;
    if (!publicKey) { setError('Payments are not configured yet. Contact Lotnis support.'); return; }
    setPaying(true); setError('');
    try {
      await loadPaystackScript();
      const handler = (window as any).PaystackPop.setup({
        key: publicKey, email: session?.email || 'guest@lotnis.com', amount: Math.round(booking.final_amount * 100),
        currency: booking.currency_snapshot || 'GHS', ref: `LOTNIS-${booking.id}-${Date.now()}`,
        metadata: { custom_fields: [{ display_name: 'Booking', variable_name: 'booking_id', value: booking.id }] },
        callback: (response: { reference: string }) => {
          api.confirmBooking(booking.id, response.reference).then(() => navigate(`/booked/${booking.id}`))
            .catch((err) => setError(err instanceof Error ? err.message : 'Payment succeeded but confirmation failed. Contact support.')).finally(() => setPaying(false));
        },
        onClose: () => setPaying(false),
      });
      handler.openIframe();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to start payment'); setPaying(false); }
  };

  if (error && !booking) return <div className="page"><div className="error-state">{error}</div></div>;
  if (!booking) return <div className="page"><div className="empty-state">Loading your reservation…</div></div>;
  const awaitingHost = booking.reservation_stage === 'awaiting_host_acceptance';
  const deadline = booking.payment_deadline_at ?? booking.payment_deadline;

  return (
    <div className="page bk-page">
      <Link className="back-link" to="/trips">← My trips</Link>
      <BookingProgress step={2} />
      <div className="bk-grid">
        <div className="bk-form">
          {awaitingHost ? <>
            <h1>Request sent</h1>
            <div className="bk-callout"><Clock size={22} /><div><b>Waiting for your host</b><p>This host reviews requests first and has 48 hours to reply. We'll notify you the moment they accept — then you can pay here. You haven't been charged.</p></div></div>
            <div className="bk-actions"><Link className="button button-primary" to="/trips">View my trips <ArrowRight size={16} /></Link></div>
          </> : <>
            <h1>Secure your stay</h1>
            {deadline && <div className="bk-callout bk-callout-warm"><Clock size={22} /><div><b>Pay by {new Date(deadline).toLocaleString('en-GH', { dateStyle: 'medium', timeStyle: 'short' })}</b><p>After that the dates are released for other guests.</p></div></div>}
            <section className="bk-block"><h2>How you'll pay</h2>
              <ul className="bk-methods"><li><Smartphone size={18} /> Mobile money — MTN, Telecel, AirtelTigo</li><li><Lock size={18} /> Visa &amp; Mastercard</li></ul>
              <p className="muted-inline"><ShieldCheck size={14} /> Payments are handled by Paystack. Lotnis never sees your card or PIN.</p></section>
            {error && <div className="form-error" role="alert">{error}</div>}
            <div className="bk-actions">
              <button className="button button-primary button-lg" onClick={payNow} disabled={paying}>{paying ? 'Opening secure checkout…' : `Pay ${money(booking.currency_snapshot, booking.final_amount)}`} <ArrowRight size={18} /></button>
              <Link className="button button-quiet" to="/trips">Pay later</Link>
            </div>
          </>}
        </div>
        <aside className="bk-summary"><Summary booking={booking} /></aside>
      </div>
    </div>
  );
}

/** Step 3 of 3 — confirmation. */
export function BookedPage() {
  const { id = '' } = useParams();
  const [booking, setBooking] = useState<Booking | null>(null);
  useEffect(() => { api.getMyBooking(id).then(setBooking).catch(() => {}); }, [id]);
  return (
    <div className="page bk-page">
      <BookingProgress step={3} />
      <div className="done-card">
        <svg className="done-check" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24" /><path d="M14 27l8 8 16-17" /></svg>
        <h1>You're booked.</h1>
        <p className="lead">{booking ? <>Payment received for <b>{booking.property?.name}</b>, {booking.start_date} → {booking.end_date}.</> : 'Your payment was received.'} We've told your host and sent you a notification.</p>
        {booking && <div className="done-total"><span>Paid</span><b>{money(booking.currency_snapshot, booking.final_amount)}</b></div>}
        <ul className="done-next">
          <li><CalendarCheck size={18} /><div><b>Your trip is in My trips</b><span>Dates, price breakdown and host details live there.</span></div></li>
          <li><ShieldCheck size={18} /><div><b>Plans change? You're covered</b><span>Cancel before check-in for a refund under the listing's policy. Once you've moved in, give notice from My trips.</span></div></li>
          <li><CheckCircle2 size={18} /><div><b>Deposit comes back</b><span>Any security deposit is returned after move-out, less itemised deductions you can review.</span></div></li>
        </ul>
        <div className="bk-actions bk-actions-center"><Link className="button button-primary" to="/trips">Go to my trips <ArrowRight size={16} /></Link><Link className="button button-quiet" to="/explore">Keep exploring</Link></div>
      </div>
    </div>
  );
}
