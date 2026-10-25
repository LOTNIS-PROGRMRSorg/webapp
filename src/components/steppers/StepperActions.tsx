import { ArrowRight } from 'lucide-react';
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/** Back / Continue / Save bar under a stepped form. The last step shows `submitLabel` and submits the <form>. */
export function StepperActions({
  index,
  count,
  last,
  busy,
  submitLabel,
  cancelTo,
  onBack,
  onNext,
  extra,
}: {
  index: number;
  count: number;
  last: boolean;
  busy?: boolean;
  submitLabel: string;
  cancelTo: string;
  onBack: () => void;
  onNext: () => void;
  extra?: ReactNode;
}) {
  return (
    <div className="form-actions stepper-actions">
      {index === 0 ? (
        <Link className="button button-quiet" to={cancelTo}>
          Cancel
        </Link>
      ) : (
        <button type="button" className="button button-quiet" onClick={onBack}>
          ← Back
        </button>
      )}
      <span className="muted-inline">
        Step {index + 1} of {count}
      </span>
      {extra}
      {last ? (
        <button className="button button-primary" disabled={busy}>
          {busy ? 'Saving…' : submitLabel} <ArrowRight size={16} />
        </button>
      ) : (
        <button type="button" className="button button-primary" onClick={onNext} disabled={busy}>
          Continue <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}
