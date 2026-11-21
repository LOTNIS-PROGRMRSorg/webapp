import { CalendarClock, ShieldCheck } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSession } from '@/lib/api';
import { marketApi, UNIT_NOUN, type ServiceDetail } from '@/lib/api/market';
import { money } from '@/lib/format';
import { track } from '@/lib/track';
import { hhmm, minutesFor, nextDates, prettyDate, slotsFor } from './slots';

/** Pick a day and a time the provider is free, choose how long, optionally offer a lower price, and send the request. */
export function RequestForm({ s }: { s: ServiceDetail }) {
  const navigate = useNavigate();
  const dates = useMemo(() => nextDates(21), []);
  const [date, setDate] = useState('');
  const [start, setStart] = useState('');
  const [units, setUnits] = useState(s.min_units);
  const [bargain, setBargain] = useState(false);
  const [offer, setOffer] = useState('');
  const [where, setWhere] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const perJob = s.pricing_unit === 'per_job';
  const minutes = minutesFor(s.pricing_unit, perJob ? 1 : units, s.job_minutes);
  const list = Math.round(s.rate * (perJob ? 1 : units) * 100) / 100;
  const floor = s.allow_negotiation ? Math.round(list * s.min_offer_percent) / 100 : list;
  const offered = bargain && offer !== '' ? Number(offer) : list;

  const slotsByDate = useMemo(
    () => Object.fromEntries(dates.map((d) => [d, slotsFor(s, d, minutes)])),
    [dates, s, minutes],
  );
  const slots = date ? (slotsByDate[date] ?? []) : [];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!getSession()) {
      navigate(`/auth?next=${encodeURIComponent(`/services/${s.id}`)}`);
      return;
    }
    if (!start) return setError('Choose a day and a start time.');
    if (s.travels_to_customer && !s.works_at_own_place && !where.trim())
      return setError('Tell the provider where the job is.');
    if (bargain && !(offered >= floor && offered <= list))
      return setError(`Your offer must be between ${money(s.currency, floor)} and ${money(s.currency, list)}.`);
    setBusy(true);
    setError('');
    try {
      track('service', s.id, 'click_book');
      const job = await marketApi.ask(s.id, {
        starts_at: start,
        units: perJob ? 1 : units,
        offer: bargain ? offered : null,
        location_text: where.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      navigate(`/jobs/${job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your request');
    } finally {
      setBusy(false);
    }
  };

  const unavailable = s.is_paused;
  return (
    <form className="svc-ask" onSubmit={submit}>
      <div className="svc-ask-price">
        <strong>{money(s.currency, s.rate)}</strong> <span>/ {UNIT_NOUN[s.pricing_unit]}</span>
        {s.allow_negotiation && <em>Negotiable</em>}
      </div>

      <fieldset disabled={unavailable}>
        <label className="fld">
          <span>Day</span>
          <div className="svc-days" role="listbox" aria-label="Day">
            {dates.map((d) => {
              const n = slotsByDate[d].length;
              return (
                <button
                  key={d}
                  type="button"
                  role="option"
                  aria-selected={date === d}
                  disabled={!n}
                  className={date === d ? 'on' : ''}
                  onClick={() => {
                    setDate(d);
                    setStart('');
                  }}
                >
                  <small>{prettyDate(d).split(' ')[0]}</small>
                  <b>{prettyDate(d).split(' ')[1]}</b>
                  <small>{prettyDate(d).split(' ')[2]}</small>
                </button>
              );
            })}
          </div>
        </label>

        {!perJob && (
          <label className="fld">
            <span>How long</span>
            <select
              value={units}
              onChange={(e) => {
                setUnits(Number(e.target.value));
                setStart('');
              }}
            >
              {Array.from({ length: s.max_units - s.min_units + 1 }, (_, i) => s.min_units + i).map((n) => (
                <option key={n} value={n}>
                  {n} {UNIT_NOUN[s.pricing_unit]}
                  {n === 1 ? '' : 's'}
                </option>
              ))}
            </select>
          </label>
        )}

        {date && (
          <div className="fld">
            <span>
              Start time{' '}
              <small>{slots.length ? 'Providers are paid for the whole job' : 'Nothing free that day'}</small>
            </span>
            <div className="svc-times">
              {slots.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={start === t}
                  className={start === t ? 'on' : ''}
                  onClick={() => setStart(t)}
                >
                  {hhmm(t)}
                </button>
              ))}
            </div>
          </div>
        )}

        {(s.travels_to_customer || !s.works_at_own_place) && (
          <label className="fld">
            <span>Where is the job?</span>
            <input
              value={where}
              onChange={(e) => setWhere(e.target.value)}
              placeholder="Area and landmark, e.g. East Legon, near the Total station"
              maxLength={300}
            />
            <small>The provider sees the exact place only after you have paid.</small>
          </label>
        )}
        <label className="fld">
          <span>Anything they should know?</span>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={1000}
            placeholder="What do you need done?"
          />
          <small>Phone numbers and links are hidden — keep the conversation in Lotnis.</small>
        </label>

        {s.allow_negotiation && (
          <div className="svc-bargain">
            <label className="check">
              <input type="checkbox" checked={bargain} onChange={(e) => setBargain(e.target.checked)} />{' '}
              <span>Offer a different price</span>
            </label>
            {bargain && (
              <>
                <input
                  type="number"
                  inputMode="decimal"
                  min={floor}
                  max={list}
                  step="0.01"
                  value={offer}
                  onChange={(e) => setOffer(e.target.value)}
                  placeholder={`${floor.toFixed(2)} – ${list.toFixed(2)}`}
                  aria-label="Your offer"
                />
                <small>
                  You can offer up to {100 - s.min_offer_percent}% less. The provider can accept, reply with another
                  price, or decline.
                </small>
              </>
            )}
          </div>
        )}
      </fieldset>

      <div className="svc-ask-total">
        <span>
          {minutes >= 60 ? `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ''}` : `${minutes} min`}{' '}
          job
        </span>
        <b>{money(s.currency, bargain && offered ? offered : list)}</b>
      </div>
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      <button className="button button-primary button-wide" disabled={busy || unavailable}>
        <CalendarClock size={16} /> {unavailable ? 'Paused right now' : busy ? 'Sending…' : 'Send request'}
      </button>
      <p className="svc-ask-note">
        <ShieldCheck size={15} /> You pay only after the provider accepts. Lotnis holds the money and the provider is
        paid when you say the job went well.
      </p>
    </form>
  );
}
