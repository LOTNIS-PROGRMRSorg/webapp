import { useEffect, useRef } from 'react';
import { useCountdown } from './useCountdown';

/** One calendar-leaf digit pair: when the value changes the old number drops away and the new one falls in. */
function FlipCell({ value, label }: { value: number; label: string }) {
  const text = String(value).padStart(2, '0');
  const previous = useRef(text);
  const from = previous.current;
  useEffect(() => {
    previous.current = text;
  }, [text]);
  return (
    <div className="evd-flip">
      <div className="evd-flip-leaf" aria-hidden="true">
        {from !== text && (
          <span key={`out-${from}`} className="evd-flip-num evd-flip-out">
            {from}
          </span>
        )}
        <span key={`in-${text}`} className={`evd-flip-num ${from !== text ? 'evd-flip-in' : ''}`}>
          {text}
        </span>
      </div>
      <span className="evd-flip-label">{label}</span>
    </div>
  );
}

/** Counts down to the moment the gates open; after that it says whether the event is on or over. */
export function Countdown({ gateAt, endsAt }: { gateAt: string; endsAt: string }) {
  const left = useCountdown(gateAt);
  if (left.done) {
    const over = new Date(endsAt).getTime() < Date.now();
    return (
      <div className="evd-countdown evd-countdown-done">
        <span className={`evd-live ${over ? 'evd-live-off' : ''}`} />
        {over ? 'This event has ended' : 'Gates are open'}
      </div>
    );
  }
  return (
    <div className="evd-countdown" role="timer" aria-label="Time until the gates open">
      <p className="evd-countdown-title">Gates open in</p>
      <div className="evd-flips">
        <FlipCell value={left.days} label="Days" />
        <i className="evd-colon" aria-hidden="true" />
        <FlipCell value={left.hours} label="Hours" />
        <i className="evd-colon" aria-hidden="true" />
        <FlipCell value={left.minutes} label="Minutes" />
        <i className="evd-colon" aria-hidden="true" />
        <FlipCell value={left.seconds} label="Seconds" />
      </div>
    </div>
  );
}
