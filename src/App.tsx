import { FormEvent, Suspense, lazy, useEffect, useState } from 'react';
import {
  ArrowRight, Building2, Check, ChevronDown, Home, MapPin, Menu, Search, ShieldCheck,
  Ticket, UserRound, UtensilsCrossed, Wrench, X,
} from 'lucide-react';
import { Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, getSession, setSession } from './api';
import { formatPrice, money, periodLabel, primaryImage } from './format';
import HomePage from './HomePage';
import { CancelDialog } from './cancel';
import { STATUS_LABEL } from './exitLabels';
import { NotificationBell, NotificationsPage } from './notifications';
import { PayPage, BookedPage } from './pay';
import { ReportIssueDialog } from './reportIssue';
import { ReservePage } from './reserve';
import { ExplorePage } from './explore';
import { LineLanding } from './lineLanding';
import { Seo, SITE_NAME } from './seo';
import { PhotosPage, StayPage } from './stay';
import { PropertyCard, SpaceFacts, startingPrice, TransactionRows } from './shared';
import type { Booking, ExitCaseSummary, HostProfile, HostRequirementReview, Property, Transaction } from './types';

// Private and rarely-visited areas are split out of the main bundle so public pages (the ones
// search engines and first-time visitors hit) stay light and fast.
const lazyNamed = <M extends object>(loader: () => Promise<M>, name: keyof M) =>
  lazy(() => loader().then((m) => ({ default: m[name] as unknown as React.ComponentType<any> })));
const HowItWorksPage = lazyNamed(() => import('./howItWorks'), 'HowItWorksPage');
const HostApplicationPage = lazyNamed(() => import('./hostApplication'), 'HostApplicationPage');
const HostWorkspace = lazyNamed(() => import('./hostWorkspace'), 'HostWorkspace');
const HostOverview = lazyNamed(() => import('./hostHome'), 'HostOverview');
const HostAccommodation = lazyNamed(() => import('./hostWorkspace'), 'HostAccommodation');
const HostBookings = lazyNamed(() => import('./hostWorkspace'), 'HostBookings');
const HostTransactions = lazyNamed(() => import('./hostHome'), 'HostTransactions');
const HostPayoutSettings = lazyNamed(() => import('./hostHome'), 'HostPayoutSettings');
const HostNotifications = lazyNamed(() => import('./hostWorkspace'), 'HostNotifications');
const HostComingSoon = lazyNamed(() => import('./hostWorkspace'), 'HostComingSoon');
const EventPage = lazyNamed(() => import('./events'), 'EventPage');
const EventsPage = lazyNamed(() => import('./events'), 'EventsPage');
const MyTicketsPage = lazyNamed(() => import('./events'), 'MyTicketsPage');
const OrderPage = lazyNamed(() => import('./events'), 'OrderPage');
const TicketPage = lazyNamed(() => import('./events'), 'TicketPage');
const CategoryPage = lazyNamed(() => import('./voting'), 'CategoryPage');
const NomineePage = lazyNamed(() => import('./voting'), 'NomineePage');
const ScanPage = lazyNamed(() => import('./scan'), 'ScanPage');
const HostEvents = lazyNamed(() => import('./hostEvents'), 'HostEvents');
const HostEventForm = lazyNamed(() => import('./hostEvents'), 'HostEventForm');
const HostEventManage = lazyNamed(() => import('./hostEvents'), 'HostEventManage');
const HostEarnings = lazyNamed(() => import('./hostEvents'), 'HostEarnings');
const NewPropertyPage = lazyNamed(() => import('./newProperty'), 'NewPropertyPage');
const HostMoveOuts = lazyNamed(() => import('./exits'), 'HostMoveOuts');
const ExitCasePage = lazyNamed(() => import('./exits'), 'ExitCasePage');
const LeaveEarlyPage = lazyNamed(() => import('./exits'), 'LeaveEarlyPage');
const TermsPage = lazyNamed(() => import('./legal'), 'TermsPage');
const PrivacyPage = lazyNamed(() => import('./legal'), 'PrivacyPage');
const RefundPolicyPage = lazyNamed(() => import('./legal'), 'RefundPolicyPage');
const TicketTermsPage = lazyNamed(() => import('./legal'), 'TicketTermsPage');
const HostAgreementPage = lazyNamed(() => import('./legal'), 'HostAgreementPage');

function AppShell({ children }: { children: React.ReactNode }) {
  const [session, setCurrentSession] = useState(getSession());
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [accountOpen, setAccountOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isHome = pathname === '/';
  // A new page always starts at the top (links with #anchors scroll to the anchor instead).
  useEffect(() => { if (!window.location.hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior }); }, [pathname]);
  if (pathname.startsWith('/scan/')) return <>{children}</>;
  const overlay = isHome && !scrolled && !menuOpen;
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  // Pick up sign-in/sign-out from other pages and close menus on navigation.
  useEffect(() => { setCurrentSession(getSession()); setAccountOpen(false); setMenuOpen(false); }, [pathname]);
  const signOut = () => { setSession(null); setCurrentSession(null); setAccountOpen(false); setMenuOpen(false); navigate('/'); };
  // Hosts working in their workspace get their own header and no guest footer —
  // the guest navigation (Stays, Food, trips…) is irrelevant while managing a business.
  const isHostArea = pathname.startsWith('/host') && !pathname.startsWith('/host/apply');
  if (isHostArea) {
    return (
      <div className="app-shell app-shell-host">
        <header className="site-header host-header">
          <div className="host-header-inner">
            <Link className="brand" to="/host"><span className="brand-mark">L</span>lotnis <em className="host-chip">Host</em></Link>
            <div className="host-header-actions">
              <Link className="header-link" to="/"><Home size={16} /> Switch to guest</Link>
              <NotificationBell />
              <button className="profile-pill" aria-expanded={accountOpen} onClick={() => setAccountOpen(!accountOpen)}><UserRound size={16} /> Account <ChevronDown size={14} /></button>
              {accountOpen && <div className="account-menu"><Link to="/">Guest site</Link><Link to="/trips">My trips</Link><Link to="/host/notifications">Notifications</Link><hr /><button onClick={signOut}>Sign out</button></div>}
            </div>
          </div>
        </header>
        <main>{children}</main>
      </div>
    );
  }
  const navLinks = <>
    <NavLink to="/explore">Spaces</NavLink>
    <NavLink to="/events">Events</NavLink>
    <NavLink to="/food">Food <span className="soon">Soon</span></NavLink>
    <NavLink to="/services">Services <span className="soon">Soon</span></NavLink>
  </>;
  return (
    <div className="app-shell">
      <header className={['site-header', isHome && 'site-header-home', overlay && 'site-header-overlay', menuOpen && 'site-header-open'].filter(Boolean).join(' ')}>
        <div className="site-header-inner">
          <Link className="brand" to="/"><span className="brand-mark">L</span>lotnis</Link>
          <nav className="main-nav" aria-label="Main">{navLinks}</nav>
          <div className="header-actions">
            <Link className="header-link" to="/host">{session ? 'Host dashboard' : 'Become a host'}</Link>
            {session && <NotificationBell />}
            {!session
              ? <Link className="header-signin" to="/auth"><UserRound size={16} /> Sign in</Link>
              : <button className="profile-pill" aria-expanded={accountOpen} onClick={() => setAccountOpen(!accountOpen)}><UserRound size={16} /> Account <ChevronDown size={14} /></button>}
            <button className="mobile-menu" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
            {accountOpen && session && <div className="account-menu"><Link to="/trips">My trips</Link><Link to="/my-tickets">My tickets</Link><Link to="/notifications">Notifications</Link><Link to="/transactions">Transactions</Link><Link to="/host">Host dashboard</Link><hr /><button onClick={signOut}>Sign out</button></div>}
          </div>
        </div>
        {menuOpen && <nav className="mobile-panel" aria-label="Mobile">
          {navLinks}
          <Link to="/host">{session ? 'Host dashboard' : 'Become a host'}</Link>
          {session ? <>
            <Link to="/trips">My trips</Link>
            <Link to="/my-tickets">My tickets</Link>
            <Link to="/notifications">Notifications</Link>
            <Link to="/transactions">Transactions</Link>
            <button onClick={signOut}>Sign out</button>
          </> : <Link className="header-signin" to="/auth"><UserRound size={16} /> Sign in</Link>}
        </nav>}
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="footer-soon">
            <h2>Coming soon to Lotnis</h2>
            <div className="footer-soon-list">
              <Link to="/food"><UtensilsCrossed size={16} /> Food</Link>
              <Link to="/services"><Wrench size={16} /> Service providers</Link>
            </div>
          </div>
          <div className="footer-grid">
            <div><Link className="brand" to="/"><span className="brand-mark">L</span>lotnis</Link><p>Places, people and experiences that make a trip feel personal.</p></div>
            <div><h3>Explore</h3><ul><li><Link to="/explore">All spaces</Link></li><li><Link to="/events">Events</Link></li><li><Link to="/how-it-works">How it works</Link></li><li><Link to="/explore?query=Accra">Accra</Link></li><li><Link to="/explore?query=Kumasi">Kumasi</Link></li><li><Link to="/explore?query=Cape%20Coast">Cape Coast</Link></li></ul></div>
            <div><h3>Hosting</h3><ul><li><Link to="/host">Become a host</Link></li><li><Link to="/host">Host dashboard</Link></li></ul></div>
            <div><h3>Your account</h3><ul>{!session && <li><Link to="/auth">Sign in</Link></li>}<li><Link to="/trips">My trips</Link></li><li><Link to="/transactions">Transactions</Link></li></ul></div>
            <div><h3>Legal</h3><ul><li><Link to="/terms">Terms of Use</Link></li><li><Link to="/ticket-terms">Tickets &amp; events</Link></li><li><Link to="/refund-policy">Refunds &amp; cancellations</Link></li><li><Link to="/privacy">Privacy</Link></li><li><Link to="/host-agreement">Host agreement</Link></li></ul></div>
          </div>
          <div className="footer-bottom">© {new Date().getFullYear()} Lotnis · <Link to="/terms">Terms</Link> · <Link to="/privacy">Privacy</Link> · <Link to="/refund-policy">Refunds</Link></div>
        </div>
      </footer>
    </div>
  );
}

function SearchBox() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('query') || '');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (query.trim()) params.set('query', query.trim()); else params.delete('query');
    navigate(`/explore?${params}`);
  };
  return <form className="search-box" onSubmit={submit}><Search size={19} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Where do you want to stay?" /><button className="button button-primary">Search</button></form>;
}

function startGoogleSignIn(next: string) {
  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '');
  if (!supabaseUrl) throw new Error('Sign-in is not configured yet. Contact Lotnis support.');
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  const authorizeUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
  window.location.href = authorizeUrl;
}

function AuthPage() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const continueWithGoogle = () => {
    try { startGoogleSignIn(searchParams.get('next') || '/'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to start sign-in'); }
  };
  return <section className="auth-page"><Seo title="Sign in" description="Sign in to Lotnis with Google to book stays and host your own spaces." path="/auth" noindex /><div className="auth-card"><span className="eyebrow">Welcome to Lotnis</span><h1>One account for every journey.</h1><p>Sign in with Google to reserve stays and build your own hosting business. New accounts are created automatically.</p>{searchParams.get('expired') && <div className="notice"><span>Your session expired, so you've been signed out. Sign in again to carry on where you left off.</span></div>}{error && <div className="form-error">{error}</div>}<button className="button button-primary button-wide google-button" onClick={continueWithGoogle}><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62Z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.81.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.9v2.33A9 9 0 0 0 9 18Z"/><path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.97H.9A9 9 0 0 0 0 9c0 1.45.35 2.83.9 4.03l3.05-2.33Z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .9 4.97l3.05 2.33C4.66 5.17 6.65 3.58 9 3.58Z"/></svg> Continue with Google</button><small className="muted">By continuing you agree to Lotnis' <Link to="/terms">Terms of Use</Link> and <Link to="/privacy">Privacy Policy</Link>.</small></div></section>;
}

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const next = new URLSearchParams(window.location.search).get('next') || '/';
    if (!accessToken || !refreshToken) {
      setError(params.get('error_description') || 'Sign-in did not complete. Please try again.');
      return;
    }
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      setSession({ id: payload.sub, email: payload.email || '', accessToken, refreshToken });
      // Trigger the profile sync (backfills name/avatar from Google on first login).
      api.getProfile().catch(() => {}).finally(() => navigate(next, { replace: true }));
    } catch {
      setError('Unable to complete sign-in. Please try again.');
    }
  }, [navigate]);
  if (error) return <section className="section error-state"><Seo title="Sign-in problem" description="We couldn't finish signing you in." noindex />{error} <Link to="/auth">Try again</Link></section>;
  return <section className="section empty-state"><Seo title="Signing in" description="Finishing sign-in to Lotnis." noindex />Finishing sign-in…</section>;
}

const REFUND_COPY: Record<string, string> = {
  pending: 'Refund pending — Lotnis is reviewing it',
  processing: 'Refund being sent',
  processed: 'Refund sent',
  failed: 'Refund hit a problem — Lotnis is resolving it',
};

function TripsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]); const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState<Booking | null>(null);
  const [reporting, setReporting] = useState<Booking | null>(null);
  const [notice, setNotice] = useState('');
  const [exits, setExits] = useState<Record<string, ExitCaseSummary>>({});
  const todayAccra = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Accra' });
  const load = () => {
    api.getMyBookings().then((result) => setBookings(result.data || [])).catch((err) => setError(err.message));
    api.getMyExits().then((list) => setExits(Object.fromEntries(list.map((x) => [x.booking_id, x])))).catch(() => {});
  };
  useEffect(() => { load(); }, []);
  return <section className="section dashboard-page"><span className="eyebrow">Your travel</span><h1>My trips</h1>{notice && <div className="notice"><Check size={16} /><span>{notice}</span></div>}{error ? <div className="error-state">{error}</div> : bookings.length ? <div className="booking-list">{bookings.map((booking) => { const needsPayment = booking.reservation_stage === 'awaiting_payment' || (!booking.reservation_stage && booking.status === 'pending' && !booking.payment_reference); const started = booking.start_date <= todayAccra; const exit = exits[booking.id]; const canCancel = booking.status === 'pending' || (booking.status === 'confirmed' && !started); const canLeave = (booking.status === 'confirmed' || booking.status === 'active') && started && !exit; const daysSince = (Date.parse(todayAccra) - Date.parse(booking.start_date)) / 86_400_000; const canReport = (booking.status === 'confirmed' || booking.status === 'active') && started && daysSince <= 2; return <div className="booking-row" key={booking.id}><div><strong>{booking.property?.name || 'Accommodation reservation'}</strong><p>{booking.start_date} → {booking.end_date}</p><small>{booking.platform_fee != null ? `Includes ${booking.currency_snapshot} ${booking.platform_fee.toLocaleString()} Lotnis service fee` : 'Price confirmed at checkout'}</small>{booking.refund && <small className="refund-line">{money(booking.refund.currency, booking.refund.refund_amount)} · {REFUND_COPY[booking.refund.status]}{booking.refund.refund_reference ? ` (ref ${booking.refund.refund_reference})` : ''}</small>}{booking.status === 'cancelled' && booking.cancellation_reason && <small>Reason: {booking.cancellation_reason}</small>}</div><span className={`status status-${booking.status}`}>{booking.reservation_stage === 'awaiting_host_acceptance' ? 'Awaiting host' : booking.status}</span><strong>{booking.currency_snapshot} {booking.final_amount.toLocaleString()}</strong><div className="form-actions">{needsPayment && <Link className="button button-secondary" to={`/pay/${booking.id}`}>Pay now</Link>}{canCancel && <button className="button button-quiet" onClick={() => setCancelling(booking)}>Cancel</button>}{canReport && <button className="button button-quiet" onClick={() => setReporting(booking)}>Report a problem</button>}{canLeave && <Link className="button button-quiet" to={`/trips/${booking.id}/leave`}>Leave early</Link>}{exit && <Link className="button button-secondary" to={`/moveouts/${exit.id}`}>Move-out: {STATUS_LABEL[exit.status]}</Link>}</div></div>; })}</div> : <div className="empty-state">Your reservations will appear here.</div>}{reporting && <ReportIssueDialog bookingId={reporting.id} propertyName={reporting.property?.name || 'Your stay'} onClose={() => setReporting(null)} onDone={() => { setReporting(null); setNotice('Thanks — we\'ve paused your host\'s payout and our team will review your report. We\'ll notify you of the outcome.'); load(); }} />}{cancelling && <CancelDialog bookingId={cancelling.id} role="guest" propertyName={cancelling.property?.name || 'Your reservation'} onClose={() => setCancelling(null)} onDone={() => { setCancelling(null); setNotice('Booking cancelled. If a refund is due you will see it here and get a notification when it is sent.'); load(); }} />}</section>;
}

function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState('');
  useEffect(() => { api.getTransactions().then(setTransactions).catch((err) => setError(err.message)); }, []);
  return <section className="section dashboard-page"><span className="eyebrow">Your money trail</span><h1>Transactions</h1><p className="lead">Every reservation, Lotnis service fee, and payment reference in one place.</p>{error ? <div className="error-state">{error}</div> : <TransactionRows transactions={transactions} />}</section>;
}

// Everything behind sign-in is private: keep it out of search results.
function Protected({ children, title = 'Your account' }: { children: React.ReactNode; title?: string }) {
  if (!getSession()) return <Navigate to="/auth" replace />;
  return <><Seo title={title} description="Your private Lotnis account page." noindex />{children}</>;
}

function NotFoundPage() {
  return <section className="page nf"><Seo title="Page not found" description="We couldn't find that page." noindex follow />
    <span className="eyebrow">Error 404</span><h1>We couldn't find that page.</h1>
    <p className="lead">It may have moved, or the link might be wrong. Try one of these:</p>
    <div className="bk-actions"><Link className="button button-primary" to="/explore">Browse spaces</Link><Link className="button button-quiet" to="/">Go home</Link></div></section>;
}

// Google sign-in returns tokens in the URL hash. If Supabase fell back to the site root (the redirect URL
// wasn't on its allow-list), forward them to the callback page that can use them.
function forwardAuthHash(): boolean {
  const { pathname, hash } = window.location;
  if (!hash.includes('access_token=') || pathname === '/auth/callback') return false;
  window.location.replace(`/auth/callback${hash}`);
  return true;
}

export default function App() {
  if (forwardAuthHash()) return null;
  return <AppShell><Suspense fallback={<div className="page"><div className="skeleton-hero" /></div>}><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/explore" element={<ExplorePage />} />
    <Route path="/rent/:type" element={<ExplorePage />} />
    <Route path="/in/:city" element={<ExplorePage />} />
    <Route path="/stays/:id" element={<StayPage />} />
    <Route path="/stays/:id/photos" element={<PhotosPage />} />
    <Route path="/events/:slug/vote/:categoryId/:nomineeId" element={<NomineePage />} />
    <Route path="/events/:slug/vote/:categoryId" element={<CategoryPage />} />
    <Route path="/events/:slug" element={<EventPage />} />
    <Route path="/orders/:id" element={<OrderPage />} />
    <Route path="/tickets/:code" element={<TicketPage />} />
    <Route path="/my-tickets" element={<Protected title="My tickets"><MyTicketsPage /></Protected>} />
    <Route path="/scan/:token" element={<ScanPage />} />
    <Route path="/auth" element={<AuthPage />} />
    <Route path="/auth/callback" element={<AuthCallbackPage />} />
    <Route path="/trips" element={<Protected title="My trips"><TripsPage /></Protected>} />
    <Route path="/notifications" element={<Protected title="Notifications"><NotificationsPage /></Protected>} />
    <Route path="/trips/:bookingId/leave" element={<Protected title="Give notice"><LeaveEarlyPage /></Protected>} />
    <Route path="/moveouts/:id" element={<Protected title="Move-out"><ExitCasePage /></Protected>} />
    <Route path="/transactions" element={<Protected title="Transactions"><TransactionsPage /></Protected>} />
    <Route path="/reserve/:id" element={<Protected title="Choose your dates"><ReservePage /></Protected>} />
    <Route path="/pay/:id" element={<Protected title="Pay for your stay"><PayPage /></Protected>} />
    <Route path="/booked/:id" element={<Protected title="Booking confirmed"><BookedPage /></Protected>} />
    {/* The application flow is open to anyone signed in; everything else under /host is verified-hosts-only. */}
    <Route path="/host/apply" element={<Protected title="Host application"><HostApplicationPage /></Protected>} />
    <Route path="/host" element={<Protected title="Host workspace"><HostWorkspace /></Protected>}>
      <Route index element={<HostOverview />} />
      <Route path="accommodation" element={<HostAccommodation />} />
      <Route path="accommodation/new" element={<NewPropertyPage />} />
      <Route path="properties/new" element={<Navigate to="/host/accommodation/new" replace />} />
      <Route path="bookings" element={<HostBookings />} />
      <Route path="move-outs" element={<HostMoveOuts />} />
      <Route path="transactions" element={<HostTransactions />} />
      <Route path="notifications" element={<HostNotifications />} />
      <Route path="events" element={<HostEvents />} />
      <Route path="events/new" element={<HostEventForm />} />
      <Route path="events/:id" element={<HostEventManage />} />
      <Route path="events/:id/edit" element={<HostEventForm />} />
      <Route path="earnings" element={<HostEarnings />} />
      <Route path="payout-settings" element={<HostPayoutSettings />} />
      <Route path="food" element={<HostComingSoon title="Food" text="Sell meals and food experiences to Lotnis guests." />} />
      <Route path="services" element={<HostComingSoon title="Services" text="Offer your skills — cleaning, transport, tours and more." />} />
    </Route>
    <Route path="/how-it-works" element={<HowItWorksPage />} />
    <Route path="/terms" element={<TermsPage />} />
    <Route path="/privacy" element={<PrivacyPage />} />
    <Route path="/refund-policy" element={<RefundPolicyPage />} />
    <Route path="/ticket-terms" element={<TicketTermsPage />} />
    <Route path="/host-agreement" element={<HostAgreementPage />} />
    <Route path="/food" element={<LineLanding lineKey="food" />} />
    <Route path="/events" element={<EventsPage />} />
    <Route path="/services" element={<LineLanding lineKey="services" />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes></Suspense></AppShell>;
}
