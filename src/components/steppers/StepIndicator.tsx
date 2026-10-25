import { Check } from 'lucide-react';
import type { Step } from './useStepper';

/** The numbered progress bar at the top of every multi-step flow (booking, event creation, listing creation). */
export function StepIndicator<K extends string>({
  steps,
  current,
  onJump,
  wide,
  label = 'Progress',
}: {
  steps: Array<Step<K>>;
  current: number;
  onJump?: (index: number) => void;
  wide?: boolean;
  label?: string;
}) {
  return (
    <ol className={`stepper ${wide ? 'stepper-wide' : ''}`} aria-label={label}>
      {steps.map((s, i) => {
        const inner = (
          <>
            <span className="step-dot">{i < current ? <Check size={14} strokeWidth={3} /> : i + 1}</span>
            <span className="step-label">{s.label}</span>
          </>
        );
        return (
          <li
            key={s.key}
            className={`step ${i < current ? 'step-done' : ''} ${i === current ? 'step-now' : ''}`}
            aria-current={i === current ? 'step' : undefined}
          >
            {onJump ? (
              <button type="button" className="step-btn" onClick={() => onJump(i)}>
                {inner}
              </button>
            ) : (
              inner
            )}
          </li>
        );
      })}
    </ol>
  );
}
