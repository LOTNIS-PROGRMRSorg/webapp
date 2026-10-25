import { useEffect, useState } from 'react';
import { ChevronDown, Home, Menu, UserRound, UtensilsCrossed, Wrench, X } from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { getSession, setSession } from '@/lib/api';
import { NotificationBell } from '@/features/account/notifications';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [session, setCurrentSession] = useState(getSession());
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [accountOpen, setAccountOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isHome = pathname === '/';
  // A new page always starts at the top (links with #anchors scroll to the anchor instead).
  useEffect(() => {
    if (!window.location.hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  if (pathname.startsWith('/scan/')) return <>{children}</>;
  const overlay = isHome && !scrolled && !menuOpen;
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  // Pick up sign-in/sign-out from other pages and close menus on navigation.
  useEffect(() => {
    setCurrentSession(getSession());
    setAccountOpen(false);
    setMenuOpen(false);
  }, [pathname]);
  const signOut = () => {
    setSession(null);
    setCurrentSession(null);
    setAccountOpen(false);
    setMenuOpen(false);
    navigate('/');
  };
  // Hosts working in their workspace get their own header and no guest footer —
  // the guest navigation (Stays, Food, trips…) is irrelevant while managing a business.
  const isHostArea = pathname.startsWith('/host') && !pathname.startsWith('/host/apply');
  if (isHostArea) {
    return (
      <div className="app-shell app-shell-host">
        <header className="site-header host-header">
          <div className="host-header-inner">
            <Link className="brand" to="/host">
              <span className="brand-mark">L</span>lotnis <em className="host-chip">Host</em>
            </Link>
            <div className="host-header-actions">
              <Link className="header-link" to="/">
                <Home size={16} /> Switch to guest
              </Link>
              <NotificationBell />
              <button className="profile-pill" aria-expanded={accountOpen} onClick={() => setAccountOpen(!accountOpen)}>
                <UserRound size={16} /> Account <ChevronDown size={14} />
              </button>
              {accountOpen && (
                <div className="account-menu">
                  <Link to="/">Guest site</Link>
                  <Link to="/trips">My trips</Link>
                  <Link to="/host/notifications">Notifications</Link>
                  <hr />
                  <button onClick={signOut}>Sign out</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main>{children}</main>
      </div>
    );
  }
  const navLinks = (
    <>
      <NavLink to="/explore">Spaces</NavLink>
      <NavLink to="/events">Events</NavLink>
      <NavLink to="/food">
        Food <span className="soon">Soon</span>
      </NavLink>
      <NavLink to="/services">
        Services <span className="soon">Soon</span>
      </NavLink>
    </>
  );
  return (
    <div className="app-shell">
      <header
        className={[
          'site-header',
          isHome && 'site-header-home',
          overlay && 'site-header-overlay',
          menuOpen && 'site-header-open',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="site-header-inner">
          <Link className="brand" to="/">
            <span className="brand-mark">L</span>lotnis
          </Link>
          <nav className="main-nav" aria-label="Main">
            {navLinks}
          </nav>
          <div className="header-actions">
            <Link className="header-link" to="/host">
              {session ? 'Host dashboard' : 'Become a host'}
            </Link>
            {session && <NotificationBell />}
            {!session ? (
              <Link className="header-signin" to="/auth">
                <UserRound size={16} /> Sign in
              </Link>
            ) : (
              <button className="profile-pill" aria-expanded={accountOpen} onClick={() => setAccountOpen(!accountOpen)}>
                <UserRound size={16} /> Account <ChevronDown size={14} />
              </button>
            )}
            <button
              className="mobile-menu"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            {accountOpen && session && (
              <div className="account-menu">
                <Link to="/trips">My trips</Link>
                <Link to="/my-tickets">My tickets</Link>
                <Link to="/notifications">Notifications</Link>
                <Link to="/transactions">Transactions</Link>
                <Link to="/host">Host dashboard</Link>
                <hr />
                <button onClick={signOut}>Sign out</button>
              </div>
            )}
          </div>
        </div>
        {menuOpen && (
          <nav className="mobile-panel" aria-label="Mobile">
            {navLinks}
            <Link to="/host">{session ? 'Host dashboard' : 'Become a host'}</Link>
            {session ? (
              <>
                <Link to="/trips">My trips</Link>
                <Link to="/my-tickets">My tickets</Link>
                <Link to="/notifications">Notifications</Link>
                <Link to="/transactions">Transactions</Link>
                <button onClick={signOut}>Sign out</button>
              </>
            ) : (
              <Link className="header-signin" to="/auth">
                <UserRound size={16} /> Sign in
              </Link>
            )}
          </nav>
        )}
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="footer-soon">
            <h2>Coming soon to Lotnis</h2>
            <div className="footer-soon-list">
              <Link to="/food">
                <UtensilsCrossed size={16} /> Food
              </Link>
              <Link to="/services">
                <Wrench size={16} /> Service providers
              </Link>
            </div>
          </div>
          <div className="footer-grid">
            <div>
              <Link className="brand" to="/">
                <span className="brand-mark">L</span>lotnis
              </Link>
              <p>Places, people and experiences that make a trip feel personal.</p>
            </div>
            <div>
              <h3>Explore</h3>
              <ul>
                <li>
                  <Link to="/explore">All spaces</Link>
                </li>
                <li>
                  <Link to="/events">Events</Link>
                </li>
                <li>
                  <Link to="/how-it-works">How it works</Link>
                </li>
                <li>
                  <Link to="/explore?query=Accra">Accra</Link>
                </li>
                <li>
                  <Link to="/explore?query=Kumasi">Kumasi</Link>
                </li>
                <li>
                  <Link to="/explore?query=Cape%20Coast">Cape Coast</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3>Hosting</h3>
              <ul>
                <li>
                  <Link to="/host">Become a host</Link>
                </li>
                <li>
                  <Link to="/host">Host dashboard</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3>Your account</h3>
              <ul>
                {!session && (
                  <li>
                    <Link to="/auth">Sign in</Link>
                  </li>
                )}
                <li>
                  <Link to="/trips">My trips</Link>
                </li>
                <li>
                  <Link to="/transactions">Transactions</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3>Legal</h3>
              <ul>
                <li>
                  <Link to="/terms">Terms of Use</Link>
                </li>
                <li>
                  <Link to="/ticket-terms">Tickets &amp; events</Link>
                </li>
                <li>
                  <Link to="/refund-policy">Refunds &amp; cancellations</Link>
                </li>
                <li>
                  <Link to="/privacy">Privacy</Link>
                </li>
                <li>
                  <Link to="/host-agreement">Host agreement</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            © {new Date().getFullYear()} Lotnis · <Link to="/terms">Terms</Link> · <Link to="/privacy">Privacy</Link> ·{' '}
            <Link to="/refund-policy">Refunds</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
