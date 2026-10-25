import { useCallback, useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api, getSession } from '@/lib/api';
import { timeAgo } from '@/lib/format';
import type { AppNotification } from '@/types';

const POLL_MS = 45_000;

/** Where a notification should take the user. Types are namespaced ("booking.*",
 *  "host.*", "refund.*"); Events / Food / Services will add their own prefixes. */
function destination(notification: AppNotification): string {
  const exitId = notification.data?.exit_id;
  if (notification.type.startsWith('exit.') && typeof exitId === 'string') return `/moveouts/${exitId}`;
  if (notification.audience === 'host') return '/host';
  const area = notification.type.split('.')[0];
  return area === 'booking' || area === 'refund' ? '/trips' : '/notifications';
}

export function NotificationBell() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!getSession()) { setCount(0); return; }
    let live = true;
    const refresh = () => api.getUnreadCount().then((n) => live && setCount(n)).catch(() => {});
    refresh();
    const timer = window.setInterval(refresh, POLL_MS);
    const onRead = () => refresh();
    window.addEventListener('lotnis-notifications-read', onRead);
    return () => { live = false; window.clearInterval(timer); window.removeEventListener('lotnis-notifications-read', onRead); };
  }, []);
  return (
    <Link className="bell-link" to="/notifications" aria-label={count ? `Notifications, ${count} unread` : 'Notifications'}>
      <Bell size={18} />
      {count > 0 && <span className="bell-badge">{count > 99 ? '99+' : count}</span>}
    </Link>
  );
}

type Tab = 'all' | 'user' | 'host';

export function NotificationsPage({ embedded = false, defaultTab = 'all' }: { embedded?: boolean; defaultTab?: Tab } = {}) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = useCallback((before?: string) => {
    setLoading(true);
    return api.getNotifications({ audience: tab === 'all' ? undefined : tab, before })
      .then((rows) => { setItems((current) => (before ? [...current, ...rows] : rows)); setDone(rows.length < 30); setError(''); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load notifications'))
      .finally(() => setLoading(false));
  }, [tab]);
  useEffect(() => { load(); }, [load]);

  const announce = () => window.dispatchEvent(new Event('lotnis-notifications-read'));
  const open = async (n: AppNotification) => {
    if (!n.read_at) {
      await api.markNotificationsRead([n.id]).catch(() => {});
      setItems((c) => c.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)));
      announce();
    }
    navigate(destination(n));
  };
  const readAll = async () => {
    await api.markAllNotificationsRead().catch(() => {});
    setItems((c) => c.map((x) => ({ ...x, read_at: x.read_at || new Date().toISOString() })));
    announce();
  };

  return (
    <section className={embedded ? 'host-page' : 'section dashboard-page'}>
      <span className="eyebrow">Stay in the loop</span>
      <h1>Notifications</h1>
      <p className="lead">Updates on your trips, refunds and — if you host — your listings and verification.</p>
      <div className="notif-toolbar">
        {([['all', 'All'], ['user', 'My trips'], ['host', 'Hosting']] as const).map(([key, label]) => (
          <button key={key} className={`chip ${tab === key ? 'chip-active' : ''}`} onClick={() => setTab(key)}>{label}</button>
        ))}
        <span className="grow" />
        <button className="chip" onClick={readAll}>Mark all read</button>
      </div>
      {error ? <div className="error-state">{error}</div> : loading && !items.length ? <div className="empty-state">Loading…</div> : items.length ? (
        <div className="notif-list">
          {items.map((n) => (
            <button key={n.id} className={`notif-item ${n.read_at ? '' : 'notif-unread'}`} onClick={() => open(n)}>
              <span className="notif-dot" aria-hidden="true" />
              <span className="notif-body">
                <strong>{n.title}</strong>
                {n.body && <span>{n.body}</span>}
                <small>{timeAgo(n.created_at)}{n.audience === 'host' ? ' · Hosting' : ''}</small>
              </span>
            </button>
          ))}
          {!done && <button className="chip" disabled={loading} onClick={() => load(items[items.length - 1].created_at)}>{loading ? 'Loading…' : 'Load older'}</button>}
        </div>
      ) : <div className="empty-state">Nothing yet. Updates about your bookings will show up here.</div>}
    </section>
  );
}
