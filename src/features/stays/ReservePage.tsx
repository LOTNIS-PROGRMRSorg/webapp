import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, Minus, Plus, ShieldCheck } from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { BookingProgress, bookingMode, liveRooms, Photo, sortedImages } from '@/features/stays/bookingUi';
import { endDateFor, money, periodLabel, policyLine, RentalUnitCode, unitNoun } from '@/lib/format';
import type { Property, StayQuote } from '@/types';

const todayIso = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Accra' });
const nextDay = (iso: string) => endDateFor(iso, 'day', 1);
const prettyDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * Step 1 of 3 — pick the space and the dates. Nightly places ask for check-in and
 * check-out; weekly, monthly and yearly lets ask for a start date and a count,
 * and always book whole calendar units. The summary on the right is the
 * backend's own quote, so what you see is exactly what you are charged.
 */
export function ReservePage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [roomId, setRoomId] = useState(params.get('room') ?? '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [quote, setQuote] = useState<StayQuote | null>(null);
  const [quoteError, setQuoteError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .getProperty(id)
      .then(setProperty)
      .catch((err) => setError(err.message));
  }, [id]);

  const rooms = useMemo(() => (property ? liveRooms(property) : []), [property]);
  const mode = property ? bookingMode(property) : 'entire';
  const needsRoom = mode === 'rooms';
  useEffect(() => {
    if (needsRoom && !roomId && rooms.length === 1) setRoomId(rooms[0].id);
  }, [needsRoom, roomId, rooms]);
  const room = rooms.find((r) => r.id === roomId);

  const unit = (room?.pricing_period || property?.pricing_period || 'day') as RentalUnitCode;
  const perUnitPrice = room?.price_per_period ?? property?.price ?? null;
  const currency = room?.currency || property?.currency || 'GHS';
  const isNightly = unit === 'day';
  const effectiveEnd = useMemo(
    () => (!startDate ? '' : isNightly ? endDate : endDateFor(startDate, unit, Math.max(1, quantity))),
    [startDate, endDate, isNightly, unit, quantity],
  );
  const cover = room
    ? (sortedImages(room.room_images)[0] ?? sortedImages(property?.property_images)[0])
    : sortedImages(property?.property_images)[0];

  useEffect(() => {
    setQuote(null);
    setQuoteError('');
    if (!property || !startDate || !effectiveEnd || effectiveEnd <= startDate) return;
    if (needsRoom && !roomId) return;
    const t = window.setTimeout(() => {
      api
        .quoteStay({ property_id: id, room_id: roomId || undefined, start_date: startDate, end_date: effectiveEnd })
        .then(setQuote)
        .catch((err) => setQuoteError(err instanceof Error ? err.message : 'Unable to price this stay'));
    }, 250);
    return () => window.clearTimeout(t);
  }, [property, id, roomId, startDate, effectiveEnd, needsRoom]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const booking = await api.createBooking({
        property_id: id,
        room_id: roomId || undefined,
        start_date: startDate,
        end_date: effectiveEnd,
      });
      navigate(`/pay/${booking.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create reservation');
    } finally {
      setBusy(false);
    }
  };

  if (error && !property)
    return (
      <div className="page">
        <div className="error-state">{error}</div>
      </div>
    );
  if (!property)
    return (
      <div className="page">
        <div className="empty-state">Loading…</div>
      </div>
    );
  if (unit === 'hour')
    return (
      <div className="page">
        <Link className="back-link" to={`/stays/${id}`}>
          ← Back
        </Link>
        <h1>Hourly booking is coming soon.</h1>
        <p className="lead">
          This space is priced by the hour. Online hourly reservations aren't open yet — please contact the host.
        </p>
      </div>
    );

  const choiceTiles = (
    <div className="choice-tiles" role="radiogroup" aria-label="Space">
      {mode === 'both' && (
        <button
          type="button"
          role="radio"
          aria-checked={!roomId}
          className={`choice-tile ${!roomId ? 'on' : ''}`}
          onClick={() => setRoomId('')}
        >
          <Photo src={sortedImages(property.property_images)[0]?.public_url} alt="" />
          <span>
            <b>Whole property</b>
            <small>
              {money(property.currency, property.price)} / {periodLabel(property.pricing_period)}
            </small>
          </span>
          <Check size={16} className="tick" />
        </button>
      )}
      {rooms.map((r) => (
        <button
          type="button"
          role="radio"
          aria-checked={roomId === r.id}
          key={r.id}
          className={`choice-tile ${roomId === r.id ? 'on' : ''}`}
          onClick={() => setRoomId(r.id)}
        >
          <Photo
            src={sortedImages(r.room_images)[0]?.public_url ?? sortedImages(property.property_images)[0]?.public_url}
            alt=""
          />
          <span>
            <b>{r.room_label || 'Room'}</b>
            <small>
              {money(r.currency || property.currency, r.price_per_period)} /{' '}
              {periodLabel(r.pricing_period || property.pricing_period)}
              {r.capacity ? ` · sleeps ${r.capacity}` : ''}
            </small>
          </span>
          <Check size={16} className="tick" />
        </button>
      ))}
    </div>
  );

  return (
    <div className="page bk-page">
      <Link className="back-link" to={`/stays/${id}`}>
        ← Back to stay
      </Link>
      <BookingProgress step={1} />
      <div className="bk-grid">
        <form className="bk-form" onSubmit={submit}>
          <h1>{isNightly ? 'Choose your dates' : 'How long do you need it?'}</h1>

          {mode !== 'entire' && rooms.length > 0 && (
            <section className="bk-block">
              <h2>Your space</h2>
              {choiceTiles}
              {mode === 'both' && roomId && (
                <p className="muted-inline">Booking a room also blocks the whole property for these dates.</p>
              )}
            </section>
          )}

          <section className="bk-block">
            <h2>{isNightly ? 'When' : 'Start date & length'}</h2>
            <div className="bk-dates">
              <label className="fld">
                {isNightly ? 'Check-in' : 'Start date'}
                <input
                  required
                  type="date"
                  min={todayIso()}
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (isNightly && endDate <= e.target.value) setEndDate(nextDay(e.target.value));
                  }}
                />
              </label>
              {isNightly ? (
                <label className="fld">
                  Check-out
                  <input
                    required
                    type="date"
                    min={startDate ? nextDay(startDate) : todayIso()}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </label>
              ) : (
                <div className="fld">
                  Number of {unitNoun(unit, 2)}
                  <div className="stepper-input">
                    <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Fewer">
                      <Minus size={16} />
                    </button>
                    <output aria-live="polite">{quantity}</output>
                    <button type="button" onClick={() => setQuantity((q) => q + 1)} aria-label="More">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
            {!isNightly && startDate && (
              <p className="muted-inline">
                Ends <strong>{prettyDate(effectiveEnd)}</strong> — booked in whole {unitNoun(unit, 2)}, not pro-rated by
                days.
              </p>
            )}
          </section>

          {quoteError && (
            <div className="form-error" role="alert">
              {quoteError}
            </div>
          )}
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          <div className="bk-actions">
            <button className="button button-primary button-lg" disabled={busy || !quote}>
              {busy ? 'Reserving…' : quote?.requires_host_acceptance ? 'Send request' : 'Continue to payment'}{' '}
              <ArrowRight size={18} />
            </button>
            <span className="muted-inline">
              <ShieldCheck size={14} />{' '}
              {quote?.requires_host_acceptance ? 'You only pay after the host accepts.' : "You won't be charged yet."}
            </span>
          </div>
        </form>

        <aside className="bk-summary">
          <div className="sum-card">
            <div className="sum-photo">
              <Photo src={cover?.public_url} alt="" />
            </div>
            <div className="sum-body">
              <small className="eyebrow">{room ? room.room_label : property.sub_type || 'Space'}</small>
              <h3>{property.name}</h3>
              <p>
                {property.city}
                {startDate && effectiveEnd > startDate
                  ? ` · ${prettyDate(startDate)} → ${prettyDate(effectiveEnd)}`
                  : ''}
              </p>
              {quote ? (
                <div className="sum-lines" key={`${quote.final_amount}-${quote.stay_label}`}>
                  <div>
                    <span>
                      {money(quote.currency, quote.price_per_unit)} × {quote.stay_label}
                    </span>
                    <b>{money(quote.currency, quote.stay_total)}</b>
                  </div>
                  {quote.discount_label && quote.property_amount !== quote.stay_total && (
                    <div className="pos">
                      <span>{quote.discount_label}</span>
                      <b>−{money(quote.currency, quote.stay_total - quote.property_amount)}</b>
                    </div>
                  )}
                  <div>
                    <span>Lotnis service fee</span>
                    <b>{money(quote.currency, quote.guest_service_fee)}</b>
                  </div>
                  {quote.security_deposit > 0 && (
                    <div>
                      <span>Refundable deposit</span>
                      <b>{money(quote.currency, quote.security_deposit)}</b>
                    </div>
                  )}
                  <div className="sum-total">
                    <span>Total</span>
                    <b>{money(quote.currency, quote.final_amount)}</b>
                  </div>
                </div>
              ) : (
                <p className="sum-hint">
                  {perUnitPrice == null
                    ? 'Choose a space to see its price.'
                    : `${money(currency, perUnitPrice)} per ${periodLabel(unit)} — pick your dates for the full price.`}
                </p>
              )}
              {quote?.cancellation_policy && (
                <details className="policy-detail">
                  <summary>Refund policy: {quote.cancellation_policy.name}</summary>
                  <ul>
                    {quote.cancellation_policy.tiers.map((t, i) => (
                      <li key={t.days_before_start}>{policyLine(t, quote.cancellation_policy!.tiers[i - 1])}</li>
                    ))}
                  </ul>
                  <p className="muted-inline">
                    Service fee isn't refunded on guest cancellations; deposits are. Host cancels → full refund.
                  </p>
                </details>
              )}
              {(quote?.min_stay || quote?.max_stay) && (
                <p className="muted-inline">
                  {quote.min_stay ? `Min ${quote.min_stay} ${unitNoun(quote.unit, quote.min_stay)}. ` : ''}
                  {quote.max_stay ? `Max ${quote.max_stay} ${unitNoun(quote.unit, quote.max_stay)}.` : ''}
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
