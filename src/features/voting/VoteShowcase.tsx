import { useMemo, useState } from 'react';
import { ArrowRight, Trophy, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cedis } from '@/features/events/eventUi';
import type { EventDetail } from '@/lib/api/events';
import { NomineeCard } from './NomineeCard';
import { categoryPath, clientVotingState, nomineePath, votingMessage } from './votingShared';

/** The event page's voting section: pick a category, then browse its contestants as cards. */
export function VoteShowcase({ ev }: { ev: EventDetail }) {
  const v = ev.voting!;
  const [activeId, setActiveId] = useState(v.categories[0]?.id);
  const category = v.categories.find((c) => c.id === activeId) ?? v.categories[0];
  const leader = useMemo(() => Math.max(1, ...(category?.nominees ?? []).map((n) => n.votes ?? 0)), [category]);
  const message = votingMessage(
    v.state ??
      (v.open
        ? 'open'
        : clientVotingState({ status: ev.status, voting_opens_at: v.opens_at, voting_closes_at: v.closes_at })),
    v.opens_at,
    v.closes_at,
    ev.is_owner,
  );
  if (!category) return null;
  const canVote = v.open && category.is_open;
  // Show the leaders first once the numbers are public; otherwise keep the organiser's order.
  const nominees = v.show_counts
    ? [...category.nominees].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99) || (b.votes ?? 0) - (a.votes ?? 0))
    : category.nominees;

  return (
    <section className="evd-vote" id="vote">
      <div className="evd-vote-head">
        <h2 className="evd-h2">Cast your vote</h2>
        <div className={`evd-vote-status ${message.ok ? 'is-open' : ''}`}>
          <Trophy size={16} />
          <b>{message.title}</b>
          {message.body && <span>{message.body}</span>}
        </div>
      </div>

      <div className="evd-cats" role="tablist" aria-label="Voting categories">
        {v.categories.map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={c.id === category.id}
            className={`evd-cat ${c.id === category.id ? 'is-on' : ''}`}
            onClick={() => setActiveId(c.id)}
          >
            {c.name}
            <small>{c.nominees.length}</small>
          </button>
        ))}
      </div>

      <div className="evd-cat-panel">
        <div className="evd-cat-info">
          <div>
            <h3>{category.name}</h3>
            {category.description && <p>{category.description}</p>}
          </div>
          <div className="evd-cat-meta">
            <span>
              <Users size={14} /> {category.nominees.length} contestant{category.nominees.length === 1 ? '' : 's'}
            </span>
            <span className="evd-cat-price">{cedis(category.price_per_vote, ev.currency)} / vote</span>
            <Link className="button button-primary" to={categoryPath(ev.slug, category.id)}>
              {canVote ? 'Vote now' : 'See results'} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        <div className="evd-nominees">
          {nominees.map((n) => (
            <NomineeCard
              key={n.id}
              nominee={n}
              to={nomineePath(ev.slug, category.id, n.id)}
              share={((n.votes ?? 0) / leader) * 100}
              showCounts={v.show_counts}
              canVote={canVote}
            />
          ))}
        </div>
        {!v.show_counts && <p className="evd-vote-note">Results stay hidden until voting closes. Votes are final once paid.</p>}
      </div>
    </section>
  );
}
