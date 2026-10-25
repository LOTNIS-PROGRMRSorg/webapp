import { ReactNode } from 'react';

/** An inline message. `tone` decides the colour; use `danger` for errors, `ok` for success. */
export function Notice({ tone = 'info', icon, children }: { tone?: 'info' | 'ok' | 'warn' | 'danger'; icon?: ReactNode; children: ReactNode }) {
  return <div className={`notice notice-${tone}`} role={tone === 'danger' ? 'alert' : undefined}>{icon}<span>{children}</span></div>;
}

/** A larger callout with a title: "Voting is open", "Postponed"… */
export function Callout({ tone = 'ok', icon, title, children }: { tone?: 'ok' | 'warn' | 'danger'; icon?: ReactNode; title: string; children?: ReactNode }) {
  return <div className={`callout callout-${tone}`}>{icon}<div><b>{title}</b>{children && <p>{children}</p>}</div></div>;
}
