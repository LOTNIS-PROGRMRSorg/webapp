import { useEffect, useState } from 'react';
import { cedis, fmtDate } from '@/features/events/eventUi';
import { eventApi } from '@/lib/api/events';

export function RefundsTab({ id, currency }: { id: string; currency: string }) {
  const [rows, setRows] = useState<any[] | null>(null);
  useEffect(() => { eventApi.host.refunds(id).then(setRows).catch(() => setRows([])); }, [id]);
  if (!rows) return <div className="empty-state">Loading…</div>;
  return <>
    <p className="muted-inline">Lotnis reviews and sends refunds. A ticket is paused the moment a refund is requested, and cannot be scanned once refunded. The refunded amount is taken out of your payout.</p>
    {rows.length ? <div className="booking-list">{rows.map((r) => <div className="booking-row" key={r.id}><div><strong>{cedis(r.amount, currency)} · {r.ticket_ids?.length || 1} ticket(s)</strong><p>{r.trigger === 'buyer_request' ? 'Requested by buyer' : r.trigger.replace('_', ' ')} · {fmtDate(r.created_at)}{r.reason ? ` · “${r.reason}”` : ''}{r.refund_reference ? ` · ref ${r.refund_reference}` : ''}</p></div><span className={`status status-${r.status === 'processed' ? 'confirmed' : r.status === 'rejected' || r.status === 'failed' ? 'cancelled' : 'pending'}`}>{r.status === 'processed' ? 'sent' : r.status}</span><span /></div>)}</div> : <div className="empty-state">No refund requests.</div>}</>;
}
