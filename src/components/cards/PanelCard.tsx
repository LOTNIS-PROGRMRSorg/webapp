import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/** A bordered box with a title row: "Accommodation — Manage", "Payout — See all". */
export function PanelCard({
  title,
  icon,
  action,
  children,
  className = '',
}: {
  title?: string;
  icon?: ReactNode;
  action?: { label: string; to: string };
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel-card ${className}`}>
      {title && (
        <div className="panel-card-head">
          <h2>
            {icon}
            {title}
          </h2>
          {action && <Link to={action.to}>{action.label}</Link>}
        </div>
      )}
      {children}
    </section>
  );
}
