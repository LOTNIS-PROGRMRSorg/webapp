import { useEffect, useState } from 'react';
import { cedis, fmtDateTime } from '@/features/events/eventUi';
import { eventApi } from '@/lib/api/events';
import { Pager } from '@/components/ui';

export function OrdersTab({ id, currency }: { id: string; currency: string }) {
  const [kind, setKind] = useState(''); const [page, setPage] = useState(1);
  const [res, setRes] = useState<Awaited<ReturnType<typeof eventApi.host.orders>> | null>(null);
  useEffect(() => { eventApi.host.orders(id, { kind, page, limit: 30 }).then(setRes).catch(() => setRes({ data: [], total: 0, page: 1, limit: 30 })); }, [id, kind, page]);
  return (
    <>
      <div className="notif-toolbar">{[['', 'All'], ['ticket', 'Tickets'], ['vote', 'Votes']].map(([v, l]) => <button key={v} className={`chip ${kind === v ? 'chip-active' : ''}`} onClick={() => { setKind(v); setPage(1); }}>{l}</button>)}</div>
      {!res ? <div className="empty-state">Loading…</div> : res.data.length ? <>
        <div className="booking-list">{res.data.map((o: any) => <div className="booking-row" key={o.id}><div><strong>{o.buyer_name || o.buyer_email}</strong><p>{o.kind === 'vote' ? 'Votes' : `${o.tickets?.length ?? 0} ticket(s)`} · {o.buyer_email} · {fmtDateTime(o.paid_at || o.created_at)}</p></div><span className={`status status-${o.status === 'paid' ? 'confirmed' : o.status === 'refunded' || o.status === 'needs_refund' ? 'cancelled' : 'pending'}`}>{o.status.replace('_', ' ')}</span><div><strong>{cedis(o.subtotal + o.service_fee, currency)}</strong><p>you get {cedis(o.host_net, currency)}</p></div></div>)}</div>
        <Pager page={res.page} limit={res.limit} total={res.total} onPage={setPage} /></> : <div className="empty-state">No orders yet.</div>}
    </>
  );
}

// ── Voting tab ────────────────────────────────────────────────────────────────
