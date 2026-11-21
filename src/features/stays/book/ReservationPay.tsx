import { useEffect, useState } from 'react';
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  Lock,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getSession } from '@/lib/api';
import { reservationsApi, Reservation } from '@/lib/api/reservations';
import { StepIndicator } from '@/components/steppers';
import { Photo, sortedImages } from '@/features/stays/bookingUi';
import { loadPaystackScript } from '@/features/stays/pay';
import { money } from '@/lib/format';
import { prettyDay, prettyTime } from './calendar';
import './book.css';

type Method = 'mobile_money' | 'card';
const METHODS: Array<{ key: Method; title: string; sub: string; icon: typeof Smartphone; chips: string[] }> = [
  {
    key: 'mobile_money',
    title: 'Mobile money',
    sub: 'Approve on your phone',
    icon: Smartphone,
    chips: ['MTN', 'Telecel', 'AirtelTigo'],
  },
  { key: 'card', title: 'Card', sub: 'Visa or Mastercard', icon: CreditCard, chips: ['Visa', 'Mastercard'] },
];
const STEPS = [
  { key: 'space', label: 'Space' },
  { key: 'when', label: 'Dates' },
  { key: 'details', label: 'Details' },
  { key: 'pay', label: 'Pay' },
];

const lineWhen = (b: Reservation['bookings'][number]) =>
  b.pricing_period === 'hour'
    ? `${prettyDay(b.start_date)} · ${prettyTime(b.starts_at.slice(11, 16))} – ${prettyTime(b.ends_at.slice(11, 16))}`
    : `${prettyDay(b.start_date)} → ${prettyDay(b.end_date)}`;

/** After the dates are held: wait for the host if they approve guests, pay once for every room, then the confirmation. */
export function ReservationPay() {
  const { id = '' } = useParams();
  const [r, setR] = useState<Reservation | null>(null);
  const [error, setError] = useState('');
  const [method, setMethod] = useState<Method>('mobile_money');
  const [paying, setPaying] = useState(false);
  const session = getSession();

  useEffect(() => {
    reservationsApi
      .get(id)
      .then(setR)
      .catch((e) => setError(e instanceof Error ? e.message : 'We couldn’t load this reservation.'));
  }, [id]);

  const pay = async () => {
    if (!r) return;
    const key = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string | undefined;
    if (!key) return setError('Payments are not configured yet. Contact Lotnis support.');
    setPaying(true);
    setError('');
    try {
      const [{ reference, amount, currency }] = await Promise.all([
        reservationsApi.startPayment(r.id),
        loadPaystackScript(),
      ]);
      (window as any).PaystackPop.setup({
        key,
        email: session?.email || 'guest@lotnis.com',
        amount: Math.round(amount * 100),
        currency,
        ref: reference,
        channels: [method],
        metadata: { custom_fields: [{ display_name: 'Reservation', variable_name: 'reservation_id', value: r.id }] },
        callback: (res: { reference: string }) => {
          reservationsApi
            .confirm(r.id, res.reference)
            .then(setR)
            .catch((e) =>
              setError(
                e instanceof Error ? e.message : 'Payment went through but confirming it failed. Contact support.',
              ),
            )
            .finally(() => setPaying(false));
        },
        onClose: () => setPaying(false),
      }).openIframe();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'We couldn’t open the payment window.');
      setPaying(false);
    }
  };

  if (error && !r)
    return (
      <div className="page">
        <div className="error-state">{error}</div>
      </div>
    );
  if (!r)
    return (
      <div className="page">
        <div className="empty-state">Loading your reservation…</div>
      </div>
    );

  const paid = Boolean(r.paid_at);
  const open = r.bookings.filter((b) => b.status === 'pending');
  const awaitingHost =
    !paid && r.requires_host_acceptance && open.some((b) => b.reservation_stage === 'awaiting_host_acceptance');
  const expired = !paid && !open.length;
  const cover = sortedImages(r.property?.property_images as never)[0] as { public_url: string } | undefined;
  const deadline = open.map((b) => b.host_acceptance_deadline).find(Boolean);

  const summary = (
    <aside className="rv-sum">
      <div className="rv-sum-photo">
        <Photo src={cover?.public_url} alt="" />
      </div>
      <div className="rv-sum-body">
        <h3>{r.property?.name}</h3>
        {r.property?.city && <p className="rv-sub">{r.property.city}</p>}
        <ul className="rv-sum-lines">
          {r.bookings.map((b) => (
            <li key={b.id}>
              <div>
                <b>{b.room?.room_label ?? 'Whole place'}</b>
                <small>{lineWhen(b)}</small>
              </div>
              <span>{money(r.currency, b.final_amount)}</span>
            </li>
          ))}
        </ul>
        <dl className="rv-sum-tot">
          <div className="total">
            <dt>{paid ? 'Paid' : 'Total'}</dt>
            <dd>{money(r.currency, r.total_charge)}</dd>
          </div>
        </dl>
      </div>
    </aside>
  );

  return (
    <div className="page rv-page">
      <Link className="back-link" to="/trips">
        ← My trips
      </Link>
      <StepIndicator steps={STEPS} current={paid ? 4 : 3} label="Booking progress" />
      <div className="rv-layout">
        <div className="rv-main">
          {paid ? (
            <section className="rv-step rv-done">
              <svg className="done-check" viewBox="0 0 52 52" aria-hidden="true">
                <circle cx="26" cy="26" r="24" />
                <path d="M14 27l8 8 16-17" />
              </svg>
              <h1>You're booked.</h1>
              <p className="rv-lead">
                {r.bookings.length > 1 ? `All ${r.bookings.length} rooms are` : 'Your booking is'} secured at{' '}
                <b>{r.property?.name}</b>. We've told your host.
              </p>
              <ul className="rv-next">
                <li>
                  <CalendarCheck size={18} />
                  <div>
                    <b>Check-in from {prettyTime(r.property?.check_in_time ?? '14:00')}</b>
                    <span>
                      Check-out by {prettyTime(r.property?.check_out_time ?? '11:00')}. The details are in My trips.
                    </span>
                  </div>
                </li>
                <li>
                  <ShieldCheck size={18} />
                  <div>
                    <b>Plans change? Each room cancels on its own</b>
                    <span>Cancel one room without touching the others — refunds follow the cancellation policy.</span>
                  </div>
                </li>
                <li>
                  <CheckCircle2 size={18} />
                  <div>
                    <b>Deposit comes back</b>
                    <span>Any security deposit returns after check-out, less itemised deductions you can review.</span>
                  </div>
                </li>
              </ul>
              <div className="rv-actions">
                <Link className="button button-primary button-lg" to="/trips">
                  Go to my trips <ArrowRight size={18} />
                </Link>
                <Link className="button button-quiet" to="/explore">
                  Keep exploring
                </Link>
              </div>
            </section>
          ) : expired ? (
            <section className="rv-step">
              <h1>This reservation has ended</h1>
              <p className="rv-lead">
                The time to pay ran out, so the rooms were released for other guests. You haven't been charged.
              </p>
              <div className="rv-actions">
                <Link className="button button-primary" to={`/stays/${r.property_id}`}>
                  Book again <ArrowRight size={16} />
                </Link>
              </div>
            </section>
          ) : awaitingHost ? (
            <section className="rv-step">
              <h1>Request sent</h1>
              <div className="callout">
                <Clock size={22} />
                <div>
                  <b>Waiting for your host</b>
                  <p>
                    This host approves guests first and has 48 hours to reply
                    {deadline
                      ? ` (by ${new Date(deadline).toLocaleString('en-GH', { dateStyle: 'medium', timeStyle: 'short' })})`
                      : ''}
                    . We'll notify you the moment they accept — then you can pay here. You haven't been charged.
                  </p>
                </div>
              </div>
              <div className="rv-actions">
                <Link className="button button-primary" to="/trips">
                  View my trips <ArrowRight size={16} />
                </Link>
              </div>
            </section>
          ) : (
            <section className="rv-step">
              <h1>Pay for your stay</h1>
              <p className="rv-lead">
                One payment secures {r.bookings.length > 1 ? `all ${r.bookings.length} rooms` : 'your booking'}.
              </p>
              {open[0] && (
                <div className="callout callout-warn">
                  <Clock size={22} />
                  <div>
                    <b>Your dates are held for a short time</b>
                    <p>Pay soon — after that they're released for other guests.</p>
                  </div>
                </div>
              )}
              <h2 className="rv-h2">How would you like to pay?</h2>
              <div className="rv-methods" role="radiogroup" aria-label="Payment method">
                {METHODS.map((m) => (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={method === m.key}
                    key={m.key}
                    className={`rv-method ${method === m.key ? 'on' : ''}`}
                    onClick={() => setMethod(m.key)}
                  >
                    <span className="rv-method-ic">
                      <m.icon size={20} />
                    </span>
                    <span className="rv-method-tx">
                      <b>{m.title}</b>
                      <small>{m.sub}</small>
                      <span className="rv-chips">
                        {m.chips.map((c) => (
                          <i key={c}>{c}</i>
                        ))}
                      </span>
                    </span>
                    <span className="rv-radio" aria-hidden="true" />
                  </button>
                ))}
              </div>
              <p className="rv-hint">
                <Lock size={14} /> Payments are handled by Paystack. Lotnis never sees your card number or PIN.
              </p>
              {error && (
                <div className="form-error" role="alert">
                  {error}
                </div>
              )}
              <div className="rv-actions">
                <button type="button" className="button button-primary button-lg" onClick={pay} disabled={paying}>
                  {paying ? 'Opening secure checkout…' : `Pay ${money(r.currency, r.total_charge)}`}{' '}
                  <ArrowRight size={18} />
                </button>
                <Link className="button button-quiet" to="/trips">
                  Pay later
                </Link>
              </div>
            </section>
          )}
        </div>
        {summary}
      </div>
    </div>
  );
}
