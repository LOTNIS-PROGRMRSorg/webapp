import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '@/lib/api';

/**
 * Where every "Become a host" link lands (after sign-in if needed): people with a host account go to the
 * dashboard (or the status screen while they're being verified); everyone else goes straight to the application.
 */
export function HostEntry() {
  const [target, setTarget] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    api
      .getHostAccess()
      .then((a) => live && setTarget(a.state === 'not_applied' || a.state === 'draft' ? '/host/apply' : '/host'))
      .catch(() => live && setTarget('/host'));
    return () => {
      live = false;
    };
  }, []);
  if (target) return <Navigate to={target} replace />;
  return (
    <section className="page">
      <div className="empty-state">Checking your host account…</div>
    </section>
  );
}
