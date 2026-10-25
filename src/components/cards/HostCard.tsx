import { BadgeCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Photo';

/** "Hosted by …" — links to the host's public page, so a listing or event always leads back to a person. */
export function HostCard({ host, label = 'Hosted by' }: { host: { id?: string | null; name?: string | null; verified?: boolean; since?: string | null } | null; label?: string }) {
  if (!host?.name) return null;
  const body = (
    <>
      <Avatar name={host.name} size="md" />
      <div><small>{label}</small><strong>{host.name}{host.verified && <BadgeCheck size={15} className="verified" aria-label="Verified host" />}</strong>{host.since && <span>On Lotnis since {new Date(host.since).getFullYear()}</span>}</div>
    </>
  );
  return host.id ? <Link className="host-card-mini" to={`/hosts/${host.id}`}>{body}</Link> : <div className="host-card-mini">{body}</div>;
}
