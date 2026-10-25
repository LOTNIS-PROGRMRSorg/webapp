import { Copy, Medal } from 'lucide-react';
import { Nominee } from '@/lib/api/events';

export const MEDAL = {
  1: { label: 'Gold', cls: 'gold' },
  2: { label: 'Silver', cls: 'silver' },
  3: { label: 'Bronze', cls: 'bronze' },
} as const;

/** A gold / silver / bronze badge for ranks 1–3; plain number otherwise. */
export function RankBadge({ rank, size = 'md' }: { rank: number | null | undefined; size?: 'sm' | 'md' | 'lg' }) {
  if (!rank) return null;
  const m = MEDAL[rank as 1 | 2 | 3];
  return m ? (
    <span className={`ev-medal ev-medal-${m.cls} ev-medal-${size}`} title={`${m.label} — rank ${rank}`}>
      <Medal size={size === 'lg' ? 26 : size === 'sm' ? 14 : 20} />
      <b>{rank}</b>
    </span>
  ) : (
    <span className={`ev-rank ev-rank-${size}`}>#{rank}</span>
  );
}

export function Avatar({
  nominee,
  className = '',
}: {
  nominee: Pick<Nominee, 'name' | 'photo_url'>;
  className?: string;
}) {
  return nominee.photo_url ? (
    <img className={`avatar ${className}`} src={nominee.photo_url} alt={nominee.name} loading="lazy" />
  ) : (
    <span className={`avatar avatar-ph ${className}`}>{nominee.name.slice(0, 1)}</span>
  );
}

/** Copy link / WhatsApp / native share. */
