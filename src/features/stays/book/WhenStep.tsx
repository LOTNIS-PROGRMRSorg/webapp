import { Minus, Plus } from 'lucide-react';
import type { BusyRange, SpaceRules } from '@/lib/api/reservations';
import { RentalUnitCode, unitNoun } from '@/lib/format';
import { RangeCalendar } from './RangeCalendar';
import { HourPicker } from './HourPicker';
import { DAY, dayMs, HOUR, isFree, minutesOf, prettyDay, prettyTime } from './calendar';

export type When = { start: string; end: string; qty: number; startTime: string; hours: number };

/** Step 2: the dates (or the day and hours). Taken nights are struck through; the rest is chosen on the calendar. */
export function WhenStep({
  unit,
  when,
  onChange,
  busy,
  roomIds,
  rules,
  minStay,
  effectiveEnd,
  conflict,
}: {
  unit: RentalUnitCode;
  when: When;
  onChange: (next: Partial<When>) => void;
  busy: BusyRange[];
  roomIds: string[];
  rules: SpaceRules;
  minStay: number;
  effectiveEnd: string;
  conflict: boolean;
}) {
  const inMin = minutesOf(rules.check_in_time);
  const outMin = minutesOf(rules.check_out_time);
  const nightFree = (day: string) =>
    isFree(busy, roomIds, dayMs(day) + inMin * 60_000, dayMs(day) + DAY + outMin * 60_000);
  const hourlyDayFree = (day: string) => {
    const open = Math.ceil(minutesOf(rules.opens_at) / 60);
    const close = Math.floor(minutesOf(rules.closes_at) / 60);
    for (let h = open; h < close; h++)
      if (isFree(busy, roomIds, dayMs(day) + h * HOUR, dayMs(day) + (h + 1) * HOUR)) return true;
    return false;
  };

  if (unit === 'hour')
    return (
      <section className="rv-step">
        <h1>Pick a day and time</h1>
        <p className="rv-lead">
          Open {prettyTime(rules.opens_at)} – {prettyTime(rules.closes_at)}. Choose the day, then your start time and
          how many hours.
        </p>
        <RangeCalendar
          mode="single"
          start={when.start}
          end=""
          canStart={hourlyDayFree}
          canEnd={() => false}
          onPick={({ start }) => onChange({ start, startTime: '', hours: Math.max(1, minStay) })}
        />
        {when.start && (
          <>
            <h2 className="rv-h2">{prettyDay(when.start, { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
            <HourPicker
              date={when.start}
              startTime={when.startTime}
              hours={when.hours}
              minHours={Math.max(1, minStay)}
              opensAt={rules.opens_at}
              closesAt={rules.closes_at}
              busy={busy}
              roomIds={roomIds}
              onChange={(n) => onChange({ startTime: n.startTime, hours: n.hours })}
            />
          </>
        )}
      </section>
    );

  const nightly = unit === 'day';
  return (
    <section className="rv-step">
      <h1>{nightly ? 'Choose your dates' : 'When do you want to start?'}</h1>
      <p className="rv-lead">
        Check-in from {prettyTime(rules.check_in_time)}, check-out by {prettyTime(rules.check_out_time)}.
        {!nightly && ` Let by the ${unitNoun(unit, 1)} — you book whole ${unitNoun(unit, 2)}.`}
      </p>
      <RangeCalendar
        mode={nightly ? 'range' : 'single'}
        start={when.start}
        end={nightly ? when.end : ''}
        canStart={nightFree}
        canEnd={(start, day) =>
          dayMs(day) - dayMs(start) >= minStay * DAY &&
          isFree(busy, roomIds, dayMs(start) + inMin * 60_000, dayMs(day) + outMin * 60_000)
        }
        onPick={({ start, end }) => onChange({ start, end })}
      />
      {!nightly && (
        <div className="rv-qty">
          <span>
            <b>How many {unitNoun(unit, 2)}?</b>
            {when.start && (
              <small>
                {prettyDay(when.start)} → {prettyDay(effectiveEnd)}
              </small>
            )}
          </span>
          <div className="stepper-input">
            <button
              type="button"
              aria-label="Fewer"
              disabled={when.qty <= minStay}
              onClick={() => onChange({ qty: when.qty - 1 })}
            >
              <Minus size={16} />
            </button>
            <output aria-live="polite">{when.qty}</output>
            <button type="button" aria-label="More" onClick={() => onChange({ qty: when.qty + 1 })}>
              <Plus size={16} />
            </button>
          </div>
        </div>
      )}
      {nightly && when.start && when.end && (
        <p className="rv-note">
          {prettyDay(when.start)} → {prettyDay(when.end)}
        </p>
      )}
      {conflict && (
        <p className="rv-error" role="alert">
          Part of that stay is already taken. Pick a shorter stay or a different start date.
        </p>
      )}
    </section>
  );
}
