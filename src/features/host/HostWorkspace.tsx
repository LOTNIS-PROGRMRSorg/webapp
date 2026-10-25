import { useEffect, useState } from 'react';
import { BarChart3, Bell, Flag, Building2, CalendarCheck, LayoutDashboard, LogOut, Receipt, Ticket, UtensilsCrossed, Wallet, Wrench } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { api } from '@/lib/api';
import { HostGate } from '@/features/host/HostGate';

// ─────────────────────────────────────────────────────────────────────────────
// Host workspace — what a verified host sees. It has its own navigation, separate
// from the guest site, organised by business line: accommodation today, with
// Events, Food and Services reserved so each can be switched on later without
// reshaping the workspace. Money (bookings, transactions) is shared across lines.
// ─────────────────────────────────────────────────────────────────────────────

export const NAV = [
  { to: '/host', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/host/accommodation', label: 'Accommodation', icon: Building2 },
  { to: '/host/events', label: 'Events', icon: Ticket },
  { to: '/host/listings', label: 'Pause & stats', icon: BarChart3 },
  { to: '/host/bookings', label: 'Bookings', icon: CalendarCheck },
  { to: '/host/move-outs', label: 'Move-outs', icon: LogOut },
  { to: '/host/earnings', label: 'Earnings', icon: Wallet },
  { to: '/host/reports', label: 'Reports', icon: Flag },
  { to: '/host/transactions', label: 'Transactions', icon: Receipt },
  { to: '/host/notifications', label: 'Notifications', icon: Bell, badge: true },
];
export const UPCOMING = [
  { to: '/host/food', label: 'Food', icon: UtensilsCrossed },
  { to: '/host/services', label: 'Services', icon: Wrench },
];

export function HostShell() {
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
