import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Seo } from '@/lib/seo/seo';

export function startGoogleSignIn(next: string) {
  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '');
  if (!supabaseUrl) throw new Error('Sign-in is not configured yet. Contact Lotnis support.');
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  const authorizeUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
  window.location.href = authorizeUrl;
}

export function AuthPage() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const continueWithGoogle = () => {
    try {
      startGoogleSignIn(searchParams.get('next') || '/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start sign-in');
    }
  };
  return (
    <section className="auth-page">
      <Seo
        title="Sign in"
        description="Sign in to Lotnis with Google to book stays and host your own spaces."
        path="/auth"
        noindex
      />
      <div className="auth-card">
        <span className="eyebrow">Welcome to Lotnis</span>
        <h1>One account for every journey.</h1>
        <p>
          Sign in with Google to reserve stays and build your own hosting business. New accounts are created
          automatically.
        </p>
        {searchParams.get('expired') && (
          <div className="notice">
            <span>Your session expired, so you've been signed out. Sign in again to carry on where you left off.</span>
          </div>
        )}
        {error && <div className="form-error">{error}</div>}
        <button className="button button-primary button-wide google-button" onClick={continueWithGoogle}>
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62Z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.81.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.9v2.33A9 9 0 0 0 9 18Z"
            />
            <path
              fill="#FBBC05"
              d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.97H.9A9 9 0 0 0 0 9c0 1.45.35 2.83.9 4.03l3.05-2.33Z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .9 4.97l3.05 2.33C4.66 5.17 6.65 3.58 9 3.58Z"
            />
          </svg>{' '}
          Continue with Google
        </button>
        <small className="muted">
          By continuing you agree to Lotnis' <Link to="/terms">Terms of Use</Link> and{' '}
          <Link to="/privacy">Privacy Policy</Link>.
        </small>
      </div>
    </section>
  );
}
