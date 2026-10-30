import { useEffect } from 'react';
import { getSession } from '@/lib/api';
import { Seo } from '@/lib/seo/seo';
import { useAuthModal } from '@/features/auth/AuthModal';

// Everything behind sign-in is private: keep it out of search results.
export function Protected({ children, title = 'Your account' }: { children: React.ReactNode; title?: string }) {
  const signedIn = !!getSession();
  const { openSignIn } = useAuthModal();
  useEffect(() => {
    if (!signedIn) openSignIn();
  }, [signedIn, openSignIn]);
  if (!signedIn)
    return (
      <section className="section empty-state">
        <Seo title={title} description="Your private Lotnis account page." noindex />
        <p>Sign in to continue.</p>
        <button className="button button-primary" onClick={() => openSignIn()}>
          Sign in
        </button>
      </section>
    );
  return (
    <>
      <Seo title={title} description="Your private Lotnis account page." noindex />
      {children}
    </>
  );
}
