import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cedis } from '@/features/events/eventUi';
import { eventApi, VotePage } from '@/lib/api/events';
import { errText, votingMessage } from './votingShared';

// ── Category page ────────────────────────────────────────────────────────────

export function usePage(slug: string, categoryId: string, nomineeId?: string) {
  const [page, setPage] = useState<VotePage | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { setPage(null); setError(''); eventApi.votePage(slug, categoryId, nomineeId).then(setPage).catch((e) => setError(errText(e, 'Not found'))); }, [slug, categoryId, nomineeId]);
  return { page, error };
}

export const costLine = (p: VotePage) => `${cedis(p.category.price_per_vote, p.event.currency)} per vote${p.event.fee_mode === 'on_top' ? ` + ${p.voting.vote_commission_percent}% service fee` : ''}`;
export const statusLine = (p: VotePage) => { const m = votingMessage(p.voting.state ?? (p.voting.open ? 'open' : p.voting.closed ? 'closed' : 'not_started'), p.voting.opens_at, p.voting.closes_at); return `${m.title}. ${m.body}`.trim(); };

export function PageFrame({ error, children }: { error: string; children: React.ReactNode }) {
  if (error) return <div className="page"><Link className="back-link" to="/events">← All events</Link><div className="error-state">{error}</div></div>;
  return <>{children}</>;
}
