import { ReactNode } from 'react';

export function EmptyState({ icon, children, action }: { icon?: ReactNode; children: ReactNode; action?: ReactNode }) {
  return <div className="empty-state">{icon}<p>{children}</p>{action}</div>;
}
export function ErrorState({ children }: { children: ReactNode }) {
  return <div className="error-state" role="alert">{children}</div>;
}
export function LoadingState({ children = 'Loading…' }: { children?: ReactNode }) {
  return <div className="empty-state" aria-busy="true">{children}</div>;
}
