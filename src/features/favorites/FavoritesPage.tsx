import { PillTabs } from '@/components/tabs';
import { useEffect, useMemo, useState } from 'react';
import { Heart, Home, Ticket, UtensilsCrossed, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EventCard } from '@/components/cards';
import { areaOf, SpaceCard } from '@/features/stays/explore/SpaceCard';
import '@/features/stays/explore/explore.css';
import { favoritesApi } from '@/lib/api/favorites';
import type { EventCard as EventCardData } from '@/lib/api/events';
import type { Property } from '@/types';
import { Seo } from '@/lib/seo/seo';
import { useFavorites } from './Favorites';

type Tab = 'all' | 'spaces' | 'events';

/** Everything the person has saved, across the services Lotnis offers. Food and services join when they launch. */
export function FavoritesPage() {
  const { has, toggle } = useFavorites();
  const [data, setData] = useState<{ events: EventCardData[]; properties: Property[] } | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('all');

  useEffect(() => {
    favoritesApi
      .items()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Unable to load your favourites'));
  }, []);

  // Un-saving a card on this page removes it straight away.
  const spaces = useMemo(() => (data?.properties ?? []).filter((p) => has('property', p.id)), [data, has]);
  const events = useMemo(() => (data?.events ?? []).filter((e) => has('event', e.id)), [data, has]);
  const total = spaces.length + events.length;

  const tabs: Array<[Tab, string, number]> = [
    ['all', 'All', total],
    ['spaces', 'Spaces', spaces.length],
    ['events', 'Events', events.length],
  ];

  return (
    <div className="page ev-page fav-page">
      <Seo title="Favourites" description="The spaces and events you saved on Lotnis." noindex />
      <header className="ev-page-heading">
        <div>
          <span className="eyebrow">Saved for later</span>
          <h1>Your favourites</h1>
        </div>
        <span className="ev-page-heading-note">Spaces and events you’ve saved, all in one place</span>
      </header>

      <PillTabs
        label="Favourites by service"
        value={tab}
        onChange={setTab}
        tabs={tabs.map(([key, label, count]) => ({ key, label, count }))}
      />

      {error ? (
        <div className="error-state" role="alert">
          {error}
        </div>
      ) : !data ? (
        <div className="skeleton-hero" aria-busy="true" />
      ) : total === 0 ? (
        <div className="empty-state ev-empty">
          <Heart size={28} aria-hidden="true" />
          <h2>Nothing saved yet</h2>
          <p>Tap the heart on any space or event and it will show up here.</p>
          <div className="fav-empty-links">
            <Link className="button button-primary" to="/explore">
              Browse spaces
            </Link>
            <Link className="button button-secondary" to="/events">
              Browse events
            </Link>
          </div>
        </div>
      ) : (
        <>
          {tab !== 'events' && spaces.length > 0 && (
            <section className="fav-section" aria-label="Saved spaces">
              <h2>
                <Home size={18} aria-hidden="true" /> Spaces
              </h2>
              <div className="sp-grid">
                {spaces.map((p) => (
                  <SpaceCard
                    key={p.id}
                    property={p}
                    area={areaOf(p)}
                    saved
                    onToggleSave={() => toggle('property', p.id)}
                  />
                ))}
              </div>
            </section>
          )}
          {tab !== 'spaces' && events.length > 0 && (
            <section className="fav-section" aria-label="Saved events">
              <h2>
                <Ticket size={18} aria-hidden="true" /> Events
              </h2>
              <div className="ev-grid">
                {events.map((ev) => (
                  <EventCard key={ev.id} ev={ev} />
                ))}
              </div>
            </section>
          )}
          {tab !== 'events' && tab !== 'spaces' && (
            <section className="fav-soon" aria-label="Coming soon">
              <p>
                <UtensilsCrossed size={16} aria-hidden="true" /> <Wrench size={16} aria-hidden="true" /> Food and
                services are coming — you’ll be able to save those here too.
              </p>
            </section>
          )}
        </>
      )}
    </div>
  );
}
