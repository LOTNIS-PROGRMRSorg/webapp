import { useState } from 'react';
import { Ban, CalendarClock, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cedis, fmtDateTime, fromLocalInput } from '@/features/events/eventUi';
import { eventApi, HostEventOverview } from '@/lib/api/events';
import { errText } from './hostShared';

export function StatusBanner({ data, reload }: { data: HostEventOverview; reload: () => void }) {
  const ev = data.event;
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [missing, setMissing] = useState(false);
  const submit = async () => {
    setBusy(true);
    setMsg('');
    setMissing(false);
    try {
      const r = await eventApi.host.submit(ev.id);
      setMsg(r.auto_published ? 'Your event is live.' : 'Submitted — we usually review within a day.');
      reload();
    } catch (e) {
      setMsg(errText(e));
      setMissing(true);
    } finally {
      setBusy(false);
    }
  };
  if (ev.status === 'draft' || ev.status === 'rejected')
    return (
      <div className={`callout ${ev.status === 'rejected' ? 'callout-warn' : ''}`}>
        <Send size={22} />
        <div>
          <b>{ev.status === 'rejected' ? 'Changes needed' : 'This event is a draft'}</b>
          <p>
            {ev.status === 'rejected'
              ? ev.rejection_reason
              : "Add your tickets (and gates), then send it for review. Guests can't see it yet."}
          </p>
          {msg && (
            <div className={missing ? 'form-error' : 'notice notice-ok'}>
              <span>{msg}</span>
            </div>
          )}
          <button className="button button-primary" disabled={busy} onClick={submit}>
            {busy ? 'Submitting…' : 'Submit for review'}
          </button>
        </div>
      </div>
    );
  if (ev.status === 'pending_review')
    return (
      <div className="callout">
        <CalendarClock size={22} />
        <div>
          <b>In review</b>
          <p>We'll email you when it's approved. You can keep adding tickets and gates meanwhile.</p>
        </div>
      </div>
    );
  if (ev.status === 'suspended')
    return (
      <div className="callout callout-warn">
        <Ban size={22} />
        <div>
          <b>Paused by Lotnis</b>
          <p>{ev.rejection_reason}. Sales are stopped — contact support to resolve it.</p>
        </div>
      </div>
    );
  if (ev.status === 'cancelled')
    return (
      <div className="callout callout-danger">
        <Ban size={22} />
        <div>
          <b>Cancelled</b>
          <p>{ev.cancellation_reason}</p>
        </div>
      </div>
    );
  return null;
}

export const Stat = ({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) => (
  <div>
    <span>{label}</span>
    <strong>{value}</strong>
    {sub && <small>{sub}</small>}
  </div>
);

export function Overview({ data, reload }: { data: HostEventOverview; reload: () => void }) {
  const { stats, event: ev, payout } = data;
  const c = ev.currency;
  const [modal, setModal] = useState<'cancel' | 'postpone' | null>(null);
  const maxHour = Math.max(1, ...stats.scans_by_hour.map((h) => h.count));
  const gross = stats.ticket_gross + stats.vote_gross;
  return (
    <>
      <div className="metric-grid metric-grid-4">
        <Stat label="Tickets sold" value={stats.tickets_sold.toLocaleString()} sub={`${stats.orders_paid} orders`} />
        <Stat
          label="Scanned in"
          value={stats.tickets_scanned.toLocaleString()}
          sub={
            stats.tickets_sold
              ? `${Math.round((stats.tickets_scanned / stats.tickets_sold) * 100)}% of sold`
              : undefined
          }
        />
        <Stat label="Revenue" value={cedis(gross, c)} sub="tickets + votes, before Lotnis's fee" />
        <Stat
          label="You'll receive"
          value={cedis(stats.ticket_host_net + stats.vote_host_net, c)}
          sub={`after ${cedis(stats.ticket_commission + stats.vote_commission, c)} Lotnis fee`}
        />
        <Stat label="Refunded" value={cedis(stats.refunded_amount, c)} sub={`${stats.tickets_refunded} ticket(s)`} />
        {ev.voting_enabled && (
          <Stat label="Votes" value={stats.votes_total.toLocaleString()} sub={cedis(stats.vote_gross, c)} />
        )}
        <Stat
          label="Reviews"
          value={stats.review_count ? `${stats.review_average} ★` : '—'}
          sub={`${stats.review_count} verified`}
        />
        <Stat label="Refund requests" value={stats.refund_requests_pending} sub="waiting for Lotnis" />
      </div>
      <h2 className="subsection-heading">Sales by ticket</h2>
      <div className="ev-bars">
        {stats.by_ticket_type.map((t) => {
          const cap = t.quantity ?? Math.max(t.sold, 1);
          return (
            <div key={t.id} className="ev-barrow">
              <span>
                {t.name} <small>{cedis(t.price, c)}</small>
              </span>
              <div className="ev-bar ev-bar-lg">
                <i style={{ width: `${Math.min(100, (t.sold / cap) * 100)}%` }} />
                <i className="ev-bar-scan" style={{ width: `${Math.min(100, (t.scanned / cap) * 100)}%` }} />
              </div>
              <b>
                {t.sold}
                {t.quantity != null ? ` / ${t.quantity}` : ' sold'}
              </b>
              <small>
                {t.scanned} scanned{t.refunded ? ` · ${t.refunded} refunded` : ''}
              </small>
            </div>
          );
        })}
      </div>
      {stats.by_gate.length > 0 && (
        <>
          <h2 className="subsection-heading">Gates</h2>
          <div className="booking-list">
            {stats.by_gate.map((g) => (
              <div className="booking-row" key={g.id}>
                <div>
                  <strong>{g.name}</strong>
                  <p>{g.last_used_at ? `Last scan ${fmtDateTime(g.last_used_at)}` : 'No scans yet'}</p>
                </div>
                <span>
                  <b>{g.admitted}</b> admitted
                </span>
                <span className={g.rejected ? 'ev-warn' : ''}>{g.rejected} rejected</span>
              </div>
            ))}
          </div>
        </>
      )}
      {stats.scans_by_hour.length > 0 && (
        <>
          <h2 className="subsection-heading">Entry by hour</h2>
          <div className="ev-hours">
            {stats.scans_by_hour.map((h) => (
              <div key={h.hour} title={`${h.count} at ${fmtDateTime(h.hour)}`}>
                <i style={{ height: `${(h.count / maxHour) * 100}%` }} />
                <small>
                  {new Date(h.hour).toLocaleTimeString('en-GH', { hour: 'numeric', timeZone: 'Africa/Accra' })}
                </small>
              </div>
            ))}
          </div>
        </>
      )}
      {Object.keys(stats.scan_results).length > 0 && (
        <p className="muted-inline">
          Scan results:{' '}
          {Object.entries(stats.scan_results)
            .map(([k, v]) => `${k.replace('_', ' ')} ${v}`)
            .join(' · ')}
        </p>
      )}
      <h2 className="subsection-heading">Payout</h2>
      <p className="muted-inline">
        You're paid after the event
        {payout.next_release_at ? ` — next release ${fmtDateTime(payout.next_release_at)}` : ''}.{' '}
        <Link to="/host/earnings">All your earnings</Link>
      </p>
      <div className="metric-grid metric-grid-4">
        <Stat label="Waiting for release" value={cedis(payout.awaiting_release, c)} />
        <Stat label="Ready to send" value={cedis(payout.due, c)} />
        <Stat label="On hold" value={cedis(payout.on_hold, c)} />
        <Stat label="Paid out" value={cedis(payout.paid, c)} />
      </div>
      {['published', 'suspended'].includes(ev.status) && (
        <div className="form-actions ev-danger">
          <button className="button button-quiet" onClick={() => setModal('postpone')}>
            <CalendarClock size={16} /> Postpone
          </button>
          <button className="button button-danger" onClick={() => setModal('cancel')}>
            <Ban size={16} /> Cancel event
          </button>
        </div>
      )}
      {modal === 'cancel' && <CancelDialog ev={ev} onClose={() => setModal(null)} onDone={reload} />}
      {modal === 'postpone' && <PostponeDialog ev={ev} onClose={() => setModal(null)} onDone={reload} />}
    </>
  );
}

export function CancelDialog({ ev, onClose, onDone }: { ev: any; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const go = async () => {
    setBusy(true);
    try {
      await eventApi.host.cancel(ev.id, reason);
      onDone();
      onClose();
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal-card">
        <h2>Cancel "{ev.title}"?</h2>
        <p>
          Every ticket and vote is refunded in full (the payment-processing fee is not refundable), buyers are emailed,
          and the event comes off sale. This can't be undone.
        </p>
        <label className="fld">
          Reason — guests will see this
          <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        {error && <div className="form-error">{error}</div>}
        <div className="form-actions">
          <button className="button button-quiet" onClick={onClose}>
            Keep event
          </button>
          <button className="button button-danger" disabled={busy || !reason.trim()} onClick={go}>
            {busy ? 'Cancelling…' : 'Cancel and refund everyone'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PostponeDialog({ ev, onClose, onDone }: { ev: any; onClose: () => void; onDone: () => void }) {
  const [s, setS] = useState('');
  const [e, setE] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const what =
    ev.postponement_policy === 'refund_all'
      ? 'Every ticket will be refunded in full automatically.'
      : ev.postponement_policy === 'carry_over'
        ? 'Tickets stay valid for the new date.'
        : `Tickets stay valid, and buyers can ask for a full refund for ${ev.postponement_refund_days} days.`;
  const go = async () => {
    setBusy(true);
    try {
      await eventApi.host.postpone(ev.id, { starts_at: fromLocalInput(s)!, ends_at: fromLocalInput(e)!, reason });
      onDone();
      onClose();
    } catch (err) {
      setError(errText(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal-card">
        <h2>Postpone "{ev.title}"</h2>
        <p>{what} Everyone who bought is emailed the new date. Your payout moves to the new date too.</p>
        <div className="two">
          <label className="fld">
            New start
            <input type="datetime-local" value={s} onChange={(x) => setS(x.target.value)} />
          </label>
          <label className="fld">
            New end
            <input type="datetime-local" value={e} onChange={(x) => setE(x.target.value)} />
          </label>
        </div>
        <label className="fld">
          Why <small>optional</small>
          <input value={reason} onChange={(x) => setReason(x.target.value)} />
        </label>
        {error && <div className="form-error">{error}</div>}
        <div className="form-actions">
          <button className="button button-quiet" onClick={onClose}>
            Never mind
          </button>
          <button className="button button-primary" disabled={busy || !s || !e} onClick={go}>
            {busy ? 'Postponing…' : 'Postpone event'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tickets tab ───────────────────────────────────────────────────────────────
