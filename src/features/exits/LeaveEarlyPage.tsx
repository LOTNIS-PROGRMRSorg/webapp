import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Clock, ShieldCheck } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import type { Booking, ExitSettlement } from '@/types';
import { REASONS, addDays, nights, today, when } from './exitShared';
import { SettlementCard } from './SettlementCard';

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
