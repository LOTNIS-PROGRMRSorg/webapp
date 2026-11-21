import { Ban, Clock, Minus, Music, Plus, ShieldCheck, Volume2 } from 'lucide-react';
import type { ReservationQuote, SpaceRules } from '@/lib/api/reservations';
import { policyLine } from '@/lib/format';
import { prettyTime } from './calendar';

/** Step 3: who's coming, the house rules, the cancellation terms — and the guest's agreement to them. */
export function DetailsStep({
  rules,
  quote,
  guests,
  max,
  notes,
  agreed,
  onGuests,
  onNotes,
  onAgree,
}: {
  rules: SpaceRules;
  quote: ReservationQuote | null;
  guests: number;
  max: number | null;
  notes: string;
  agreed: boolean;
  onGuests: (n: number) => void;
  onNotes: (v: string) => void;
  onAgree: (v: boolean) => void;
}) {
  const policy = quote?.cancellation_policy;
  const lines = (rules.house_rules ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  return (
    <section className="rv-step">
      <h1>Before you book</h1>
      <p className="rv-lead">A few details and the ground rules for your stay.</p>

      <div className="rv-qty">
        <span>
          <b>Guests</b>
          <small>{max ? `Up to ${max} for what you've chosen` : 'Everyone who will be staying'}</small>
        </span>
        <div className="stepper-input">
          <button type="button" aria-label="Fewer guests" disabled={guests <= 1} onClick={() => onGuests(guests - 1)}>
            <Minus size={16} />
          </button>
          <output aria-live="polite">{guests}</output>
          <button
            type="button"
            aria-label="More guests"
            disabled={max != null && guests >= max}
            onClick={() => onGuests(guests + 1)}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="rv-panel">
        <h2>House rules</h2>
        <ul className="rv-rules">
          <li>
            <Clock size={16} />
            <span>
              Check-in from <b>{prettyTime(rules.check_in_time)}</b> · check-out by{' '}
              <b>{prettyTime(rules.check_out_time)}</b>
            </span>
          </li>
          {rules.quiet_hours && (
            <li>
              <Volume2 size={16} />
              <span>
                Quiet hours <b>{rules.quiet_hours}</b>
              </span>
            </li>
          )}
          <li>
            <Ban size={16} />
            <span>{rules.smoking_allowed ? 'Smoking is allowed' : 'No smoking'}</span>
          </li>
          <li>
            <Music size={16} />
            <span>{rules.parties_allowed ? 'Parties and events are allowed' : 'No parties or events'}</span>
          </li>
          {lines.map((l, i) => (
            <li key={i} className="rv-rule-text">
              <span>{l}</span>
            </li>
          ))}
        </ul>
      </div>

      {policy && (
        <div className="rv-panel">
          <h2>
            <ShieldCheck size={17} /> {policy.name} cancellation
          </h2>
          <ul className="rv-tiers">
            {policy.tiers.map((t, i) => (
              <li key={t.days_before_start}>{policyLine(t, policy.tiers[i - 1])}</li>
            ))}
          </ul>
          <p className="rv-hint">
            Each room is cancelled on its own. The service fee isn't refunded when a guest cancels; deposits are. If the
            host cancels, you get everything back.
          </p>
        </div>
      )}

      <label className="rv-notes">
        <b>A note for the host</b> <small>(optional)</small>
        <textarea
          rows={3}
          maxLength={500}
          placeholder="Expected arrival time, anything they should know…"
          value={notes}
          onChange={(e) => onNotes(e.target.value)}
        />
      </label>

      <label className="rv-agree">
        <input type="checkbox" checked={agreed} onChange={(e) => onAgree(e.target.checked)} />
        <span>I've read the house rules and cancellation terms and I agree to them.</span>
      </label>
    </section>
  );
}
