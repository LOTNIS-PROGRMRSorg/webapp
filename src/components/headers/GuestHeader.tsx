import { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import type { AuthUser } from '@/types';
import { api } from '@/lib/api';
import { AuthLink, useAuthModal } from '@/features/auth/AuthModal';
import { NotificationBell } from '@/features/account/notifications';
import { lineByKey, type LineKey } from '@/lib/lines';

// "Soon" follows each line's status in lib/lines.ts, so launching a line there updates the header too.
const isSoon = (key: LineKey) => lineByKey(key).status === 'soon';
const tabs: Array<{ key: LineKey; to: string; label: string }> = [
  { key: 'spaces', to: '/explore', label: 'Spaces' },
  { key: 'events', to: '/events', label: 'Events' },
  { key: 'services', to: '/services', label: 'Services' },
  { key: 'food', to: '/food', label: 'Food' },
];

const NavLinks = ({ className }: { className: string }) => (
  <>
    {tabs.map((tab) => (
      <NavLink key={tab.key} to={tab.to} className={className}>
        {tab.label}
        {isSoon(tab.key) && <span className="hdr-soon">Soon</span>}
      </NavLink>
    ))}
  </>
);

/** The website header: brand, the four lines, hosting, and the account menu. Static — no motion. */
export function GuestHeader({ session, onSignOut }: { session: AuthUser | null; onSignOut: () => void }) {
  const { pathname } = useLocation();
  const { openSignIn } = useAuthModal();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isHome = pathname === '/';
  // Over the homepage photo the header is transparent until you scroll or open the menu.
  const overlay = isHome && !scrolled && !menuOpen;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  // Verified hosts see "Host dashboard"; everyone else sees "Become a host".
  useEffect(() => {
    if (!session) return setIsHost(false);
    let live = true;
    api
      .getHostAccess()
      .then((a) => live && setIsHost(a.can_access_dashboard))
      .catch(() => live && setIsHost(false));
    return () => {
      live = false;
    };
  }, [session]);

  // Close the menu on outside click / Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const hostLink = isHost ? '/host' : '/host/start';
  const hostLabel = isHost ? 'Host dashboard' : 'Become a host';
  const initial = session?.email?.trim().charAt(0).toUpperCase() || '';

  return (
    <header className={['hdr', isHome && 'hdr-home', overlay && 'hdr-overlay'].filter(Boolean).join(' ')}>
      <div className="hdr-inner">
        <Link className="brand" to="/" aria-label="Lotnis home">
          <span className="brand-mark">L</span>lotnis
        </Link>

        <nav className="hdr-nav" aria-label="Main">
          <NavLinks className="hdr-link" />
        </nav>

        <div className="hdr-actions" ref={menuRef}>
          <AuthLink className="hdr-host" to={hostLink}>
            {hostLabel}
          </AuthLink>
          {session && <NotificationBell />}

          {session ? (
            <button
              type="button"
              className="hdr-account"
              aria-label="Account menu"
              aria-haspopup="true"
              aria-expanded={menuOpen}
              aria-controls="hdr-menu"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={16} /> : <Menu size={16} />}
              <span className="hdr-avatar" aria-hidden="true">
                {initial}
              </span>
            </button>
          ) : (
            <>
              <button type="button" className="hdr-signin" onClick={() => openSignIn()}>
                Sign in
              </button>
              <button
                type="button"
                className="hdr-menu-btn"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-haspopup="true"
                aria-expanded={menuOpen}
                aria-controls="hdr-menu"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </>
          )}

          {menuOpen && (
            <div className="hdr-menu" id="hdr-menu">
              <nav className="hdr-menu-tabs" aria-label="Main">
                <NavLinks className="hdr-menu-link" />
                <hr />
              </nav>
              {session && <span className="hdr-menu-who">{session.email}</span>}
              <AuthLink to={hostLink}>{hostLabel}</AuthLink>
              {session ? (
                <>
                  <hr />
                  <Link to="/trips">My trips</Link>
                  <Link to="/my-tickets">My tickets</Link>
                  <Link to="/favorites">Favourites</Link>
                  <Link to="/notifications">Notifications</Link>
                  <Link to="/transactions">Transactions</Link>
                  <hr />
                  <button type="button" onClick={onSignOut}>
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/how-it-works">How it works</Link>
                  <hr />
                  <button
                    type="button"
                    className="hdr-menu-primary"
                    onClick={() => {
                      setMenuOpen(false);
                      openSignIn();
                    }}
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
