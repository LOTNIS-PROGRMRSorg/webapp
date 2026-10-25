import { ReactNode } from 'react';
import type { Tone } from '@/theme';
import { statusMeta } from '@/lib/status';

/** A small coloured label. `tone` picks the colour from the theme. */
export function Pill({
  tone = 'neutral',
  children,
  className = '',
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return <span className={`pill pill-${tone} ${className}`}>{children}</span>;
}

/** A pill for any status string ("published", "paid", "refund_pending"…) with the app-wide colour and wording. */
export function StatusPill({ status, label }: { status: string | null | undefined; label?: string }) {
  const m = statusMeta(status);
  return <Pill tone={m.tone}>{label ?? m.label}</Pill>;
}
