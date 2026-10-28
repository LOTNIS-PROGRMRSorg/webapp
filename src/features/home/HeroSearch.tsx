import { FormEvent, useState } from 'react';
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  Clock,
  LockKeyhole,
  MapPin,
  Search,
  ShieldCheck,
  Smartphone,
  Undo2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LINES, lineByKey, type LineKey } from '@/lib/lines';
import { LINE_ICON, PERIODS, Period, SPACE_TYPES } from './homeShared';

// ── One search box, four lines ──────────────────────────────────────────────
export const PLACEHOLDER: Record<Exclude<LineKey, 'spaces'>, string> = {
  food: 'Waakye, cake, catering…',
  services: 'Plumber, photographer, tour guide…',
  events: 'Wedding, concert, workshop…',
};

const ASSURANCES = [
  { icon: ShieldCheck, text: 'Verified hosts and providers' },
  { icon: Smartphone, text: 'Pay with mobile money or card' },
  { icon: Undo2, text: 'Clear prices and fair refund rules' },
  { icon: LockKeyhole, text: 'Secure account and payments' },
  { icon: BadgeCheck, text: 'Support when you need it' },
];

export function HeroSearch() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<LineKey>('spaces');
  const [where, setWhere] = useState('');
  const [what, setWhat] = useState('');
  const [period, setPeriod] = useState<Period | ''>('');
  const [space, setSpace] = useState('');
  const line = lineByKey(tab);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (tab === 'spaces') {
      if (where.trim()) params.set('query', where.trim());
      if (period) params.set('pricingPeriod', period);
      if (space) params.set('subType', space);
      const search = params.toString();
      navigate(search ? `/explore?${search}` : '/explore');
    } else if (line.status === 'live') {
      // Events: the text is what they're after; the place narrows it to a city.
      const text = what.trim() || where.trim();
      if (text) params.set('query', text);
      if (what.trim() && where.trim()) params.set('city', where.trim());
      navigate(`${line.path}${params.toString() ? `?${params}` : ''}`);
    } else {
      if (what.trim()) params.set('query', what.trim());
      if (where.trim()) params.set('where', where.trim());
      navigate(`${line.path}${params.size ? `?${params}` : ''}`);
    }
  };

  return (
    <div className="lp-container lp-search-wrap reveal">
      <div className="lp-tabs" role="tablist" aria-label="What are you looking for?">
        {LINES.map((l) => {
          const Icon = LINE_ICON[l.key];
          return (
            <button
              key={l.key}
              type="button"
              role="tab"
              aria-selected={tab === l.key}
              className={tab === l.key ? 'on' : ''}
              onClick={() => setTab(l.key)}
            >
              <Icon size={17} /> {l.label}
              {l.status === 'soon' && <em>Soon</em>}
            </button>
          );
        })}
      </div>
      <form className="lp-search" role="search" onSubmit={submit}>
        {tab === 'spaces' ? (
          <>
            <label className="lp-field lp-field-where">
              <MapPin size={20} />
              <span className="lp-field-text">
                <span className="lp-field-label">Where</span>
                <input
                  value={where}
                  onChange={(e) => setWhere(e.target.value)}
                  placeholder="Search Osu, Kumasi, Cape Coast…"
                />
              </span>
            </label>
            <label className="lp-field">
              <Building2 size={20} />
              <span className="lp-field-text">
                <span className="lp-field-label">Space</span>
                <select value={space} onChange={(e) => setSpace(e.target.value)}>
                  <option value="">Any kind of space</option>
                  {SPACE_TYPES.map(({ slug, label }) => (
                    <option key={slug} value={slug}>
                      {label}
                    </option>
                  ))}
                </select>
              </span>
            </label>
            <label className="lp-field">
              <CalendarDays size={20} />
              <span className="lp-field-text">
                <span className="lp-field-label">Rent by</span>
                <select value={period} onChange={(e) => setPeriod(e.target.value as Period | '')}>
                  <option value="">Any length</option>
                  {PERIODS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </span>
            </label>
          </>
        ) : (
          <>
            <label className="lp-field lp-field-where">
              <Search size={20} />
              <span className="lp-field-text">
                <span className="lp-field-label">
                  {tab === 'food'
                    ? 'What are you hungry for?'
                    : tab === 'services'
                      ? 'What do you need done?'
                      : 'What are you planning?'}
                </span>
                <input
                  value={what}
                  onChange={(e) => setWhat(e.target.value)}
                  placeholder={PLACEHOLDER[tab as Exclude<LineKey, 'spaces'>]}
                />
              </span>
            </label>
            <label className="lp-field">
              <MapPin size={20} />
              <span className="lp-field-text">
                <span className="lp-field-label">Where</span>
                <input value={where} onChange={(e) => setWhere(e.target.value)} placeholder="Your area or city" />
              </span>
            </label>
            {line.status === 'soon' && (
              <div className="lp-field lp-soon-note">
                <Clock size={20} />
                <span className="lp-field-text">
                  <span className="lp-field-label">Launching soon</span>
                  <span>See what's planned</span>
                </span>
              </div>
            )}
          </>
        )}
        <button className="lp-search-btn" type="submit">
          <Search size={20} /> {tab === 'spaces' ? 'Find a space' : line.status === 'live' ? 'Search' : 'Learn more'}
        </button>
      </form>
      <div className="lp-assurances" aria-label="Why use Lotnis">
        <div className="lp-assurances-track">
          {[...ASSURANCES, ...ASSURANCES].map(({ icon: Icon, text }, index) => (
            <span className="lp-assurance" key={`${text}-${index}`} aria-hidden={index >= ASSURANCES.length}>
              <Icon size={16} /> {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
