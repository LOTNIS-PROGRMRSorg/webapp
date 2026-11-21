import { Languages, LocateFixed, Map as MapIcon, Search, SlidersHorizontal } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ServiceCard } from '@/components/cards';
import { emojiFor } from '@/components/maps/categoryIcons';
import { EmptyState, ErrorState, PageHeader } from '@/components/ui';
import { PillTabs } from '@/components/tabs';
import { Seo } from '@/lib/seo/seo';
import { marketApi, type ServiceCard as Card, type ServiceCategory } from '@/lib/api/market';
import { LANGUAGES } from '@/lib/serviceCatalog';
import './services.css';

const SORTS = [
  { key: 'nearest', label: 'Nearest' },
  { key: 'top', label: 'Top rated' },
  { key: 'price_asc', label: 'Price: low to high' },
  { key: 'price_desc', label: 'Price: high to low' },
  { key: 'new', label: 'Newest' },
];

/** Browse people who can do a job: by type, by price, and by how close they are. */
export default function ServicesPage() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') ?? '';
  const language = params.get('language') ?? '';
  const q = params.get('q') ?? '';
  const sort = params.get('sort') ?? (params.get('lat') ? 'nearest' : 'top');
  const lat = params.get('lat') ? Number(params.get('lat')) : undefined;
  const lng = params.get('lng') ? Number(params.get('lng')) : undefined;
  const [cats, setCats] = useState<ServiceCategory[]>([]);
  const [items, setItems] = useState<Card[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [text, setText] = useState(q);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    marketApi
      .categories()
      .then(setCats)
      .catch(() => {});
  }, []);
  useEffect(() => {
    setItems(null);
    setError('');
    marketApi
      .search({
        category: category || undefined,
        language: language || undefined,
        q: q || undefined,
        lat,
        lng,
        radius_km: 30,
        sort,
      })
      .then((r) => {
        setItems(r.data);
        setTotal(r.total);
      })
      .catch((e) => setError(e.message));
  }, [category, language, q, lat, lng, sort]);

  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };
  const nearMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false);
        set({ lat: p.coords.latitude.toFixed(4), lng: p.coords.longitude.toFixed(4), sort: 'nearest' });
      },
      () => setLocating(false),
      { timeout: 8000 },
    );
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    set({ q: text.trim() || null });
  };
  const mapLink = useMemo(
    () => `/map?kinds=services${category ? `&category=${category}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`,
    [category, q],
  );

  return (
    <div className="page svc">
      <Seo
        title="Hire a local pro"
        description="Photographers, plumbers, cleaners, DJs and more near you. Request a time, agree a price and pay safely through Lotnis."
        path="/services"
      />
      <PageHeader eyebrow="Services" title="Find someone who can do the job">
        <Link className="button button-secondary" to={mapLink}>
          <MapIcon size={16} /> Map view
        </Link>
        <Link className="button button-primary" to="/host/services/new">
          Offer your service
        </Link>
      </PageHeader>
      <p className="lead">
        Pick a time, agree the price, and pay through Lotnis. Your money is held until the job is done and you are happy
        — the provider is paid then.
      </p>

      <form className="svc-search" role="search" onSubmit={submit}>
        <Search size={18} />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What do you need? e.g. wedding photographer, plumber"
          aria-label="Search services"
        />
        <button type="button" className="button button-quiet" onClick={nearMe} disabled={locating}>
          <LocateFixed size={16} /> {lat ? 'Near you' : locating ? 'Finding you…' : 'Near me'}
        </button>
        <button className="button button-primary">Search</button>
      </form>

      <PillTabs
        label="Service type"
        value={category}
        onChange={(v) => set({ category: v || null })}
        tabs={[
          { key: '', label: 'Everything' },
          ...cats.map((c) => ({ key: c.slug, label: c.name, icon: <span>{emojiFor(c.icon)}</span> })),
        ]}
      />

      <div className="svc-bar">
        <strong>
          {items ? `${total} provider${total === 1 ? '' : 's'}${lat ? ' who can reach you' : ''}` : 'Searching…'}
        </strong>
        <label className="svc-sort">
          <Languages size={15} /> Language
          <select value={language} onChange={(e) => set({ language: e.target.value || null })}>
            <option value="">Any language</option>
            <optgroup label="Ghanaian languages">
              {LANGUAGES.filter((l) => l.group === 'ghanaian').map((l) => (
                <option key={l.name} value={l.name}>
                  {l.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="International">
              {LANGUAGES.filter((l) => l.group === 'international').map((l) => (
                <option key={l.name} value={l.name}>
                  {l.name}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
        <label className="svc-sort">
          <SlidersHorizontal size={15} /> Sort
          <select value={sort} onChange={(e) => set({ sort: e.target.value })}>
            {SORTS.filter((s) => lat || s.key !== 'nearest').map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <ErrorState>{error}</ErrorState>
      ) : !items ? (
        <div className="svc-grid">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="ex-skel" style={{ height: 280, borderRadius: 18 }} />
          ))}
        </div>
      ) : items.length ? (
        <div className="svc-grid">
          {items.map((s) => (
            <ServiceCard key={s.id} s={s} />
          ))}
        </div>
      ) : (
        <EmptyState
          action={
            <Link className="button button-secondary" to="/host/services/new">
              Be the first to offer it
            </Link>
          }
        >
          No one matches yet. Try another type, a wider search, or remove "near me".
        </EmptyState>
      )}
    </div>
  );
}
