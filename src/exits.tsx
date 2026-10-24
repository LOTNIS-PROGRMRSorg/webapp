import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Camera, CheckCircle2, Clock, DoorOpen, Gavel, Home, LogOut, MessageSquare, ShieldCheck, Undo2, User, X } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from './api';
import { money } from './format';
import type { Booking, ExitCaseDetail, ExitCaseSummary, ExitDeduction, ExitSettlement, ExitStatus } from './types';

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Accra' });
const addDays = (iso: string, n: number) => new Date(new Date(`${iso}T00:00:00Z`).getTime() + n * 86_400_000).toISOString().slice(0, 10);
const nights = (n: number) => `${n} night${n === 1 ? '' : 's'}`;
const when = (iso: string) => new Date(iso).toLocaleString('en-GH', { dateStyle: 'medium', timeStyle: 'short' });

import { STATUS_LABEL } from './exitLabels';

const STEPS: Array<{ key: string; label: string; match: ExitStatus[] }> = [
  { key: 'notice', label: 'Notice', match: ['notice_given'] },
  { key: 'host', label: 'Host response', match: ['host_responded'] },
  { key: 'out', label: 'Move-out', match: ['moved_out'] },
  { key: 'deposit', label: 'Deposit review', match: ['in_dispute'] },
  { key: 'done', label: 'Settled', match: ['settled'] },
];

const REASONS = [
  ['relocation', 'Relocating or plans changed'], ['emergency', 'Emergency'], ['dissatisfied', 'Not what I expected'],
  ['host_issue', 'Problem with the host or space'], ['other', 'Something else'],
];
const EVENT_COPY: Record<string, string> = {
  notice_given: 'gave notice to leave early', withdrawn: 'withdrew the notice', host_responded: 'responded to the notice',
  moved_out: 'confirmed the move-out', checkout_started: 'started the checkout', deduction_proposed: 'listed a deposit deduction',
  deduction_accepted: 'accepted a deduction', deduction_disputed: 'disputed a deduction', deduction_ruled: 'ruled on a deduction',
  flags_changed: 'updated the case', settled: 'settled the case',
};
const ROLE_LABEL: Record<string, string> = { guest: 'Guest', host: 'Host', admin: 'Lotnis', system: 'System' };

function Stepper({ status }: { status: ExitStatus }) {
  const idx = status === 'withdrawn' ? -1 : Math.max(0, STEPS.findIndex((s) => s.match.includes(status)));
  return (
    <ol className="xs" aria-label="Case progress">
      {STEPS.map((step, i) => (
        <li key={step.key} className={`xs-step ${i < idx || status === 'settled' ? 'xs-done' : ''} ${i === idx && status !== 'settled' ? 'xs-now' : ''}`}>
          <span className="xs-dot">{i < idx || status === 'settled' ? <CheckCircle2 size={16} /> : i + 1}</span><span>{step.label}</span>
        </li>
      ))}
    </ol>
  );
}

/** The maths, in plain words, so nobody has to trust a black box. */
export function SettlementCard({ s, title = 'How it adds up', host = false }: { s: ExitSettlement; title?: string; host?: boolean }) {
  const c = s.currency;
  return (
    <div className="settle-card">
      <h3>{title}</h3>
      <div className="settle-rows">
        <div><span>You stay for</span><strong>{nights(s.nights_stayed)}</strong></div>
        {s.notice_nights_charged > 0 && <div><span>Notice not given in advance</span><strong>+ {nights(s.notice_nights_charged)}</strong></div>}
        {s.relet_credit_nights > 0 && <div><span>Re-let by the host (credited back)</span><strong className="pos">− {nights(s.relet_credit_nights)}</strong></div>}
        <div className="settle-sep"><span>Booked</span><strong>{nights(s.nights_total)}</strong></div>
        <div><span>Unused nights refunded</span><strong>{nights(s.nights_refunded)}</strong></div>
        <div><span>Unused rent</span><strong>{money(c, s.rent_refund)}</strong></div>
        {s.fee_refund > 0 && <div><span>Service fee refunded</span><strong>{money(c, s.fee_refund)}</strong></div>}
        {s.deposit_held > 0 && <div><span>Deposit{s.deductions_total ? ` (less ${money(c, s.deductions_total)} deductions)` : ' (returned after move-out)'}</span><strong>{money(c, s.deposit_returned ?? s.deposit_held)}</strong></div>}
        <div className="settle-total"><span>{host ? 'Refund to guest' : 'You get back'}</span><strong>{money(c, s.total_refund ?? s.rent_refund + s.fee_refund + (s.deposit_returned ?? s.deposit_held))}</strong></div>
        {host && <div><span>You keep (after commission)</span><strong>{money(c, s.host_receives)}</strong></div>}
      </div>
      <small>The Lotnis service fee is not refunded unless the host is found at fault. Refunds are sent by Lotnis, who notify you when it's on its way.</small>
    </div>
  );
}

// ── Guest: give notice ────────────────────────────────────────────────────────

export function LeaveEarlyPage() {
  const { bookingId = '' } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('relocation');
  const [reason, setReason] = useState('');
  const [preview, setPreview] = useState<ExitSettlement | null>(null);
  const [previewError, setPreviewError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.getMyBooking(bookingId).then(setBooking).catch((e) => setError(e.message)); }, [bookingId]);
  useEffect(() => {
    setPreview(null); setPreviewError('');
    if (!date) return;
    const t = window.setTimeout(() => api.previewExit(bookingId, date).then(setPreview).catch((e) => setPreviewError(e.message)), 250);
    return () => window.clearTimeout(t);
  }, [bookingId, date]);

  const min = useMemo(() => (booking ? [today(), addDays(booking.start_date, 1)].sort().pop()! : today()), [booking]);
  const max = booking ? addDays(booking.end_date, -1) : undefined;

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setError('');
    try { const exit = await api.giveNotice({ booking_id: bookingId, planned_checkout: date, reason_category: category, reason: reason.trim() || undefined }); navigate(`/moveouts/${exit.id}`, { replace: true }); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to record your notice'); setBusy(false); }
  };

  if (error && !booking) return <section className="page"><div className="error-state">{error}</div></section>;
  if (!booking) return <section className="page"><div className="empty-state">Loading…</div></section>;

  return (
    <section className="page">
      <Link className="back-link" to="/trips">← My trips</Link>
      <div className="page-head"><div><span className="eyebrow">Leaving early</span><h1>Give notice for {booking.property?.name}</h1>
        <p className="lead">Your stay runs {booking.start_date} → {booking.end_date}. Tell us when you're leaving — your host and Lotnis see this straight away, so everyone can plan.</p></div></div>
      <div className="split">
        <form className="panel" onSubmit={submit}>
          <h2>When are you leaving?</h2>
          <label className="fld">Departure date
            <input type="date" required min={min} max={max} value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="fld">Why are you leaving early?
            <select value={category} onChange={(e) => setCategory(e.target.value)}>{REASONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          </label>
          <label className="fld">Tell us more <small>(optional — helps if there's a dispute)</small>
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
          <div className="notice"><ShieldCheck size={16} /><span><b>7 nights' notice</b> is fair to your host. Give it in advance and there's nothing extra to pay. If you can't, the shortfall is charged — but never past your booking end, and any nights your host re-lets are credited back. If the host is at fault, no notice charge applies.</span></div>
          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="form-actions"><Link className="button button-quiet" to="/trips">Keep my stay</Link>
            <button className="button button-primary" disabled={busy || !preview}>{busy ? 'Sending…' : 'Give notice'} <ArrowRight size={16} /></button></div>
        </form>
        <aside>
          {previewError ? <div className="form-error">{previewError}</div> : preview ? <SettlementCard s={{ ...preview, deposit_returned: preview.deposit_held, total_refund: preview.rent_refund + preview.fee_refund + preview.deposit_held }} title="Your estimate" />
            : <div className="panel panel-soft"><Clock size={20} /><p>Pick a departure date to see exactly what you'd get back — before you commit.</p></div>}
        </aside>
      </div>
    </section>
  );
}

// ── Shared case page (guest + host) ──────────────────────────────────────────

function PhotoStrip({ urls }: { urls: string[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return <>
    <div className="photo-strip">{urls.map((u) => <button type="button" key={u} onClick={() => setOpen(u)} aria-label="View evidence"><img src={u} alt="Evidence" /></button>)}</div>
    {open && <div className="lightbox" onClick={() => setOpen(null)} role="presentation"><button className="lightbox-x" aria-label="Close"><X size={20} /></button><img src={open} alt="Evidence" /></div>}
  </>;
}

function DeductionRow({ d, currency, role, onRespond }: { d: ExitDeduction; currency: string; role: string; onRespond: (id: string, response: 'accept' | 'dispute', comment?: string) => Promise<void> }) {
  const [disputing, setDisputing] = useState(false);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const open = ['proposed', 'accepted', 'disputed'].includes(d.status);
  const label = { proposed: role === 'guest' ? 'Needs your reply' : 'Awaiting guest', accepted: 'Accepted', disputed: 'Disputed', upheld: 'Upheld by Lotnis', reduced: 'Reduced by Lotnis', waived: 'Waived by Lotnis' }[d.status];
  const run = async (response: 'accept' | 'dispute') => { setBusy(true); try { await onRespond(d.id, response, comment); setDisputing(false); } finally { setBusy(false); } };
  return (
    <div className={`ded ded-${d.status}`}>
      <div className="ded-head"><strong>{d.reason}</strong><span className="ded-amt">{money(currency, d.amount)}{d.final_amount != null && d.final_amount !== d.amount ? ` → ${money(currency, d.final_amount)}` : ''}</span></div>
      <span className={`pill pill-${d.status}`}>{label}</span>
      {d.evidence_urls?.length > 0 && <PhotoStrip urls={d.evidence_urls} />}
      {d.guest_comment && <p className="ded-note"><MessageSquare size={14} /> Guest: {d.guest_comment}</p>}
      {d.admin_note && <p className="ded-note"><Gavel size={14} /> Lotnis: {d.admin_note}</p>}
      {role === 'guest' && open && d.status !== 'disputed' && (disputing ? (
        <div className="ded-dispute"><textarea rows={2} placeholder="Why do you disagree? (required)" value={comment} onChange={(e) => setComment(e.target.value)} />
          <div className="form-actions"><button className="button button-quiet" onClick={() => setDisputing(false)}>Back</button><button className="button button-danger" disabled={busy || !comment.trim()} onClick={() => run('dispute')}>Send dispute</button></div></div>
      ) : d.status === 'proposed' && (
        <div className="form-actions"><button className="button button-quiet" onClick={() => setDisputing(true)}>Dispute</button><button className="button button-primary" disabled={busy} onClick={() => run('accept')}>Accept</button></div>
      ))}
    </div>
  );
}

function HostPanel({ detail, reload }: { detail: ExitCaseDetail; reload: () => void }) {
  const { exit, booking } = detail;
  const [response, setResponse] = useState(exit.host_response ?? '');
  const [relet, setRelet] = useState(exit.relet_from ?? '');
  const [fault, setFault] = useState(exit.host_at_fault);
  const [checkout, setCheckout] = useState(exit.planned_checkout);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const run = async (key: string, work: () => Promise<unknown>) => { setBusy(key); setError(''); try { await work(); reload(); } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong'); } finally { setBusy(''); } };
  const canRespond = ['notice_given', 'host_responded'].includes(exit.status);
  return (
    <div className="panel">
      {canRespond && <>
        <h2>{exit.kind === 'early_departure' ? 'Your response' : 'Checkout'}</h2>
        {exit.kind === 'early_departure' && <>
          <label className="fld">Message to the guest <textarea rows={2} value={response} onChange={(e) => setResponse(e.target.value)} placeholder="e.g. Noted — please return the keys on the 12th." /></label>
          <label className="fld">Have you re-let the space? <small>From which date — those notice days are credited back to the guest so you're not paid twice.</small>
            <input type="date" min={exit.planned_checkout} max={booking.end_date} value={relet} onChange={(e) => setRelet(e.target.value)} /></label>
          <label className="check"><input type="checkbox" checked={fault} onChange={(e) => setFault(e.target.checked)} /> The space/host was at fault (no notice charge applies)</label>
          <div className="form-actions"><button className="button button-secondary" disabled={!!busy} onClick={() => run('respond', () => api.hostRespondExit(exit.id, { response, relet_from: relet || null, concede_fault: fault }))}>{busy === 'respond' ? 'Saving…' : 'Send response'}</button></div>
        </>}
        <h3>Confirm the guest has left</h3>
        <label className="fld">Checkout date <input type="date" value={checkout} min={addDays(booking.start_date, 1)} max={booking.end_date} onChange={(e) => setCheckout(e.target.value)} /></label>
        <div className="form-actions"><button className="button button-primary" disabled={!!busy} onClick={() => run('out', () => api.confirmMoveOut(exit.id, checkout))}><DoorOpen size={16} /> {busy === 'out' ? 'Saving…' : 'Confirm move-out'}</button></div>
      </>}
      {['moved_out', 'in_dispute'].includes(exit.status) && <DeductionForm exitId={exit.id} deposit={Number(booking.security_deposit ?? 0)} currency={booking.currency_snapshot} onDone={reload} />}
      {error && <div className="form-error" role="alert">{error}</div>}
    </div>
  );
}

function DeductionForm({ exitId, deposit, currency, onDone }: { exitId: string; deposit: number; currency: string; onDone: () => void }) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [photos, setPhotos] = useState<Array<{ url: string; name: string }>>([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  if (deposit <= 0) return <><h2>Deposit</h2><p className="muted-inline">This booking had no security deposit, so there is nothing to deduct. Lotnis will settle the case.</p></>;
  const upload = async (files: FileList | null) => {
    if (!files) return; setUploading(true); setError('');
    try { for (const f of Array.from(files)) { const { url } = await api.uploadExitEvidence(exitId, f); setPhotos((p) => [...p, { url, name: f.name }]); } }
    catch (e) { setError(e instanceof Error ? e.message : 'Upload failed'); } finally { setUploading(false); }
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setError('');
    try { await api.proposeDeduction(exitId, { amount: Number(amount), reason, evidence_urls: photos.map((p) => p.url) }); setAmount(''); setReason(''); setPhotos([]); onDone(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to add the deduction'); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit}>
      <h2>List a deposit deduction</h2>
      <p className="muted-inline">Deposit held: {money(currency, deposit)}. Every deduction needs a reason and photo/receipt evidence. The guest can accept or dispute each one; Lotnis decides disputes.</p>
      <div className="two"><label className="fld">Amount ({currency})<input type="number" min="1" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
        <label className="fld">What for?<input required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Broken window pane" /></label></div>
      <div className="evidence"><label className="button button-secondary"><Camera size={16} /> {uploading ? 'Uploading…' : 'Add photos / receipts'}<input hidden type="file" accept="image/*" multiple onChange={(e) => upload(e.target.files)} /></label>
        {photos.length > 0 && <div className="photo-strip">{photos.map((p) => <img key={p.url} src={p.url} alt={p.name} />)}</div>}</div>
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="form-actions"><button className="button button-primary" disabled={busy || uploading || !photos.length}>{busy ? 'Adding…' : 'Add deduction'}</button></div>
    </form>
  );
}

export function ExitCasePage() {
  const { id = '' } = useParams();
  const [detail, setDetail] = useState<ExitCaseDetail | null>(null);
  const [error, setError] = useState('');
  const load = () => api.getExit(id).then(setDetail).catch((e) => setError(e.message));
  useEffect(() => { load(); const t = window.setInterval(load, 30_000); return () => window.clearInterval(t); }, [id]);

  if (error) return <section className="page"><div className="error-state">{error}</div></section>;
  if (!detail) return <section className="page"><div className="empty-state">Loading…</div></section>;
  const { exit, booking, role, events, deductions, estimate } = detail;
  const c = booking.currency_snapshot;
  const open = !['settled', 'withdrawn'].includes(exit.status);
  const back = role === 'host' ? '/host/move-outs' : '/trips';

  const respond = async (deductionId: string, response: 'accept' | 'dispute', comment?: string) => { setDetail(await api.respondToDeduction(id, deductionId, { response, comment })); };

  return (
    <section className="page">
      <Link className="back-link" to={back}>← {role === 'host' ? 'Move-outs' : 'My trips'}</Link>
      <div className="page-head">
        <div><span className="eyebrow">{exit.kind === 'early_departure' ? 'Leaving early' : 'Checkout'} · {role === 'host' ? 'Host view' : 'Your case'}</span>
          <h1>{booking.property?.name}</h1>
          <p className="lead">{booking.start_date} → {booking.end_date}{exit.kind === 'early_departure' && <> · leaving <b>{exit.actual_checkout ?? exit.planned_checkout}</b></>}</p></div>
        <span className={`pill pill-big pill-${exit.status}`}>{STATUS_LABEL[exit.status]}</span>
      </div>
      {exit.status !== 'withdrawn' && <Stepper status={exit.status} />}

      <div className="split">
        <div className="stack">
          {exit.status === 'settled' && <div className="notice notice-ok"><CheckCircle2 size={18} /><span>Settled. {Number(exit.total_refund) > 0 ? <>A refund of <b>{money(c, exit.total_refund)}</b> is with Lotnis to send — you'll be notified when it's on its way.</> : 'No refund was due.'}{exit.admin_override_reason && <> Lotnis note: {exit.admin_override_reason}</>}</span></div>}
          {exit.host_response && <div className="panel"><h3><User size={16} /> Host says</h3><p>{exit.host_response}</p>{exit.relet_from && <small>Re-let from {exit.relet_from} — those days are credited back.</small>}</div>}
          {exit.reason && <div className="panel"><h3><LogOut size={16} /> Guest's reason</h3><p>{exit.reason}</p></div>}

          {deductions.length > 0 && <div className="panel"><h2>Deposit deductions</h2>
            <div className="ded-list">{deductions.map((d) => <DeductionRow key={d.id} d={d} currency={c} role={role} onRespond={respond} />)}</div></div>}

          {role === 'host' && open && <HostPanel detail={detail} reload={load} />}
          {role === 'guest' && ['notice_given', 'host_responded'].includes(exit.status) && (
            <div className="panel"><h3>Changed your mind?</h3><p className="muted-inline">You can withdraw your notice any time before you move out.</p>
              <div className="form-actions"><button className="button button-quiet" onClick={async () => setDetail(await api.withdrawExit(id))}><Undo2 size={16} /> Withdraw notice</button></div></div>
          )}

          <div className="panel"><h2>Timeline</h2>
            <ol className="timeline">{events.map((e) => (
              <li key={e.id}><span className={`tl-dot tl-${e.actor_role}`} /><div><b>{e.actor_name || ROLE_LABEL[e.actor_role]}</b> <span className={`pill pill-role-${e.actor_role}`}>{ROLE_LABEL[e.actor_role]}</span> {EVENT_COPY[e.event] ?? e.event}
                {e.note && <p>“{e.note}”</p>}<small>{when(e.created_at)}</small></div></li>
            ))}</ol></div>
        </div>
        <aside className="stack">
          {estimate && open && <SettlementCard s={estimate} host={role === 'host'} title={exit.status === 'moved_out' || exit.status === 'in_dispute' ? 'Settlement so far' : 'If settled today'} />}
          <div className="panel panel-soft"><Home size={18} /><p>{role === 'host' ? 'Lotnis reviews every case, rules on disputes and sends the refund. Payouts to you are adjusted automatically.' : 'Lotnis reviews every case and sends your refund. Your host and Lotnis can both see this timeline.'}</p></div>
        </aside>
      </div>
    </section>
  );
}

// ── Host: list ───────────────────────────────────────────────────────────────

export function HostMoveOuts() {
  const [cases, setCases] = useState<ExitCaseSummary[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { api.getHostExits().then(setCases).catch((e) => setError(e.message)); }, []);
  const needs = (c: ExitCaseSummary) => ['notice_given', 'in_dispute'].includes(c.status) || c.status === 'moved_out';
  return (
    <section className="host-page">
      <div className="host-page-head"><div><span className="eyebrow">Move-outs</span><h1>Notices &amp; deposits</h1></div></div>
      <p className="lead">When a guest gives notice or checks out, the case appears here with Lotnis looking on. Respond, confirm the move-out, and list deposit deductions with evidence.</p>
      {error ? <div className="error-state">{error}</div> : !cases ? <div className="empty-state">Loading…</div> : cases.length ? (
        <div className="booking-list">{cases.map((c) => (
          <Link key={c.id} to={`/moveouts/${c.id}`} className="booking-row case-row">
            <div><strong>{c.booking.property?.name}</strong><p>{c.kind === 'early_departure' ? `Leaving ${c.actual_checkout ?? c.planned_checkout} (booked to ${c.booking.end_date})` : 'End-of-stay checkout'}</p>
              {c.reason && <small>“{c.reason}”</small>}</div>
            <span className={`pill pill-${c.status}`}>{STATUS_LABEL[c.status]}</span>
            {needs(c) && c.status !== 'settled' ? <span className="needs">Needs you</span> : <span />}
          </Link>))}</div>
      ) : <div className="empty-state"><LogOut size={28} /><p>No move-outs yet. They'll show up here when a guest gives notice.</p></div>}
    </section>
  );
}
