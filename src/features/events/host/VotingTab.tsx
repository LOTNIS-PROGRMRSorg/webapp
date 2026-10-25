import { ReactNode, useCallback, useEffect, useState } from 'react';
import { Link2, Plus, Trash2, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cedis, fmtDateTime } from '@/features/events/eventUi';
import { eventApi, HostEventOverview } from '@/lib/api/events';
import { ConfirmDialog, FieldDialog } from '@/components/modals';
import { categoryPath, clientVotingState, nomineePath, shareText, votingMessage } from '@/features/voting';
import { ShareBar } from '@/components/share/ShareBar';
import { copy, errText } from './hostShared';
import { Stat } from './OverviewTab';

export function VotingTab({ data, reload }: { data: HostEventOverview; reload: () => void }) {
  const id = data.event.id; const c = data.event.currency; const slug = data.event.slug as string;
  const [res, setRes] = useState<Awaited<ReturnType<typeof eventApi.host.votes>> | null>(null);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState<ReactNode>(null);
  const close = () => setDialog(null);
  const load = useCallback(() => eventApi.host.votes(id).then(setRes).catch((e) => setError(errText(e))), [id]);
  useEffect(() => { load(); }, [load]);
  const done = async () => { close(); await load(); reload(); };
  const linkFor = (catId: string, nomId?: string) => `${window.location.origin}${nomId ? nomineePath(slug, catId, nomId) : categoryPath(slug, catId)}`;

  const categoryDialog = (cat?: any) => setDialog(
    <FieldDialog
      title={cat ? `Edit “${cat.name}”` : 'Add a voting category'}
      intro={cat ? undefined : 'A category is one award, like “Best DJ” or “Miss Lotnis”. Each has its own price per vote and its own shareable page.'}
      fields={[
        { name: 'name', label: 'Category name', type: 'text', required: true, placeholder: 'Best Artist of the Year', maxLength: 80 },
        { name: 'description', label: 'Description', type: 'textarea', hint: 'optional — shown on the category page', rows: 3, maxLength: 500 },
        { name: 'price_per_vote', label: 'Price per vote (GH₵)', type: 'number', required: true, min: 0.1, step: '0.01', placeholder: '1.00' },
        ...(cat ? [{ name: 'is_open', label: 'Open for voting', type: 'checkbox' } as const] : []),
      ]}
      initial={cat ? { name: cat.name, description: cat.description || '', price_per_vote: String(cat.price_per_vote), is_open: cat.is_open } : {}}
      submitLabel={cat ? 'Save category' : 'Add category'}
      onSubmit={async (v) => {
        const body = { name: v.name, description: v.description, price_per_vote: Number(v.price_per_vote), ...(cat ? { is_open: v.is_open } : {}) };
        if (cat) await eventApi.host.updateCategory(cat.id, body); else await eventApi.host.addCategory(id, body);
        await done();
      }}
      onClose={close} />);

  const nomineeDialog = (cat: any, nom?: any) => setDialog(
    <FieldDialog
      title={nom ? `Edit ${nom.name}` : `Add a contestant to “${cat.name}”`}
      intro={nom ? undefined : 'Every contestant needs a picture. It shows on their voting page and in the preview when their link is shared.'}
      fields={[
        { name: 'photo_url', label: 'Picture of the contestant', type: 'photo', required: true, round: true, hint: 'A clear, front-facing photo works best.' },
        { name: 'name', label: 'Name', type: 'text', required: true, maxLength: 80, placeholder: 'Ama Owusu' },
        { name: 'code', label: 'Contestant code', type: 'text', hint: 'optional, e.g. A01', maxLength: 20 },
        { name: 'bio', label: 'A line about them', type: 'textarea', hint: 'optional', rows: 3, maxLength: 600 },
      ]}
      initial={nom ? { photo_url: nom.photo_url || '', name: nom.name, code: nom.code || '', bio: nom.bio || '' } : {}}
      submitLabel={nom ? 'Save contestant' : 'Add contestant'}
      onSubmit={async (v) => {
        const body = { name: v.name, code: v.code, bio: v.bio, photo_url: v.photo_url };
        if (nom) await eventApi.host.updateNominee(nom.id, body); else await eventApi.host.addNominee(cat.id, body);
        await done();
      }}
      onClose={close} />);

  const confirm = (title: string, body: ReactNode, label: string, work: () => Promise<unknown>) =>
    setDialog(<ConfirmDialog title={title} body={body} confirmLabel={label} danger onConfirm={async () => { await work(); await done(); }} onClose={close} />);

  return (
    <>
      <div className="page-header"><h2>Voting</h2><button className="button button-primary" onClick={() => categoryDialog()}><Plus size={16} /> Add category</button></div>
      <p className="muted-inline">Voters need only an email. Every category and every contestant has its own link to copy and share — the shared preview shows the contestant's picture. {data.event.show_vote_counts ? 'Live counts and the top 3 are public.' : 'Counts and rankings are hidden from the public until voting closes (you always see them).'} Turn counts on or off in <Link to={`/host/events/${id}/edit`}>Edit event</Link>.</p>
      {(() => { const m = votingMessage(clientVotingState(data.event), data.event.voting_opens_at, data.event.voting_closes_at, true); return (
        <div className={`callout ${m.ok ? '' : 'callout-warn'}`}><Trophy size={22} /><div><b>{m.title}</b><p>{m.body} {data.event.voting_opens_at ? `Voting starts ${fmtDateTime(data.event.voting_opens_at)}` : 'Voting has no start time, so it opens as soon as the event is published'}{data.event.voting_closes_at ? ` and ends ${fmtDateTime(data.event.voting_closes_at)}` : ' and has no end time'}. Change this in <Link to={`/host/events/${id}/edit`}>Edit event → Voting</Link>.</p></div></div>); })()}
      {error && <div className="form-error">{error}</div>}
      {res && <div className="metric-grid metric-grid-4"><Stat label="Vote orders" value={res.orders} /><Stat label="Votes" value={data.stats.votes_total.toLocaleString()} /><Stat label="Revenue" value={cedis(res.gross, c)} /><Stat label="You'll receive" value={cedis(res.host_net, c)} sub={`after ${cedis(res.commission, c)} Lotnis fee`} /></div>}
      {!res ? <div className="empty-state">Loading…</div> : res.categories.length ? res.categories.map((cat: any) => {
        const catLink = linkFor(cat.id);
        return (
          <div className="ev-cat ev-cat-host" key={cat.id}>
            <div className="ev-cat-head">
              <h3>{cat.name} {!cat.is_open && <span className="pill">Closed</span>}</h3>
              <span className="pill">{cedis(cat.price_per_vote, c)} / vote · {cat.total_votes.toLocaleString()} votes</span>
              <div className="form-actions">
                <button className="button button-quiet" onClick={() => categoryDialog(cat)}>Edit</button>
                <button className="button button-quiet" onClick={() => eventApi.host.updateCategory(cat.id, { is_open: !cat.is_open }).then(done).catch((e) => setError(errText(e)))}>{cat.is_open ? 'Close voting' : 'Reopen'}</button>
                <button className="icon-btn" aria-label="Remove category" onClick={() => confirm(`Remove “${cat.name}”?`, cat.total_votes ? 'This category already has votes, so it will be closed instead of deleted.' : 'The category and its contestants will be deleted.', cat.total_votes ? 'Close it' : 'Delete', () => eventApi.host.removeCategory(cat.id))}><Trash2 size={16} /></button>
              </div>
            </div>
            <div className="ev-linkrow"><Link2 size={15} /><code>{catLink}</code><ShareBar compact url={catLink} title={cat.name} text={`Vote in ${cat.name} at ${data.event.title}! ${cedis(cat.price_per_vote, c)} per vote. ${catLink}`} /></div>
            <div className="booking-list">{cat.nominees.map((n: any, i: number) => {
              const link = linkFor(cat.id, n.id);
              return (
                <div className="ev-nomrow" key={n.id}>
                  {n.photo_url ? <img className="avatar avatar-md" src={n.photo_url} alt={n.name} /> : <span className="avatar avatar-md avatar-ph">{n.name.slice(0, 1)}</span>}
                  <div className="ev-nomrow-info">
                    <strong>{i + 1}. {n.name} {!n.is_active && <span className="pill">Off</span>}{!n.photo_url && <span className="pill ev-pill-rejected">Picture needed</span>}</strong>
                    <small>{n.votes_count.toLocaleString()} votes{n.code ? ` · code ${n.code}` : ''}</small>
                    <div className="ev-linkrow ev-linkrow-sm"><code>{link}</code></div>
                  </div>
                  <div className="ev-nomrow-actions">
                    <ShareBar compact url={link} title={`Vote for ${n.name}`} text={shareText(n.name, cat.name, data.event.title, cedis(cat.price_per_vote, c), link)} />
                    <button className="button button-quiet" onClick={() => nomineeDialog(cat, n)}>Edit</button>
                    <button className="icon-btn" aria-label={`Remove ${n.name}`} onClick={() => confirm(`Remove ${n.name}?`, n.votes_count ? `${n.name} already has ${n.votes_count.toLocaleString()} votes, so they will be switched off (hidden) rather than deleted.` : `${n.name} will be removed from “${cat.name}”.`, n.votes_count ? 'Switch off' : 'Remove', () => eventApi.host.removeNominee(n.id))}><Trash2 size={16} /></button>
                  </div>
                </div>);
            })}</div>
            <button className="button button-secondary" onClick={() => nomineeDialog(cat)}><Plus size={15} /> Add contestant</button>
          </div>);
      }) : <div className="empty-state"><Trophy size={26} /><p>Add a category (like “Best Artist”), then its contestants with their pictures.</p><button className="button button-secondary" onClick={() => categoryDialog()}>Add your first category</button></div>}
      {dialog}
    </>
  );
}

// ── Reviews / refunds / payout tabs ───────────────────────────────────────────
