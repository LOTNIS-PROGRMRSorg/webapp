import { CalendarClock, MapPin, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ConfirmDialog, FieldDialog, ReportDialog } from '@/components/modals';
import { ErrorState, LoadingState, Notice } from '@/components/ui';
import { payWithPaystack } from '@/features/events/eventUi';
import { marketApi, UNIT_NOUN, type Job } from '@/lib/api/market';
import { money } from '@/lib/format';
import { Seo } from '@/lib/seo/seo';
import { ChatPanel } from './ChatPanel';
import { fmtLeft, fmtWhen, JobPill, JobSteps } from './jobUi';
import './jobs.css';

/** One job from either side: negotiate the price, pay, talk, mark it done, confirm you are happy — or raise a problem. */
export default function JobPage() {
  const { id = '' } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState('');
  const [dialog, setDialog] = useState<
    null | 'counter' | 'decline' | 'cancel' | 'unhappy' | 'review' | 'done' | 'report'
  >(null);

  const load = useCallback(
    () =>
      marketApi
        .job(id)
        .then(setJob)
        .catch((e) => setError(e.message)),
    [id],
  );
  useEffect(() => {
    load();
    const t = window.setInterval(load, 20_000);
    return () => window.clearInterval(t);
  }, [load]);

  const run = async (key: string, work: () => Promise<Job | unknown>, ok?: string) => {
    setBusy(key);
    setMsg('');
    try {
      const r = await work();
      if (r && typeof r === 'object' && 'status' in (r as object)) setJob(r as Job);
      else await load();
      if (ok) setMsg(ok);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy('');
    }
  };

  const pay = async () => {
    if (!job) return;
    setBusy('pay');
    setMsg('');
    try {
      const p = await marketApi.startPay(job.id);
      const ref = await payWithPaystack({
        email: p.email,
        amountPesewas: p.amount_pesewas,
        currency: p.currency,
        reference: p.reference,
        orderId: job.id,
        kind: 'service',
      });
      if (!ref) return setMsg('Payment was not completed. Your slot is held until the time shown.');
      setJob(await marketApi.confirmPay(job.id, ref));
      setMsg('Paid. The provider has been told, and the money stays safe with Lotnis until you confirm the job.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setBusy('');
    }
  };

  if (error)
    return (
      <div className="page">
        <Link className="back-link" to="/jobs">
          ← My jobs
        </Link>
        <ErrorState>{error}</ErrorState>
      </div>
    );
  if (!job)
    return (
      <div className="page">
        <LoadingState />
      </div>
    );

  const host = job.role === 'host';
  const other = host ? job.customer.name : (job.provider?.name ?? 'the provider');
  const youOffered = job.offer_by === job.role;
  const price = job.agreed_total ?? job.current_offer;
  const unit = UNIT_NOUN[job.service.pricing_unit];

  return (
    <div className="page job">
      <Seo title={`${job.service.title} — job`} description="Your service job on Lotnis." noindex />
      <Link className="back-link" to={host ? '/host/jobs' : '/jobs'}>
        ← {host ? 'Service jobs' : 'My jobs'}
      </Link>
      <header className="job-head">
        <div>
          <span className="eyebrow">{host ? 'A customer asked for' : 'You asked for'}</span>
          <h1>
            <Link to={`/services/${job.service.id}`}>{job.service.title}</Link>
          </h1>
          <p className="muted-inline">
            with {host ? job.customer.name : <Link to={`/hosts/${job.provider?.id}`}>{other}</Link>}
          </p>
        </div>
        <JobPill status={job.status} />
      </header>
      <JobSteps status={job.status} />

      {msg && <Notice tone={/fail|not|could|went wrong/i.test(msg) ? 'danger' : 'ok'}>{msg}</Notice>}

      <div className="job-grid">
        <div className="job-main">
          <section className="job-card">
            <h2>The job</h2>
            <ul className="job-facts">
              <li>
                <CalendarClock size={16} />{' '}
                <span>
                  <b>{fmtWhen(job.starts_at)}</b> to{' '}
                  {new Date(job.ends_at).toLocaleTimeString('en-GH', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Africa/Accra',
                  })}{' '}
                  · {job.units} × {unit}
                </span>
              </li>
              {(job.location_text || job.location_hidden) && (
                <li>
                  <MapPin size={16} />{' '}
                  <span>
                    {job.location_hidden ? (
                      <>
                        The exact place is shown once the customer has paid
                        {job.distance_km != null ? ` (about ${job.distance_km} km from you)` : ''}.
                      </>
                    ) : (
                      job.location_text
                    )}
                  </span>
                </li>
              )}
              {job.provider_place && (
                <li>
                  <MapPin size={16} /> <span>Provider's place: {job.provider_place}</span>
                </li>
              )}
            </ul>
            {job.notes && <p className="job-notes">“{job.notes}”</p>}
          </section>

          <section className="job-card">
            <h2>Price</h2>
            <div className="job-price">
              <div>
                <small>Provider's price</small>
                <b>{money(job.currency, job.list_total)}</b>
              </div>
              <div>
                <small>{job.agreed_total != null ? 'Agreed' : 'On the table'}</small>
                <b>{money(job.currency, price)}</b>
              </div>
            </div>
            {job.offers.length > 1 && (
              <ol className="job-offers">
                {job.offers.map((o, i) => (
                  <li key={i}>
                    <span>
                      {o.by_role === job.role ? 'You' : o.by_role === 'host' ? 'Provider' : job.customer.name}
                    </span>{' '}
                    offered <b>{money(job.currency, o.amount)}</b>
                    {o.message ? ` — “${o.message}”` : ''}
                  </li>
                ))}
              </ol>
            )}
            {job.money && (
              <dl className="job-money">
                <div>
                  <dt>Agreed price</dt>
                  <dd>{money(job.currency, job.money.agreed)}</dd>
                </div>
                {job.money.you_earn != null ? (
                  <>
                    <div>
                      <dt>Lotnis commission ({job.money.commission_percent}%)</dt>
                      <dd>− {money(job.currency, job.money.commission ?? 0)}</dd>
                    </div>
                    <div className="strong">
                      <dt>You earn</dt>
                      <dd>{money(job.currency, job.money.you_earn)}</dd>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <dt>Payment processing</dt>
                      <dd>{money(job.currency, job.money.processing_fee)}</dd>
                    </div>
                    <div className="strong">
                      <dt>You pay</dt>
                      <dd>{money(job.currency, job.money.total_charge)}</dd>
                    </div>
                  </>
                )}
              </dl>
            )}

            {/* what happens next, in plain words */}
            {job.status === 'requested' && (
              <p className="job-hint">
                {host
                  ? 'Accept this time and price, suggest another price, or decline.'
                  : `Waiting for ${other}. They have until ${fmtWhen(job.expires_at)} to answer.`}
              </p>
            )}
            {job.status === 'negotiating' && (
              <p className="job-hint">
                {youOffered
                  ? `Waiting for ${other} to answer your price.`
                  : `${other} suggested ${money(job.currency, job.current_offer)}. Accept it, reply with another price, or decline.`}
              </p>
            )}
            {job.status === 'accepted' && (
              <p className="job-hint">
                {host ? (
                  `Waiting for ${other} to pay. The time is held for them until ${fmtWhen(job.pay_by!)}.`
                ) : (
                  <>
                    Pay within <b>{fmtLeft(job.pay_by!)}</b> to keep this time. You pay Lotnis —{' '}
                    <ShieldCheck size={14} /> the provider is only paid after you say the job went well.
                  </>
                )}
              </p>
            )}
            {job.status === 'paid' && (
              <p className="job-hint">
                {host
                  ? 'Paid. The money is held by Lotnis and is released to you after the customer confirms the job.'
                  : 'Paid. The money is held by Lotnis. After the job, confirm you are happy and the provider is paid.'}
              </p>
            )}
            {job.status === 'awaiting_confirmation' && (
              <p className="job-hint">
                {host
                  ? 'You marked this done. Waiting for the customer to confirm.'
                  : 'The provider says this is done. Are you happy with it?'}
              </p>
            )}
            {job.status === 'disputed' && (
              <p className="job-hint">
                The customer raised a problem: “{job.dispute_reason}”. Lotnis is holding the payment and will decide.
                You will both be told.
              </p>
            )}
            {job.resolution && <p className="job-hint">Lotnis decided: {job.resolution}</p>}
            {job.status === 'completed' && (
              <p className="job-hint">
                {host ? 'Completed. Your earnings are due in the next payout.' : 'Completed. Thank you!'}
              </p>
            )}
            {['declined', 'cancelled', 'expired'].includes(job.status) && (
              <p className="job-hint">{job.cancel_reason || 'This request is closed.'}</p>
            )}
            {job.refunds.map((r) => (
              <p key={r.id} className="job-hint">
                Refund of {money(job.currency, r.amount)}:{' '}
                {r.status === 'processed' ? 'sent' : 'being processed by Lotnis'}.
              </p>
            ))}
          </section>

          <section className="job-actions" aria-label="What you can do">
            {job.can.accept && (
              <button
                className="button button-primary"
                disabled={!!busy}
                onClick={() => run('accept', () => marketApi.respond(job.id, 'accept'))}
              >
                {busy === 'accept' ? 'Accepting…' : `Accept ${money(job.currency, job.current_offer)}`}
              </button>
            )}
            {job.can.counter && (
              <button className="button button-secondary" onClick={() => setDialog('counter')}>
                Suggest another price
              </button>
            )}
            {job.can.pay && (
              <button className="button button-primary" disabled={!!busy} onClick={pay}>
                {busy === 'pay' ? 'Opening payment…' : `Pay ${money(job.currency, job.money?.total_charge ?? price)}`}
              </button>
            )}
            {job.can.mark_done && (
              <button className="button button-primary" onClick={() => setDialog('done')}>
                Mark the job as done
              </button>
            )}
            {job.can.confirm && (
              <button
                className="button button-primary"
                disabled={!!busy}
                onClick={() =>
                  run('ok', () => marketApi.confirm(job.id, true), 'Thank you — the provider will be paid.')
                }
              >
                I'm satisfied
              </button>
            )}
            {job.can.confirm && (
              <button className="button button-quiet" onClick={() => setDialog('unhappy')}>
                Something was wrong
              </button>
            )}
            {job.can.review && (
              <button className="button button-secondary" onClick={() => setDialog('review')}>
                Leave a review
              </button>
            )}
            {job.can.decline && (
              <button className="button button-quiet" onClick={() => setDialog('decline')}>
                {host ? 'Decline' : 'Withdraw request'}
              </button>
            )}
            {job.can.cancel && (
              <button className="button button-quiet" onClick={() => setDialog('cancel')}>
                Cancel job
              </button>
            )}
            {!host && ['paid', 'awaiting_confirmation', 'completed'].includes(job.status) && (
              <button className="button button-quiet" onClick={() => setDialog('report')}>
                Report a problem
              </button>
            )}
          </section>
          {job.review && (
            <section className="job-card">
              <h2>Review</h2>
              <p>
                <span className="ev-stars">
                  {'★'.repeat(job.review.rating)}
                  <i>{'★'.repeat(5 - job.review.rating)}</i>
                </span>{' '}
                {job.review.comment}
              </p>
              {job.review.host_reply && (
                <p className="svc-reply">
                  <b>Reply:</b> {job.review.host_reply}
                </p>
              )}
            </section>
          )}
          <p className="job-trust">
            <ShieldCheck size={15} /> Everything about this job stays in Lotnis — messages, payment and protection.
            Never pay or share contact details outside it.
          </p>
        </div>
        <ChatPanel jobId={job.id} enabled={job.can.message} />
      </div>

      {dialog === 'counter' && (
        <FieldDialog
          title="Suggest a price"
          intro={`Between ${money(job.currency, job.floor_total)} and ${money(job.currency, job.list_total)}.`}
          submitLabel="Send price"
          onClose={() => setDialog(null)}
          fields={[
            {
              name: 'amount',
              type: 'number',
              label: 'Price',
              required: true,
              min: job.floor_total,
              max: job.list_total,
              step: '0.01',
            },
            { name: 'message', type: 'text', label: 'A short note (optional)', maxLength: 200 },
          ]}
          onSubmit={async (v) => {
            await marketApi.respond(job.id, 'counter', { amount: Number(v.amount), message: String(v.message || '') });
            setDialog(null);
            await load();
          }}
        />
      )}
      {dialog === 'decline' && (
        <FieldDialog
          title={host ? 'Decline this request?' : 'Withdraw your request?'}
          danger
          submitLabel={host ? 'Decline' : 'Withdraw'}
          onClose={() => setDialog(null)}
          fields={[{ name: 'message', type: 'text', label: 'Reason (optional)', maxLength: 200 }]}
          onSubmit={async (v) => {
            await marketApi.respond(job.id, 'decline', { message: String(v.message || '') });
            setDialog(null);
            await load();
          }}
        />
      )}
      {dialog === 'cancel' && (
        <FieldDialog
          title="Cancel this job?"
          danger
          submitLabel="Cancel job"
          onClose={() => setDialog(null)}
          intro={
            job.status === 'paid'
              ? host
                ? 'The customer is refunded in full.'
                : 'Your refund depends on how close the job is — the exact amount is shown to you by Lotnis support in the refund. The payment processing fee is not refundable.'
              : 'No money has changed hands.'
          }
          fields={[{ name: 'reason', type: 'textarea', label: 'Reason', required: true, rows: 3 }]}
          onSubmit={async (v) => {
            await marketApi.cancel(job.id, String(v.reason));
            setDialog(null);
            await load();
          }}
        />
      )}
      {dialog === 'unhappy' && (
        <FieldDialog
          title="What was wrong?"
          danger
          submitLabel="Report it"
          onClose={() => setDialog(null)}
          intro="Lotnis keeps the payment safe while we look into it. Both of you can add details here."
          fields={[
            { name: 'reason', type: 'textarea', label: 'What happened', required: true, rows: 4, maxLength: 1500 },
          ]}
          onSubmit={async (v) => {
            await marketApi.confirm(job.id, false, String(v.reason));
            setDialog(null);
            await load();
          }}
        />
      )}
      {dialog === 'review' && (
        <FieldDialog
          title="Review this job"
          submitLabel="Post review"
          onClose={() => setDialog(null)}
          fields={[
            {
              name: 'rating',
              type: 'select',
              label: 'Rating',
              options: [
                ['5', '★★★★★ Excellent'],
                ['4', '★★★★ Good'],
                ['3', '★★★ OK'],
                ['2', '★★ Poor'],
                ['1', '★ Bad'],
              ],
              required: true,
            },
            { name: 'comment', type: 'textarea', label: 'Say a little about it', rows: 3 },
          ]}
          initial={{ rating: '5' }}
          onSubmit={async (v) => {
            await marketApi.review(job.id, Number(v.rating), String(v.comment || ''));
            setDialog(null);
            await load();
          }}
        />
      )}
      {dialog === 'done' && (
        <ConfirmDialog
          title="Mark this job as done?"
          body="The customer is asked to confirm. You are paid once they do."
          confirmLabel="Yes, it's done"
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            await marketApi.done(job.id);
            setDialog(null);
            await load();
          }}
        />
      )}
      {dialog === 'report' && (
        <ReportDialog
          kind="service_request"
          target={{ service_request_id: job.id }}
          title="Report a problem with this job"
          audienceNote="The provider and Lotnis can both see this."
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
