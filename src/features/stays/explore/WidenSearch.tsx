import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import type { SpaceCopy } from '@/lib/seo/content';
import type { CatalogCity } from '@/types';
import { apiQuery, essentialByKey, Filters, RADII, unitWord } from './exploreFilters';

type Option = { key: string; title: string; detail: string; patch: Partial<Filters>; total?: number };

/** One-step changes that loosen the current search, most useful first. */
function candidates(f: Filters, space: SpaceCopy | undefined, cities: CatalogCity[]): Option[] {
  const out: Option[] = [];
  const hasPoint = Boolean(f.lat && f.lng);
  if (f.minPrice || f.maxPrice)
    out.push({
      key: 'budget',
      title: 'Any budget',
      detail: `remove the GHS ${f.minPrice || '0'} – ${f.maxPrice || 'any'} limit`,
      patch: { minPrice: '', maxPrice: '' },
    });
  if (f.amenities.length)
    out.push({
      key: 'amenities',
      title: 'Fewer must-haves',
      detail: `drop ${f.amenities.map((a) => essentialByKey(a)?.label.toLowerCase() ?? a).join(', ')}`,
      patch: { amenities: [] },
    });
  if (f.pricingPeriod)
    out.push({
      key: 'period',
      title: 'Any rental length',
      detail: `not only ${unitWord[f.pricingPeriod] ?? f.pricingPeriod} lets`,
      patch: { pricingPeriod: '', minPrice: '', maxPrice: '' },
    });
  if (hasPoint) {
    const next = RADII.find((r) => r > Number(f.radiusKm || 10));
    if (next)
      out.push({
        key: 'radius',
        title: `Within ${next} km`,
        detail: `a wider area around ${f.near || 'this point'}`,
        patch: { radiusKm: String(next) },
      });
  } else if (f.city && !f.query) {
    const region = cities.find((c) => c.name === f.city)?.region;
    if (region)
      out.push({
        key: 'region',
        title: `Anywhere in ${region.replace(/ Region$/, '')}`,
        detail: `include towns near ${f.city}`,
        patch: { city: '', query: region },
      });
  }
  if (f.query && f.city)
    out.push({ key: 'area', title: `All of ${f.city}`, detail: `not only “${f.query}”`, patch: { query: '' } });
  if (f.subType || f.category)
    out.push({
      key: 'type',
      title: f.city ? `Any space in ${f.city}` : 'Any type of space',
      detail: space ? `not only ${space.plural}` : 'homes, offices, shops and more',
      patch: { subType: '', category: '' },
    });
  // Last resort for a place with nothing listed yet: the same search across the whole country.
  if (f.city || hasPoint)
    out.push({
      key: 'ghana',
      title: 'Anywhere in Ghana',
      detail: `not only ${f.city || f.near || 'this area'}`,
      patch: { city: '', query: '', lat: '', lng: '', near: '', radiusKm: '' },
    });
  else if (f.query)
    out.push({ key: 'words', title: 'All spaces', detail: `not only “${f.query}”`, patch: { query: '' } });
  if (f.rooms || f.pets || f.parking || f.minRating)
    out.push({
      key: 'extras',
      title: 'Fewer extras',
      detail: 'drop parking, pets, rating and room filters',
      patch: { rooms: false, pets: false, parking: false, minRating: '' },
    });
  return out;
}

export function WidenSearch({
  filters,
  total,
  space,
  cities,
  commit,
}: {
  filters: Filters;
  total: number;
  space?: SpaceCopy;
  cities: CatalogCity[];
  commit: (patch: Partial<Filters>) => void;
}) {
  const [options, setOptions] = useState<Option[] | null>(null);
  const key = JSON.stringify(filters);
  useEffect(() => {
    let live = true;
    setOptions(null);
    const list = candidates(filters, space, cities).slice(0, 5);
    // Ask for one result per option: the API's total says how many spaces each change would show.
    Promise.all(
      list.map((o) =>
        api
          .searchProperties(apiQuery({ ...filters, ...o.patch, page: 1 }, 1, 1))
          .then((r) => ({ ...o, total: r.total ?? 0 }))
          .catch(() => ({ ...o, total: 0 })),
      ),
    ).then((rows) => {
      if (live)
        setOptions(
          rows
            .filter((o) => (o.total ?? 0) > total)
            .sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
            .slice(0, 3),
        );
    });
    return () => {
      live = false;
    };
  }, [key, total]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!options?.length) return null;
  return (
    <section className="sp-widen" aria-labelledby="sp-widen-title">
      <h2 id="sp-widen-title">{total ? 'Looking for more choice?' : 'Try one of these instead'}</h2>
      <p>One small change to your search finds more spaces.</p>
      <div className="sp-widen-list">
        {options.map((o) => {
          const more = (o.total ?? 0) - total;
          return (
            <button key={o.key} type="button" onClick={() => commit(o.patch)}>
              <b>{o.title}</b>
              <small>
                <em>
                  {total ? '+' : ''}
                  {more.toLocaleString()} {more === 1 ? 'space' : 'spaces'}
                </em>{' '}
                · {o.detail}
              </small>
            </button>
          );
        })}
      </div>
    </section>
  );
}

const article = (word: string) => (/^[aeiou]/i.test(word) ? 'an' : 'a');

/** Invites landlords to list here: an empty or thin search is the clearest sign of missing supply. */
export function HostPrompt({ city, space, empty }: { city?: string; space?: SpaceCopy; empty?: boolean }) {
  const thing = space ? space.label.toLowerCase().replace(' / hostel', '') : 'space';
  const title = city
    ? empty && space
      ? `No ${space.plural} listed in ${city} yet`
      : `Own ${article(thing)} ${thing} in ${city}?`
    : `Have ${article(thing)} ${thing} to rent out?`;
  return (
    <aside className="sp-host">
      <div>
        <small>For landlords and businesses</small>
        <h2>{title}</h2>
        <p>
          {empty
            ? 'Be one of the first hosts here. Listing on Lotnis is free and takes a few minutes.'
            : 'List it on Lotnis for free. You set the price and the house rules, and get paid by mobile money or bank.'}
        </p>
      </div>
      <Link to="/host">
        List your space <ArrowRight size={16} />
      </Link>
    </aside>
  );
}
