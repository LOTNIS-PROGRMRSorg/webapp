import { ReactNode } from 'react';

/** One number with a label — the tiles at the top of dashboards. */
export function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: 'warn' | 'danger' | 'good';
}) {
  return (
    <div className={`stat-card ${tone ? `stat-${tone}` : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {sub && <small>{sub}</small>}
    </div>
  );
}

export function StatGrid({ children, cols = 4 }: { children: ReactNode; cols?: 3 | 4 | 5 }) {
  return <div className={`stat-grid stat-grid-${cols}`}>{children}</div>;
}
