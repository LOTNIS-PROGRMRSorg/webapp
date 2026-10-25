import { useEffect, useMemo, useState } from 'react';
import { Check, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cedis, fmtDate, fmtDateTime } from '@/features/events/eventUi';
import { eventApi, PayoutBucket, PayoutItem, PayoutSummary } from '@/lib/api/events';
import { Seo } from '@/lib/seo/seo';
import { PageHeader, errText } from './hostShared';
import { Stat } from './OverviewTab';

export const BUCKET_LABEL: Record<PayoutBucket, string> = {
  awaiting_release: 'Waiting for release',
  due: 'Ready to send',
  on_hold: 'On hold',
  processing: 'Being sent',
  paid: 'Paid',
};
export function HostEarnings() {
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [items, setItems] = useState<PayoutItem[] | null>(null);
  const [batches, setBatches] = useState<Awaited<ReturnType<typeof eventApi.payouts.batches>>>([]);
  const [bucket, setBucket] = useState('');
  const [service, setService] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    eventApi.payouts
      .summary()
      .then(setSummary)
      .catch((e) => setError(errText(e)));
    eventApi.payouts
      .batches()
      .then(setBatches)
      .catch(() => {});
  }, []);
  useEffect(() => {
    setItems(null);
    eventApi.payouts
      .items({ bucket, service, limit: 60 })
      .then((r) => setItems(r.data))
      .catch(() => setItems([]));
  }, [bucket, service]);
  const c = summary?.currency || 'GHS';
  const d = summary?.payout_details;
  return (
    <section className="host-page">
      <Seo title="Earnings" description="Your payouts" noindex />
      <PageHeader eyebrow="Earnings" title="What you're owed" />
      {error ? (
        <div className="error-state">{error}</div>
      ) : !summary ? (
        <div className="empty-state">Loading…</div>
      ) : (
        <>
          <div className="metric-grid metric-grid-4">
            {(Object.keys(BUCKET_LABEL) as PayoutBucket[]).map((k) => (
              <Stat
                key={k}
                label={BUCKET_LABEL[k]}
                value={cedis(summary.totals[k], c)}
                sub={
                  k === 'awaiting_release' && summary.next_release_at
                    ? `next ${fmtDate(summary.next_release_at)}`
                    : undefined
                }
              />
            ))}
          </div>
          <div className="callout">
            <Wallet size={22} />
            <div>
              <b>Paid to</b>
              <p>
                {d
                  ? d.method === 'bank'
                    ? `${d.bank_name} · ${'•'.repeat(4)}${String(d.account_number).slice(-4)}`
                    : `${d.provider} · ${'•'.repeat(6)}${String(d.number).slice(-4)}`
                  : 'No payout account yet — add one so Lotnis can pay you.'}{' '}
                <Link to="/host/payout-settings">{d ? 'Change or add accounts' : 'Add a payout account'}</Link>
              </p>
            </div>
          </div>
          {summary.adjustments !== 0 && (
            <div className="notice">
              <span>Refunds after a payout are netted off your next one: {cedis(summary.adjustments, c)}.</span>
            </div>
          )}
          <div className="callout">
            <Wallet size={22} />
            <div>
              <b>How you're paid</b>
              <p>
                <b>Stays:</b> 24–48 hours after check-in (guests can report a problem until then). <b>Event tickets:</b>{' '}
                48 hours after the event ends. <b>Votes:</b> 48 hours after voting closes. Lotnis then sends the money
                to your default payout account.
              </p>
            </div>
          </div>
          {summary.by_service.length > 1 && (
            <div className="booking-list">
              {summary.by_service.map((s) => (
                <div className="booking-row" key={s.service}>
                  <div>
                    <strong>{s.label}</strong>
                    <p>
                      {cedis(s.awaiting_release, c)} waiting · {cedis(s.due, c)} ready
                    </p>
                  </div>
                  <span />
                  <strong>{cedis(s.paid, c)} paid</strong>
                </div>
              ))}
            </div>
          )}
          <h2 className="subsection-heading">Payments</h2>
          <div className="notif-toolbar">
            {[['', 'All'], ...(Object.keys(BUCKET_LABEL) as PayoutBucket[]).map((k) => [k, BUCKET_LABEL[k]])].map(
              ([v, l]) => (
                <button key={v} className={`chip ${bucket === v ? 'chip-active' : ''}`} onClick={() => setBucket(v)}>
                  {l}
                </button>
              ),
            )}
            <select className="ev-mini-select" value={service} onChange={(e) => setService(e.target.value)}>
              <option value="">All services</option>
              {summary.by_service.map((s) => (
                <option key={s.service} value={s.service}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          {!items ? (
            <div className="empty-state">Loading…</div>
          ) : items.length ? (
            <div className="booking-list">
              {items.map((i) => (
                <div className="booking-row" key={i.id}>
                  <div>
                    <strong>{i.title}</strong>
                    <p>
                      {i.service_label}
                      {i.detail ? ` · ${i.detail}` : ''} ·{' '}
                      {i.bucket === 'paid'
                        ? `paid ${i.paid_at ? fmtDate(i.paid_at) : ''}${i.provider_reference ? ` · ref ${i.provider_reference}` : ''}`
                        : i.bucket === 'awaiting_release' && i.release_at
                          ? `releases ${fmtDateTime(i.release_at)}`
                          : i.on_hold
                            ? `on hold: ${i.hold_reason}`
                            : i.bucket === 'due'
                              ? 'ready — Lotnis will send it'
                              : i.bucket === 'processing'
                                ? 'being sent'
                                : ''}
                    </p>
                  </div>
                  <span
                    className={`status status-${i.bucket === 'paid' ? 'confirmed' : i.on_hold ? 'cancelled' : 'pending'}`}
                  >
                    {i.bucket ? BUCKET_LABEL[i.bucket] : i.status}
                  </span>
                  <strong>{cedis(i.amount, i.currency)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">Nothing here yet.</div>
          )}
          {batches.length > 0 && (
            <>
              <h2 className="subsection-heading">Payouts sent</h2>
              <div className="booking-list">
                {batches.map((b) => (
                  <div className="booking-row" key={b.id}>
                    <div>
                      <strong>{cedis(b.amount, b.currency)}</strong>
                      <p>
                        {fmtDate(b.paid_at || b.created_at)} · to{' '}
                        {b.destination?.method === 'bank'
                          ? `${b.destination.bank_name}`
                          : b.destination?.provider || 'your account'}
                        {b.reference ? ` · ref ${b.reference}` : ''}
                      </p>
                    </div>
                    <span
                      className={`status status-${b.status === 'paid' ? 'confirmed' : b.status === 'failed' ? 'cancelled' : 'pending'}`}
                    >
                      {b.status}
                    </span>
                    <span />
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
void useMemo;
void Check;
