import { FormEvent, ReactNode, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { cedis, fmtDateTime, fromLocalInput, toLocalInput } from '@/features/events/eventUi';
import { eventApi, HostEventOverview } from '@/lib/api/events';
import { ConfirmDialog } from '@/components/modals';
import { errText } from './hostShared';

export function TicketsTab({ data, reload }: { data: HostEventOverview; reload: () => void }) {
  const ev = data.event; const [editing, setEditing] = useState<any | 'new' | null>(null); const [error, setError] = useState('');
  const [dialog, setDialog] = useState<ReactNode>(null);
  const remove = (t: any) => setDialog(<ConfirmDialog title={t.sold ? `Switch off “${t.name}”?` : `Delete “${t.name}”?`} body={t.sold ? 'It already has sales, so it will be switched off (no new sales) rather than deleted.' : 'This ticket type will be deleted.'} confirmLabel={t.sold ? 'Switch off' : 'Delete'} danger onConfirm={async () => { await eventApi.host.removeTicketType(t.id); setDialog(null); reload(); }} onClose={() => setDialog(null)} />);
  return (
    <>
      <div className="page-header"><h2>Ticket types</h2><button className="button button-primary" onClick={() => setEditing('new')}><Plus size={16} /> Add ticket type</button></div>
      <p className="muted-inline">Prices are in cedis. Set a quantity, or leave it unlimited. Free tickets skip payment but still count towards capacity and are scanned at the gate.</p>
      {error && <div className="form-error">{error}</div>}
      <div className="booking-list">{data.ticket_types.length ? data.ticket_types.map((t) => (
        <div className="booking-row" key={t.id}>
          <div><strong>{t.name} {!t.is_active && <span className="pill">Off</span>}</strong><p>{t.description || ''}{t.sales_end ? ` Sales close ${fmtDateTime(t.sales_end)}.` : ''}</p><small>{t.sold} sold{t.reserved ? ` · ${t.reserved} held in checkouts` : ''} · {t.quantity == null ? 'unlimited' : `${Math.max(0, t.quantity - t.sold - t.reserved)} left of ${t.quantity}`}</small></div>
          <strong>{Number(t.price) === 0 ? 'Free' : cedis(Number(t.price), ev.currency)}</strong>
          <div className="form-actions"><button className="button button-secondary" onClick={() => setEditing(t)}>Edit</button><button className="icon-btn" onClick={() => remove(t)} aria-label="Delete ticket type"><Trash2 size={16} /></button></div>
        </div>)) : <div className="empty-state">No tickets yet — add your first ticket type.</div>}</div>
      {dialog}
      {editing && <TicketTypeDialog eventId={ev.id} ticket={editing === 'new' ? null : editing} currency={ev.currency} onClose={() => setEditing(null)} onDone={() => { setEditing(null); reload(); }} />}
    </>
  );
}

export function TicketTypeDialog({ eventId, ticket, onClose, onDone }: { eventId: string; ticket: any | null; currency: string; onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({
    name: ticket?.name ?? '', description: ticket?.description ?? '', price: ticket ? String(ticket.price) : '', unlimited: ticket ? ticket.quantity == null : false, quantity: ticket?.quantity != null ? String(ticket.quantity) : '',
    sales_start: toLocalInput(ticket?.sales_start), sales_end: toLocalInput(ticket?.sales_end), min_per_order: ticket?.min_per_order ?? 1, max_per_order: ticket?.max_per_order ?? 10, is_active: ticket?.is_active ?? true,
  });
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const save = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setError('');
    const body = { name: f.name, description: f.description, price: Number(f.price || 0), quantity: f.unlimited ? null : Number(f.quantity), sales_start: fromLocalInput(f.sales_start), sales_end: fromLocalInput(f.sales_end), min_per_order: f.min_per_order, max_per_order: f.max_per_order, is_active: f.is_active };
    try { if (ticket) await eventApi.host.updateTicketType(ticket.id, body); else await eventApi.host.addTicketType(eventId, body); onDone(); } catch (err) { setError(errText(err)); } finally { setBusy(false); }
  };
  return (
    <div className="modal" role="dialog" aria-modal="true"><form className="modal-card" onSubmit={save}>
      <h2>{ticket ? 'Edit ticket' : 'New ticket type'}</h2>
      <label className="fld">Name<input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Regular, VIP, Early bird, Table for 6…" /></label>
      <label className="fld">What's included <small>optional</small><input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>
      <div className="two">
        <label className="fld">Price (GH₵)<input required type="number" min={0} step="0.01" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} placeholder="0 for free" /></label>
        <label className="fld">How many{!f.unlimited && <input required type="number" min={1} value={f.quantity} onChange={(e) => setF({ ...f, quantity: e.target.value })} />}<span className="check"><input type="checkbox" checked={f.unlimited} onChange={(e) => setF({ ...f, unlimited: e.target.checked })} /> Unlimited</span></label>
      </div>
      <div className="two"><label className="fld">Sales open <small>optional</small><input type="datetime-local" value={f.sales_start} onChange={(e) => setF({ ...f, sales_start: e.target.value })} /></label><label className="fld">Sales close <small>optional</small><input type="datetime-local" value={f.sales_end} onChange={(e) => setF({ ...f, sales_end: e.target.value })} /></label></div>
      <div className="two"><label className="fld">Min per order<input type="number" min={1} value={f.min_per_order} onChange={(e) => setF({ ...f, min_per_order: Number(e.target.value) })} /></label><label className="fld">Max per order<input type="number" min={1} max={50} value={f.max_per_order} onChange={(e) => setF({ ...f, max_per_order: Number(e.target.value) })} /></label></div>
      {ticket && <label className="check"><input type="checkbox" checked={f.is_active} onChange={(e) => setF({ ...f, is_active: e.target.checked })} /> On sale</label>}
      {error && <div className="form-error">{error}</div>}
      <div className="form-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? 'Saving…' : 'Save ticket'}</button></div>
    </form></div>
  );
}

// ── Gates tab ─────────────────────────────────────────────────────────────────
