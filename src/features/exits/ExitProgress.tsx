import { CheckCircle2 } from 'lucide-react';
import type { ExitStatus } from '@/types';
import { STEPS } from './exitShared';

export function Stepper({ status }: { status: ExitStatus }) {
  const idx = status === 'withdrawn' ? -1 : Math.max(0, STEPS.findIndex((s) => s.match.includes(status)));
  return (
    <ol className="xs" aria-label="Case progress">
      {STEPS.map((step, i) => (
        <li key={step.key} className={`xs-step ${i < idx || status === 'settled' ? 'xs-done' : ''} ${i === idx && status !== 'settled' ? 'xs-now' : ''}`}>
          <span className="xs-dot">{i < idx || status === 'settled' ? <CheckCircle2 size={16} /> : i + 1}</span><span>{step.label}</span>
        </li>
      ))}
    </ol>
  );
}

/** The maths, in plain words, so nobody has to trust a black box. */
