import { Hotel } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CITY_COPY, SPACE_COPY } from '@/lib/seo/content';
import { UNITS } from './exploreFilters';

export function BrowseLinks() {
  return (
      <section className="ex-links reveal" aria-label="Explore more">
        <div><h2>Browse by space</h2><ul>{SPACE_COPY.map((s) => <li key={s.slug}><Link to={`/rent/${s.slug}`}>{s.label === 'Hotel / hostel' ? 'Hotels & hostels' : `${s.label.charAt(0).toUpperCase()}${s.label.slice(1)}s`} for rent</Link></li>)}</ul></div>
        <div><h2>Browse by city</h2><ul>{CITY_COPY.map((c) => <li key={c.slug}><Link to={`/in/${c.slug}`}>Places to rent in {c.name}</Link></li>)}</ul></div>
        <div><h2>Rent by</h2><ul>{UNITS.slice(1).map(([v, l]) => <li key={v}><Link to={`/explore?pricingPeriod=${v}`}>{l} rentals</Link></li>)}</ul></div>
      </section>
  );
}
