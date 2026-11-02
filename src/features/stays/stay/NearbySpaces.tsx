import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { areaOf, SpaceCard } from '@/features/stays/explore/SpaceCard';
import { rememberViewed, useSavedSpaces } from '@/features/stays/explore/spaceMemory';
import type { CatalogCity, Property } from '@/types';
import '@/features/stays/explore/explore.css';

/** "More spaces in Kumasi": keeps people browsing when this one isn't quite right. */
export function NearbySpaces({ property, cities }: { property: Property; cities: CatalogCity[] }) {
  const [list, setList] = useState<Property[]>([]);
  const { isSaved, toggle } = useSavedSpaces();
  useEffect(() => {
    if (!property.city) return;
    let live = true;
    api
      .searchProperties(new URLSearchParams({ city: property.city, page: '1', limit: '5' }))
      .then((r) => live && setList((r.data ?? []).filter((p) => p.id !== property.id).slice(0, 4)))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [property.id, property.city]);
  if (!list.length) return null;
  const citySlug = (property.city ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return (
    <section className="st-nearby" aria-labelledby="st-nearby-title">
      <div className="st-nearby-head">
        <h2 id="st-nearby-title">More spaces in {property.city}</h2>
        <Link to={`/in/${citySlug}`}>
          See all <ArrowRight size={15} />
        </Link>
      </div>
      <div className="sp-grid">
        {list.map((p) => (
          <SpaceCard
            key={p.id}
            property={p}
            area={areaOf(p, cities)}
            saved={isSaved(p.id)}
            onToggleSave={() => toggle(p)}
            onOpen={() => rememberViewed(p)}
          />
        ))}
      </div>
    </section>
  );
}
