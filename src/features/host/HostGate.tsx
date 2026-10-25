import { ReactNode, useCallback, useEffect, useState } from 'react';
import { ArrowRight, Check, Clock, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import type { HostAccess } from '@/types';

const REQUIREMENT_LABELS: Record<string, string> = {
  identity: 'Identity (government ID & selfie)',
  phone: 'Phone number',
  ownership: 'Proof of address / ownership',
  business: 'Business registration',
  tax: 'Tax information',
  payout: 'Payout details',
};

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : '');

/**
 * The host dashboard is only shown to verified hosts. Everyone else sees
 * exactly what they need to do next:
 *   - never applied / half-finished  → start or finish the application
 *   - admin asked for changes        → what to fix, then resubmit
 *   - waiting / being reviewed       → "being verified" + remind-the-team (once per 24h)
 *   - suspended                      → why, and who to contact
 * (The API also refuses host actions for unverified hosts; this is the friendly layer.)
 */
export function HostGate({ children }: { children: (access: HostAccess) => ReactNode }) {
  const [access, setAccess] = useState<HostAccess | null>(null);
  const [error, setError] = useState('');
  const [nudging, setNudging] = useState(false);
  const [nudgeMessage, setNudgeMessage] = useState('');

  const load = useCallback(() => api.getHostAccess().then(setAccess).catch((err) => setError(err instanceof Error ? err.message : 'Unable to load your host status')), []);
  useEffect(() => {
    load();
    // While waiting, quietly re-check so the screen flips to the dashboard as soon as an admin approves.
    const timer = window.setInterval(load, 60_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const nudge = async () => {
    setNudging(true); setNudgeMessage('');
    try {
      setAccess(await api.nudgeHostReview());
      setNudgeMessage('Thanks — we have let the Lotnis team know you are waiting.');
    } catch (err) {
      setNudgeMessage(err instanceof Error ? err.message : 'Unable to send the reminder');
      load();
    } finally { setNudging(false); }
  };

  if (error) return <section className="page"><div className="error-state">{error}</div></section>;
  if (!access) return <section className="page"><div className="empty-state">Checking your host account…</div></section>;
  if (access.can_access_dashboard) return <>{children(access)}</>;

  const header = (eyebrow: string, title: string, text: string) => (
    <><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p className="lead">{text}</p></>
  );

  const stage = { not_applied: 0, draft: 0, submitted: 1, in_review: 2, action_required: 2, suspended: 3, verified: 4 }[access.state] ?? 0;
  const roadmap = [
    ['Apply', 'Tell us who you are and where to pay you.'],
    ['In the queue', 'A reviewer picks up your application.'],
    ['Being verified', 'We check each item — ID, phone, address, payout.'],
    ['Decision', 'Approved, or we tell you exactly what to fix.'],
    ['Dashboard unlocks', 'List spaces, take bookings, get paid.'],
  ];
  return (
    <section className="page gate-page">
      <div className="gate-grid">
      <div className="gate-main">
      {access.state === 'not_applied' && <>
        {header('Host workspace', 'Become a Lotnis host.', 'List rooms, homes, villas, offices, garages or warehouses — by the night, week, month or year. We verify every host before listings go live.')}
        <Link className="button button-primary" to="/host/apply">Start your application <ArrowRight size={16} /></Link>
      </>}

      {access.state === 'draft' && <>
        {header('Host application', 'Finish your application.', 'You have saved your details but not submitted them yet. Upload your documents and submit to start verification.')}
        <Link className="button button-primary" to="/host/apply">Continue application <ArrowRight size={16} /></Link>
      </>}

      {access.state === 'action_required' && <>
        {header('Action required', 'We need a few things from you.', 'Your dashboard stays locked until these are fixed and you resubmit. Items we already approved will not be asked for again.')}
        <div className="gate-card gate-card-warn">
          <div className="gate-card-title"><ShieldAlert size={18} /> To fix</div>
          <ul className="gate-list">
            {access.items.length ? access.items.map((item) => (
              <li key={item.requirement}>
                <strong>{REQUIREMENT_LABELS[item.requirement] || item.requirement}</strong>
                <span>{item.reason || item.note || 'Please review and update this item.'}{item.reason && item.note ? ` — ${item.note}` : ''}</span>
              </li>
            )) : <li><strong>Your application was not approved</strong><span>{access.message || 'Review your details and resubmit.'}</span></li>}
          </ul>
          {access.message && access.items.length > 0 && <p className="gate-note">Reviewer's note: {access.message}</p>}
        </div>
        <Link className="button button-primary" to="/host/apply">Fix and resubmit <ArrowRight size={16} /></Link>
      </>}

      {(access.state === 'submitted' || access.state === 'in_review') && <>
        {header(
          access.state === 'in_review' ? 'In review' : 'Submitted',
          access.state === 'in_review' ? 'Your details are being verified.' : "You're in the queue.",
          access.state === 'in_review'
            ? 'A Lotnis reviewer is checking your application now. You will be notified here the moment there is a decision.'
            : 'Thanks for applying. A reviewer will pick up your application soon, and you will be notified here as soon as it is opened.',
        )}
        <div className="gate-card">
          <div className="gate-card-title">{access.state === 'in_review' ? <ShieldCheck size={18} /> : <Clock size={18} />} Verification progress</div>
          <ol className="gate-steps">
            <li className="done">Application submitted <small>{fmt(access.submitted_at)}</small></li>
            <li className={access.state === 'in_review' ? 'done' : 'current'}>Review started <small>{access.review_started_at ? fmt(access.review_started_at) : 'Waiting for a reviewer'}</small></li>
            <li className={access.state === 'in_review' ? 'current' : ''}>Decision</li>
          </ol>
          <div className="gate-actions">
            <button className="button button-secondary" onClick={nudge} disabled={!access.can_nudge || nudging}>
              {nudging ? 'Sending…' : 'Remind the team'}
            </button>
            <small className="muted-inline">
              {access.can_nudge
                ? 'Been waiting a while? You can nudge the team once every 24 hours.'
                : access.next_nudge_at ? `Reminder sent. You can send another after ${fmt(access.next_nudge_at)}.` : ''}
            </small>
          </div>
          {nudgeMessage && <div className="notice"><Clock size={16} /><span>{nudgeMessage}</span></div>}
        </div>
      </>}

      {access.state === 'suspended' && <>
        {header('Account suspended', 'Your host account is suspended.', access.message ? `Reason: ${access.message}` : 'Please contact Lotnis support for details.')}
        <div className="notice"><ShieldAlert size={16} /><span>Your listings are paused and you cannot take new bookings until this is resolved.</span></div>
      </>}
      </div>
      <aside className="gate-side" aria-label="How verification works">
        <h3>How verification works</h3>
        <ol className="road">
          {roadmap.map(([title, text], i) => (
            <li key={title} className={i < stage ? 'road-done' : i === stage ? 'road-now' : ''}>
              <span className="road-dot">{i < stage ? <Check size={13} strokeWidth={3} /> : i + 1}</span>
              <div><b>{title}</b><span>{text}</span></div>
            </li>
          ))}
        </ol>
        <p className="muted-inline">Questions? <Link to="/host-agreement">Read the host agreement</Link> or email support@lotnis.com.</p>
      </aside>
      </div>
    </section>
  );
}
