import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { ComponentProps, MouseEvent } from 'react';
import { getSession } from '@/lib/api';
import { SignInModal } from '@/components/modals';

type Request = { next: string; expired?: boolean };
type AuthModalValue = { openSignIn: (next?: string, expired?: boolean) => void };

const AuthModalContext = createContext<AuthModalValue>({ openSignIn: () => undefined });
export const useAuthModal = () => useContext(AuthModalContext);

/**
 * Sign-in is a dialog, not a page. Anything can open it with `openSignIn(next)`; a session that ends elsewhere
 * (a plain page load) opens it through `/?signin=1&next=…`.
 */
export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<Request | null>(null);
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const openSignIn = useCallback((next?: string, expired?: boolean) => {
    setRequest({ next: next || `${window.location.pathname}${window.location.search}`, expired });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(search);
    if (!params.has('signin')) return;
    const next = params.get('next') || '/';
    const expired = params.has('expired');
    params.delete('signin');
    params.delete('next');
    params.delete('expired');
    const rest = params.toString();
    navigate(`${pathname}${rest ? `?${rest}` : ''}`, { replace: true });
    if (!getSession()) setRequest({ next, expired });
  }, [pathname, search, navigate]);

  const value = useMemo(() => ({ openSignIn }), [openSignIn]);
  return (
    <AuthModalContext.Provider value={value}>
      {children}
      {request && <SignInModal next={request.next} expired={request.expired} onClose={() => setRequest(null)} />}
    </AuthModalContext.Provider>
  );
}

/** A link that opens the sign-in dialog first when nobody is signed in, then continues to `to`. */
export function AuthLink({ to, onClick, ...rest }: ComponentProps<typeof Link> & { to: string }) {
  const { openSignIn } = useAuthModal();
  return (
    <Link
      to={to}
      {...rest}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
        if (!getSession() && !e.defaultPrevented) {
          e.preventDefault();
          openSignIn(to);
        }
      }}
    />
  );
}
