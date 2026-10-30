import { Navigate, useSearchParams } from 'react-router-dom';

/** Old `/auth` links: sign-in is a dialog now, so send them to the home page with it open. */
export function AuthRedirect() {
  const [params] = useSearchParams();
  const next = params.get('next') || '/';
  const expired = params.get('expired') ? '&expired=1' : '';
  return <Navigate to={`/?signin=1&next=${encodeURIComponent(next)}${expired}`} replace />;
}
