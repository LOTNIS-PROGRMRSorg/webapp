import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { startGoogleSignIn } from '@/features/auth/google';

const benefits = [
  { image: '/images/nav/spaces.png', label: 'Book accommodation or space' },
  { image: '/images/nav/events.png', label: 'Join events' },
  { image: '/images/nav/food.png', label: 'Food' },
  { image: '/images/nav/services.png', label: 'Services' },
  { image: '/images/nav/host.png', label: 'Become a host to earn' },
];

/** Sign-in dialog: Google only, with what an account unlocks. `next` is where to land after signing in. */
export function SignInModal({ next, expired, onClose }: { next: string; expired?: boolean; onClose: () => void }) {
  const [error, setError] = useState('');
  const continueWithGoogle = () => {
    try {
      startGoogleSignIn(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start sign-in');
    }
  };
  return (
    <div
      className="modal signin-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Sign in to Lotnis"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="signin-card">
        <button type="button" className="icon-btn signin-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        <h2>Sign in to Lotnis</h2>
        {expired && <p className="signin-note">Your session expired. Sign in again to carry on where you left off.</p>}
        <ul className="signin-benefits">
          {benefits.map((b) => (
            <li key={b.label}>
              <img src={b.image} alt="" width={40} height={40} />
              <span>{b.label}</span>
            </li>
          ))}
        </ul>
        {error && <div className="form-error">{error}</div>}
        <button type="button" className="signin-google" onClick={continueWithGoogle} autoFocus>
          <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62Z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.81.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.9v2.33A9 9 0 0 0 9 18Z" />
            <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.97H.9A9 9 0 0 0 0 9c0 1.45.35 2.83.9 4.03l3.05-2.33Z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .9 4.97l3.05 2.33C4.66 5.17 6.65 3.58 9 3.58Z" />
          </svg>
          Continue with Google
        </button>
        <small>
          By continuing you agree to Lotnis&apos; <Link to="/terms" onClick={onClose}>Terms of Use</Link> and{' '}
          <Link to="/privacy" onClick={onClose}>Privacy Policy</Link>.
        </small>
      </div>
    </div>
  );
}
