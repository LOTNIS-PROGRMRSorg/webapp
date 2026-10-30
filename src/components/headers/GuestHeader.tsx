import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Menu, UserRound, X } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import type { AuthUser } from '@/types';
import { api } from '@/lib/api';
import { AuthLink, useAuthModal } from '@/features/auth/AuthModal';
import { NotificationBell } from '@/features/account/notifications';

const tabs = [
  { key: 'spaces', to: '/explore', label: 'Spaces', image: '/images/nav/spaces.png', soon: false },
  { key: 'events', to: '/events', label: 'Events', image: '/images/nav/events.png', soon: false },
  { key: 'food', to: '/food', label: 'Food', image: '/images/nav/food.png', soon: true },
  { key: 'services', to: '/services', label: 'Services', image: '/images/nav/services.png', soon: true },
];

/** 3D still that swaps to a short video clip (when one exists in /videos/nav) and plays it on hover / when the tab becomes active. */
function TabMedia({ name, image, active, hovered }: { name: string; image: string; active: boolean; hovered: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const play = active || hovered;
  useEffect(() => {
    const el = video.current;
    if (!el || !ready) return;
    if (play) {
      el.currentTime = 0;
      el.play().catch(() => undefined);
    }
  }, [play, active, ready]);
  return (
    <span className="hdr-tab-media">
      <img className={ready ? 'hdr-tab-icon hdr-tab-icon-hidden' : 'hdr-tab-icon'} src={image} alt="" width={52} height={52} draggable={false} />
      <video
        ref={video}
        className="hdr-tab-video"
        muted
        playsInline
        preload="auto"
        poster={image}
        onLoadedData={() => setReady(true)}
        onError={() => setReady(false)}
        aria-hidden="true"
      >
        <source src={`/videos/nav/${name}.webm`} type="video/webm" />
        <source src={`/videos/nav/${name}.mp4`} type="video/mp4" />
      </video>
    </span>
  );
}

function HeaderTab({ tab }: { tab: (typeof tabs)[number] }) {
  const [hovered, setHovered] = useState(false);
  return (
    <NavLink
      to={tab.to}
      className={`hdr-tab hdr-tab-${tab.key}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {({ isActive }) => (
        <>
          <TabMedia name={tab.key} image={tab.image} active={isActive} hovered={hovered} />
          <span>{tab.label}</span>
          {tab.soon && <em className="hdr-soon">Soon</em>}
        </>
      )}
    </NavLink>
  );
}

export function GuestHeader({ session, onSignOut }: { session: AuthUser | null; onSignOut: () => void }) {
  const { pathname } = useLocation();
  const { openSignIn } = useAuthModal();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [bar, setBar] = useState<{ left: number; width: number } | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isHome = pathname === '/';
  const activeIndex = tabs.findIndex((t) => pathname === t.to || pathname.startsWith(`${t.to}/`));
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

  // Slide the underline under the active tab (measured so it follows any tab width).
  useLayoutEffect(() => {
    const measure = () => {
      const el = activeIndex >= 0 ? navRef.current?.children[activeIndex] : null;
      setBar(el instanceof HTMLElement ? { left: el.offsetLeft + 8, width: el.offsetWidth - 16 } : null);
    };
    measure();
    window.addEventListener('resize', measure);
    document.fonts?.ready.then(measure);
    return () => window.removeEventListener('resize', measure);
  }, [activeIndex]);

  const tabLinks = tabs.map((tab) => <HeaderTab key={tab.to} tab={tab} />);

  return (
    <header className={['hdr', isHome && 'hdr-home', overlay && 'hdr-overlay'].filter(Boolean).join(' ')}>
      <div className="hdr-inner">
        <Link className="brand" to="/">
          <span className="brand-mark">L</span>lotnis
        </Link>

        <nav className="hdr-nav" aria-label="Main" ref={navRef}>
          {tabLinks}
          <span
            className="hdr-underline"
            aria-hidden="true"
            style={{ transform: `translateX(${bar?.left ?? 0}px)`, width: bar?.width ?? 0, opacity: bar ? 1 : 0 }}
          />
        </nav>

        <div className="hdr-actions" ref={menuRef}>
          <AuthLink className="hdr-host" to={isHost ? '/host' : '/host/start'}>
            {isHost ? 'Host dashboard' : 'Become a host'}
          </AuthLink>
          {session && <NotificationBell />}
          {session ? (
            <button className="hdr-circle" aria-label="Account" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
              <UserRound size={20} />
            </button>
          ) : (
            <button className="hdr-circle" aria-label="Sign in" onClick={() => openSignIn()}>
              <UserRound size={20} />
            </button>
          )}
          <button
            className="hdr-circle"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {menuOpen && (
            <div className="hdr-menu" role="menu">
              <div className="hdr-menu-tabs">
                {tabLinks}
                <hr />
              </div>
              <AuthLink to={isHost ? '/host' : '/host/start'}>{isHost ? 'Host dashboard' : 'Become a host'}</AuthLink>
              {session ? (
                <>
                  <Link to="/trips">My trips</Link>
                  <Link to="/my-tickets">My tickets</Link>
                  <Link to="/notifications">Notifications</Link>
                  <Link to="/transactions">Transactions</Link>
                  <hr />
                  <button onClick={onSignOut}>Sign out</button>
                </>
              ) : (
                <>
                  <Link to="/how-it-works">How it works</Link>
                  <hr />
                  <button
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
