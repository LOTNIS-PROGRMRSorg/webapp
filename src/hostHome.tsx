import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, Banknote, Building2, CalendarClock, Check, Pencil, Plus, Smartphone, Star, Trash2, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from './api';
import { ConfirmDialog, FieldDialog } from './dialogs';
import { cedis, EventStatusPill, fmtDate, fmtDateTime } from './eventUi';
import { eventApi, PayoutItem, PayoutMethod, PayoutOptions, PayoutSummary } from './eventApi';
import { money, periodLabel, primaryImage } from './format';
import { BookingRequests } from './hostWorkspace';
import { Seo } from './seo';
import type { Booking, Property } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// What a host sees first, across everything they do on Lotnis — stays, events and money — plus the
// all-services transactions list and where they want to be paid.
// ─────────────────────────────────────────────────────────────────────────────

const errText = (e: unknown, fallback = 'Something went wrong') => (e instanceof Error ? e.message : fallback);
const PageHeader = ({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) => (
  <div className="host-page-head"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1></div>{children}</div>
);
const Stat = ({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) => <div><span>{label}</span><strong>{value}</strong>{sub && <small>{sub}</small>}</div>;

export function HostOverview() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [properties, setProperties] = useState<Property[] | null>(null);
  const [events, setEvents] = useState<Array<Record<string, any>> | null>(null);
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    // Each area loads on its own: events not being set up must never hide the host's stays.
    api.getHostBookings().then((r) => setBookings(r.data || [])).catch((e) => setError(errText(e)));
    api.getMyProperties().then((p) => setProperties(p || [])).catch((e) => setError(errText(e)));
    eventApi.host.list().then(setEvents).catch(() => setEvents([]));
    eventApi.payouts.summary().then(setSummary).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Accra' });
  const requests = bookings.filter((b) => b.reservation_stage === 'awaiting_host_acceptance' && b.status === 'pending');
  const upcomingStays = bookings.filter((b) => (b.status === 'confirmed' || b.status === 'active') && b.end_date >= today).sort((a, b) => a.start_date.localeCompare(b.start_date));
  const liveEvents = (events ?? []).filter((e) => e.status === 'published' && new Date(e.ends_at) > new Date()).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const ticketsSold = (events ?? []).reduce((a, e) => a + (e.stats?.tickets_sold ?? 0), 0);

  const attention = useMemo(() => {
    const items: Array<{ key: string; text: string; to: string; tone?: 'warn' }> = [];
    if (requests.length) items.push({ key: 'req', tone: 'warn', text: `${requests.length} booking request${requests.length > 1 ? 's' : ''} waiting for your answer`, to: '/host/bookings' });
    for (const e of events ?? []) {
      if (e.status === 'rejected') items.push({ key: `rej-${e.id}`, tone: 'warn', text: `“${e.title}” needs changes before it can go live`, to: `/host/events/${e.id}` });
      else if (e.status === 'draft') items.push({ key: `dr-${e.id}`, text: `“${e.title}” is still a draft — finish it and submit for review`, to: `/host/events/${e.id}` });
      if (e.stats?.refund_requests_pending) items.push({ key: `rf-${e.id}`, text: `${e.stats.refund_requests_pending} refund request${e.stats.refund_requests_pending > 1 ? 's' : ''} on “${e.title}” (Lotnis is reviewing)`, to: `/host/events/${e.id}?tab=refunds` });
    }
    for (const p of properties ?? []) if (p.approval_status === 'rejected') items.push({ key: `p-${p.id}`, tone: 'warn', text: `Your listing “${p.name}” needs changes`, to: '/host/accommodation' });
    if (summary && !summary.payout_details && (summary.totals.awaiting_release + summary.totals.due) > 0) items.push({ key: 'payout', tone: 'warn', text: 'Add a payout account so Lotnis can pay you', to: '/host/payout-settings' });
    if (summary?.totals.on_hold) items.push({ key: 'hold', text: `${cedis(summary.totals.on_hold, summary.currency)} of your earnings is on hold while a problem is reviewed`, to: '/host/earnings' });
    return items;
  }, [requests.length, events, properties, summary]);

  const c = summary?.currency || 'GHS';
  return (
    <section className="host-page">
      <Seo title="Host overview" description="Your hosting overview" noindex />
      <PageHeader eyebrow="Overview" title="Welcome back.">
        <div className="form-actions">
          <Link className="button button-secondary" to="/host/events/new">Create an event</Link>
          <Link className="button button-primary" to="/host/accommodation/new">Add a space <ArrowRight size={16} /></Link>
        </div>
      </PageHeader>
      {error && <div className="error-state">{error}</div>}

      <h2 className="subsection-heading">Your money</h2>
      <div className="metric-grid metric-grid-4">
        <Stat label="Waiting for release" value={summary ? cedis(summary.totals.awaiting_release, c) : '—'} sub={summary?.next_release_at ? `next ${fmtDate(summary.next_release_at)}` : 'across stays and events'} />
        <Stat label="Ready to send" value={summary ? cedis(summary.totals.due, c) : '—'} sub="Lotnis pays this out next" />
        <Stat label="Paid to you" value={summary ? cedis(summary.totals.paid, c) : '—'} sub="to date" />
        <Stat label="On hold" value={summary ? cedis(summary.totals.on_hold, c) : '—'} sub="while a problem is reviewed" />
      </div>
      <p className="muted-inline"><Link to="/host/earnings">See all earnings</Link> · <Link to="/host/transactions">Transactions</Link> · <Link to="/host/payout-settings">Payout accounts</Link></p>

      <h2 className="subsection-heading">Needs your attention</h2>
      {attention.length ? <div className="booking-list">{attention.map((a) => (
        <Link key={a.key} to={a.to} className="booking-row host-attn"><div><AlertCircle size={16} className={a.tone === 'warn' ? 'host-attn-warn' : ''} /> {a.text}</div><span /><ArrowRight size={16} /></Link>))}</div>
        : <div className="notice"><Check size={16} /><span>You're all caught up — nothing is waiting on you.</span></div>}
      <BookingRequests bookings={bookings} onChange={load} />

      <div className="host-twin">
        <div className="host-card">
          <div className="host-card-head"><h2><Building2 size={18} /> Accommodation</h2><Link to="/host/accommodation">Manage</Link></div>
          <div className="host-mini"><Stat label="Listings" value={properties?.length ?? '—'} /><Stat label="Requests" value={requests.length} /><Stat label="Upcoming stays" value={upcomingStays.length} /></div>
          {(properties ?? []).slice(0, 3).map((p) => (
            <Link key={p.id} to="/host/accommodation" className="host-mini-row">
              {primaryImage(p) ? <img className="host-thumb host-thumb-sm" src={primaryImage(p)} alt="" /> : <span className="host-thumb host-thumb-sm host-thumb-ph"><Building2 size={16} /></span>}
              <div><b>{p.name}</b><small>{p.city}{p.price != null ? ` · ${money(p.currency, p.price)} / ${periodLabel(p.pricing_period)}` : ''}</small></div>
            </Link>))}
          {upcomingStays[0] && <p className="muted-inline">Next stay: {upcomingStays[0].property?.name || 'Reservation'} from {upcomingStays[0].start_date}.</p>}
          {properties && !properties.length && <div className="empty-state">No listings yet. <Link to="/host/accommodation/new">Add your first space</Link></div>}
        </div>
        <div className="host-card">
          <div className="host-card-head"><h2><CalendarClock size={18} /> Events</h2><Link to="/host/events">Manage</Link></div>
          <div className="host-mini"><Stat label="On sale" value={liveEvents.length} /><Stat label="Tickets sold" value={ticketsSold.toLocaleString()} /><Stat label="Events" value={events?.length ?? '—'} /></div>
          {(events ?? []).slice(0, 3).map((e) => (
            <Link key={e.id} to={`/host/events/${e.id}`} className="host-mini-row">
              {e.cover_image_url ? <img className="host-thumb host-thumb-sm" src={e.cover_image_url} alt="" /> : <span className="host-thumb host-thumb-sm host-thumb-ph"><CalendarClock size={16} /></span>}
              <div><b>{e.title}</b><small>{fmtDateTime(e.starts_at)} · {e.stats?.tickets_sold ?? 0} sold</small></div><EventStatusPill status={e.status} />
            </Link>))}
          {liveEvents[0] && <p className="muted-inline">Next event: {liveEvents[0].title} on {fmtDate(liveEvents[0].starts_at)}.</p>}
          {events && !events.length && <div className="empty-state">No events yet. <Link to="/host/events/new">Create your first event</Link></div>}
        </div>
      </div>
    </section>
  );
}

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

// ── Payout accounts ──────────────────────────────────────────────────────────

const MOMO_LABEL: Record<string, string> = { MTN: 'MTN MoMo', TELECEL: 'Telecel Cash', AIRTELTIGO: 'AirtelTigo Money' };

export function HostPayoutSettings() {
  const [methods, setMethods] = useState<PayoutMethod[] | null>(null);
  const [options, setOptions] = useState<PayoutOptions | null>(null);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState<ReactNode>(null);
  const close = () => setDialog(null);
  const load = useCallback(() => eventApi.payouts.methods().then((m) => { setMethods(m); setError(''); }).catch((e) => { setError(errText(e)); setMethods([]); }), []);
  useEffect(() => { load(); eventApi.payouts.methodOptions().then(setOptions).catch(() => {}); }, [load]);
  const done = async () => { close(); await load(); };

  const momo = (network: string) => (methods ?? []).find((m) => m.kind === 'momo' && m.provider === network);
  const banks = (methods ?? []).filter((m) => m.kind === 'bank');
  const takenBanks = new Set(banks.map((b) => b.provider));

  const addMomo = (network: string) => setDialog(
    <FieldDialog title={`Add ${MOMO_LABEL[network]}`} intro="Lotnis sends your earnings to this number. It must be registered in your name." submitLabel="Add number"
      fields={[{ name: 'account_number', label: 'Mobile money number', type: 'text', required: true, placeholder: '0244 123 456', hint: `a ${network} number` }, { name: 'account_name', label: 'Name on the account', type: 'text', required: true, placeholder: 'Ama Owusu' }]}
      onSubmit={async (v) => { await eventApi.payouts.addMethod({ kind: 'momo', provider: network, account_number: String(v.account_number), account_name: String(v.account_name) }); await done(); }} onClose={close} />);
  const addBank = () => setDialog(
    <FieldDialog title="Add a bank account" intro="Lotnis sends your earnings to this account. It must be in your name (or your business's)." submitLabel="Add account"
      fields={[{ name: 'provider', label: 'Bank', type: 'select', required: true, options: [['', 'Choose your bank…'], ...(options?.banks ?? []).filter((b) => !takenBanks.has(b)).map((b) => [b, b] as [string, string])] },
        { name: 'account_number', label: 'Account number', type: 'text', required: true, placeholder: '1234567890123' }, { name: 'account_name', label: 'Name on the account', type: 'text', required: true }]}
      onSubmit={async (v) => { await eventApi.payouts.addMethod({ kind: 'bank', provider: String(v.provider), account_number: String(v.account_number), account_name: String(v.account_name) }); await done(); }} onClose={close} />);
  const edit = (m: PayoutMethod) => setDialog(
    <FieldDialog title={`Edit ${m.kind === 'momo' ? MOMO_LABEL[m.provider] : m.provider}`} submitLabel="Save changes"
      fields={[{ name: 'account_number', label: m.kind === 'momo' ? 'Mobile money number' : 'Account number', type: 'text', required: true }, { name: 'account_name', label: 'Name on the account', type: 'text', required: true }]}
      initial={{ account_number: m.account_number, account_name: m.account_name }}
      onSubmit={async (v) => { await eventApi.payouts.updateMethod(m.id, { account_number: String(v.account_number), account_name: String(v.account_name) }); await done(); }} onClose={close} />);
  const remove = (m: PayoutMethod) => setDialog(<ConfirmDialog title="Remove this account?" body={`${m.kind === 'momo' ? MOMO_LABEL[m.provider] : m.provider} ${m.account_number_masked} will no longer be used for payouts.${m.is_default ? ' It is your default, so another account (if you have one) becomes the default.' : ''}`} confirmLabel="Remove" danger onConfirm={async () => { await eventApi.payouts.removeMethod(m.id); await done(); }} onClose={close} />);
  const makeDefault = async (m: PayoutMethod) => { try { await eventApi.payouts.makeDefaultMethod(m.id); await load(); } catch (e) { setError(errText(e)); } };

  const Row = ({ m }: { m: PayoutMethod }) => (
    <div className={`ev-payrow ${m.is_default ? 'ev-payrow-default' : ''}`}>
      <span className="ev-payicon">{m.kind === 'momo' ? <Smartphone size={18} /> : <Banknote size={18} />}</span>
      <div><b>{m.kind === 'momo' ? MOMO_LABEL[m.provider] : m.provider}</b><small>{m.account_number_masked} · {m.account_name}</small></div>
      {m.is_default ? <span className="pill ev-pill-published"><Star size={11} /> Default</span> : <button className="button button-quiet" onClick={() => makeDefault(m)}>Make default</button>}
      <div className="form-actions"><button className="icon-btn" aria-label="Edit" onClick={() => edit(m)}><Pencil size={15} /></button><button className="icon-btn" aria-label="Remove" onClick={() => remove(m)}><Trash2 size={15} /></button></div>
    </div>
  );

  return (
    <section className="host-page">
      <Seo title="Payout accounts" description="Where Lotnis pays you" noindex />
      <Link className="back-link" to="/host/earnings">← Earnings</Link>
      <PageHeader eyebrow="Earnings" title="Payout accounts" />
      <p className="lead">Choose where Lotnis sends your money. Add one mobile money number for each network you use, and bank accounts if you prefer. One account is your <b>default</b> — that's where payouts go.</p>
      {error && <div className="form-error">{error}</div>}
      {!methods ? <div className="empty-state">Loading…</div> : <>
        <h2 className="subsection-heading">Mobile money</h2>
        <div className="ev-paylist">{(options?.momo_networks ?? ['MTN', 'TELECEL', 'AIRTELTIGO']).map((n) => {
          const m = momo(n);
          return m ? <Row key={n} m={m} /> : (
            <div className="ev-payrow ev-payrow-empty" key={n}><span className="ev-payicon"><Smartphone size={18} /></span><div><b>{MOMO_LABEL[n]}</b><small>Not added</small></div><span /><button className="button button-secondary" onClick={() => addMomo(n)}><Plus size={15} /> Add number</button></div>);
        })}</div>
        <h2 className="subsection-heading">Bank accounts</h2>
        <div className="ev-paylist">{banks.map((m) => <Row key={m.id} m={m} />)}{!banks.length && <div className="empty-state">No bank account added.</div>}</div>
        <button className="button button-secondary" onClick={addBank} disabled={!options}><Plus size={15} /> Add a bank account</button>
        <div className="notice"><Wallet size={16} /><span>For your security we tell you whenever a payout account is added, changed or made default. Payouts already being sent keep the account they were prepared with.</span></div>
        {dialog}
      </>}
    </section>
  );
}
