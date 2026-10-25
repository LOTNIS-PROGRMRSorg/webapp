import { FormEvent, useEffect, useState } from 'react';
import { Camera, CheckCircle2, DoorOpen, Gavel, Home, LogOut, MessageSquare, Undo2, User, X } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
import type { ExitCaseDetail, ExitDeduction } from '@/types';
import { STATUS_LABEL } from '@/features/exits/labels';
import { EVENT_COPY, ROLE_LABEL, addDays, today, when } from './exitShared';
import { Stepper } from './ExitProgress';
import { SettlementCard } from './SettlementCard';

// ── Shared case page (guest + host) ──────────────────────────────────────────

export function PhotoStrip({ urls }: { urls: string[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <>
      <div className="photo-strip">
        {urls.map((u) => (
          <button type="button" key={u} onClick={() => setOpen(u)} aria-label="View evidence">
            <img src={u} alt="Evidence" />
          </button>
        ))}
      </div>
      {open && (
        <div className="lightbox" onClick={() => setOpen(null)} role="presentation">
          <button className="lightbox-x" aria-label="Close">
            <X size={20} />
          </button>
          <img src={open} alt="Evidence" />
        </div>
      )}
    </>
  );
}

export function DeductionRow({
  d,
  currency,
  role,
  onRespond,
}: {
  d: ExitDeduction;
  currency: string;
  role: string;
  onRespond: (id: string, response: 'accept' | 'dispute', comment?: string) => Promise<void>;
}) {
  const [disputing, setDisputing] = useState(false);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const open = ['proposed', 'accepted', 'disputed'].includes(d.status);
  const label = {
    proposed: role === 'guest' ? 'Needs your reply' : 'Awaiting guest',
    accepted: 'Accepted',
    disputed: 'Disputed',
    upheld: 'Upheld by Lotnis',
    reduced: 'Reduced by Lotnis',
    waived: 'Waived by Lotnis',
  }[d.status];
  const run = async (response: 'accept' | 'dispute') => {
    setBusy(true);
    try {
      await onRespond(d.id, response, comment);
      setDisputing(false);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className={`ded ded-${d.status}`}>
      <div className="ded-head">
        <strong>{d.reason}</strong>
        <span className="ded-amt">
          {money(currency, d.amount)}
          {d.final_amount != null && d.final_amount !== d.amount ? ` → ${money(currency, d.final_amount)}` : ''}
        </span>
      </div>
      <span className={`pill pill-${d.status}`}>{label}</span>
      {d.evidence_urls?.length > 0 && <PhotoStrip urls={d.evidence_urls} />}
      {d.guest_comment && (
        <p className="ded-note">
          <MessageSquare size={14} /> Guest: {d.guest_comment}
        </p>
      )}
      {d.admin_note && (
        <p className="ded-note">
          <Gavel size={14} /> Lotnis: {d.admin_note}
        </p>
      )}
      {role === 'guest' &&
        open &&
        d.status !== 'disputed' &&
        (disputing ? (
          <div className="ded-dispute">
            <textarea
              rows={2}
              placeholder="Why do you disagree? (required)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div className="form-actions">
              <button className="button button-quiet" onClick={() => setDisputing(false)}>
                Back
              </button>
              <button
                className="button button-danger"
                disabled={busy || !comment.trim()}
                onClick={() => run('dispute')}
              >
                Send dispute
              </button>
            </div>
          </div>
        ) : (
          d.status === 'proposed' && (
            <div className="form-actions">
              <button className="button button-quiet" onClick={() => setDisputing(true)}>
                Dispute
              </button>
              <button className="button button-primary" disabled={busy} onClick={() => run('accept')}>
                Accept
              </button>
            </div>
          )
        ))}
    </div>
  );
}

export function HostPanel({ detail, reload }: { detail: ExitCaseDetail; reload: () => void }) {
  const { exit, booking } = detail;
  const [response, setResponse] = useState(exit.host_response ?? '');
  const [relet, setRelet] = useState(exit.relet_from ?? '');
  const [fault, setFault] = useState(exit.host_at_fault);
  const [checkout, setCheckout] = useState(exit.planned_checkout);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const run = async (key: string, work: () => Promise<unknown>) => {
    setBusy(key);
    setError('');
    try {
      await work();
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy('');
    }
  };
  const canRespond = ['notice_given', 'host_responded'].includes(exit.status);
  return (
    <div className="panel">
      {canRespond && (
        <>
          <h2>{exit.kind === 'early_departure' ? 'Your response' : 'Checkout'}</h2>
          {exit.kind === 'early_departure' && (
            <>
              <label className="fld">
                Message to the guest{' '}
                <textarea
                  rows={2}
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="e.g. Noted — please return the keys on the 12th."
                />
              </label>
              <label className="fld">
                Have you re-let the space?{' '}
                <small>
                  From which date — those notice days are credited back to the guest so you're not paid twice.
                </small>
                <input
                  type="date"
                  min={exit.planned_checkout}
                  max={booking.end_date}
                  value={relet}
                  onChange={(e) => setRelet(e.target.value)}
                />
              </label>
              <label className="check">
                <input type="checkbox" checked={fault} onChange={(e) => setFault(e.target.checked)} /> The space/host
                was at fault (no notice charge applies)
              </label>
              <div className="form-actions">
                <button
                  className="button button-secondary"
                  disabled={!!busy}
                  onClick={() =>
                    run('respond', () =>
                      api.hostRespondExit(exit.id, { response, relet_from: relet || null, concede_fault: fault }),
                    )
                  }
                >
                  {busy === 'respond' ? 'Saving…' : 'Send response'}
                </button>
              </div>
            </>
          )}
          <h3>Confirm the guest has left</h3>
          <label className="fld">
            Checkout date{' '}
            <input
              type="date"
              value={checkout}
              min={addDays(booking.start_date, 1)}
              max={booking.end_date}
              onChange={(e) => setCheckout(e.target.value)}
            />
          </label>
          <div className="form-actions">
            <button
              className="button button-primary"
              disabled={!!busy}
              onClick={() => run('out', () => api.confirmMoveOut(exit.id, checkout))}
            >
              <DoorOpen size={16} /> {busy === 'out' ? 'Saving…' : 'Confirm move-out'}
            </button>
          </div>
        </>
      )}
      {['moved_out', 'in_dispute'].includes(exit.status) && (
        <DeductionForm
          exitId={exit.id}
          deposit={Number(booking.security_deposit ?? 0)}
          currency={booking.currency_snapshot}
          onDone={reload}
        />
      )}
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

export function DeductionForm({
  exitId,
  deposit,
  currency,
  onDone,
}: {
  exitId: string;
  deposit: number;
  currency: string;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [photos, setPhotos] = useState<Array<{ url: string; name: string }>>([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  if (deposit <= 0)
    return (
      <>
        <h2>Deposit</h2>
        <p className="muted-inline">
          This booking had no security deposit, so there is nothing to deduct. Lotnis will settle the case.
        </p>
      </>
    );
  const upload = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    setError('');
    try {
      for (const f of Array.from(files)) {
        const { url } = await api.uploadExitEvidence(exitId, f);
        setPhotos((p) => [...p, { url, name: f.name }]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.proposeDeduction(exitId, { amount: Number(amount), reason, evidence_urls: photos.map((p) => p.url) });
      setAmount('');
      setReason('');
      setPhotos([]);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add the deduction');
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit}>
      <h2>List a deposit deduction</h2>
      <p className="muted-inline">
        Deposit held: {money(currency, deposit)}. Every deduction needs a reason and photo/receipt evidence. The guest
        can accept or dispute each one; Lotnis decides disputes.
      </p>
      <div className="two">
        <label className="fld">
          Amount ({currency})
          <input
            type="number"
            min="1"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <label className="fld">
          What for?
          <input
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Broken window pane"
          />
        </label>
      </div>
      <div className="evidence">
        <label className="button button-secondary">
          <Camera size={16} /> {uploading ? 'Uploading…' : 'Add photos / receipts'}
          <input hidden type="file" accept="image/*" multiple onChange={(e) => upload(e.target.files)} />
        </label>
        {photos.length > 0 && (
          <div className="photo-strip">
            {photos.map((p) => (
              <img key={p.url} src={p.url} alt={p.name} />
            ))}
          </div>
        )}
      </div>
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      <div className="form-actions">
        <button className="button button-primary" disabled={busy || uploading || !photos.length}>
          {busy ? 'Adding…' : 'Add deduction'}
        </button>
      </div>
    </form>
  );
}

export function ExitCasePage() {
  const { id = '' } = useParams();
  const [detail, setDetail] = useState<ExitCaseDetail | null>(null);
  const [error, setError] = useState('');
  const load = () =>
    api
      .getExit(id)
      .then(setDetail)
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
    const t = window.setInterval(load, 30_000);
    return () => window.clearInterval(t);
  }, [id]);

  if (error)
    return (
      <section className="page">
        <div className="error-state">{error}</div>
      </section>
    );
  if (!detail)
    return (
      <section className="page">
        <div className="empty-state">Loading…</div>
      </section>
    );
  const { exit, booking, role, events, deductions, estimate } = detail;
  const c = booking.currency_snapshot;
  const open = !['settled', 'withdrawn'].includes(exit.status);
  const back = role === 'host' ? '/host/move-outs' : '/trips';

  const respond = async (deductionId: string, response: 'accept' | 'dispute', comment?: string) => {
    setDetail(await api.respondToDeduction(id, deductionId, { response, comment }));
  };

  return (
    <section className="page">
      <Link className="back-link" to={back}>
        ← {role === 'host' ? 'Move-outs' : 'My trips'}
      </Link>
      <div className="page-head">
        <div>
          <span className="eyebrow">
            {exit.kind === 'early_departure' ? 'Leaving early' : 'Checkout'} ·{' '}
            {role === 'host' ? 'Host view' : 'Your case'}
          </span>
          <h1>{booking.property?.name}</h1>
          <p className="lead">
            {booking.start_date} → {booking.end_date}
            {exit.kind === 'early_departure' && (
              <>
                {' '}
                · leaving <b>{exit.actual_checkout ?? exit.planned_checkout}</b>
              </>
            )}
          </p>
        </div>
        <span className={`pill pill-big pill-${exit.status}`}>{STATUS_LABEL[exit.status]}</span>
      </div>
      {exit.status !== 'withdrawn' && <Stepper status={exit.status} />}

      <div className="split">
        <div className="stack">
          {exit.status === 'settled' && (
            <div className="notice notice-ok">
              <CheckCircle2 size={18} />
              <span>
                Settled.{' '}
                {Number(exit.total_refund) > 0 ? (
                  <>
                    A refund of <b>{money(c, exit.total_refund)}</b> is with Lotnis to send — you'll be notified when
                    it's on its way.
                  </>
                ) : (
                  'No refund was due.'
                )}
                {exit.admin_override_reason && <> Lotnis note: {exit.admin_override_reason}</>}
              </span>
            </div>
          )}
          {exit.host_response && (
            <div className="panel">
              <h3>
                <User size={16} /> Host says
              </h3>
              <p>{exit.host_response}</p>
              {exit.relet_from && <small>Re-let from {exit.relet_from} — those days are credited back.</small>}
            </div>
          )}
          {exit.reason && (
            <div className="panel">
              <h3>
                <LogOut size={16} /> Guest's reason
              </h3>
              <p>{exit.reason}</p>
            </div>
          )}

          {deductions.length > 0 && (
            <div className="panel">
              <h2>Deposit deductions</h2>
              <div className="ded-list">
                {deductions.map((d) => (
                  <DeductionRow key={d.id} d={d} currency={c} role={role} onRespond={respond} />
                ))}
              </div>
            </div>
          )}

          {role === 'host' && open && <HostPanel detail={detail} reload={load} />}
          {role === 'guest' && ['notice_given', 'host_responded'].includes(exit.status) && (
            <div className="panel">
              <h3>Changed your mind?</h3>
              <p className="muted-inline">You can withdraw your notice any time before you move out.</p>
              <div className="form-actions">
                <button className="button button-quiet" onClick={async () => setDetail(await api.withdrawExit(id))}>
                  <Undo2 size={16} /> Withdraw notice
                </button>
              </div>
            </div>
          )}

          <div className="panel">
            <h2>Timeline</h2>
            <ol className="timeline">
              {events.map((e) => (
                <li key={e.id}>
                  <span className={`tl-dot tl-${e.actor_role}`} />
                  <div>
                    <b>{e.actor_name || ROLE_LABEL[e.actor_role]}</b>{' '}
                    <span className={`pill pill-role-${e.actor_role}`}>{ROLE_LABEL[e.actor_role]}</span>{' '}
                    {EVENT_COPY[e.event] ?? e.event}
                    {e.note && <p>“{e.note}”</p>}
                    <small>{when(e.created_at)}</small>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <aside className="stack">
          {estimate && open && (
            <SettlementCard
              s={estimate}
              host={role === 'host'}
              title={
                exit.status === 'moved_out' || exit.status === 'in_dispute' ? 'Settlement so far' : 'If settled today'
              }
            />
          )}
          <div className="panel panel-soft">
            <Home size={18} />
            <p>
              {role === 'host'
                ? 'Lotnis reviews every case, rules on disputes and sends the refund. Payouts to you are adjusted automatically.'
                : 'Lotnis reviews every case and sends your refund. Your host and Lotnis can both see this timeline.'}
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
