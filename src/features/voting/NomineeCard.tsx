import { Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Nominee } from '@/lib/api/events';
import { MEDAL } from './RankBadge';

/** A contestant as a portrait card: photo, rank medal, vote share bar and a vote button. */
export function NomineeCard({
  nominee,
  to,
  share,
  showCounts,
  canVote,
}: {
  nominee: Nominee;
  to: string;
  /** 0–100, this contestant's votes relative to the leader. */
  share: number;
  showCounts: boolean;
  canVote: boolean;
}) {
  const medal = showCounts && nominee.rank && nominee.rank <= 3 && (nominee.votes ?? 0) > 0 ? MEDAL[nominee.rank as 1 | 2 | 3] : null;
  return (
    <Link to={to} className={`evd-nominee ${medal ? `is-${medal.cls}` : ''}`}>
      <div className="evd-nominee-photo">
        {nominee.photo_url ? (
          <img src={nominee.photo_url} alt={nominee.name} loading="lazy" />
        ) : (
          <span className="evd-nominee-ph">{nominee.name.slice(0, 1)}</span>
        )}
        {medal && (
          <span className="evd-nominee-medal">
            {nominee.rank === 1 ? <Crown size={14} /> : null} {medal.label}
          </span>
        )}
        {nominee.code && <span className="evd-nominee-code">#{nominee.code}</span>}
      </div>
      <div className="evd-nominee-body">
        <b>{nominee.name}</b>
        {showCounts && (
          <>
            <div className="evd-bar" aria-hidden="true">
              <i style={{ width: `${Math.max(share, 3)}%` }} />
            </div>
            <span className="evd-nominee-votes">{(nominee.votes ?? 0).toLocaleString()} votes</span>
          </>
        )}
        <span className={`evd-nominee-cta ${canVote ? '' : 'is-view'}`}>{canVote ? 'Vote' : 'View'}</span>
      </div>
    </Link>
  );
}
