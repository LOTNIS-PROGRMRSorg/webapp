import { ShareBar } from '@/components/share/ShareBar';
import { useMemo, useState } from 'react';
import { Trophy } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { cedis, fmtDate } from '@/features/events/eventUi';
import { Seo } from '@/lib/seo/seo';
import { categoryPath, nomineePath, origin, shareText } from './votingShared';
import { Avatar, RankBadge } from './RankBadge';
import { VoteCheckout, VoteStepper } from './VoteCheckout';
import { Podium } from './Leaderboard';
import { PageFrame, costLine, statusLine, usePage } from './votePageShared';

export function CategoryPage() {
  const { slug = '', categoryId = '' } = useParams();
  const { page, error } = usePage(slug, categoryId);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const lines = useMemo(() => Object.entries(votes).filter(([, n]) => n > 0).map(([nominee_id, n]) => ({ nominee_id, votes: n })), [votes]);

  if (error || !page) return <PageFrame error={error}><div className="page"><div className="skeleton-hero" /></div></PageFrame>;
  const { event, category, voting, nominees } = page;
  const url = `${origin()}${categoryPath(event.slug, category.id)}`;
  const canVote = voting.open && event.status === 'published';
  const max = Math.max(1, ...nominees.map((n) => n.votes ?? 0));

  return (
    <div className="page ev-votepage">
      <Seo title={`Vote for ${category.name} — ${event.title}`} description={`Vote for your favourite in ${category.name} at ${event.title}. ${costLine(page)}.`} path={categoryPath(event.slug, category.id)} image={event.cover_image_url} imageAlt={event.title} />
      <Link className="back-link" to={`/events/${event.slug}?tab=vote`}>← {event.title}</Link>
      <header className="ev-votehead">
        <div>
          <span className="eyebrow"><Trophy size={13} /> Category</span>
          <h1>{category.name}</h1>
          <p className="lead">{event.title} · {fmtDate(event.starts_at)} · {event.venue_name}, {event.city}</p>
          {category.description && <p className="muted-inline">{category.description}</p>}
          <div className="ev-votemeta"><span className="pill">{costLine(page)}</span><span className="pill">{category.nominee_count} contestant{category.nominee_count === 1 ? '' : 's'}</span>{category.total_votes != null && <span className="pill">{category.total_votes.toLocaleString()} votes so far</span>}</div>
          <p className={`ev-votestatus ${canVote ? 'ev-open' : 'ev-closed'}`}>{statusLine(page)}{!voting.show_counts && ' Vote counts are hidden until voting closes.'}</p>
        </div>
        <ShareBar url={url} title={`${category.name} — ${event.title}`} text={`Vote in ${category.name} at ${event.title}! ${costLine(page)}. ${url}`} />
      </header>

      {voting.show_counts && <Podium nominees={nominees} slug={event.slug} categoryId={category.id} />}

      <div className="ev-nominees ev-nominees-grid">
        {nominees.map((n) => {
          const mine = votes[n.id] ?? 0;
          const link = `${origin()}${nomineePath(event.slug, category.id, n.id)}`;
          return (
            <article className={`ev-contestant ${mine > 0 ? 'ev-nominee-on' : ''}`} key={n.id}>
              <Link to={nomineePath(event.slug, category.id, n.id)} className="ev-contestant-photo">
                <Avatar nominee={n} className="avatar-xl" />
                {n.rank != null && (n.votes ?? 0) > 0 && <span className="ev-contestant-rank"><RankBadge rank={n.rank} size="md" /></span>}
              </Link>
              <div className="ev-contestant-body">
                <Link to={nomineePath(event.slug, category.id, n.id)}><b>{n.name}</b></Link>
                {n.code && <small>Code {n.code}</small>}
                {n.bio && <p>{n.bio}</p>}
                {n.votes != null && <div className="ev-bar" title={`${n.votes} votes`}><i style={{ width: `${Math.round((n.votes / max) * 100)}%` }} /><span>{n.votes.toLocaleString()} votes</span></div>}
              </div>
              {canVote && <VoteStepper value={mine} onChange={(v) => setVotes({ ...votes, [n.id]: v })} label={`Votes for ${n.name}`} />}
              <ShareBar compact url={link} title={`Vote for ${n.name}`} text={shareText(n.name, category.name, event.title, cedis(category.price_per_vote, event.currency), link)} />
            </article>);
        })}
      </div>
      {canVote && <VoteCheckout eventId={event.id} lines={lines} onClear={() => setVotes({})} />}
    </div>
  );
}
