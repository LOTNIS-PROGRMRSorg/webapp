import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, MapPin, Search, Ticket, Trophy } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Seo, SITE_URL } from '@/lib/seo/seo';
import { cedisShort, fmtDate, fmtTime } from '@/features/events/eventUi';
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
    eventApi
      .categories()
      .then(setCategories)
      .catch(() => {});
    eventApi
      .cities()
      .then(setCities)
      .catch(() => {});
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

  return (
    <div className="page">
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
      <div className="page-head">
        <div>
          <span className="eyebrow">Events</span>
          <h1>What's on in Ghana.</h1>
          <p className="lead">
            Concerts, parties, workshops and awards nights. Pay with mobile money or card — your ticket lands in your
            inbox in seconds.
          </p>
        </div>
      </div>
      <form className="ev-filters" onSubmit={submit}>
        <div className="ev-search">
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events, venues, places…"
            aria-label="Search events"
          />
          <button className="button button-primary">Search</button>
        </div>
        <div className="ev-filter-row">
          <label className="ev-select">
            <span>City</span>
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
          <div className="ev-chips" role="group" aria-label="When">
            {[
              ['', 'Anytime'],
              ['today', 'Today'],
              ['week', 'This week'],
              ['month', 'This month'],
            ].map(([v, l]) => (
              <button
                type="button"
                key={v}
                className={`chip ${when === v ? 'chip-active' : ''}`}
                onClick={() => set('when', v)}
              >
                {l}
              </button>
            ))}
            <button
              type="button"
              className={`chip ${free ? 'chip-active' : ''}`}
              onClick={() => set('free', free ? '' : 'true')}
            >
              Free
            </button>
          </div>
        </div>
      </form>
      {error ? (
        <div className="error-state">{error}</div>
      ) : !events ? (
        <div className="ev-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="ev-card ev-skel" />
          ))}
        </div>
      ) : events.length ? (
        <>
          <p className="muted-inline">
            {total} event{total === 1 ? '' : 's'}
          </p>
          <div className="ev-grid">
            {events.map((ev) => (
              <EventCard key={ev.id} ev={ev} />
            ))}
          </div>
        </>
      ) : (
        <div className="empty-state">
          <Ticket size={28} />
          <p>No events match yet.</p>
          <Link className="button button-secondary" to="/events" onClick={() => setQuery('')}>
            Clear filters
          </Link>
        </div>
      )}
      <section className="ev-cta">
        <div>
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
