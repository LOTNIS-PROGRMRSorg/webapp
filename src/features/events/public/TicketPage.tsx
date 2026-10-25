import { useEffect, useState } from 'react';
import { Check, Clock, Star, Ticket } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Seo } from '@/lib/seo/seo';
import { fmtDateTime, fmtRange, QrImage, TicketStatusPill } from '@/features/events/eventUi';
import { eventApi, TicketView } from '@/lib/api/events';
import { errText } from './eventShared';

// ── Single ticket page (the one people show at the gate) ──────────────────────

export function TicketPage() {
  const { code = '' } = useParams();
  const [view, setView] = useState<TicketView | null>(null);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { eventApi.ticket(code).then(setView).catch((e) => setError(errText(e, 'Ticket not found'))); }, [code]);

  const sendReview = async () => {
    setBusy(true);
    try { await eventApi.review(code, { rating, comment: comment.trim() || undefined }); setSent(true); } catch (e) { setError(errText(e, 'Unable to send your review')); } finally { setBusy(false); }
  };
  if (error && !view) return <div className="page"><div className="error-state">{error}</div></div>;
  if (!view) return <div className="page"><div className="empty-state">Loading ticket…</div></div>;
  const { ticket, event } = view;
  const usable = ticket.status === 'valid' && event.status !== 'cancelled';
  const note = { valid: 'Show this code at the gate. It works once.', used: `Scanned${ticket.used_at ? ` ${fmtDateTime(ticket.used_at)}` : ''}. This ticket has been used.`, refund_pending: 'A refund is being reviewed, so this ticket is paused.', refunded: 'This ticket was refunded and can no longer be used.', cancelled: 'This ticket was cancelled.', void: 'This ticket is not valid.' }[ticket.status];
  return (
    <div className="page ev-ticketpage">
      <Seo title={`Ticket — ${event.title}`} description="Your event ticket." noindex />
      <div className={`ev-pass ev-pass-${usable ? 'ok' : ticket.status}`}>
        <div className="ev-pass-top"><small>{ticket.type}</small><h1>{event.title}</h1><p>{fmtRange(event.starts_at, event.ends_at)}</p><p>{event.venue_name}, {event.city}</p></div>
        <div className="ev-pass-qr">{ticket.status === 'valid' || ticket.status === 'used' ? <QrImage value={ticket.code} size={240} label={`Ticket ${ticket.code}`} /> : <div className="qr-void">{ticket.status === 'refund_pending' ? 'Refund pending' : ticket.status === 'refunded' ? 'Refunded' : 'Not valid'}</div>}<code>{ticket.code}</code></div>
        <div className="ev-pass-foot"><TicketStatusPill status={ticket.status} /><p>{event.status === 'cancelled' ? 'This event was cancelled.' : note}</p>{ticket.holder_name && <small>{ticket.holder_name}</small>}</div>
      </div>
      {event.postponed && <div className="callout callout-warn"><Clock size={20} /><div><b>Postponed</b><p>New date: {fmtDateTime(event.starts_at)}. This ticket stays valid.</p></div></div>}
      {event.entry_rules && <p className="muted-inline">{event.entry_rules}</p>}
      {view.can_review && !sent && <section className="ev-reviewform"><h2>How was it?</h2><p className="muted-inline">You were there, so your review is marked as a verified attendee.</p>
        <div className="ev-rate" role="radiogroup" aria-label="Rating">{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} aria-label={`${n} star${n > 1 ? 's' : ''}`} className={n <= rating ? 'on' : ''} onClick={() => setRating(n)}><Star size={28} fill={n <= rating ? 'currentColor' : 'none'} /></button>)}</div>
        <label className="fld">Tell others what it was like<textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} /></label>
        {error && <div className="form-error">{error}</div>}
        <button className="button button-primary" disabled={!rating || busy} onClick={sendReview}>{busy ? 'Sending…' : 'Post review'}</button></section>}
      {(sent || view.review) && <div className="notice notice-ok"><Check size={16} /><span>Thanks — your review is posted.</span></div>}
      <div className="bk-actions bk-actions-center"><Link className="button button-quiet" to={`/events/${event.slug}`}>Event page</Link></div>
    </div>
  );
}
