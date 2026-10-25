import { useEffect, useState } from 'react';
import { cedis, fmtDate } from '@/features/events/eventUi';
import { eventApi, PayoutItem, PayoutSummary } from '@/lib/api/events';
import { Seo } from '@/lib/seo/seo';
import { PageHeader } from '@/components/ui';
import { Stat, errText } from './hostHomeShared';

// ── Transactions: every sale across every service ────────────────────────────

export function HostTransactions() {
  const [service, setService] = useState('');
  const [items, setItems] = useState<PayoutItem[] | null>(null);
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { eventApi.payouts.summary().then(setSummary).catch(() => {}); }, []);
  useEffect(() => { setItems(null); eventApi.payouts.items({ service, limit: 100 }).then((r) => setItems(r.data)).catch((e) => { setError(errText(e)); setItems([]); }); }, [service]);
  const rows = items ?? [];
  const gross = rows.reduce((a, r) => a + Number(r.gross ?? r.amount + r.commission), 0);
  const fees = rows.reduce((a, r) => a + Number(r.commission), 0);
  const net = rows.reduce((a, r) => a + Number(r.amount), 0);
  const c = summary?.currency || 'GHS';
  return (
    <section className="host-page">
      <Seo title="Transactions" description="Your transactions" noindex />
      <PageHeader eyebrow="Transactions" title="Every sale, across everything" />
      <p className="lead">Stays, event tickets and votes in one list: what the guest paid, Lotnis's fee, and what you receive.</p>
      <div className="notif-toolbar">
        {[['', 'All'], ...(summary?.by_service ?? []).map((s) => [s.service, s.label])].map(([v, l]) => <button key={v} className={`chip ${service === v ? 'chip-active' : ''}`} onClick={() => setService(v)}>{l}</button>)}
      </div>
      <div className="metric-grid metric-grid-4">
        <Stat label="Transactions" value={rows.length} />
        <Stat label="Customers paid" value={cedis(gross, c)} />
        <Stat label="Lotnis fees" value={cedis(fees, c)} />
        <Stat label="You receive" value={cedis(net, c)} />
      </div>
      {error ? <div className="error-state">{error}</div> : !items ? <div className="empty-state">Loading…</div> : rows.length ? (
        <div className="booking-list">{rows.map((r) => (
          <div className="booking-row host-tx" key={r.id}>
            <div><strong>{r.title}</strong><p>{r.service_label}{r.detail ? ` · ${r.detail}` : ''} · {r.created_at ? fmtDate(r.created_at) : ''}{r.refunded_amount ? ` · ${cedis(r.refunded_amount, r.currency)} refunded` : ''}</p></div>
            <div className="host-tx-fig"><small>Fee</small>{cedis(r.commission, r.currency)}</div>
            <div className="host-tx-fig"><small>You receive</small><b>{cedis(r.amount, r.currency)}</b></div>
            <span className={`status status-${r.bucket === 'paid' ? 'confirmed' : r.on_hold ? 'cancelled' : 'pending'}`}>{r.bucket === 'paid' ? 'Paid' : r.on_hold ? 'On hold' : r.bucket === 'due' ? 'Ready' : r.bucket === 'processing' ? 'Being sent' : 'Waiting'}</span>
          </div>))}</div>
      ) : <div className="empty-state">No transactions yet.</div>}
    </section>
  );
}
