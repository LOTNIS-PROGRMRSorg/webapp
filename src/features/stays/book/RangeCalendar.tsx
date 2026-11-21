import { ReactNode, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, dayMs, DAY, isoOf, todayIso } from './calendar';

type Props = {
  mode: 'range' | 'single';
  start: string;
  end: string;
  /** Can a stay (or visit) begin on this day? Taken nights are false. */
  canStart: (day: string) => boolean;
  /** Can the stay end on this day, given the chosen start? */
  canEnd: (start: string, day: string) => boolean;
  onPick: (next: { start: string; end: string }) => void;
};

const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function Month({
  year,
  month,
  head,
  ...p
}: Props & { year: number; month: number; head: { left?: ReactNode; right?: ReactNode; rightWide?: ReactNode } }) {
  const first = Date.UTC(year, month, 1);
  const lead = (new Date(first).getUTCDay() + 6) % 7; // Monday first
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const today = todayIso();
  const picking = p.mode === 'range' && p.start && !p.end;

  const click = (day: string) => {
    if (p.mode === 'single') return p.onPick({ start: day, end: '' });
    if (picking && day > p.start && p.canEnd(p.start, day)) return p.onPick({ start: p.start, end: day });
    if (p.canStart(day)) return p.onPick({ start: day, end: '' });
  };

  return (
    <div className="rv-month">
      <div className="rv-month-head">
        <span className="rv-slot-l">{head.left}</span>
        <h4>{new Date(first).toLocaleDateString('en-GH', { timeZone: 'UTC', month: 'long', year: 'numeric' })}</h4>
        <span className="rv-slot-r">{head.right}</span>
      </div>
      <div className="rv-grid" role="grid">
        {WEEK.map((d, i) => (
          <span key={i} className="rv-dow" aria-hidden="true">
            {d}
          </span>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <span key={`l${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const day = isoOf(first + i * DAY);
          const past = day < today;
          const endable = picking && day > p.start && p.canEnd(p.start, day);
          const disabled = past || (picking ? !endable && !p.canStart(day) : !p.canStart(day));
          const isStart = day === p.start;
          const isEnd = day === p.end;
          const inside = p.mode === 'range' && p.start && p.end && day > p.start && day < p.end;
          // while choosing the end, preview the stay up to the day being hovered
          const cls = [
            'rv-day',
            isStart && 'start',
            isEnd && 'end',
            inside && 'in',
            day === today && 'today',
            disabled && 'off',
            endable && 'endable',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <button
              type="button"
              key={day}
              className={cls}
              disabled={disabled}
              aria-pressed={isStart || isEnd}
              aria-label={new Date(`${day}T00:00:00Z`).toLocaleDateString('en-GH', {
                timeZone: 'UTC',
                dateStyle: 'full',
              })}
              onClick={() => click(day)}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Month calendar with taken days struck through. Two months side by side on a wide screen, one on a phone. */
export function RangeCalendar(props: Props) {
  const anchor = props.start || todayIso();
  const [view, setView] = useState(() => {
    const d = new Date(`${anchor}T00:00:00Z`);
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() };
  });
  const next = useMemo(() => {
    const t = Date.UTC(view.y, view.m + 1, 1);
    return { y: new Date(t).getUTCFullYear(), m: new Date(t).getUTCMonth() };
  }, [view]);
  const step = (n: number) => {
    const t = Date.UTC(view.y, view.m + n, 1);
    setView({ y: new Date(t).getUTCFullYear(), m: new Date(t).getUTCMonth() });
  };
  const thisMonth = dayMs(todayIso());
  const atStart =
    Date.UTC(view.y, view.m, 1) <= Date.UTC(new Date(thisMonth).getUTCFullYear(), new Date(thisMonth).getUTCMonth(), 1);
  const prev = (
    <button type="button" className="rv-nav" onClick={() => step(-1)} disabled={atStart} aria-label="Previous month">
      <ChevronLeft size={18} />
    </button>
  );
  const nextBtn = (cls = '') => (
    <button type="button" className={`rv-nav ${cls}`} onClick={() => step(1)} aria-label="Next month">
      <ChevronRight size={18} />
    </button>
  );
  return (
    <div className="rv-cal">
      <div className="rv-months">
        <Month {...props} year={view.y} month={view.m} head={{ left: prev, right: nextBtn('rv-nav-narrow') }} />
        <div className="rv-second">
          <Month {...props} year={next.y} month={next.m} head={{ right: nextBtn() }} />
        </div>
      </div>
      <p className="rv-legend">
        <span>
          <i className="sel" /> Your dates
        </span>
        <span>
          <i className="off" /> Taken
        </span>
      </p>
    </div>
  );
}

export { addDays };
