import { FormEvent, useEffect, useState } from 'react';
import {
  ArrowRight, Building2, Check, ChevronDown, MapPin, Menu, Search, ShieldCheck,
  Ticket, UserRound, UtensilsCrossed, Wrench, X,
} from 'lucide-react';
import { Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, getSession, setSession } from './api';
import { formatPrice, periodLabel, primaryImage } from './format';
import HomePage from './HomePage';
import type { Booking, HostProfile, HostRequirementReview, Profile, Property, Transaction } from './types';

function AppShell({ children }: { children: React.ReactNode }) {
  const [session, setCurrentSession] = useState(getSession());
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [accountOpen, setAccountOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isHome = pathname === '/';
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
  const navLinks = <>
    <NavLink to="/explore">Stays</NavLink>
    <NavLink to="/food">Food <span className="soon">Soon</span></NavLink>
    <NavLink to="/events">Events <span className="soon">Soon</span></NavLink>
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
            {!session
              ? <Link className="header-signin" to="/auth"><UserRound size={16} /> Sign in</Link>
              : <button className="profile-pill" aria-expanded={accountOpen} onClick={() => setAccountOpen(!accountOpen)}><UserRound size={16} /> Account <ChevronDown size={14} /></button>}
            <button className="mobile-menu" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
            {accountOpen && session && <div className="account-menu"><Link to="/trips">My trips</Link><Link to="/transactions">Transactions</Link><Link to="/host">Host dashboard</Link><hr /><button onClick={signOut}>Sign out</button></div>}
          </div>
        </div>
        {menuOpen && <nav className="mobile-panel" aria-label="Mobile">
          {navLinks}
          <Link to="/host">{session ? 'Host dashboard' : 'Become a host'}</Link>
          {session ? <>
            <Link to="/trips">My trips</Link>
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
              <Link to="/events"><Ticket size={16} /> Events</Link>
              <Link to="/services"><Wrench size={16} /> Service providers</Link>
            </div>
          </div>
          <div className="footer-grid">
            <div><Link className="brand" to="/"><span className="brand-mark">L</span>lotnis</Link><p>Places, people and experiences that make a trip feel personal.</p></div>
            <div><h3>Explore</h3><ul><li><Link to="/explore">All stays</Link></li><li><Link to="/explore?query=Accra">Accra</Link></li><li><Link to="/explore?query=Kumasi">Kumasi</Link></li><li><Link to="/explore?query=Cape%20Coast">Cape Coast</Link></li></ul></div>
            <div><h3>Hosting</h3><ul><li><Link to="/host">Become a host</Link></li><li><Link to="/host">Host dashboard</Link></li></ul></div>
            <div><h3>Your account</h3><ul>{!session && <li><Link to="/auth">Sign in</Link></li>}<li><Link to="/trips">My trips</Link></li><li><Link to="/transactions">Transactions</Link></li></ul></div>
          </div>
          <div className="footer-bottom">© {new Date().getFullYear()} Lotnis</div>
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

function PropertyCard({ property }: { property: Property }) {
  const image = primaryImage(property);
  return <Link className="property-card" to={`/stays/${property.id}`}><div className="property-image" style={image ? { backgroundImage: `url("${image}")` } : undefined}><span className="image-label">{property.verified ? 'Verified stay' : 'Lotnis stay'}</span></div><div className="property-card-body"><div className="property-title-row"><h3>{property.name}</h3><span>★ {property.rating?.toFixed(1) || 'New'}</span></div><p><MapPin size={14} /> {property.city || 'Location'}, {property.country || ''}</p><strong>{formatPrice(property.currency, property.price)} {property.price != null && <small>/ {periodLabel(property.pricing_period)}</small>}</strong></div></Link>;
}

const periodTitles: Record<string, string> = { day: 'Short stays', month: 'Monthly stays', year: 'Long lets' };

function ExplorePage() {
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const query = searchParams.get('query') || '';
  const pricingPeriod = searchParams.get('pricingPeriod') || '';
  const filterKey = searchParams.toString();
  useEffect(() => {
    setLoading(true); setError('');
    const params = new URLSearchParams({ page: '1', limit: '24' });
    for (const key of ['query', 'pricingPeriod', 'minPrice', 'maxPrice']) { const value = searchParams.get(key); if (value) params.set(key, value); }
    api.searchProperties(params).then((result) => setProperties(result.data || [])).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [filterKey]);
  const heading = query ? `Places matching “${query}”` : periodTitles[pricingPeriod] || 'Find your next place.';
  return <section className="section explore-page"><div className="explore-header"><div><span className="eyebrow">Explore accommodation</span><h1>{heading}</h1></div><SearchBox key={query} /></div>{loading ? <div className="empty-state">Finding places for you…</div> : error ? <div className="error-state">{error}<p>Check that the backend is running and VITE_API_URL is configured.</p></div> : properties.length ? <div className="property-grid">{properties.map((property) => <PropertyCard key={property.id} property={property} />)}</div> : <div className="empty-state">No approved stays match this search yet.</div>}</section>;
}

function StayPage() {
  const { id = '' } = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const navigate = useNavigate();
  useEffect(() => { api.getProperty(id).then((p) => { setProperty(p); setActiveImage(0); }).catch((err) => setError(err.message)); }, [id]);
  if (error) return <div className="section error-state">{error}</div>;
  if (!property) return <div className="section empty-state">Loading stay…</div>;
  const images = property.property_images?.length ? property.property_images : [];
  const image = images[activeImage]?.public_url;
  return <section className="section stay-page"><Link className="back-link" to="/explore">← Back to explore</Link><div className="stay-layout"><div><div className="stay-hero" style={image ? { backgroundImage: `url("${image}")` } : undefined} />{images.length > 1 && <div className="stay-thumbs">{images.map((img, i) => <button key={img.id || i} type="button" className={`stay-thumb ${i === activeImage ? 'stay-thumb-active' : ''}`} style={{ backgroundImage: `url("${img.public_url}")` }} onClick={() => setActiveImage(i)} />)}</div>}<div className="stay-content"><span className="eyebrow">{property.sub_type || 'Accommodation'} · {property.city}</span><h1>{property.name}</h1><p className="lead">{property.description || property.tagline || 'A welcoming place to stay, listed on Lotnis.'}</p><div className="detail-list"><span><MapPin size={16} /> {property.formatted_address || `${property.city}, ${property.country}`}</span><span><ShieldCheck size={16} /> Verified details and secure booking</span></div></div></div><aside className="booking-card"><span className="eyebrow">Reserve this stay</span><h2>{property.currency || 'GHS'} {property.price?.toLocaleString() || 'Contact host'}</h2><small>per {property.pricing_period || 'night'}</small><div className="booking-card-divider" />{property.rooms?.length ? <p>{property.rooms.length} room options available</p> : <p>Entire property booking</p>}<button className="button button-primary button-wide" onClick={() => getSession() ? navigate(`/reserve/${property.id}`) : navigate('/auth?next=/reserve/' + property.id)}>Reserve dates <ArrowRight size={16} /></button><small className="muted">You will review the complete price before payment.</small></aside></div></section>;
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
  return <section className="auth-page"><div className="auth-card"><span className="eyebrow">Welcome to Lotnis</span><h1>One account for every journey.</h1><p>Sign in with Google to reserve stays and build your own hosting business. New accounts are created automatically.</p>{error && <div className="form-error">{error}</div>}<button className="button button-primary button-wide google-button" onClick={continueWithGoogle}><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62Z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.81.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.9v2.33A9 9 0 0 0 9 18Z"/><path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.97H.9A9 9 0 0 0 0 9c0 1.45.35 2.83.9 4.03l3.05-2.33Z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .9 4.97l3.05 2.33C4.66 5.17 6.65 3.58 9 3.58Z"/></svg> Continue with Google</button><small className="muted">By continuing you agree to Lotnis' terms and privacy policy.</small></div></section>;
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
  if (error) return <section className="section error-state">{error} <Link to="/auth">Try again</Link></section>;
  return <section className="section empty-state">Finishing sign-in…</section>;
}

function TripsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]); const [error, setError] = useState('');
  useEffect(() => { api.getMyBookings().then((result) => setBookings(result.data || [])).catch((err) => setError(err.message)); }, []);
  return <section className="section dashboard-page"><span className="eyebrow">Your travel</span><h1>My trips</h1>{error ? <div className="error-state">{error}</div> : bookings.length ? <div className="booking-list">{bookings.map((booking) => { const needsPayment = booking.reservation_stage === 'awaiting_payment' || (!booking.reservation_stage && booking.status === 'pending' && !booking.payment_reference); return <div className="booking-row" key={booking.id}><div><strong>{booking.property?.name || 'Accommodation reservation'}</strong><p>{booking.start_date} → {booking.end_date}</p><small>{booking.platform_fee != null ? `Includes ${booking.currency_snapshot} ${booking.platform_fee.toLocaleString()} Lotnis service fee` : 'Price confirmed at checkout'}</small></div><span className={`status status-${booking.status}`}>{booking.reservation_stage === 'awaiting_host_acceptance' ? 'Awaiting host' : booking.status}</span><strong>{booking.currency_snapshot} {booking.final_amount.toLocaleString()}</strong>{needsPayment && <Link className="button button-secondary" to={`/pay/${booking.id}`}>Pay now</Link>}</div>; })}</div> : <div className="empty-state">Your reservations will appear here.</div>}</section>;
}

function TransactionRows({ transactions, hostView = false }: { transactions: Transaction[]; hostView?: boolean }) {
  return transactions.length ? <div className="booking-list">{transactions.map((transaction) => <div className="booking-row" key={transaction.id}><div><strong>{transaction.property?.name || 'Accommodation transaction'}</strong><p>{new Date(transaction.created_at).toLocaleDateString()} · {transaction.service}</p></div><span className={`status status-${transaction.status}`}>{transaction.status}</span><strong>{transaction.currency} {(hostView ? transaction.host_payout : transaction.gross_amount).toLocaleString()}</strong></div>)}</div> : <div className="empty-state">No transactions yet.</div>;
}

function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState('');
  useEffect(() => { api.getTransactions().then(setTransactions).catch((err) => setError(err.message)); }, []);
  return <section className="section dashboard-page"><span className="eyebrow">Your money trail</span><h1>Transactions</h1><p className="lead">Every reservation, Lotnis service fee, and payment reference in one place.</p>{error ? <div className="error-state">{error}</div> : <TransactionRows transactions={transactions} />}</section>;
}

function ReservePage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.getProperty(id).then(setProperty).catch((err) => setError(err.message)); }, [id]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const booking = await api.createBooking({ property_id: id, room_id: roomId || undefined, start_date: startDate, end_date: endDate });
      navigate(`/pay/${booking.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create reservation');
    } finally { setBusy(false); }
  };
  if (error && !property) return <div className="section error-state">{error}</div>;
  if (!property) return <div className="section empty-state">Loading reservation details…</div>;
  return <section className="section form-page"><Link className="back-link" to={`/stays/${id}`}>← Back to stay</Link><span className="eyebrow">Reserve {property.name}</span><h1>Choose your dates.</h1><form className="listing-form" onSubmit={submit}><div className="form-grid"><label>Check-in<input required type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label><label>Check-out<input required type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></label></div>{property.rooms?.length ? <label>Room<select value={roomId} onChange={(e) => setRoomId(e.target.value)}><option value="">Entire property</option>{property.rooms.map((room) => <option key={room.id} value={room.id}>{room.room_label || 'Room'} — {room.currency || property.currency} {room.price_per_period.toLocaleString()}</option>)}</select></label> : null}<div className="notice"><ShieldCheck size={18} /><span>Dates are checked by the backend before a reservation is created. You will pay securely by card on the next step.</span></div>{error && <div className="form-error">{error}</div>}<div className="form-actions"><Link className="button button-quiet" to={`/stays/${id}`}>Cancel</Link><button className="button button-primary" disabled={busy}>{busy ? 'Creating reservation…' : 'Continue to secure payment'} <ArrowRight size={16} /></button></div></form></section>;
}

function loadPaystackScript(): Promise<void> {
  if ((window as any).PaystackPop) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.getElementById('paystack-inline-js');
    if (existing) { existing.addEventListener('load', () => resolve()); return; }
    const script = document.createElement('script');
    script.id = 'paystack-inline-js';
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Unable to load the Paystack payment script.'));
    document.body.appendChild(script);
  });
}

function PayPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const session = getSession();
  useEffect(() => { api.getMyBooking(id).then(setBooking).catch((err) => setError(err instanceof Error ? err.message : 'Unable to load reservation')); }, [id]);

  const payNow = async () => {
    if (!booking) return;
    const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string | undefined;
    if (!publicKey) { setError('Payments are not configured yet. Contact Lotnis support.'); return; }
    setPaying(true); setError('');
    try {
      await loadPaystackScript();
      const reference = `LOTNIS-${booking.id}-${Date.now()}`;
      const handler = (window as any).PaystackPop.setup({
        key: publicKey,
        email: session?.email || 'guest@lotnis.com',
        amount: Math.round(booking.final_amount * 100),
        currency: booking.currency_snapshot || 'GHS',
        ref: reference,
        metadata: { custom_fields: [{ display_name: 'Booking', variable_name: 'booking_id', value: booking.id }] },
        callback: (response: { reference: string }) => {
          api.confirmBooking(booking.id, response.reference)
            .then(() => navigate('/trips', { state: { paidBookingId: booking.id } }))
            .catch((err) => setError(err instanceof Error ? err.message : 'Payment succeeded but confirmation failed. Contact support.'))
            .finally(() => setPaying(false));
        },
        onClose: () => setPaying(false),
      });
      handler.openIframe();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start payment');
      setPaying(false);
    }
  };

  if (error && !booking) return <div className="section error-state">{error}</div>;
  if (!booking) return <div className="section empty-state">Loading your reservation…</div>;
  const awaitingHost = booking.reservation_stage === 'awaiting_host_acceptance';
  return <section className="section form-page"><Link className="back-link" to="/trips">← My trips</Link><span className="eyebrow">Secure your stay</span><h1>{booking.property?.name || 'Your reservation'}</h1><p className="lead">{booking.start_date} → {booking.end_date}</p>
    {awaitingHost ? <div className="notice"><ShieldCheck size={18} /><span>This host reviews requests before payment. We will email you as soon as it is accepted, then you can pay here.</span></div> : <>
      <div className="price-breakdown"><div><span>Stay total</span><strong>{booking.currency_snapshot} {(booking.total_amount ?? booking.final_amount).toLocaleString()}</strong></div>{booking.guest_service_fee ? <div><span>Lotnis service fee</span><strong>{booking.currency_snapshot} {booking.guest_service_fee.toLocaleString()}</strong></div> : null}<div className="price-breakdown-total"><span>Total due</span><strong>{booking.currency_snapshot} {booking.final_amount.toLocaleString()}</strong></div></div>
      {error && <div className="form-error">{error}</div>}
      <div className="form-actions"><Link className="button button-quiet" to="/trips">Pay later</Link><button className="button button-primary" onClick={payNow} disabled={paying}>{paying ? 'Opening secure checkout…' : `Pay ${booking.currency_snapshot} ${booking.final_amount.toLocaleString()}`} <ArrowRight size={16} /></button></div>
    </>}
  </section>;
}

function HostBookingRequests({ bookings, onChange }: { bookings: Booking[]; onChange: () => void }) {
  const pending = bookings.filter((b) => b.reservation_stage === 'awaiting_host_acceptance');
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  if (!pending.length) return null;
  const accept = async (bookingId: string) => { setBusyId(bookingId); setError(''); try { await api.hostAcceptBooking(bookingId); onChange(); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to accept'); } finally { setBusyId(''); } };
  const reject = async (bookingId: string) => { const reason = window.prompt('Reason for declining this request?') || 'Not available'; setBusyId(bookingId); setError(''); try { await api.hostRejectBooking(bookingId, reason); onChange(); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to decline'); } finally { setBusyId(''); } };
  return <><h2 className="subsection-heading">Requests awaiting your response</h2>{error && <div className="form-error">{error}</div>}<div className="booking-list">{pending.map((booking) => <div className="booking-row" key={booking.id}><div><strong>{booking.property?.name || 'Reservation request'}</strong><p>{booking.start_date} → {booking.end_date}</p></div><strong>{booking.currency_snapshot} {booking.final_amount.toLocaleString()}</strong><div className="form-actions"><button className="button button-quiet" disabled={busyId === booking.id} onClick={() => reject(booking.id)}>Decline</button><button className="button button-primary" disabled={busyId === booking.id} onClick={() => accept(booking.id)}>Accept</button></div></div>)}</div></>;
}

function HostStatusBanner({ hostProfile }: { hostProfile: HostProfile }) {
  const statusCopy: Record<HostProfile['verification_status'], string> = {
    pending: 'Your application is submitted and waiting for the Lotnis team to review it.',
    under_review: 'A reviewer flagged something in your application — check below and resubmit.',
    verified: 'Your host account is verified.',
    rejected: 'Your application was rejected. Review the reason below and resubmit.',
    suspended: 'Your host account has been suspended. Contact Lotnis support.',
  };
  return <div className="notice"><ShieldCheck size={18} /><span>{statusCopy[hostProfile.verification_status]}{hostProfile.verification_status !== 'verified' && <> <Link to="/host/apply">Review application</Link></>}</span></div>;
}

function HostPage() {
  const [properties, setProperties] = useState<Property[]>([]); const [transactions, setTransactions] = useState<Transaction[]>([]); const [bookings, setBookings] = useState<Booking[]>([]); const [profile, setProfile] = useState<Profile | null>(null); const [hostProfile, setHostProfile] = useState<HostProfile | null>(null); const [error, setError] = useState('');
  const loadBookings = () => api.getHostBookings().then((result) => setBookings(result.data || [])).catch((err) => setError(err.message));
  useEffect(() => { Promise.all([api.getMyProperties(), api.getProfile(), api.getHostTransactions(), api.getHostProfile()]).then(([items, currentProfile, hostTransactions, hp]) => { setProperties(items || []); setProfile(currentProfile); setTransactions(hostTransactions || []); setHostProfile(hp); }).catch((err) => setError(err.message)); loadBookings(); }, []);
  const canListProperties = profile?.role === 'host';
  return <section className="section dashboard-page"><div className="dashboard-heading"><div><span className="eyebrow">Host workspace</span><h1>Build a place people remember.</h1><p>Manage accommodation now. Food, events, and services can be added to the same host account later.</p></div>{canListProperties ? <Link className="button button-primary" to="/host/properties/new">Add accommodation <ArrowRight size={16} /></Link> : <Link className="button button-primary" to="/host/apply">{hostProfile ? 'Continue application' : 'Become a host'} <ArrowRight size={16} /></Link>}</div>{error ? <div className="error-state">{error}</div> : <><div className="metric-grid"><div><span>Account</span><strong>{profile?.role || 'user'}</strong></div><div><span>Listings</span><strong>{properties.length}</strong></div><div><span>Host earnings</span><strong>{transactions.reduce((sum, item) => sum + item.host_payout, 0).toLocaleString()} GHS</strong></div></div>{!canListProperties ? (hostProfile ? <HostStatusBanner hostProfile={hostProfile} /> : <div className="notice"><ShieldCheck size={18} /><span>Start host onboarding to submit accommodation and unlock the shared host workspace.</span></div>) : <><HostBookingRequests bookings={bookings} onChange={loadBookings} />{hostProfile && hostProfile.verification_status !== 'verified' && <HostStatusBanner hostProfile={hostProfile} />}<h2>Your accommodation</h2>{properties.length ? <div className="property-grid">{properties.map((property) => <PropertyCard key={property.id} property={property} />)}</div> : <div className="empty-state"><Building2 size={28} /><p>You have no accommodation listings yet.</p><Link className="button button-secondary" to="/host/properties/new">Create your first listing</Link></div>}<h2 className="subsection-heading">Transactions for your listings</h2><TransactionRows transactions={transactions} hostView /></>}</>}</section>;
}

function HostApplicationPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<HostProfile | null>(null);
  const [reviews, setReviews] = useState<HostRequirementReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState('');
  const [form, setForm] = useState({
    accountType: 'individual' as 'individual' | 'business',
    displayName: '', legalFirstName: '', legalLastName: '', dateOfBirth: '', nationality: '',
    streetAddress: '', city: '', state: '', postalCode: '', country: 'Ghana',
    businessName: '', businessTaxId: '', businessWebsite: '', businessPhone: '', businessEmail: '',
    payoutMethod: 'mobile_money' as 'bank' | 'mobile_money', bankName: '', bankAccountNumber: '', bankAccountName: '',
    momoProvider: '', momoNumber: '',
  });

  const load = () => {
    Promise.all([api.getHostProfile(), api.getHostRequirementReviews()]).then(([p, r]) => {
      setProfile(p);
      setReviews(r);
      if (p) setForm((f) => ({
        ...f,
        accountType: p.account_type,
        displayName: p.display_name || '', legalFirstName: p.legal_first_name || '', legalLastName: p.legal_last_name || '',
        dateOfBirth: p.date_of_birth || '', nationality: p.nationality || '',
        streetAddress: p.street_address || '', city: p.city || '', state: p.state || '', postalCode: p.postal_code || '', country: p.country || 'Ghana',
        businessName: p.business_name || '', businessTaxId: p.business_tax_id || '', businessWebsite: p.business_website || '',
        businessPhone: p.business_phone || '', businessEmail: p.business_email || '',
        payoutMethod: p.payout_method || 'mobile_money', bankName: p.bank_name || '', bankAccountNumber: p.bank_account_number || '',
        bankAccountName: p.bank_account_name || '', momoProvider: p.momo_provider || '', momoNumber: p.momo_number || '',
      }));
    }).catch((err) => setError(err instanceof Error ? err.message : 'Unable to load your application')).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true); setError(''); setMessage('');
    try {
      const saved = await api.saveHostProfile({
        categories: ['property'],
        accountType: form.accountType,
        displayName: form.displayName,
        legalFirstName: form.legalFirstName || undefined,
        legalLastName: form.legalLastName || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        nationality: form.nationality || undefined,
        streetAddress: form.streetAddress,
        city: form.city,
        state: form.state || undefined,
        postalCode: form.postalCode || undefined,
        country: form.country,
        businessName: form.accountType === 'business' ? form.businessName : undefined,
        businessTaxId: form.accountType === 'business' ? form.businessTaxId : undefined,
        businessWebsite: form.accountType === 'business' ? form.businessWebsite : undefined,
        businessPhone: form.accountType === 'business' ? form.businessPhone : undefined,
        businessEmail: form.accountType === 'business' ? form.businessEmail : undefined,
        payoutMethod: form.payoutMethod,
        bankName: form.payoutMethod === 'bank' ? form.bankName : undefined,
        bankAccountNumber: form.payoutMethod === 'bank' ? form.bankAccountNumber : undefined,
        bankAccountName: form.payoutMethod === 'bank' ? form.bankAccountName : undefined,
        momoProvider: form.payoutMethod === 'mobile_money' ? form.momoProvider : undefined,
        momoNumber: form.payoutMethod === 'mobile_money' ? form.momoNumber : undefined,
      });
      setProfile(saved);
      setMessage('Application details saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save your application');
    } finally { setSaving(false); }
  };

  const upload = async (slot: string, file: File | null) => {
    if (!file) return;
    setUploadingSlot(slot); setError('');
    try { await api.uploadHostDocument(slot, file); load(); }
    catch (err) { setError(err instanceof Error ? err.message : `Unable to upload ${slot}`); }
    finally { setUploadingSlot(''); }
  };

  const submitApplication = async () => {
    setSubmitting(true); setError(''); setMessage('');
    try { await api.submitHostApplication(); setMessage('Application submitted for review.'); load(); navigate('/host'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to submit your application'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="section empty-state">Loading your application…</div>;

  const flaggedReviews = reviews.filter((r) => r.status === 'rejected' || r.status === 'changes_required');
  const docUpload = (slot: string, label: string, currentUrl?: string | null) => (
    <label>{label}
      <input type="file" accept="image/*" disabled={uploadingSlot === slot} onChange={(e) => upload(slot, e.target.files?.[0] || null)} />
      {uploadingSlot === slot && <small>Uploading…</small>}
      {currentUrl && uploadingSlot !== slot && <small className="muted">Uploaded ✓</small>}
    </label>
  );

  return <section className="section form-page">
    <Link className="back-link" to="/host">← Host dashboard</Link>
    <span className="eyebrow">Host application</span>
    <h1>Tell us about you.</h1>
    <p className="lead">These details are reviewed by the Lotnis team before your listings can go live.</p>
    {profile && <div className="notice"><ShieldCheck size={18} /><span>Status: <strong>{profile.verification_status.replace('_', ' ')}</strong></span></div>}
    {flaggedReviews.length > 0 && <div className="form-error"><strong>Needs your attention:</strong><ul>{flaggedReviews.map((r) => <li key={r.requirement}>{r.requirement}: {r.rejection_reason?.reason || r.note || 'Please review and resubmit.'}</li>)}</ul></div>}
    {message && <div className="notice"><Check size={18} /><span>{message}</span></div>}
    {error && <div className="form-error">{error}</div>}

    <form className="listing-form" onSubmit={save}>
      <div className="form-grid">
        <label>Account type<select {...field('accountType')}><option value="individual">Individual</option><option value="business">Business</option></select></label>
        <label>Display name (shown to guests)<input required {...field('displayName')} /></label>
      </div>
      <div className="form-grid">
        <label>Legal first name<input {...field('legalFirstName')} /></label>
        <label>Legal last name<input {...field('legalLastName')} /></label>
        <label>Date of birth<input type="date" {...field('dateOfBirth')} /></label>
        <label>Nationality<input {...field('nationality')} /></label>
      </div>
      <div className="form-grid">
        <label>Street address<input required {...field('streetAddress')} /></label>
        <label>City<input required {...field('city')} /></label>
        <label>State/Region<input {...field('state')} /></label>
        <label>Postal code<input {...field('postalCode')} /></label>
        <label>Country<input required {...field('country')} /></label>
      </div>
      {form.accountType === 'business' && <div className="form-grid">
        <label>Business name<input {...field('businessName')} /></label>
        <label>Tax ID<input {...field('businessTaxId')} /></label>
        <label>Business website<input {...field('businessWebsite')} /></label>
        <label>Business phone<input {...field('businessPhone')} /></label>
        <label>Business email<input type="email" {...field('businessEmail')} /></label>
      </div>}
      <h2 className="subsection-heading">Payout details</h2>
      <div className="form-grid">
        <label>Payout method<select {...field('payoutMethod')}><option value="mobile_money">Mobile money</option><option value="bank">Bank transfer</option></select></label>
        {form.payoutMethod === 'bank' ? <>
          <label>Bank name<input {...field('bankName')} /></label>
          <label>Account number<input {...field('bankAccountNumber')} /></label>
          <label>Account name<input {...field('bankAccountName')} /></label>
        </> : <>
          <label>Mobile money provider<input placeholder="MTN, Vodafone, AirtelTigo…" {...field('momoProvider')} /></label>
          <label>Mobile money number<input {...field('momoNumber')} /></label>
        </>}
      </div>
      <div className="form-actions"><button className="button button-primary" disabled={saving}>{saving ? 'Saving…' : 'Save details'}</button></div>
    </form>

    {profile && <>
      <h2 className="subsection-heading">Verification documents</h2>
      <div className="form-grid">
        {docUpload('gov-id-front', 'Government ID (front)', profile.gov_id_front_image_url)}
        {docUpload('gov-id-back', 'Government ID (back, optional)', profile.gov_id_back_image_url)}
        {docUpload('selfie', 'Selfie photo', profile.selfie_image_url)}
        {docUpload('proof-of-address', 'Proof of address', profile.proof_image_url)}
        {form.accountType === 'business' && docUpload('business-certificate', 'Business registration certificate', profile.biz_certificate_image_url)}
      </div>
      <div className="form-actions"><button className="button button-primary button-wide" onClick={submitApplication} disabled={submitting}>{submitting ? 'Submitting…' : 'Submit application for review'} <ArrowRight size={16} /></button></div>
    </>}
  </section>;
}

function NewPropertyPage() {
  const navigate = useNavigate(); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); setBusy(true); setError(''); try { await api.publishProperty({ draft: { category: 'residential', subType: String(form.get('subType')), allowsIndividualBookings: false, requiresHostAcceptance: form.get('requiresHostAcceptance') === 'on', name: String(form.get('name')), tagline: String(form.get('tagline')), description: String(form.get('description')), location: { streetAddress: String(form.get('streetAddress')), city: String(form.get('city')), country: String(form.get('country')) }, price: String(form.get('price')), pricingPeriod: 'day', currency: 'GHS', selectedAmenities: [] }, images: { frontImage: null, buildingImages: [], rooms: [] } }); navigate('/host'); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to create listing'); } finally { setBusy(false); } };
  return <section className="section form-page"><Link className="back-link" to="/host">← Host dashboard</Link><span className="eyebrow">New accommodation</span><h1>Tell guests about your place.</h1><form className="listing-form" onSubmit={submit}><div className="form-grid"><label>Property name<input name="name" required placeholder="e.g. The Palm House" /></label><label>Type<input name="subType" required placeholder="Apartment, villa, hotel…" /></label><label>Street address<input name="streetAddress" required /></label><label>City<input name="city" required /></label><label>Country<input name="country" required defaultValue="Ghana" /></label><label>Price per night<input name="price" required type="number" min="0" /></label></div><label>Short description<textarea name="description" required rows={5} placeholder="What should guests know about this place?" /></label><label>Tagline<input name="tagline" placeholder="A short line guests will remember" /></label><label className="checkbox-row"><input type="checkbox" name="requiresHostAcceptance" /> Require my approval before each booking is confirmed</label>{error && <div className="form-error">{error}</div>}<div className="form-actions"><button type="button" className="button button-quiet" onClick={() => navigate('/host')}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? 'Submitting…' : 'Submit for approval'} <ArrowRight size={16} /></button></div></form></section>;
}

function PlaceholderPage({ title }: { title: string }) { return <section className="section placeholder-page"><span className="eyebrow">Coming in the next service release</span><h1>{title}</h1><p>Every Lotnis host will eventually be able to publish and manage this service from the same account. The accommodation foundation is being connected first.</p><div className="placeholder-columns"><div><Check size={18} /><strong>One host account</strong><p>Accommodation, food, events, and providers will share identity and verification.</p></div><div><Check size={18} /><strong>One transaction model</strong><p>Payments will be tagged by service so finance can report each business line separately.</p></div></div></section>; }

function Protected({ children }: { children: React.ReactNode }) { return getSession() ? <>{children}</> : <Navigate to="/auth" replace />; }

export default function App() {
  return <AppShell><Routes><Route path="/" element={<HomePage />} /><Route path="/explore" element={<ExplorePage />} /><Route path="/stays/:id" element={<StayPage />} /><Route path="/auth" element={<AuthPage />} /><Route path="/auth/callback" element={<AuthCallbackPage />} /><Route path="/trips" element={<Protected><TripsPage /></Protected>} /><Route path="/transactions" element={<Protected><TransactionsPage /></Protected>} /><Route path="/reserve/:id" element={<Protected><ReservePage /></Protected>} /><Route path="/pay/:id" element={<Protected><PayPage /></Protected>} /><Route path="/host" element={<Protected><HostPage /></Protected>} /><Route path="/host/apply" element={<Protected><HostApplicationPage /></Protected>} /><Route path="/host/properties/new" element={<Protected><NewPropertyPage /></Protected>} /><Route path="/food" element={<PlaceholderPage title="Food is coming to Lotnis." />} /><Route path="/events" element={<PlaceholderPage title="Events are coming to Lotnis." />} /><Route path="/services" element={<PlaceholderPage title="Trusted service providers are coming to Lotnis." />} /></Routes></AppShell>;
}
