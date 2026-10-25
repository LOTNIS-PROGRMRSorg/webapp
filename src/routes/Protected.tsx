import { Navigate } from 'react-router-dom';
import { getSession } from '@/lib/api';
import { Seo } from '@/lib/seo/seo';

// Everything behind sign-in is private: keep it out of search results.
export function Protected({ children, title = 'Your account' }: { children: React.ReactNode; title?: string }) {
  if (!getSession()) return <Navigate to="/auth" replace />;
  return <><Seo title={title} description="Your private Lotnis account page." noindex />{children}</>;
}
