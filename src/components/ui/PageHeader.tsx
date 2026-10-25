import { ReactNode } from 'react';

/** Eyebrow + title on the left, actions on the right. Used at the top of every host and account page. */
export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return <div className="page-header"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1></div>{children && <div className="page-header-actions">{children}</div>}</div>;
}

/** A section heading inside a page, with optional actions. */
export function SectionHeading({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="section-heading"><h2>{title}</h2>{children && <div className="section-heading-actions">{children}</div>}</div>;
}
