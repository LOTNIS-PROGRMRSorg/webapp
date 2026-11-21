import { CalendarClock, ShieldCheck } from 'lucide-react';
import type { ReservationQuote } from '@/lib/api/reservations';
import { money } from '@/lib/format';
import { Photo } from '@/features/stays/bookingUi';
import { prettyDay, prettyTime } from './calendar';

type Line = ReservationQuote['lines'][number];

const when = (l: Line) =>
  l.unit === 'hour' && l.starts_at && l.ends_at
    ? `${prettyDay(l.start_date)} · ${prettyTime(l.starts_at.slice(11, 16))} – ${prettyTime(l.ends_at.slice(11, 16))}`
    : `${prettyDay(l.start_date)} → ${prettyDay(l.end_date)}`;

/** The running price: every room on its own line, one total. The same numbers the payment is charged. */
export function Summary({
  name,
  city,
  cover,
  quote,
  loading,
  error,
  hint,
}: {
  name: string;
  city?: string | null;
  cover?: string | null;
  quote: ReservationQuote | null;
  loading: boolean;
  error: string;
  hint: string;
}) {
  return (
    <aside className="rv-sum" aria-label="Price summary">
      <div className="rv-sum-photo">
        <Photo src={cover} alt="" />
      </div>
      <div className="rv-sum-body">
        <h3>{name}</h3>
        {city && <p className="rv-sub">{city}</p>}

        {quote ? (
          <>
            <ul className="rv-sum-lines">
              {quote.lines.map((l) => (
                <li key={l.room_id ?? 'whole'}>
                  <div>
                    <b>{l.room_label ?? 'Whole place'}</b>
                    <small>{when(l)}</small>
                    <small>
                      {money(quote.currency, l.price_per_unit).replace(/\.00$/, '')} × {l.stay_label}
                    </small>
                  </div>
                  <span>{money(quote.currency, l.stay_total)}</span>
                </li>
              ))}
            </ul>
            <dl className="rv-sum-tot">
              {quote.property_amount !== quote.stay_total && (
                <div className="pos">
                  <dt>{quote.lines[0]?.discount_label ?? 'Discount'}</dt>
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
              <div className="total">
                <dt>Total</dt>
                <dd>{money(quote.currency, quote.final_amount)}</dd>
              </div>
            </dl>
            <p className="rv-hint">
              <CalendarClock size={14} /> Check-in {prettyTime(quote.check_in_time)} · check-out{' '}
              {prettyTime(quote.check_out_time)}
            </p>
            <p className="rv-hint">
              <ShieldCheck size={14} />{' '}
              {quote.requires_host_acceptance ? 'You only pay after the host accepts.' : "You won't be charged yet."}
            </p>
          </>
        ) : error ? (
          <p className="rv-error" role="alert">
            {error}
          </p>
        ) : (
          <p className="rv-hint">{loading ? 'Working out your total…' : hint}</p>
        )}
      </div>
    </aside>
  );
}
