import { FormEvent, useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { getSession } from '@/lib/api';
import { reportsApi, type ReportCategory, type ReportInput, type ReportKind } from '@/lib/api/reports';
import { Modal } from './Modal';

/**
 * One report form for everything: "this listing is fake", "my booking wasn't as described", "I was refused at the gate".
 * The server decides who can read it, so this dialog just says what will happen.
 */
export function ReportDialog({ kind, target, title, audienceNote, onClose, onDone }: {
  kind: ReportKind; target: Pick<ReportInput, 'property_id' | 'event_id' | 'booking_id' | 'order_id' | 'host_id' | 'token'>;
  title: string; audienceNote?: string; onClose: () => void; onDone?: () => void;
}) {
  const [categories, setCategories] = useState<ReportCategory[]>([]);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const signedIn = !!getSession();

  useEffect(() => { reportsApi.categories().then((all) => { setCategories(all[kind] ?? []); setCategory(all[kind]?.[0]?.value ?? 'other'); }).catch(() => setError('Could not load the report form. Please try again.')); }, [kind]);
  const chosen = categories.find((c) => c.value === category);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setError('');
    try { await reportsApi.create({ target_type: kind, category, description: description.trim(), email: email.trim() || undefined, ...target }); setSent(true); onDone?.(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to send your report'); } finally { setBusy(false); }
  };

  if (sent) return (
    <Modal title="Report sent" onClose={onClose}>
      <div className="dialog-done"><CheckCircle2 size={34} /><p><b>Thank you.</b> Lotnis will look into this{signedIn ? '' : ' and email you the outcome'}. {audienceNote}</p></div>
      <div className="form-actions"><button className="button button-primary" onClick={onClose}>Close</button></div>
    </Modal>
  );
  return (
    <Modal title={title} onClose={onClose}>
      <form className="dialog-form" onSubmit={submit}>
        {audienceNote && <p className="dialog-intro">{audienceNote}</p>}
        <label className="fld"><span>What is wrong?</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>{categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select>
          {chosen?.hint && <small>{chosen.hint}</small>}
        </label>
        <label className="fld"><span>Tell us what happened <small>at least a sentence</small></span>
          <textarea required minLength={15} rows={4} maxLength={3000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Be as specific as you can — what, when, and any proof you have." /></label>
        {!signedIn && <label className="fld"><span>Your email <small>so we can follow up</small></span><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>}
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="form-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button className="button button-danger" disabled={busy || description.trim().length < 15 || !category}>{busy ? 'Sending…' : 'Send report'}</button></div>
      </form>
    </Modal>
  );
}
