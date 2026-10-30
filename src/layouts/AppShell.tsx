import { useEffect, useState } from 'react';
import { UtensilsCrossed, Wrench } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getSession, setSession } from '@/lib/api';
import { AuthLink } from '@/features/auth/AuthModal';
import { GuestHeader, HostHeader } from '@/components/headers';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [session, setCurrentSession] = useState(getSession());
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // A new page always starts at the top (links with #anchors scroll to the anchor instead).
  useEffect(() => {
    if (!window.location.hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  // Pick up sign-in/sign-out from other pages.
  useEffect(() => {
    setCurrentSession(getSession());
  }, [pathname]);
  if (pathname.startsWith('/scan/')) return <>{children}</>;
  const signOut = () => {
    setSession(null);
    setCurrentSession(null);
    navigate('/');
  };
  // Hosts working in their workspace get their own header and no guest footer —
  // the guest navigation (Stays, Food, trips…) is irrelevant while managing a business.
  const isHostArea = pathname.startsWith('/host') && !pathname.startsWith('/host/apply') && pathname !== '/host/start';
  if (isHostArea) {
    return (
      <div className="app-shell app-shell-host">
        <HostHeader onSignOut={signOut} />
        <main>{children}</main>
      </div>
    );
  }
  return (
    <div className="app-shell">
      <GuestHeader session={session} onSignOut={signOut} />
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
                  <AuthLink to="/host/start">Become a host</AuthLink>
                </li>
                <li>
                  <AuthLink to="/host/start">Host dashboard</AuthLink>
                </li>
              </ul>
            </div>
            <div>
              <h3>Your account</h3>
              <ul>
                {!session && (
                  <li>
                    <AuthLink to="/">Sign in</AuthLink>
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
