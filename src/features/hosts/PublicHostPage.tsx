import { BadgeCheck, MapPin, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Seo } from '@/lib/seo/seo';
import { hostsApi, type PublicHost } from '@/lib/api/hosts';
import { PropertyCard, EventCard, StatCard, StatGrid } from '@/components/cards';
import { Avatar } from '@/components/ui/Photo';
import { EmptyState, ErrorState, LoadingState, SectionHeading } from '@/components/ui';
import { ReportDialog } from '@/components/modals';
import { track } from '@/lib/track';
import type { Property } from '@/types';

/** Who is behind a listing or an event: verified status, track record, what else they offer. */
export function PublicHostPage() {
  const { id = '' } = useParams();
  const [host, setHost] = useState<PublicHost | null>(null);
  const [error, setError] = useState('');
  const [reporting, setReporting] = useState(false);
  useEffect(() => {
    hostsApi
      .profile(id)
      .then(setHost)
      .catch((e) => setError(e.message));
  }, [id]);
  if (error)
    return (
      <div className="page">
        <ErrorState>{error}</ErrorState>
      </div>
    );
  if (!host)
    return (
      <div className="page">
        <LoadingState />
      </div>
    );
  const since = new Date(host.since).getFullYear();
  return (
    <div className="page host-public">
      <Seo
        title={`${host.name} — host on Lotnis`}
        description={`${host.name} hosts ${host.stats.listings} space${host.stats.listings === 1 ? '' : 's'} and ${host.stats.upcoming_events} upcoming event${host.stats.upcoming_events === 1 ? '' : 's'} on Lotnis.`}
        path={`/hosts/${host.id}`}
      />
      <header className="host-public-head">
        <Avatar name={host.name} size="lg" />
        <div>
          <span className="eyebrow">{host.type === 'business' ? 'Business host' : 'Host'}</span>
          <h1>
            {host.name}
            {host.verified && <BadgeCheck size={22} className="verified" aria-label="Verified host" />}
          </h1>
          <p>
            {host.city && (
              <>
                <MapPin size={14} /> {[host.city, host.region].filter(Boolean).join(', ')} ·{' '}
              </>
            )}
            On Lotnis since {since}
          </p>
        </div>
      </header>
      <StatGrid cols={4}>
        <StatCard label="Listings" value={host.stats.listings} />
        <StatCard label="Upcoming events" value={host.stats.upcoming_events} />
        <StatCard label="Events hosted" value={host.stats.past_events} />
        <StatCard
          label="Average rating"
          value={
            host.stats.rating ? (
              <>
                <Star size={16} fill="currentColor" /> {host.stats.rating}
              </>
            ) : (
              '—'
            )
          }
        />
      </StatGrid>
      <SectionHeading title="Places to stay" />
      {host.listings.length ? (
        <div className="card-grid">
          {host.listings.map((l) => (
            <PropertyCard
              key={l.id}
              property={
                {
                  ...l,
                  property_images: l.image ? [{ public_url: l.image, sort_order: 0 }] : [],
                } as unknown as Property
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState>No live listings right now.</EmptyState>
      )}
      <SectionHeading title="Upcoming events" />
      {host.events.length ? (
        <div className="card-grid">
          {host.events.map((e) => (
            <EventCard key={e.id} ev={e} />
          ))}
        </div>
      ) : (
        <EmptyState>No upcoming events.</EmptyState>
      )}
      <p className="muted-inline">
        <button
          className="link-btn"
          onClick={() => {
            track('property', host.listings[0]?.id, 'click_host');
            setReporting(true);
          }}
        >
          Report this host
        </button>
      </p>
      {reporting && (
        <ReportDialog
          kind="host"
          target={{ host_id: host.id }}
          title={`Report ${host.name}`}
          onClose={() => setReporting(false)}
          audienceNote="Only Lotnis can see this report."
        />
      )}
    </div>
  );
}
