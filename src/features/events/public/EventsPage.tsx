import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  Camera,
  Clapperboard,
  Compass,
  Music2,
  Search,
  Ticket,
  Trophy,
  Utensils,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Seo, SITE_URL } from '@/lib/seo/seo';
import { eventApi, EventCard as EventCardData } from '@/lib/api/events';
import { EventCard } from '@/components/cards';
import { errText } from './eventShared';

export function EventsPage() {
  const [params, setParams] = useSearchParams();
  const [events, setEvents] = useState<EventCardData[] | null>(null);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [cities, setCities] = useState<Array<{ city: string; count: number }>>([]);
  const [error, setError] = useState('');
  const [query, setQuery] = useState(params.get('query') || '');
  const category = params.get('category') || '',
    city = params.get('city') || '',
    when = params.get('when') || '',
    free = params.get('free') === 'true';

  useEffect(() => {
    eventApi.categories().then(setCategories).catch(() => {});
    eventApi.cities().then(setCities).catch(() => {});
  }, []);
  const range = useMemo(() => {
    const now = new Date();
    const day = 86_400_000;
    if (when === 'today') {
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { from: now.toISOString(), to: end.toISOString() };
    }
    if (when === 'week') return { from: now.toISOString(), to: new Date(now.getTime() + 7 * day).toISOString() };
    if (when === 'month') return { from: now.toISOString(), to: new Date(now.getTime() + 31 * day).toISOString() };
    return {} as { from?: string; to?: string };
  }, [when]);
  useEffect(() => {
    setEvents(null);
    eventApi
      .list({
        query: params.get('query') || undefined,
        category: category || undefined,
        city: city || undefined,
        free: free ? 'true' : undefined,
        ...range,
        limit: 36,
      })
      .then((r) => {
        setEvents(r.data);
        setTotal(r.total);
        setError('');
      })
      .catch((e) => {
        setError(errText(e, 'Unable to load events'));
        setEvents([]);
      });
  }, [params, category, city, free, range]);

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    set('query', query.trim());
  };
  const title = [category, city && `in ${city}`].filter(Boolean).join(' ') || 'Events and tickets in Ghana';
  const categoryIcon = (value: string) => {
    const name = value.toLowerCase();
    if (/music|concert|festival|party/.test(name)) return Music2;
    if (/food|drink|dining|culinary/.test(name)) return Utensils;
    if (/film|movie|cinema|theatre|theater|arts|culture/.test(name)) return Clapperboard;
    if (/sport|fitness|wellness/.test(name)) return Trophy;
    if (/photo|art|exhibition|creative/.test(name)) return Camera;
    return Compass;
  };

  return (
    <div className="page ev-page">
      <Seo
        title={`${title} — buy tickets`}
        description="Find concerts, parties, workshops, festivals and awards nights across Ghana. Buy tickets with mobile money or card — no account needed — and get them instantly by email."
        path={`/events${params.toString() ? `?${params}` : ''}`}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Events in Ghana',
            url: `${SITE_URL}/events`,
          },
        ]}
      />
      <header className="ev-page-heading">
        <div>
          <span className="eyebrow">Discover experiences across Ghana</span>
          <h1 id="events-heading">Find your next event</h1>
        </div>
        <span className="ev-page-heading-note">Live music, culture, food and more</span>
      </header>

      <form className="ev-discovery-panel" onSubmit={submit}>
        <div className="ev-search">
          <Search size={20} aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events, artists or venues"
            aria-label="Search events, artists or venues"
          />
          <button className="button button-primary" type="submit">
            Search events <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="ev-filter-row">
          <label className="ev-select">
            <span>Location</span>
            <select value={city} onChange={(e) => set('city', e.target.value)}>
              <option value="">All cities</option>
              {cities.map((c) => (
                <option key={c.city} value={c.city}>
                  {c.city} ({c.count})
                </option>
              ))}
            </select>
          </label>
          <label className="ev-select">
            <span>Category</span>
            <select value={category} onChange={(e) => set('category', e.target.value)}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <div className="ev-filter-options">
            <span className="ev-filter-label">When and price</span>
            <div className="ev-chips" role="group" aria-label="Date and price filters">
              {[
                ['', 'Anytime'],
                ['today', 'Today'],
                ['week', 'This week'],
                ['month', 'This month'],
              ].map(([v, label]) => (
                <button
                  type="button"
                  key={v}
                  className={`chip ${when === v ? 'chip-active' : ''}`}
                  aria-pressed={when === v}
                  onClick={() => set('when', v)}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                className={`chip ${free ? 'chip-active' : ''}`}
                aria-pressed={free}
                onClick={() => set('free', free ? '' : 'true')}
              >
                Free
              </button>
            </div>
          </div>
        </div>
      </form>

      {categories.length > 0 && (
        <nav className="ev-category-browse" aria-label="Browse events by category">
          <div className="ev-category-rail">
            <button
              type="button"
              className={`ev-category-shortcut${category ? '' : ' is-active'}`}
              aria-pressed={!category}
              onClick={() => set('category', '')}
            >
              <CalendarDays size={17} aria-hidden="true" />
              All events
            </button>
            {categories.map((value) => {
              const Icon = categoryIcon(value);
              return (
                <button
                  type="button"
                  key={value}
                  className={`ev-category-shortcut${category === value ? ' is-active' : ''}`}
                  aria-pressed={category === value}
                  onClick={() => set('category', value)}
                >
                  <Icon size={17} aria-hidden="true" />
                  {value}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {error ? (
        <div className="error-state ev-error" id="events-results" role="alert">
          <strong>Events could not load</strong>
          <span>{error}</span>
        </div>
      ) : !events ? (
        <section className="ev-results" id="events-results" aria-label="Loading events" aria-busy="true">
          <div className="ev-results-head">
            <span className="ev-skel-line" />
          </div>
          <div className="ev-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="ev-card ev-skel" aria-hidden="true">
                <div className="ev-skel-image" />
                <div className="ev-skel-body">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : events.length ? (
        <section className="ev-results" id="events-results" aria-label="Events">
          <div className="ev-results-head">
            <div>
              <span className="eyebrow">{city ? `In ${city}` : category || 'Across Ghana'}</span>
              <h2>{city || category ? 'Matching events' : 'Explore what’s on'}</h2>
              <p>Real experiences, ready when you are.</p>
            </div>
            <div className="ev-result-count" aria-live="polite">
              <strong>{total}</strong>
              <span>event{total === 1 ? '' : 's'}</span>
            </div>
          </div>
          <div className="ev-grid">
            {events.map((ev) => (
              <EventCard key={ev.id} ev={ev} />
            ))}
          </div>
        </section>
      ) : (
        <div className="empty-state ev-empty" id="events-results">
          <Ticket size={28} aria-hidden="true" />
          <h2>No events match those filters</h2>
          <p>Try a different city, category or date to see what is happening.</p>
          <Link className="button button-secondary" to="/events" onClick={() => setQuery('')}>
            Clear filters
          </Link>
        </div>
      )}

      <section className="ev-cta">
        <div>
          <span className="eyebrow">For the people who make it happen</span>
          <h2>Putting something on?</h2>
          <p>
            Sell tickets, run awards voting and scan guests in at the gate. You're paid after the event, with every
            number in one dashboard.
          </p>
        </div>
        <Link className="button button-primary" to="/host/events">
          Host an event <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
