import { useState } from 'react';
import { ChevronDown, Home, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { NotificationBell } from '@/features/account/notifications';

/** Header for the host workspace — replaces the guest header while managing a business. */
export function HostHeader({ onSignOut }: { onSignOut: () => void }) {
  const [accountOpen, setAccountOpen] = useState(false);
  return (
    <header className="host-header">
      <div className="host-header-inner">
        <Link className="brand" to="/host">
          <span className="brand-mark">L</span>lotnis <em className="host-chip">Host</em>
        </Link>
        <div className="host-header-actions">
          <Link className="hdr-host" to="/">
            <Home size={16} /> Switch to guest
          </Link>
          <NotificationBell />
          <button className="hdr-pill" aria-expanded={accountOpen} onClick={() => setAccountOpen(!accountOpen)}>
            <UserRound size={16} /> Account <ChevronDown size={14} />
          </button>
          {accountOpen && (
            <div className="hdr-menu" onClick={() => setAccountOpen(false)}>
              <Link to="/">Guest site</Link>
              <Link to="/trips">My trips</Link>
              <Link to="/host/notifications">Notifications</Link>
              <hr />
              <button onClick={onSignOut}>Sign out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
