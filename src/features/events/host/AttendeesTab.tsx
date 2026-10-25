import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { api } from '@/lib/api';
import { fmtDateTime, TicketStatusPill } from '@/features/events/eventUi';
import { eventApi } from '@/lib/api/events';
import { Pager } from '@/components/ui';

export function AttendeesTab({ id }: { id: string }) {
  const [q, setQ] = useState(''); const [status, setStatus] = useState(''); const [page, setPage] = useState(1);
  const [res, setRes] = useState<Awaited<ReturnType<typeof eventApi.host.attendees>> | null>(null);
  useEffect(() => { const t = window.setTimeout(() => eventApi.host.attendees(id, { query: q, status, page, limit: 40 }).then(setRes).catch(() => setRes({ data: [], total: 0, page: 1, limit: 40 })), q ? 250 : 0); return () => window.clearTimeout(t); }, [id, q, status, page]);
  const download = async () => {
    const { getSession } = await import('@/lib/api'); const base = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
    const r = await fetch(`${base}${eventApi.host.csvUrl(id)}`, { headers: { Authorization: `Bearer ${getSession()?.accessToken}` } });
    const blob = await r.blob(); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'attendees.csv'; a.click(); URL.revokeObjectURL(a.href);
  };
  return (
    <>
      <div className="notif-toolbar"><input className="ev-searchbox" placeholder="Search name, email or ticket code" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        {['', 'valid', 'used', 'refund_pending', 'refunded'].map((s) => <button key={s} className={`chip ${status === s ? 'chip-active' : ''}`} onClick={() => { setStatus(s); setPage(1); }}>{s ? s.replace('_', ' ') : 'All'}</button>)}
        <button className="button button-quiet" onClick={download}><Download size={15} /> CSV</button></div>
      {!res ? <div className="empty-state">Loading…</div> : res.data.length ? <>
        <div className="booking-list">{res.data.map((t: any) => <div className="booking-row" key={t.id}><div><strong>{t.holder_name || t.holder_email}</strong><p>{t.ticket_type?.name} · <code>{t.code}</code>{t.holder_email !== t.order?.buyer_email ? ` · bought by ${t.order?.buyer_email}` : ''}{t.used_at ? ` · in at ${fmtDateTime(t.used_at)}${t.gate?.name ? ` (${t.gate.name})` : ''}` : ''}</p></div><TicketStatusPill status={t.status} /><span /></div>)}</div>
        <Pager page={res.page} limit={res.limit} total={res.total} onPage={setPage} />
      </> : <div className="empty-state">No tickets match.</div>}
    </>
  );
}
