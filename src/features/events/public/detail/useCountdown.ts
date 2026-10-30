import { useEffect, useState } from 'react';

export type Countdown = { days: number; hours: number; minutes: number; seconds: number; done: boolean };

const split = (ms: number): Countdown => {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    done: total === 0,
  };
};

/** Time left until `target`, re-rendered on the second. */
export function useCountdown(target: string): Countdown {
  const at = new Date(target).getTime();
  const [left, setLeft] = useState(() => split(at - Date.now()));
  useEffect(() => {
    const tick = () => setLeft(split(at - Date.now()));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [at]);
  return left;
}
