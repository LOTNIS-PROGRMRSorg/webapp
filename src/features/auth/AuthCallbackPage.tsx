import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, setSession } from '@/lib/api';
import { Seo } from '@/lib/seo/seo';

export function AuthCallbackPage() {
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
      api
        .getProfile()
        .catch(() => {})
        .finally(() => navigate(next, { replace: true }));
    } catch {
      setError('Unable to complete sign-in. Please try again.');
    }
  }, [navigate]);
  if (error)
    return (
      <section className="section error-state">
        <Seo title="Sign-in problem" description="We couldn't finish signing you in." noindex />
        {error} <Link to="/auth">Try again</Link>
      </section>
    );
  return (
    <section className="section empty-state">
      <Seo title="Signing in" description="Finishing sign-in to Lotnis." noindex />
      Finishing sign-in…
    </section>
  );
}
