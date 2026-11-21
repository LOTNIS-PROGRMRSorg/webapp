import { Minus, Plus } from 'lucide-react';
import type { BusyRange } from '@/lib/api/reservations';
import { clock, dayMs, HOUR, isFree, minutesOf, prettyTime } from './calendar';

/**
 * Pick a start time and how many hours. Every hour inside the opening hours is a button; hours already
 * taken are struck through, and the length can't run into the next booking or past closing time.
 */
export function HourPicker({
  date,
  startTime,
  hours,
  minHours,
  opensAt,
  closesAt,
  busy,
  roomIds,
  onChange,
}: {
  date: string;
  startTime: string;
  hours: number;
  minHours: number;
  opensAt: string;
  closesAt: string;
  busy: BusyRange[];
  roomIds: string[];
  onChange: (next: { startTime: string; hours: number }) => void;
}) {
  const open = Math.ceil(minutesOf(opensAt) / 60);
  const close = Math.floor(minutesOf(closesAt) / 60);
  const base = dayMs(date);
  const freeHour = (h: number) => isFree(busy, roomIds, base + h * HOUR, base + (h + 1) * HOUR);
  // a start time only works if the space stays free for at least the minimum number of hours
  const runFrom = (h: number) => {
    let n = 0;
    while (h + n < close && freeHour(h + n)) n++;
    return n;
  };
  const slots = Array.from({ length: Math.max(0, close - open) }, (_, i) => open + i);
  const startH = startTime ? Math.floor(minutesOf(startTime) / 60) : -1;

  // the longest run that is free from the chosen start
  const longest = startH >= 0 ? runFrom(startH) : 0;

  const pick = (h: number) => onChange({ startTime: clock(h * 60), hours: Math.max(minHours, 1) });
  const setHours = (n: number) => onChange({ startTime, hours: n });

  return (
    <div className="rv-hours">
      <div className="rv-slots" role="group" aria-label="Start time">
        {slots.map((h) => {
          const free = runFrom(h) >= minHours;
          const inRange = startH >= 0 && h >= startH && h < startH + hours;
          return (
            <button
              type="button"
              key={h}
              disabled={!free}
              className={`rv-slot ${inRange ? 'on' : ''} ${h === startH ? 'first' : ''}`}
              onClick={() => pick(h)}
              aria-pressed={h === startH}
            >
              {prettyTime(clock(h * 60))}
            </button>
          );
        })}
        {!slots.length && <p className="rv-hint">This space has no opening hours set.</p>}
      </div>
      {startH >= 0 && (
        <div className="rv-hours-len">
          <span>
            <b>How long?</b>
            <small>
              {prettyTime(clock(startH * 60))} – {prettyTime(clock((startH + hours) * 60))}
              {minHours > 1 ? ` · minimum ${minHours} hours` : ''}
            </small>
          </span>
          <div className="stepper-input">
            <button
              type="button"
              aria-label="Fewer hours"
              disabled={hours <= minHours}
              onClick={() => setHours(hours - 1)}
            >
              <Minus size={16} />
            </button>
            <output aria-live="polite">{hours}</output>
            <button
              type="button"
              aria-label="More hours"
              disabled={hours >= longest}
              onClick={() => setHours(hours + 1)}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
