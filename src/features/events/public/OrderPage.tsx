import { ReportDialog } from '@/components/modals';
import { useEffect, useState } from 'react';
import { CalendarDays, Clock, MapPin } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Seo } from '@/lib/seo/seo';
import {
  cedis,
  fmtDate,
  fmtDateTime,
  fmtRange,
  forgetPayment,
  QrImage,
  recallPayment,
  TicketStatusPill,
} from '@/features/events/eventUi';
import { eventApi, OrderView } from '@/lib/api/events';
import { errText } from './eventShared';

// ── Order page (receipt, tickets, refund requests) ────────────────────────────

export function OrderPage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const token = params.get('token') || undefined;
  const [view, setView] = useState<OrderView | null>(null);
  const [error, setError] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () =>
    eventApi
      .order(id, token)
      .then(async (v) => {
        // A buyer who paid but whose tab closed before confirming: finish it now.
        const saved = recallPayment(id);
        if (v.order.status === 'pending' && saved) {
          try {
            v = await eventApi.confirm(id, saved.reference, saved.token);
            forgetPayment(id);
          } catch {
            /* shown as pending below */
          }
        }
        setView(v);
        setError('');
      })
      .catch((e) => setError(errText(e, 'Unable to load this order')));
  useEffect(() => {
    load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [id, token]);

  const requestRefund = async () => {
    setBusy(true);
    setMsg('');
    try {
      await eventApi.requestRefund(id, { token, ticket_ids: picked, reason });
      setPicked([]);
      setReason('');
      setMsg('Refund requested. We paused those tickets and emailed you.');
      await load();
    } catch (e) {
      setMsg(errText(e, 'Unable to request a refund'));
    } finally {
      setBusy(false);
    }
  };

  if (error)
    return (
      <div className="page">
        <div className="error-state">{error}</div>
      </div>
    );
  if (!view)
    return (
      <div className="page">
        <div className="empty-state">Loading your order…</div>
      </div>
    );
  const { order, event, tickets } = view;
  const paid = ['paid', 'partially_refunded', 'refunded'].includes(order.status);
  const refundable = tickets.filter((t) => t.refundable);

  return (
    <div className="page ev-order">
      <Seo title="Your order" description="Your tickets and receipt." noindex />
      <div className="done-card">
        <svg className="done-check" viewBox="0 0 52 52" aria-hidden="true">
          <circle cx="26" cy="26" r="24" />
          <path d="M14 27l8 8 16-17" />
        </svg>
        <h1>
          {paid
            ? order.kind === 'vote'
              ? 'Votes counted.'
              : "You're going."
            : order.status === 'pending'
              ? 'Waiting for payment'
              : `Order ${order.status.replace('_', ' ')}`}
        </h1>
        <p className="lead">
          {paid ? (
            <>
              {order.kind === 'vote' ? 'Thanks for voting in' : 'Your tickets for'} <b>{event.title}</b>{' '}
              {order.kind === 'vote' ? '.' : 'are ready — we emailed them to you too.'}
            </>
          ) : order.status === 'pending' ? (
            'If you paid, this page updates in a moment. If not, go back to the event and try again — your tickets are held for 10 minutes.'
          ) : (
            'This order is no longer active.'
          )}
        </p>
        <p className="muted-inline">
          <CalendarDays size={14} /> {fmtRange(event.starts_at, event.ends_at)} · <MapPin size={14} />{' '}
          {event.venue_name}, {event.city}
        </p>
        {event.postponed && (
          <div className="callout callout-warn">
            <Clock size={20} />
            <div>
              <b>Postponed</b>
              <p>New date {fmtDateTime(event.starts_at)}. Your tickets are still valid.</p>
            </div>
          </div>
        )}
        {event.status === 'cancelled' && (
          <div className="callout callout-danger">
            <Clock size={20} />
            <div>
              <b>This event was cancelled</b>
              <p>You'll be refunded in full (the payment-processing fee is not refundable).</p>
            </div>
          </div>
        )}
      </div>

      {order.kind === 'ticket' && tickets.length > 0 && (
        <section className="ev-tickets">
          <h2>Your tickets</h2>
          <div className="ev-ticket-grid">
            {tickets.map((t) => (
              <article className={`ev-ticket ev-ticket-${t.status}`} key={t.id}>
                <div className="ev-ticket-top">
                  <b>{t.ticket_type?.name}</b>
                  <TicketStatusPill status={t.status} />
                </div>
                {t.status === 'valid' || t.status === 'used' ? (
                  <QrImage value={t.code} size={170} label={`QR code for ticket ${t.code}`} />
                ) : (
                  <div className="qr-void">
                    {t.status === 'refund_pending'
                      ? 'Refund pending'
                      : t.status === 'refunded'
                        ? 'Refunded'
                        : 'Not valid'}
                  </div>
                )}
                <code>{t.code}</code>
                <small>{t.holder_name || t.holder_email}</small>
                {refundable.length > 0 && t.refundable && (
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={picked.includes(t.id)}
                      onChange={(e) =>
                        setPicked(e.target.checked ? [...picked, t.id] : picked.filter((x) => x !== t.id))
                      }
                    />{' '}
                    Select for refund
                  </label>
                )}
                <Link className="button button-secondary" to={`/tickets/${t.code}`}>
                  Open ticket
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}

      {order.kind === 'vote' && view.votes && (
        <section className="ev-tickets">
          <h2>Your votes</h2>
          <ul className="policy-ticks">
            {view.votes.map((v) => (
              <li key={v.nominee_id}>
                {v.votes.toLocaleString()} vote{v.votes > 1 ? 's' : ''}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="ev-receipt">
        <h2>Receipt</h2>
        <div className="ev-lines">
          <div>
            <span>{order.kind === 'vote' ? 'Votes' : 'Tickets'}</span>
            <b>{cedis(order.subtotal, order.currency)}</b>
          </div>
          {order.service_fee > 0 && (
            <div>
              <span>Lotnis service fee</span>
              <b>{cedis(order.service_fee, order.currency)}</b>
            </div>
          )}
          {order.processing_fee > 0 && (
            <div>
              <span>Payment processing</span>
              <b>{cedis(order.processing_fee, order.currency)}</b>
            </div>
          )}
          <div className="ev-total">
            <span>Paid</span>
            <b>{cedis(order.total, order.currency)}</b>
          </div>
          {order.refunded_amount > 0 && (
            <div>
              <span>Refunded</span>
              <b>−{cedis(order.refunded_amount, order.currency)}</b>
            </div>
          )}
        </div>
        <small className="muted-inline">
          Order {order.id.slice(0, 8).toUpperCase()} · {order.buyer_email}
        </small>
      </section>

      {paid && (
        <div className="order-report">
          <button className="button button-quiet" onClick={() => setReporting(true)}>
            Report a problem with this event
          </button>
        </div>
      )}
      {reporting && (
        <ReportDialog
          kind="ticket_order"
          target={{ order_id: order.id, token }}
          title={`Report a problem: ${event.title}`}
          audienceNote="The organiser and Lotnis can both see this report."
          onClose={() => setReporting(false)}
        />
      )}

      {order.kind === 'ticket' && paid && (
        <section className="ev-refunds">
          <h2>Refunds</h2>
          {view.refund.eligible ? (
            <p>
              You can ask for {view.refund.percent === 100 ? 'a full refund' : `a ${view.refund.percent}% refund`} of
              the ticket price. The payment-processing fee isn't refundable.
            </p>
          ) : (
            <p className="muted-inline">
              {view.refund.reason === 'no_refunds'
                ? "This organiser doesn't offer refunds, except if the event is cancelled."
                : view.refund.reason === 'too_late'
                  ? 'The refund window for this event has closed.'
                  : view.refund.reason === 'event_started'
                    ? 'The event has started, so tickets can no longer be refunded.'
                    : view.refund.reason === 'postponed_carry_over'
                      ? 'The event was postponed and tickets stay valid for the new date.'
                      : 'Refunds are not available right now.'}
            </p>
          )}
          {refundable.length > 0 && (
            <div className="stack">
              <label className="fld">
                Reason <small>optional</small>
                <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
              </label>
              <button className="button button-primary" disabled={!picked.length || busy} onClick={requestRefund}>
                {busy
                  ? 'Sending…'
                  : `Request refund for ${picked.length || 'selected'} ticket${picked.length === 1 ? '' : 's'}`}
              </button>
            </div>
          )}
          {msg && (
            <div className={msg.startsWith('Refund requested') ? 'notice notice-ok' : 'form-error'}>
              <span>{msg}</span>
            </div>
          )}
          {view.refund_requests.length > 0 && (
            <div className="booking-list">
              {view.refund_requests.map((r) => (
                <div className="booking-row" key={r.id}>
                  <div>
                    <strong>
                      {cedis(r.amount, order.currency)} ·{' '}
                      {r.trigger === 'buyer_request' ? 'Your request' : r.trigger.replace('_', ' ')}
                    </strong>
                    <p>
                      {fmtDate(r.created_at)}
                      {r.admin_note ? ` · ${r.admin_note}` : ''}
                      {r.refund_reference ? ` · ref ${r.refund_reference}` : ''}
                    </p>
                  </div>
                  <span
                    className={`status status-${r.status === 'processed' ? 'confirmed' : r.status === 'rejected' || r.status === 'failed' ? 'cancelled' : 'pending'}`}
                  >
                    {r.status === 'processed' ? 'Sent' : r.status}
                  </span>
                  <span />
                </div>
              ))}
            </div>
          )}
        </section>
      )}
      <div className="bk-actions bk-actions-center">
        <Link className="button button-quiet" to={`/events/${event.slug}`}>
          Back to event
        </Link>
        <Link className="button button-quiet" to="/events">
          More events
        </Link>
      </div>
    </div>
  );
}
