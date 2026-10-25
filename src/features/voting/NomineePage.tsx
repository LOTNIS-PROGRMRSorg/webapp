import { ShareBar } from '@/components/share/ShareBar';
import { useState } from 'react';
import { Link2, Trophy } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { cedis, fmtDate } from '@/features/events/eventUi';
import { Seo } from '@/lib/seo/seo';
import { categoryPath, nomineePath, origin, shareText } from './votingShared';
import { Avatar, RankBadge } from './RankBadge';
import { VoteCheckout, VoteStepper } from './VoteCheckout';
import { PageFrame, statusLine, usePage } from './votePageShared';

// ── Contestant page — the link a contestant shares ───────────────────────────

export function NomineePage() {
  const { slug = '', categoryId = '', nomineeId = '' } = useParams();
  const { page, error } = usePage(slug, categoryId, nomineeId);
  const [count, setCount] = useState(10);

  if (error || !page || !page.nominee)
    return (
      <PageFrame error={error}>
        <div className="page">
          <div className="skeleton-hero" />
        </div>
      </PageFrame>
    );
  const { event, category, voting, nominee } = page;
  const url = `${origin()}${nomineePath(event.slug, category.id, nominee.id)}`;
  const canVote = voting.open && event.status === 'published';
  const price = cedis(category.price_per_vote, event.currency);
  const total = count * category.price_per_vote;

  return (
    <div className="page ev-nomineepage">
      <Seo
        title={`Vote for ${nominee.name} as ${category.name} — ${event.title}`}
        description={`Vote for ${nominee.name} as ${category.name} at ${event.title}. A vote costs ${price}.`}
        path={nomineePath(event.slug, category.id, nominee.id)}
        image={nominee.photo_url || event.cover_image_url}
        imageAlt={nominee.name}
      />
      <Link className="back-link" to={categoryPath(event.slug, category.id)}>
        ← All contestants in {category.name}
      </Link>
      <div className="ev-nominee-hero">
        <div className="ev-nominee-photo">
          <Avatar nominee={nominee} className="avatar-hero" />
          {nominee.rank != null && (nominee.votes ?? 0) > 0 && (
            <span className="ev-contestant-rank">
              <RankBadge rank={nominee.rank} size="lg" />
            </span>
          )}
        </div>
        <div className="ev-nominee-info">
          <span className="eyebrow">
            <Trophy size={13} /> {event.title}
          </span>
          <h1>Vote for {nominee.name}</h1>
          <p className="ev-nominee-as">
            as <b>{category.name}</b>
          </p>
          <p className="muted-inline">
            {fmtDate(event.starts_at)} · {event.venue_name}, {event.city}
          </p>
          {nominee.bio && <p className="ev-desc">{nominee.bio}</p>}
          <div className="ev-votemeta">
            <span className="pill pill-big">A vote costs {price}</span>
            {nominee.votes != null && (
              <span className="pill pill-big">
                {nominee.votes.toLocaleString()} votes
                {nominee.rank ? ` · #${nominee.rank} of ${category.nominee_count}` : ''}
              </span>
            )}
            {nominee.code && <span className="pill pill-big">Code {nominee.code}</span>}
          </div>
          {event.fee_mode === 'on_top' && (
            <p className="muted-inline">
              A {voting.vote_commission_percent}% Lotnis service fee and a small payment-processing fee are added at
              checkout.
            </p>
          )}
          <p className={`ev-votestatus ${canVote ? 'ev-open' : 'ev-closed'}`}>{statusLine(page)}</p>
        </div>
      </div>

      {canVote ? (
        <section className="ev-section ev-nominee-vote">
          <h2>How many votes?</h2>
          <VoteStepper value={count} onChange={setCount} label={`Votes for ${nominee.name}`} />
          <p className="muted-inline">
            {count} vote{count === 1 ? '' : 's'} × {price} = <b>{cedis(total, event.currency)}</b> before fees
          </p>
          <VoteCheckout eventId={event.id} lines={count > 0 ? [{ nominee_id: nominee.id, votes: count }] : []} />
        </section>
      ) : (
        <div className="empty-state">
          Voting isn't open right now. <Link to={categoryPath(event.slug, category.id)}>See the contestants</Link>.
        </div>
      )}

      <section className="ev-sharecard">
        <div>
          <h2>
            <Link2 size={18} /> Share {nominee.name}'s link
          </h2>
          <p className="muted-inline">
            When it's shared, the preview shows {nominee.name}'s picture and "Vote for {nominee.name} as {category.name}
            ".
          </p>
          <code>{url}</code>
        </div>
        <ShareBar
          url={url}
          title={`Vote for ${nominee.name}`}
          text={shareText(nominee.name, category.name, event.title, price, url)}
        />
      </section>
      <div className="bk-actions bk-actions-center">
        <Link className="button button-quiet" to={categoryPath(event.slug, category.id)}>
          See everyone in {category.name}
        </Link>
        <Link className="button button-quiet" to={`/events/${event.slug}`}>
          Event page
        </Link>
      </div>
    </div>
  );
}
