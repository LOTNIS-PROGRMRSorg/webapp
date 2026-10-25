import { useCallback, useState } from 'react';

export interface Step<K extends string = string> { key: K; label: string }

/**
 * The state of a multi-step form. Give it the steps and a `validate(stepKey)` that returns a message
 * (or '' when the step is fine). Moving forward runs that step's check; moving back never does.
 */
export function useStepper<K extends string>(steps: Array<Step<K>>, validate: (key: K) => string, opts: { freeJump?: boolean } = {}) {
  const [index, setIndex] = useState(0);
  const [reached, setReached] = useState(0);
  const [error, setError] = useState('');
  const last = index === steps.length - 1;

  const go = useCallback((i: number) => { setError(''); setIndex(i); if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' }); }, []);
  const next = useCallback(() => {
    const problem = validate(steps[index].key);
    if (problem) { setError(problem); return false; }
    setReached((r) => Math.max(r, index + 1)); go(index + 1); return true;
  }, [index, steps, validate, go]);
  const back = useCallback(() => go(Math.max(0, index - 1)), [index, go]);
  /** Jump from the step indicator: backwards is always fine; forwards must pass each step unless `freeJump`. */
  const jump = useCallback((i: number) => {
    if (i === index) return;
    if (i < index || opts.freeJump || i <= reached) { go(i); return; }
    next();
  }, [index, reached, opts.freeJump, go, next]);
  /** Check every step; if one fails, show it and return false. */
  const validateAll = useCallback(() => {
    for (let i = 0; i < steps.length; i++) { const problem = validate(steps[i].key); if (problem) { setIndex(i); setError(problem); return false; } }
    setError(''); return true;
  }, [steps, validate]);

  return { index, key: steps[index].key, steps, last, error, setError, next, back, jump, go, validateAll, reached };
}
