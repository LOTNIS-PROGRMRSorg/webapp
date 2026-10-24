import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, Bell, Building2, CalendarCheck, Check, LayoutDashboard, LogOut, Receipt, Ticket, UtensilsCrossed, Wallet, Wrench,
} from 'lucide-react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { api } from './api';
import { CancelDialog } from './cancel';
import { HostGate } from './hostGate';
import { money, periodLabel, primaryImage } from './format';
import { NotificationsPage } from './notifications';
import { TransactionRows } from './shared';
import type { Booking, Property, Transaction } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Host workspace — what a verified host sees. It has its own navigation, separate
// from the guest site, organised by business line: accommodation today, with
// Events, Food and Services reserved so each can be switched on later without
// reshaping the workspace. Money (bookings, transactions) is shared across lines.
// ─────────────────────────────────────────────────────────────────────────────

const NAV = [
  { to: '/host', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/host/accommodation', label: 'Accommodation', icon: Building2 },
  { to: '/host/events', label: 'Events', icon: Ticket },
  { to: '/host/bookings', label: 'Bookings', icon: CalendarCheck },
  { to: '/host/move-outs', label: 'Move-outs', icon: LogOut },
  { to: '/host/earnings', label: 'Earnings', icon: Wallet },
  { to: '/host/transactions', label: 'Transactions', icon: Receipt },
  { to: '/host/notifications', label: 'Notifications', icon: Bell, badge: true },
];
const UPCOMING = [
  { to: '/host/food', label: 'Food', icon: UtensilsCrossed },
  { to: '/host/services', label: 'Services', icon: Wrench },
];

function HostShell() {
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    let live = true;
    const refresh = () => api.getUnreadCount().then((n) => live && setUnread(n)).catch(() => {});
    refresh();
    const timer = window.setInterval(refresh, 45_000);
    window.addEventListener('lotnis-notifications-read', refresh);
    return () => { live = false; window.clearInterval(timer); window.removeEventListener('lotnis-notifications-read', refresh); };
  }, []);

  return (
    <div className="host-shell">
      <aside className="host-nav" aria-label="Host workspace">
        <div className="host-nav-title">Host workspace</div>
        <nav>
          {NAV.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `host-link ${isActive ? 'host-link-active' : ''}`}>
              <Icon size={18} /><span>{label}</span>
              {badge && unread > 0 && <em className="host-link-badge">{unread > 99 ? '99+' : unread}</em>}
            </NavLink>
          ))}
        </nav>
        <div className="host-nav-title host-nav-soon">Coming soon</div>
        <nav>
          {UPCOMING.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `host-link host-link-soon ${isActive ? 'host-link-active' : ''}`}>
              <Icon size={18} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="host-content"><Outlet /></div>
    </div>
  );
}

/** Layout route: the sidebar and every page inside it are only reachable once verified. */
export function HostWorkspace() {
  return <HostGate>{() => <HostShell />}</HostGate>;
}

// ── Shared loaders ────────────────────────────────────────────────────────────

function useHostBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const reload = () => api.getHostBookings().then((r) => { setBookings(r.data || []); setError(''); }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  useEffect(() => { reload(); }, []);
  return { bookings, error, loading, reload };
}

const guestName = (b: Booking) => [b.renter?.first_name, b.renter?.last_name].filter(Boolean).join(' ') || b.renter?.email || 'Guest';
const PageHeader = ({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) => (
  <div className="host-page-head"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1></div>{children}</div>
);

// ── Booking requests (host must accept/decline within 48h) ────────────────────

export function BookingRequests({ bookings, onChange }: { bookings: Booking[]; onChange: () => void }) {
  const pending = bookings.filter((b) => b.reservation_stage === 'awaiting_host_acceptance' && b.status === 'pending');
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  if (!pending.length) return null;
  const act = async (id: string, work: () => Promise<unknown>, failure: string) => {
    setBusyId(id); setError('');
    try { await work(); onChange(); } catch (err) { setError(err instanceof Error ? err.message : failure); } finally { setBusyId(''); }
  };
  return (
    <>
      <h2 className="subsection-heading">Requests awaiting your response</h2>
      {error && <div className="form-error">{error}</div>}
      <div className="booking-list">
        {pending.map((b) => (
          <div className="booking-row" key={b.id}>
            <div>
              <strong>{b.property?.name || 'Reservation request'}</strong>
              <p>{guestName(b)} · {b.start_date} → {b.end_date}</p>
              {b.host_acceptance_deadline && <small>Respond by {new Date(b.host_acceptance_deadline).toLocaleString()}</small>}
            </div>
            <strong>{money(b.currency_snapshot, b.landlord_payout ?? b.final_amount)}</strong>
            <div className="form-actions">
              <button className="button button-quiet" disabled={busyId === b.id}
                onClick={() => { const reason = window.prompt('Reason for declining this request?') || 'Not available'; act(b.id, () => api.hostRejectBooking(b.id, reason), 'Unable to decline'); }}>Decline</button>
              <button className="button button-primary" disabled={busyId === b.id} onClick={() => act(b.id, () => api.hostAcceptBooking(b.id), 'Unable to accept')}>Accept</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Pages ─────────────────────────────────────────────────────────────────────

const APPROVAL_LABEL: Record<string, string> = {
  pending: 'Awaiting approval', under_review: 'Under review', approved: 'Live', rejected: 'Needs changes', suspended: 'Suspended',
};
const MODE_LABEL: Record<string, string> = { entire: 'Whole property', rooms: 'Room by room', both: 'Whole or by room' };

export function HostAccommodation() {
  const [properties, setProperties] = useState<Property[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { api.getMyProperties().then((p) => setProperties(p || [])).catch((e) => setError(e.message)); }, []);
  return (
    <section className="host-page">
      <PageHeader eyebrow="Accommodation" title="Your spaces">
        <Link className="button button-primary" to="/host/accommodation/new">Add a space <ArrowRight size={16} /></Link>
      </PageHeader>
      {error ? <div className="error-state">{error}</div> : !properties ? <div className="empty-state">Loading…</div> : properties.length ? (
        <div className="space-list">
          {properties.map((p) => {
            const mode = p.booking_mode ?? (p.allows_individual_bookings ? 'both' : 'entire');
            const rooms = (p.rooms || []).filter((r) => !r.deleted_at);
            return (
              <div className="space-row" key={p.id}>
                <div className="host-rowmain">
                  {primaryImage(p) ? <img className="host-thumb" src={primaryImage(p)} alt={p.name} loading="lazy" /> : <span className="host-thumb host-thumb-ph"><Building2 size={22} /></span>}
                  <div>
                    <strong>{p.name}</strong>
                    <p>{[p.sub_type, p.city].filter(Boolean).join(' · ')}</p>
                    <small>{MODE_LABEL[mode]}{rooms.length ? ` · ${rooms.length} room${rooms.length === 1 ? '' : 's'}` : ''}{p.price != null ? ` · ${money(p.currency, p.price)} / ${periodLabel(p.pricing_period)}` : ''}</small>
                  </div>
                </div>
                <span className={`status status-${p.approval_status === 'approved' ? 'confirmed' : p.approval_status === 'rejected' || p.approval_status === 'suspended' ? 'cancelled' : 'pending'}`}>
                  {APPROVAL_LABEL[p.approval_status || 'pending'] || p.approval_status}
                </span>
                {p.approval_status === 'approved' ? <Link className="button button-secondary" to={`/stays/${p.id}`}>View listing</Link> : <span />}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state"><Building2 size={28} /><p>You have no listings yet.</p><Link className="button button-secondary" to="/host/accommodation/new">Create your first listing</Link></div>
      )}
    </section>
  );
}

type BookingTab = 'requests' | 'upcoming' | 'past' | 'cancelled';
export function HostBookings() {
  const { bookings, error, loading, reload } = useHostBookings();
  const [tab, setTab] = useState<BookingTab>('requests');
  const [cancelling, setCancelling] = useState<Booking | null>(null);
  const navigate = useNavigate();
  const todayAccra = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Accra' });
  const startCheckout = async (bookingId: string) => {
    try { const d = await api.startCheckout(bookingId); navigate(`/moveouts/${d.exit.id}`); }
    catch (err) { window.alert(err instanceof Error ? err.message : 'Unable to start checkout'); }
  };
  const groups = useMemo(() => ({
    requests: bookings.filter((b) => b.reservation_stage === 'awaiting_host_acceptance' && b.status === 'pending'),
    upcoming: bookings.filter((b) => b.status === 'confirmed' || b.status === 'active'),
    past: bookings.filter((b) => b.status === 'completed'),
    cancelled: bookings.filter((b) => b.status === 'cancelled' || b.status === 'no_show'),
  }), [bookings]);
  const list = groups[tab];
  return (
    <section className="host-page">
      <PageHeader eyebrow="Bookings" title="Reservations" />
      <div className="notif-toolbar">
        {(['requests', 'upcoming', 'past', 'cancelled'] as BookingTab[]).map((key) => (
          <button key={key} className={`chip ${tab === key ? 'chip-active' : ''}`} onClick={() => setTab(key)} style={{ textTransform: 'capitalize' }}>
            {key} ({groups[key].length})
          </button>
        ))}
      </div>
      {error ? <div className="error-state">{error}</div> : loading ? <div className="empty-state">Loading…</div> : tab === 'requests' ? (
        list.length ? <BookingRequests bookings={bookings} onChange={reload} /> : <div className="empty-state">No requests are waiting for you.</div>
      ) : list.length ? (
        <div className="booking-list">
          {list.map((b) => (
            <div className="booking-row" key={b.id}>
              <div>
                <strong>{b.property?.name || 'Reservation'}</strong>
                <p>{guestName(b)} · {b.start_date} → {b.end_date}</p>
                <small>
                  {b.status === 'cancelled'
                    ? `${b.cancellation_reason ? `Cancelled: ${b.cancellation_reason}. ` : 'Cancelled. '}${b.refund ? `Guest refund ${money(b.refund.currency, b.refund.refund_amount)} · you receive ${money(b.refund.currency, b.refund.host_receives)}.` : ''}`
                    : `Your payout: ${money(b.currency_snapshot, b.landlord_payout)} after check-in`}
                </small>
              </div>
              <span className={`status status-${b.status}`}>{b.status}</span>
              <strong>{money(b.currency_snapshot, b.final_amount)}</strong>
              <div className="form-actions">
                {b.status === 'confirmed' && b.start_date > todayAccra && <button className="button button-quiet" onClick={() => setCancelling(b)}>Cancel</button>}
                {(b.status === 'confirmed' || b.status === 'active') && b.start_date <= todayAccra && <button className="button button-secondary" onClick={() => startCheckout(b.id)}>Start checkout</button>}
              </div>
            </div>
          ))}
        </div>
      ) : <div className="empty-state">Nothing here yet.</div>}
      {cancelling && <CancelDialog bookingId={cancelling.id} role="host" propertyName={cancelling.property?.name || 'Reservation'}
        onClose={() => setCancelling(null)} onDone={() => { setCancelling(null); reload(); }} />}
    </section>
  );
}

export function HostNotifications() {
  return <NotificationsPage embedded defaultTab="host" />;
}

export function HostComingSoon({ title, text }: { title: string; text: string }) {
  return (
    <section className="host-page">
      <PageHeader eyebrow="Coming soon" title={title} />
      <p className="lead">{text}</p>
      <div className="placeholder-columns">
        <div><Check size={18} /><strong>Same host account</strong><p>No new application — your verified account carries over.</p></div>
        <div><Check size={18} /><strong>Same bookings and payouts</strong><p>Orders will appear in your Bookings and Transactions, tagged by service.</p></div>
      </div>
    </section>
  );
}
