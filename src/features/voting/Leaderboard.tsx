import { ArrowRight, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cedis } from '@/features/events/eventUi';
import { EventDetail, Nominee } from '@/lib/api/events';
import { categoryPath, clientVotingState, nomineePath, votingMessage } from './votingShared';
import { Avatar, MEDAL, RankBadge } from './RankBadge';

// ── Leaderboard (event page → Vote tab) ───────────────────────────────────────

export function Podium({ nominees, slug, categoryId }: { nominees: Nominee[]; slug: string; categoryId: string }) {
  const top = nominees.filter((n) => n.rank != null && n.rank <= 3 && (n.votes ?? 0) > 0).slice(0, 3);
  if (!top.length) return null;
  return (
    <div className="ev-podium">
      {top.map((n) => (
        <Link
          key={n.id}
          to={nomineePath(slug, categoryId, n.id)}
          className={`ev-podium-spot ev-podium-${MEDAL[n.rank as 1 | 2 | 3].cls}`}
        >
          <RankBadge rank={n.rank} size="lg" />
          <Avatar nominee={n} className="avatar-lg" />
          <b>{n.name}</b>
          <span>{(n.votes ?? 0).toLocaleString()} votes</span>
        </Link>
      ))}
    </div>
  );
}

export function Leaderboard({ ev }: { ev: EventDetail }) {
  const v = ev.voting!;
  return (
    <section className="ev-section">
      {(() => {
        const m = votingMessage(
          v.state ??
            (v.open
              ? 'open'
              : clientVotingState({ status: ev.status, voting_opens_at: v.opens_at, voting_closes_at: v.closes_at })),
          v.opens_at,
          v.closes_at,
          ev.is_owner,
        );
        return (
          <div className={`callout ${m.ok ? '' : 'callout-warn'}`}>
            <Trophy size={22} />
            <div>
              <b>{m.title}</b>
              <p>
                {m.body} Pick a category to see every contestant and vote. Votes are final once paid.
                {!v.show_counts && ' Results are hidden until voting closes.'}
              </p>
            </div>
          </div>
        );
      })()}
      {v.categories.map((c) => (
        <div className="ev-cat ev-cat-board" key={c.id}>
          <div className="ev-cat-head">
            <h3>
              <Link to={categoryPath(ev.slug, c.id)}>{c.name}</Link>
            </h3>
            <span className="pill">{cedis(c.price_per_vote, ev.currency)} / vote</span>
            <Link className="button button-secondary ev-cat-go" to={categoryPath(ev.slug, c.id)}>
              {v.open && c.is_open ? 'Vote' : 'View'} · {c.nominees.length} contestant
              {c.nominees.length === 1 ? '' : 's'} <ArrowRight size={15} />
            </Link>
          </div>
          {c.description && <p className="muted-inline">{c.description}</p>}
          {v.show_counts ? <Podium nominees={c.nominees} slug={ev.slug} categoryId={c.id} /> : null}
          {(!v.show_counts || !c.nominees.some((n) => (n.votes ?? 0) > 0)) && (
            <div className="ev-faces">
              {c.nominees.slice(0, 6).map((n) => (
                <Link key={n.id} to={nomineePath(ev.slug, c.id, n.id)} className="ev-face" title={n.name}>
                  <Avatar nominee={n} />
                  <span>{n.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
