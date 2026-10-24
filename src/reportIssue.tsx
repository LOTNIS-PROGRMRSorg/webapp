import { FormEvent, useState } from 'react';
import { eventApi } from './eventApi';

const CATEGORIES: Array<[string, string]> = [
  ['not_as_described', 'Not as described'], ['cleanliness', 'Cleanliness or condition'], ['access', "Couldn't get in / host unreachable"],
  ['safety', 'Safety concern'], ['amenities', 'Missing amenities'], ['other', 'Something else'],
];

/** A guest tells Lotnis something is wrong after check-in. This pauses the host's payout until an admin rules. */
export function ReportIssueDialog({ bookingId, propertyName, onClose, onDone }: { bookingId: string; propertyName: string; onClose: () => void; onDone: () => void }) {
  const [category, setCategory] = useState('not_as_described');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setError('');
    try { await eventApi.reportStayIssue(bookingId, { category, description }); onDone(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to send your report'); } finally { setBusy(false); }
  };
  return (
    <div className="ev-modal" role="dialog" aria-modal="true" aria-label="Report a problem">
      <form className="ev-modal-card" onSubmit={submit}>
        <h2>Report a problem</h2>
        <p><b>{propertyName}</b>. You have <b>24–48 hours after checking in</b> to tell us. We'll pause your host's payout while we look into it and email you what we decide. After that window the host is paid, and anything later is between you and your host — we'll still help.</p>
        <label className="fld">What's wrong?<select value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label className="fld">Tell us what happened<textarea required minLength={15} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Be as specific as you can — what you expected and what you found." /></label>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="form-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={busy || description.trim().length < 15}>{busy ? 'Sending…' : 'Send report'}</button></div>
      </form>
    </div>
  );
}
