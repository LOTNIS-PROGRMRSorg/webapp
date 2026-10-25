import { ReactNode } from 'react';

export const errText = (e: unknown, fallback = 'Something went wrong') => (e instanceof Error ? e.message : fallback);
export const Stat = ({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) => (
  <div>
    <span>{label}</span>
    <strong>{value}</strong>
    {sub && <small>{sub}</small>}
  </div>
);
