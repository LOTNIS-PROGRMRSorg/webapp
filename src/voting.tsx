import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, Copy, Link2, Medal, Minus, Plus, Share2, Trophy } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getSession } from './api';
import { cedis, fmtDate, fmtDateTime, forgetPayment, payWithPaystack, rememberPayment } from './eventUi';
import { eventApi, EventDetail, Nominee, Quote, VotePage, VotingState } from './eventApi';
import { Seo, SITE_URL } from './seo';

// ─────────────────────────────────────────────────────────────────────────────
// Voting pages.
//   /events/:slug?tab=vote                          leaderboard: every category's top 3 on medals
//   /events/:slug/vote/:categoryId                  one category: all contestants (counts if the host shows them)
//   /events/:slug/vote/:categoryId/:nomineeId       one contestant's own page — the link they share
// Every URL is a real, shareable link; the share preview (picture + "Vote for X as Y") is produced by
// the /api/share function on Vercel, because chat apps don't run JavaScript.
// ─────────────────────────────────────────────────────────────────────────────

const errText = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);
const origin = () => (typeof window !== 'undefined' ? window.location.origin : SITE_URL);
export const categoryPath = (slug: string, categoryId: string) => `/events/${slug}/vote/${categoryId}`;
export const nomineePath = (slug: string, categoryId: string, nomineeId: string) => `/events/${slug}/vote/${categoryId}/${nomineeId}`;
export const shareText = (name: string, category: string, event: string, price: string, url: string) =>
  `Vote for ${name} as ${category} at ${event}! A vote costs ${price}. ${url}`;


/** Plain-words reason voting isn't available (or when it closes). Never calls an unpublished event "closed". */
export function votingMessage(state: VotingState, opens?: string | null, closes?: string | null, isOwner = false): { title: string; body: string; ok: boolean } {
  switch (state) {
    case 'open': return { ok: true, title: 'Voting is open', body: closes ? `Closes ${fmtDateTime(closes)}.` : '' };
    case 'not_published': return { ok: false, title: 'Voting opens once the event is published', body: isOwner ? 'Submit your event for review — voting starts as soon as it is live (and after your voting start time).' : 'This event is not on sale yet.' };
    case 'not_started': return { ok: false, title: `Voting opens ${opens ? fmtDateTime(opens) : 'soon'}`, body: closes ? `It closes ${fmtDateTime(closes)}.` : '' };
    case 'closed': return { ok: false, title: 'Voting has closed', body: closes ? `It ended ${fmtDateTime(closes)}.` : '' };
    case 'category_closed': return { ok: false, title: 'Voting in this category is closed', body: 'The organiser has closed this category.' };
    case 'cancelled': return { ok: false, title: 'This event was cancelled', body: 'Votes are refunded in full.' };
    default: return { ok: false, title: 'Voting is not available right now', body: '' };
  }
}

/** Same rule as the server's votingState, for screens that already hold the event row (host dashboard). */
export function clientVotingState(ev: { status: string; voting_opens_at?: string | null; voting_closes_at?: string | null }): VotingState {
  const now = Date.now();
  if (ev.status === 'cancelled') return 'cancelled';
  if (ev.status !== 'published') return 'not_published';
  if (ev.voting_opens_at && now < new Date(ev.voting_opens_at).getTime()) return 'not_started';
  if (ev.voting_closes_at && now > new Date(ev.voting_closes_at).getTime()) return 'closed';
  return 'open';
}

const MEDAL = { 1: { label: 'Gold', cls: 'gold' }, 2: { label: 'Silver', cls: 'silver' }, 3: { label: 'Bronze', cls: 'bronze' } } as const;

/** A gold / silver / bronze badge for ranks 1–3; plain number otherwise. */
export function RankBadge({ rank, size = 'md' }: { rank: number | null | undefined; size?: 'sm' | 'md' | 'lg' }) {
  if (!rank) return null;
  const m = MEDAL[rank as 1 | 2 | 3];
  return m
    ? <span className={`ev-medal ev-medal-${m.cls} ev-medal-${size}`} title={`${m.label} — rank ${rank}`}><Medal size={size === 'lg' ? 26 : size === 'sm' ? 14 : 20} /><b>{rank}</b></span>
    : <span className={`ev-rank ev-rank-${size}`}>#{rank}</span>;
}

function Avatar({ nominee, className = '' }: { nominee: Pick<Nominee, 'name' | 'photo_url'>; className?: string }) {
  return nominee.photo_url ? <img className={`ev-avatar ${className}`} src={nominee.photo_url} alt={nominee.name} loading="lazy" /> : <span className={`ev-avatar ev-avatar-ph ${className}`}>{nominee.name.slice(0, 1)}</span>;
}

/** Copy link / WhatsApp / native share. */
export function ShareBar({ url, text, title, compact }: { url: string; text: string; title: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); }
    catch { const t = document.createElement('textarea'); t.value = url; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); }
    setCopied(true); window.setTimeout(() => setCopied(false), 1800);
  };
  const native = typeof navigator !== 'undefined' && 'share' in navigator;
  return (
    <div className={`ev-sharebar ${compact ? 'ev-sharebar-compact' : ''}`}>
      <button type="button" className="button button-secondary" onClick={copy}>{copied ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy link</>}</button>
      <a className="button button-quiet" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(text)}`}>WhatsApp</a>
      {native && <button type="button" className="button button-quiet" onClick={() => navigator.share({ title, text, url }).catch(() => {})}><Share2 size={15} /> Share</button>}
    </div>
  );
}

// ── Vote checkout (shared by the category page and the contestant page) ───────

export function VoteCheckout({ eventId, lines, onClear }: { eventId: string; lines: Array<{ nominee_id: string; votes: number }>; onClear?: () => void }) {
  const navigate = useNavigate();
  const session = getSession();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [email, setEmail] = useState(session?.email || '');
  const [name, setName] = useState('');
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const key = JSON.stringify(lines);

  useEffect(() => {
    if (!lines.length) { setQuote(null); return; }
    const t = window.setTimeout(() => eventApi.voteQuote(eventId, lines).then((q) => { setQuote(q); setError(''); }).catch((e) => { setQuote(null); setError(errText(e, 'Unable to price your votes')); }), 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, key]);

  if (!lines.length) return null;
  const pay = async () => {
    setError('');
    if (!/^\S+@\S+\.\S{2,}$/.test(email.trim())) { setError('Enter your email — your vote receipt goes there.'); return; }
    if (!agree) { setError('Please accept the voting terms to continue.'); return; }
    setBusy(true);
    try {
      const res = await eventApi.voteCheckout(eventId, { email: email.trim(), name: name.trim() || undefined, votes: lines, accepted_terms: true });
      const reference = await payWithPaystack({ email: email.trim(), amountPesewas: res.amount_pesewas ?? 0, currency: res.currency || 'GHS', reference: res.reference!, orderId: res.order_id });
      if (!reference) { setError('Payment window closed. You have not been charged.'); return; }
      rememberPayment(res.order_id, reference, res.access_token);
      await eventApi.confirm(res.order_id, reference, res.access_token);
      forgetPayment(res.order_id);
      navigate(`/orders/${res.order_id}?token=${res.access_token}`);
    } catch (e) { setError(errText(e, 'Something went wrong. Please try again.')); } finally { setBusy(false); }
  };

  return (
    <div className="ev-checkout ev-votecart">
      {quote ? <div className="ev-lines">
        {quote.lines.map((l) => <div key={l.nominee}><span>{l.votes} vote{(l.votes ?? 0) > 1 ? 's' : ''} · {l.nominee}</span><b>{cedis(l.amount, quote.currency)}</b></div>)}
        {quote.service_fee > 0 && <div><span>Lotnis service fee</span><b>{cedis(quote.service_fee, quote.currency)}</b></div>}
        {quote.processing_fee > 0 && <div><span>Payment processing</span><b>{cedis(quote.processing_fee, quote.currency)}</b></div>}
        <div className="ev-total"><span>Total</span><b>{cedis(quote.total, quote.currency)}</b></div>
      </div> : <div className="muted-inline">Pricing your votes…</div>}
      <div className="two">
        <label className="fld">Email <small>for your receipt</small><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" /></label>
        <label className="fld">Name <small>optional</small><input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
      </div>
      {!session && <div className="notice"><span>No account needed. <Link to="/auth">Sign in</Link> to keep your receipts together.</span></div>}
      <label className="check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> <span>I understand votes are final once paid and are only refunded if voting is cancelled.</span></label>
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="bk-actions">
        <button className="button button-primary button-lg" disabled={busy || !quote} onClick={pay}>{busy ? 'Working…' : quote ? `Pay ${cedis(quote.total, quote.currency)}` : 'Pay'} <ArrowRight size={18} /></button>
        {onClear && <button type="button" className="button button-quiet" onClick={onClear}>Clear</button>}
      </div>
    </div>
  );
}

function VoteStepper({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  const clamp = (n: number) => Math.max(0, Math.min(10000, n));
  return (
    <div className="ev-vote-ctl">
      <div className="ev-stepper"><button type="button" onClick={() => onChange(clamp(value - 1))} aria-label="Fewer votes"><Minus size={16} /></button>
        <input aria-label={label} inputMode="numeric" value={value} onChange={(e) => onChange(clamp(Number(e.target.value.replace(/\D/g, '')) || 0))} />
        <button type="button" onClick={() => onChange(clamp(value + 1))} aria-label="More votes"><Plus size={16} /></button></div>
      <div className="ev-quick">{[5, 10, 50, 100].map((k) => <button type="button" key={k} onClick={() => onChange(clamp(value + k))}>+{k}</button>)}</div>
    </div>
  );
}

// ── Leaderboard (event page → Vote tab) ───────────────────────────────────────

function Podium({ nominees, slug, categoryId }: { nominees: Nominee[]; slug: string; categoryId: string }) {
  const top = nominees.filter((n) => n.rank != null && n.rank <= 3 && (n.votes ?? 0) > 0).slice(0, 3);
  if (!top.length) return null;
  return (
    <div className="ev-podium">
      {top.map((n) => (
        <Link key={n.id} to={nomineePath(slug, categoryId, n.id)} className={`ev-podium-spot ev-podium-${MEDAL[n.rank as 1 | 2 | 3].cls}`}>
          <RankBadge rank={n.rank} size="lg" />
          <Avatar nominee={n} className="ev-avatar-lg" />
          <b>{n.name}</b>
          <span>{(n.votes ?? 0).toLocaleString()} votes</span>
        </Link>))}
    </div>
  );
}

export function Leaderboard({ ev }: { ev: EventDetail }) {
  const v = ev.voting!;
  return (
    <section className="ev-section">
      {(() => { const m = votingMessage(v.state ?? (v.open ? 'open' : clientVotingState({ status: ev.status, voting_opens_at: v.opens_at, voting_closes_at: v.closes_at })), v.opens_at, v.closes_at, ev.is_owner); return (
        <div className={`bk-callout ${m.ok ? '' : 'bk-callout-warm'}`}><Trophy size={22} /><div>
          <b>{m.title}</b>
          <p>{m.body} Pick a category to see every contestant and vote. Votes are final once paid.{!v.show_counts && ' Results are hidden until voting closes.'}</p></div></div>); })()}
      {v.categories.map((c) => (
        <div className="ev-cat ev-cat-board" key={c.id}>
          <div className="ev-cat-head">
            <h3><Link to={categoryPath(ev.slug, c.id)}>{c.name}</Link></h3>
            <span className="pill">{cedis(c.price_per_vote, ev.currency)} / vote</span>
            <Link className="button button-secondary ev-cat-go" to={categoryPath(ev.slug, c.id)}>{v.open && c.is_open ? 'Vote' : 'View'} · {c.nominees.length} contestant{c.nominees.length === 1 ? '' : 's'} <ArrowRight size={15} /></Link>
          </div>
          {c.description && <p className="muted-inline">{c.description}</p>}
          {v.show_counts ? <Podium nominees={c.nominees} slug={ev.slug} categoryId={c.id} /> : null}
          {(!v.show_counts || !c.nominees.some((n) => (n.votes ?? 0) > 0)) && <div className="ev-faces">{c.nominees.slice(0, 6).map((n) => <Link key={n.id} to={nomineePath(ev.slug, c.id, n.id)} className="ev-face" title={n.name}><Avatar nominee={n} /><span>{n.name}</span></Link>)}</div>}
        </div>))}
    </section>
  );
}

// ── Category page ────────────────────────────────────────────────────────────

function usePage(slug: string, categoryId: string, nomineeId?: string) {
  const [page, setPage] = useState<VotePage | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { setPage(null); setError(''); eventApi.votePage(slug, categoryId, nomineeId).then(setPage).catch((e) => setError(errText(e, 'Not found'))); }, [slug, categoryId, nomineeId]);
  return { page, error };
}

const costLine = (p: VotePage) => `${cedis(p.category.price_per_vote, p.event.currency)} per vote${p.event.fee_mode === 'on_top' ? ` + ${p.voting.vote_commission_percent}% service fee` : ''}`;
const statusLine = (p: VotePage) => { const m = votingMessage(p.voting.state ?? (p.voting.open ? 'open' : p.voting.closed ? 'closed' : 'not_started'), p.voting.opens_at, p.voting.closes_at); return `${m.title}. ${m.body}`.trim(); };

function PageFrame({ error, children }: { error: string; children: React.ReactNode }) {
  if (error) return <div className="page"><Link className="back-link" to="/events">← All events</Link><div className="error-state">{error}</div></div>;
  return <>{children}</>;
}

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
                <Avatar nominee={n} className="ev-avatar-xl" />
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

// ── Contestant page — the link a contestant shares ───────────────────────────

export function NomineePage() {
  const { slug = '', categoryId = '', nomineeId = '' } = useParams();
  const { page, error } = usePage(slug, categoryId, nomineeId);
  const [count, setCount] = useState(10);

  if (error || !page || !page.nominee) return <PageFrame error={error}><div className="page"><div className="skeleton-hero" /></div></PageFrame>;
  const { event, category, voting, nominee } = page;
  const url = `${origin()}${nomineePath(event.slug, category.id, nominee.id)}`;
  const canVote = voting.open && event.status === 'published';
  const price = cedis(category.price_per_vote, event.currency);
  const total = count * category.price_per_vote;

  return (
    <div className="page ev-nomineepage">
      <Seo title={`Vote for ${nominee.name} as ${category.name} — ${event.title}`} description={`Vote for ${nominee.name} as ${category.name} at ${event.title}. A vote costs ${price}.`} path={nomineePath(event.slug, category.id, nominee.id)} image={nominee.photo_url || event.cover_image_url} imageAlt={nominee.name} />
      <Link className="back-link" to={categoryPath(event.slug, category.id)}>← All contestants in {category.name}</Link>
      <div className="ev-nominee-hero">
        <div className="ev-nominee-photo">
          <Avatar nominee={nominee} className="ev-avatar-hero" />
          {nominee.rank != null && (nominee.votes ?? 0) > 0 && <span className="ev-contestant-rank"><RankBadge rank={nominee.rank} size="lg" /></span>}
        </div>
        <div className="ev-nominee-info">
          <span className="eyebrow"><Trophy size={13} /> {event.title}</span>
          <h1>Vote for {nominee.name}</h1>
          <p className="ev-nominee-as">as <b>{category.name}</b></p>
          <p className="muted-inline">{fmtDate(event.starts_at)} · {event.venue_name}, {event.city}</p>
          {nominee.bio && <p className="ev-desc">{nominee.bio}</p>}
          <div className="ev-votemeta">
            <span className="pill pill-big">A vote costs {price}</span>
            {nominee.votes != null && <span className="pill pill-big">{nominee.votes.toLocaleString()} votes{nominee.rank ? ` · #${nominee.rank} of ${category.nominee_count}` : ''}</span>}
            {nominee.code && <span className="pill pill-big">Code {nominee.code}</span>}
          </div>
          {event.fee_mode === 'on_top' && <p className="muted-inline">A {voting.vote_commission_percent}% Lotnis service fee and a small payment-processing fee are added at checkout.</p>}
          <p className={`ev-votestatus ${canVote ? 'ev-open' : 'ev-closed'}`}>{statusLine(page)}</p>
        </div>
      </div>

      {canVote ? <section className="ev-section ev-nominee-vote">
        <h2>How many votes?</h2>
        <VoteStepper value={count} onChange={setCount} label={`Votes for ${nominee.name}`} />
        <p className="muted-inline">{count} vote{count === 1 ? '' : 's'} × {price} = <b>{cedis(total, event.currency)}</b> before fees</p>
        <VoteCheckout eventId={event.id} lines={count > 0 ? [{ nominee_id: nominee.id, votes: count }] : []} />
      </section> : <div className="empty-state">Voting isn't open right now. <Link to={categoryPath(event.slug, category.id)}>See the contestants</Link>.</div>}

      <section className="ev-sharecard">
        <div><h2><Link2 size={18} /> Share {nominee.name}'s link</h2><p className="muted-inline">When it's shared, the preview shows {nominee.name}'s picture and "Vote for {nominee.name} as {category.name}".</p><code>{url}</code></div>
        <ShareBar url={url} title={`Vote for ${nominee.name}`} text={shareText(nominee.name, category.name, event.title, price, url)} />
      </section>
      <div className="bk-actions bk-actions-center"><Link className="button button-quiet" to={categoryPath(event.slug, category.id)}>See everyone in {category.name}</Link><Link className="button button-quiet" to={`/events/${event.slug}`}>Event page</Link></div>
    </div>
  );
}
