import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Minus, Plus, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { endDateFor, money, periodLabel, RentalUnitCode, unitNoun } from '@/lib/format';
import type { Property, Room, StayQuote } from '@/types';

const todayIso = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Accra' });
const prettyDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' });

export type ReserveChoice = { roomId?: string; start?: string; end?: string; qty?: number };
export type QuoteSummary = { quote: StayQuote | null; ready: boolean };

/**
 * The booking card: choose what to book and when, and see the exact total before signing in.
 * Prices come from the backend's public quote, so they match what the reserve page charges.
 */
export function BookingCard({
  property,
  rooms,
  mode,
  policy,
  initialRoomId,
  onReserve,
  onQuote,
  onPolicy,
}: {
  property: Property;
  rooms: Room[];
  mode: 'entire' | 'rooms' | 'both' | string;
  policy?: { name: string; description?: string | null } | null;
  initialRoomId?: string;
  onReserve: (choice: ReserveChoice) => void;
  /** Lets the page show the total in the phone's sticky bar. */
  onQuote?: (summary: QuoteSummary) => void;
  /** Called when the cancellation link is followed (the phone sheet closes so the section is visible). */
  onPolicy?: () => void;
}) {
  const needsRoom = mode === 'rooms';
  const [roomId, setRoomId] = useState(initialRoomId ?? (needsRoom && rooms.length === 1 ? rooms[0].id : ''));
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [qty, setQty] = useState(1);
  const [quote, setQuote] = useState<StayQuote | null>(null);
  const [quoteError, setQuoteError] = useState('');
  const [pricing, setPricing] = useState(false);
  const [nudge, setNudge] = useState(false);
  const startInput = useRef<HTMLInputElement>(null);

  // A room chosen from the room list below the fold lands here.
  useEffect(() => {
    if (initialRoomId) setRoomId(initialRoomId);
  }, [initialRoomId]);

  const room = rooms.find((r) => r.id === roomId);
  const unit = (room?.pricing_period || property.pricing_period || 'day') as RentalUnitCode;
  const nightly = unit === 'day';
  // The host's minimum stay is counted in the listing's own unit (nights, months…).
  const minStay = unit === (property.pricing_period || 'day') ? Math.max(1, property.minimum_stay ?? 1) : 1;
  const earliestEnd = (from: string) => endDateFor(from, 'day', minStay);
  const unitPrice = room?.price_per_period ?? property.price ?? null;
  const currency = room?.currency || property.currency || 'GHS';
  const effectiveEnd = useMemo(
    () => (!start ? '' : nightly ? end : endDateFor(start, unit, Math.max(1, qty))),
    [start, end, nightly, unit, qty],
  );
  const cheapestRoom = rooms.length ? rooms.reduce((a, b) => (b.price_per_period < a.price_per_period ? b : a)) : null;

  useEffect(() => {
    setQty((n) => Math.max(n, minStay));
  }, [minStay]);

  useEffect(() => {
    setQuote(null);
    setQuoteError('');
    if (!start || !effectiveEnd || effectiveEnd <= start || (needsRoom && !roomId)) return;
    let live = true;
    setPricing(true);
    const t = window.setTimeout(() => {
      api
        .quoteStay({
          property_id: property.id,
          room_id: roomId || undefined,
          start_date: start,
          end_date: effectiveEnd,
        })
        .then((q) => live && setQuote(q))
        .catch((e) => live && setQuoteError(e instanceof Error ? e.message : 'We couldn’t price these dates.'))
        .finally(() => live && setPricing(false));
    }, 300);
    return () => {
      live = false;
      window.clearTimeout(t);
    };
  }, [property.id, roomId, start, effectiveEnd, needsRoom]);

  useEffect(() => {
    onQuote?.({ quote, ready: Boolean(start && effectiveEnd) });
  }, [quote, start, effectiveEnd]); // eslint-disable-line react-hooks/exhaustive-deps

  const needsHost = quote?.requires_host_acceptance ?? property.requires_host_acceptance ?? false;
  const reserve = () => {
    if (needsRoom && !roomId) {
      setNudge(true);
      return;
    }
    if (!start || !effectiveEnd) {
      setNudge(true);
      startInput.current?.focus();
      try {
        startInput.current?.showPicker?.();
      } catch {
        /* some browsers only allow the picker on a direct tap */
      }
      return;
    }
    onReserve({ roomId: roomId || undefined, start, end: nightly ? end : undefined, qty: nightly ? undefined : qty });
  };

  return (
    <div className="st-card">
      <div className="st-card-price">
        {unitPrice != null ? (
          <>
            <b>{money(currency, unitPrice).replace(/\.00$/, '')}</b> <span>/ {periodLabel(unit)}</span>
          </>
        ) : cheapestRoom ? (
          <>
            <small>Rooms from</small>{' '}
            <b>{money(cheapestRoom.currency || currency, cheapestRoom.price_per_period).replace(/\.00$/, '')}</b>{' '}
            <span>/ {periodLabel(cheapestRoom.pricing_period || property.pricing_period)}</span>
          </>
        ) : (
          <b>Price on request</b>
        )}
      </div>

      {rooms.length > 0 && (
        <label className={`st-field st-field-full${nudge && needsRoom && !roomId ? ' st-field-nudge' : ''}`}>
          <small>What would you like to book?</small>
          <select value={roomId} onChange={(e) => setRoomId(e.target.value)}>
            {needsRoom ? <option value="">Choose a room</option> : <option value="">The whole property</option>}
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.room_label || 'Room'} — {money(r.currency || currency, r.price_per_period).replace(/\.00$/, '')} /{' '}
                {periodLabel(r.pricing_period || property.pricing_period)}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className={`st-dates${nudge && !start ? ' st-field-nudge' : ''}`}>
        <label className="st-field">
          <small>{nightly ? 'Check-in' : 'Move-in'}</small>
          <input
            ref={startInput}
            type="date"
            min={todayIso()}
            value={start}
            onChange={(e) => {
              setStart(e.target.value);
              if (nightly && end && end < earliestEnd(e.target.value)) setEnd('');
            }}
          />
        </label>
        {nightly ? (
          <label className="st-field">
            <small>Check-out</small>
            <input
              type="date"
              min={start ? earliestEnd(start) : todayIso()}
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
        ) : (
          <div className="st-field">
            <small>How long</small>
            <div className="st-stepper">
              <button
                type="button"
                aria-label={`Fewer ${unitNoun(unit, 2)}`}
                disabled={qty <= minStay}
                onClick={() => setQty((n) => Math.max(minStay, n - 1))}
              >
                <Minus size={15} />
              </button>
              <span>
                {qty} {unitNoun(unit, qty)}
              </span>
              <button type="button" aria-label={`More ${unitNoun(unit, 2)}`} onClick={() => setQty((n) => n + 1)}>
                <Plus size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
      {!nightly && start && effectiveEnd && (
        <p className="st-note">
          {prettyDate(start)} to {prettyDate(effectiveEnd)}
        </p>
      )}

      {quote ? (
        <dl className="st-lines">
          <div>
            <dt>
              {money(quote.currency, quote.price_per_unit).replace(/\.00$/, '')} × {quote.stay_label}
            </dt>
            <dd>{money(quote.currency, quote.stay_total)}</dd>
          </div>
          {quote.discount_label && quote.property_amount !== quote.stay_total && (
            <div className="st-deal">
              <dt>{quote.discount_label}</dt>
              <dd>−{money(quote.currency, quote.stay_total - quote.property_amount)}</dd>
            </div>
          )}
          <div>
            <dt>Lotnis service fee</dt>
            <dd>{money(quote.currency, quote.guest_service_fee)}</dd>
          </div>
          {quote.security_deposit > 0 && (
            <div>
              <dt>Refundable deposit</dt>
              <dd>{money(quote.currency, quote.security_deposit)}</dd>
            </div>
          )}
          <div className="st-total">
            <dt>Total</dt>
            <dd>{money(quote.currency, quote.final_amount)}</dd>
          </div>
        </dl>
      ) : quoteError ? (
        <p className="st-error" role="alert">
          {quoteError}
        </p>
      ) : pricing ? (
        <p className="st-note">Working out your total…</p>
      ) : (
        <p className="st-note">
          {needsRoom && !roomId
            ? 'Choose a room and your dates to see the total.'
            : 'Add your dates to see the total, including fees.'}
        </p>
      )}

      <button
        type="button"
        className="st-reserve"
        disabled={property.is_paused || Boolean(quoteError && quote === null && start && effectiveEnd)}
        onClick={reserve}
      >
        {property.is_paused ? (
          'Not taking bookings right now'
        ) : (
          <>
            {needsHost ? 'Request to book' : 'Reserve'} <ArrowRight size={17} />
          </>
        )}
      </button>
      <p className="st-small">
        {needsHost ? 'You only pay after the host accepts.' : 'You won’t be charged yet.'} Pay by mobile money or card.
      </p>
      {policy && (
        <a className="st-policy" href="#refunds" onClick={onPolicy}>
          <ShieldCheck size={16} />
          <span>
            <b>{policy.name} cancellation</b>
            {policy.description ? ` · ${policy.description}` : ''}
          </span>
        </a>
      )}
    </div>
  );
}
