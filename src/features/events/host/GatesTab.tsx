import { FormEvent, ReactNode, useCallback, useEffect, useState } from 'react';
import { Copy, KeyRound, Link2, Plus, QrCode, RefreshCw, Trash2 } from 'lucide-react';
import { fmtDateTime } from '@/features/events/eventUi';
import { eventApi, GateRow, HostEventOverview } from '@/lib/api/events';
import { ConfirmDialog, FieldDialog } from '@/components/modals';
import { copy, errText } from './hostShared';

export function GatesTab({ data }: { data: HostEventOverview }) {
  const id = data.event.id;
  const [gates, setGates] = useState<GateRow[] | null>(null);
  const [form, setForm] = useState({ name: '', pin: '', assigned_to: '', send_to: '' });
  const [fresh, setFresh] = useState<{ name: string; link: string; pin?: string; emailed: boolean } | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const load = useCallback(() => eventApi.host.gates(id).then(setGates).catch((e) => setError(errText(e))), [id]);
  useEffect(() => { load(); }, [load]);
  const add = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setError('');
    try { const r = await eventApi.host.addGate(id, { name: form.name, pin: form.pin || undefined, assigned_to: form.assigned_to || undefined, send_to: form.send_to || undefined }); setFresh({ name: form.name, link: r.link, pin: form.pin || undefined, emailed: r.emailed }); setForm({ name: '', pin: '', assigned_to: '', send_to: '' }); load(); }
    catch (err) { setError(errText(err)); } finally { setBusy(false); }
  };
  const [dialog, setDialog] = useState<ReactNode>(null);
  const regen = (g: GateRow) => setDialog(<FieldDialog title={`New link for ${g.name}`} intro="The old link stops working immediately. You can email the new one to the person scanning." fields={[{ name: 'send_to', label: 'Email the new link to', type: 'email', hint: 'optional' }]} submitLabel="Create new link"
    onSubmit={async (v) => { const r = await eventApi.host.regenerateGate(g.id, { send_to: String(v.send_to) || undefined }); setFresh({ name: g.name, link: r.link, emailed: r.emailed }); setDialog(null); load(); }} onClose={() => setDialog(null)} />);
  const toggle = async (g: GateRow) => { try { await eventApi.host.updateGate(g.id, { is_active: !g.is_active }); load(); } catch (err) { setError(errText(err)); } };
  const setPin = (g: GateRow) => setDialog(<FieldDialog title={g.has_pin ? `Change PIN for ${g.name}` : `Set a PIN for ${g.name}`} intro="A PIN is a second lock: the scanner needs the link and the PIN. Give it to the person separately." fields={[{ name: 'pin', label: 'PIN', type: 'text', hint: g.has_pin ? '4–10 letters or numbers — leave empty to remove the PIN' : '4–10 letters or numbers', maxLength: 10 }]} submitLabel="Save PIN"
    onSubmit={async (v) => { await eventApi.host.updateGate(g.id, { pin: String(v.pin).trim() }); setDialog(null); load(); }} onClose={() => setDialog(null)} />);
  const remove = (g: GateRow) => setDialog(<ConfirmDialog title={`Remove ${g.name}?`} body="Its link stops working. If it has scan history it is switched off instead of deleted." confirmLabel="Remove" danger onConfirm={async () => { await eventApi.host.removeGate(g.id); setDialog(null); load(); }} onClose={() => setDialog(null)} />);
  return (
    <>
      <h2>Gates &amp; scanners</h2>
      <p className="muted-inline">Name each entrance (Gate 1, VIP door…) and give it to the person scanning. They open a private link on their phone — no account — and see the gate name and a scanner. Add a PIN as a second lock and give it to them separately.</p>
      {error && <div className="form-error">{error}</div>}
      {fresh && <div className="callout"><Link2 size={22} /><div><b>{fresh.name} is ready</b><p>This link is shown once — copy it now{fresh.emailed ? ' (we also emailed it)' : ''}.</p>
        <div className="ev-linkbox"><code>{fresh.link}</code><button className="button button-secondary" onClick={() => copy(fresh.link)}><Copy size={15} /> Copy</button></div>
        {fresh.pin && <p>PIN: <code>{fresh.pin}</code> — share it separately.</p>}
        <button className="button button-quiet" onClick={() => setFresh(null)}>Done</button></div></div>}
      <form className="ev-gateform" onSubmit={add}>
        <label className="fld">Gate name <small>required</small><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Gate 1" /></label>
        <label className="fld">Given to <small>your note</small><input value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} placeholder="Kwame" /></label>
        <label className="fld">PIN <small>optional</small><input value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} placeholder="4–10 characters" /></label>
        <label className="fld">Email the link to <small>optional</small><input type="email" value={form.send_to} onChange={(e) => setForm({ ...form, send_to: e.target.value })} /></label>
        <button className="button button-primary" disabled={busy}><Plus size={16} /> Create gate</button>
      </form>
      <div className="booking-list">{!gates ? <div className="empty-state">Loading…</div> : gates.length ? gates.map((g) => (
        <div className="booking-row" key={g.id}>
          <div><strong><QrCode size={15} /> {g.name} {!g.is_active && <span className="pill">Off</span>}</strong><p>{g.assigned_to ? `With ${g.assigned_to} · ` : ''}{g.has_pin ? 'PIN protected' : 'No PIN'} · {g.last_used_at ? `last scan ${fmtDateTime(g.last_used_at)}` : 'not used yet'}</p></div>
          <span />
          <div className="form-actions"><button className="button button-quiet" onClick={() => setPin(g)}><KeyRound size={15} /> PIN</button><button className="button button-quiet" onClick={() => regen(g)}><RefreshCw size={15} /> New link</button><button className="button button-quiet" onClick={() => toggle(g)}>{g.is_active ? 'Switch off' : 'Switch on'}</button><button className="icon-btn" onClick={() => remove(g)} aria-label="Remove gate"><Trash2 size={16} /></button></div>
        </div>)) : <div className="empty-state">No gates yet. Create one above to get a scanner link.</div>}</div>
      <h2 className="subsection-heading">Recent scans</h2><RecentScans id={id} />
      {dialog}
    </>
  );
}

export const SCAN_LABEL: Record<string, string> = { valid: 'Admitted', already_used: 'Already used', not_found: 'Not found', refunded: 'Refunded', refund_pending: 'Refund pending', cancelled: 'Cancelled', wrong_event: 'Wrong event', outside_window: 'Outside window', event_cancelled: 'Event cancelled' };
export function RecentScans({ id }: { id: string }) {
  const [rows, setRows] = useState<any[] | null>(null);
  useEffect(() => { const load = () => eventApi.host.scans(id).then(setRows).catch(() => setRows([])); load(); const t = window.setInterval(load, 15000); return () => window.clearInterval(t); }, [id]);
  if (!rows) return <div className="empty-state">Loading…</div>;
  return rows.length ? <div className="booking-list">{rows.map((r) => <div className="booking-row" key={r.id}><div><strong>{r.ticket?.holder_name || r.ticket?.holder_email || r.code}</strong><p>{r.ticket?.ticket_type?.name || ''} · {r.gate?.name || 'Gate'} · {fmtDateTime(r.scanned_at)}</p></div><span className={`status status-${r.result === 'valid' ? 'confirmed' : 'cancelled'}`}>{SCAN_LABEL[r.result] || r.result}</span><span /></div>)}</div> : <div className="empty-state">No scans yet.</div>;
}

// ── Attendees / orders ────────────────────────────────────────────────────────
