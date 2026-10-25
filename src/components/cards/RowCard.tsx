import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/**
 * A list row: optional picture, a title with a line or two under it, a figure on the right and actions.
 * Pass `to` to make the whole row a link (a detail page); keep actions for buttons that act in place.
 */
export function RowCard({ to, thumb, title, subtitle, meta, figure, status, actions, className = '' }: {
  to?: string; thumb?: ReactNode; title: ReactNode; subtitle?: ReactNode; meta?: ReactNode; figure?: ReactNode; status?: ReactNode; actions?: ReactNode; className?: string;
}) {
  const body = (
    <>
      <div className="row-main">
        {thumb}
        <div className="row-text"><strong>{title}</strong>{subtitle && <p>{subtitle}</p>}{meta && <small>{meta}</small>}</div>
      </div>
      {figure != null && <div className="row-figure">{figure}</div>}
      {status && <div className="row-status">{status}</div>}
      {actions && <div className="row-actions" onClick={(e) => e.stopPropagation()}>{actions}</div>}
    </>
  );
  return to
    ? <Link to={to} className={`row-card row-card-link ${className}`}>{body}</Link>
    : <div className={`row-card ${className}`}>{body}</div>;
}

export function RowList({ children }: { children: ReactNode }) { return <div className="row-list">{children}</div>; }

/** The small square picture at the start of a row. */
export function Thumb({ src, alt = '', fallback, size = 'md' }: { src?: string | null; alt?: string; fallback: ReactNode; size?: 'sm' | 'md' }) {
  return src ? <img className={`thumb thumb-${size}`} src={src} alt={alt} loading="lazy" /> : <span className={`thumb thumb-${size} thumb-ph`}>{fallback}</span>;
}
