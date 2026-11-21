import './myservices.css';
import { Check, Clock, MapPin, Tag, Wallet } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { emojiFor } from '@/components/maps/categoryIcons';
import {
  emptyLocation,
  LocationPicker,
  locationPayload,
  validateLocation,
  type LocationValue,
} from '@/components/forms/LocationPicker';
import { PhotoPicker } from '@/components/forms/PhotoPicker';
import { StepIndicator, StepperActions, useStepper } from '@/components/steppers';
import { ErrorState, LoadingState, Notice, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';
import { marketApi, UNIT_NOUN, type MyService, type PricingUnit, type ServiceCategory } from '@/lib/api/market';
import { uploadImage } from '@/lib/api/uploads';
import type { CatalogOptions } from '@/types';
import { TimeOff } from './TimeOff';
import { MultiSelect } from '@/components/forms/MultiSelect';
import { LANGUAGES, MAX_LANGUAGES, MAX_TAGS, MAX_UNITS, SERVICE_LIMITS as L } from '@/lib/serviceCatalog';
import { cleanBlock, cleanInt, cleanKeywords, cleanLine, cleanMoney, len } from '@/lib/textRules';

/** "12 / 80" under a field; turns amber in the last 10%. */
function Count({ value, max }: { value: string; max: number }) {
  const n = value.length;
  return (
    <small className={`char-count${n > max * 0.9 ? ' is-near' : ''}`} aria-live="polite">
      {n} / {max}
    </small>
  );
}

const LANGUAGE_OPTIONS = LANGUAGES.map((l) => ({
  value: l.name,
  label: l.name,
  group: l.group === 'ghanaian' ? 'Ghanaian languages' : 'International',
}));

const STEPS = [
  { key: 'what', label: 'What you do' },
  { key: 'price', label: 'Your rate' },
  { key: 'where', label: 'Where' },
  { key: 'hours', label: 'Hours' },
  { key: 'photos', label: 'Photos' },
] as const;
type StepKey = (typeof STEPS)[number]['key'];
type Window = { weekday: number; start_time: string; end_time: string };
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const UNITS: Array<[PricingUnit, string, string]> = [
  ['per_hour', 'Per hour', 'Plumbing, tutoring, repairs'],
  ['per_30min', 'Per 30 minutes', 'Short sessions, consultations'],
  ['per_day', 'Per day', 'Photography, driving, long jobs (8-hour day)'],
  ['per_job', 'Per job', 'A fixed price for the whole job'],
];
const split = (v: string) =>
  v
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

/** Create or edit a service in five short steps; the last step saves it and sends it for review. */
export default function ServiceForm() {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  const [cats, setCats] = useState<ServiceCategory[]>([]);
  const [catsState, setCatsState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [catalog, setCatalog] = useState<CatalogOptions | null>(null);
  const [loaded, setLoaded] = useState(!editing);
  const [existing, setExisting] = useState<MyService | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [languages, setLanguages] = useState<string[]>(['English']);
  const [unit, setUnit] = useState<PricingUnit>('per_hour');
  const [rate, setRate] = useState('');
  const [jobMinutes, setJobMinutes] = useState('60');
  const [minUnits, setMinUnits] = useState('1');
  const [maxUnits, setMaxUnits] = useState('8');
  const [negotiate, setNegotiate] = useState(true);
  const [loc, setLoc] = useState<LocationValue>({ ...emptyLocation });
  const [radius, setRadius] = useState('15');
  const [travels, setTravels] = useState(true);
  const [ownPlace, setOwnPlace] = useState(false);
  const [address, setAddress] = useState('');
  const [windows, setWindows] = useState<Window[]>(
    [1, 2, 3, 4, 5].map((weekday) => ({ weekday, start_time: '08:00', end_time: '17:00' })),
  );
  const [photos, setPhotos] = useState<string[]>([]);

  const loadCats = useCallback(() => {
    setCatsState('loading');
    marketApi
      .categories()
      .then((list) => {
        setCats(list);
        setCatsState(list.length ? 'ready' : 'error');
      })
      .catch(() => setCatsState('error'));
  }, []);
  useEffect(() => {
    loadCats();
    api
      .getCatalog()
      .then(setCatalog)
      .catch(() => {});
  }, [loadCats]);
  useEffect(() => {
    if (!id) return;
    marketApi.host
      .get(id)
      .then((s) => {
        setExisting(s);
        setCategoryId(s.category_id);
        setTitle(s.title);
        setSummary(s.summary ?? '');
        setDescription(s.description);
        setTags(s.tags.join(', '));
        setLanguages(s.languages);
        setUnit(s.pricing_unit);
        setRate(String(s.rate));
        setJobMinutes(String(s.job_minutes));
        setMinUnits(String(s.min_units));
        setMaxUnits(String(s.max_units));
        setNegotiate(s.allow_negotiation);
        setRadius(String(s.service_radius_km));
        setTravels(s.travels_to_customer);
        setOwnPlace(s.works_at_own_place);
        setAddress(s.address_text ?? '');
        setPhotos(s.photos);
        setLoc({
          ...emptyLocation,
          street: s.address_text ?? '',
          lat: s.latitude,
          lng: s.longitude,
          cityOther: s.city ?? '',
          city: '__other__',
          region: s.region ?? '',
        } as LocationValue);
        setWindows(
          (s.availability ?? []).map((w) => ({
            weekday: w.weekday,
            start_time: w.start_time.slice(0, 5),
            end_time: w.end_time.slice(0, 5),
          })),
        );
        setLoaded(true);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  // Every kind of service in one dropdown, A to Z, with "Other" last.
  const sortedCats = useMemo(
    () => [...cats].sort((x, y) => (x.slug === 'other' ? 1 : y.slug === 'other' ? -1 : x.name.localeCompare(y.name))),
    [cats],
  );

  const validate = useCallback(
    (key: StepKey): string => {
      if (key === 'what') {
        if (catsState === 'error') return "Service types couldn't load, so this can't be saved yet. Try again above.";
        if (!categoryId) return 'Choose what kind of service it is.';
        if (languages.length === 0) return 'Choose at least one language you speak with customers.';
        if (len(title) < L.titleMin) return `Give your service a title of at least ${L.titleMin} characters.`;
        if (len(description) < L.descriptionMin)
          return `Describe what you do in at least ${L.descriptionMin} characters (you have ${len(description)}).`;
        const words = split(tags);
        const short = words.find((w) => w.length < L.keywordMin);
        if (short) return `Keywords need at least ${L.keywordMin} characters each (“${short}”).`;
        if (words.length > MAX_TAGS) return `Use at most ${MAX_TAGS} keywords (you have ${words.length}).`;
      }
      if (key === 'price') {
        const amount = Number(rate);
        if (!(amount >= L.rateMin)) return `Enter your rate (at least GH₵${L.rateMin}).`;
        if (amount > L.rateMax) return `The highest rate allowed is GH₵${L.rateMax.toLocaleString()}.`;
        if (unit === 'per_job') {
          const m = Number(jobMinutes);
          if (!(m >= L.jobMinutesMin && m <= L.jobMinutesMax))
            return `A job must last between ${L.jobMinutesMin} minutes and ${L.jobMinutesMax / 60} hours.`;
        } else {
          const cap = MAX_UNITS[unit];
          if (!(Number(minUnits) >= 1)) return 'The shortest booking must be at least 1.';
          if (Number(maxUnits) > cap) return `The longest booking can be at most ${cap} ${UNIT_NOUN[unit]}s.`;
        }
        if (Number(maxUnits) < Number(minUnits))
          return 'The most time a customer can book must be at least the minimum.';
      }
      if (key === 'where') {
        const p = loc.lat == null ? validateLocation(loc) : '';
        if (loc.lat == null && p) return p;
        if (loc.lat == null) return 'Pin where you are on the map so customers nearby can find you.';
        if (!travels && !ownPlace) return 'Say whether you travel to customers, work from your own place, or both.';
        if (ownPlace && len(address) < L.addressMin) return 'Add your address so paying customers can find you.';
      }
      if (key === 'hours') {
        if (windows.length === 0) return 'Choose at least one day you work.';
        const late = windows.find((w) => !w.start_time || !w.end_time || w.end_time <= w.start_time);
        if (late) return `On ${DAYS[late.weekday]}, the finishing time must be after the starting time.`;
      }
      if (key === 'photos' && photos.length === 0)
        return 'Add at least one photo — services with pictures get far more requests.';
      return '';
    },
    [
      catsState,
      categoryId,
      languages,
      title,
      description,
      tags,
      rate,
      jobMinutes,
      unit,
      address,
      minUnits,
      maxUnits,
      loc,
      travels,
      ownPlace,
      windows,
      photos,
    ],
  );
  const stepper = useStepper<StepKey>(STEPS as unknown as Array<{ key: StepKey; label: string }>, validate);

  const body = useMemo(() => {
    const where = locationPayload(loc);
    return {
      category_id: categoryId,
      title: title.trim(),
      summary: summary.trim() || undefined,
      description: description.trim(),
      tags: split(tags).slice(0, MAX_TAGS),
      languages,
      pricing_unit: unit,
      rate: Number(rate),
      job_minutes: Number(jobMinutes) || 60,
      min_units: Number(minUnits) || 1,
      max_units: Number(maxUnits) || 1,
      allow_negotiation: negotiate,
      city: where.city || undefined,
      region: where.state || undefined,
      latitude: where.latitude ?? loc.lat ?? undefined,
      longitude: where.longitude ?? loc.lng ?? undefined,
      service_radius_km: Number(radius) || 0,
      travels_to_customer: travels,
      works_at_own_place: ownPlace,
      address_text: ownPlace ? address.trim() || where.formatted : undefined,
      photos,
      availability: windows,
    };
  }, [
    categoryId,
    title,
    summary,
    description,
    tags,
    languages,
    unit,
    rate,
    jobMinutes,
    minUnits,
    maxUnits,
    negotiate,
    loc,
    radius,
    travels,
    ownPlace,
    address,
    photos,
    windows,
  ]);

  const save = async (submitForReview: boolean) => {
    if (!stepper.validateAll()) return;
    setBusy(true);
    setError('');
    try {
      const saved = existing
        ? await marketApi.host.update(existing.id, body as never)
        : await marketApi.host.create(body as never);
      if (submitForReview && ['draft', 'rejected'].includes(existing?.status ?? 'draft'))
        await marketApi.host.submit(saved.id);
      navigate('/host/services');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your service');
    } finally {
      setBusy(false);
    }
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!stepper.last) return void stepper.next();
    void save(true);
  };

  const toggleDay = (d: number) =>
    setWindows((w) =>
      w.some((x) => x.weekday === d)
        ? w.filter((x) => x.weekday !== d)
        : [...w, { weekday: d, start_time: '08:00', end_time: '17:00' }].sort((a, b) => a.weekday - b.weekday),
    );
  const setWin = (d: number, patch: Partial<Window>) =>
    setWindows((w) => w.map((x) => (x.weekday === d ? { ...x, ...patch } : x)));
  const you = rate ? Number(rate) : 0;

  if (error && !loaded) return <ErrorState>{error}</ErrorState>;
  if (!loaded) return <LoadingState />;

  return (
    <section className="host-page host-form-page">
      <Link className="back-link" to="/host/services">
        ← My services
      </Link>
      <PageHeader
        eyebrow={editing ? 'Edit service' : 'New service'}
        title={editing ? (existing?.title ?? 'Edit service') : 'Tell people what you can do'}
      />
      {existing?.status === 'rejected' && (
        <Notice tone="warn">Lotnis asked for changes: {existing.rejection_reason}. Update it and submit again.</Notice>
      )}
      <StepIndicator
        steps={STEPS as unknown as Array<{ key: StepKey; label: string }>}
        current={stepper.index}
        onJump={stepper.jump}
        label="Service steps"
      />

      <form className="listing-form" onSubmit={submit} noValidate>
        {stepper.key === 'what' && (
          <div className="step-panel">
            <h2 className="form-section">
              <Tag size={18} /> What you do
            </h2>
            {catsState === 'loading' && <LoadingState>Loading service types…</LoadingState>}
            {catsState === 'error' && (
              <ErrorState>
                <p>Service types couldn't load, so there's nothing to choose from yet.</p>
                <button type="button" className="button button-secondary button-sm" onClick={loadCats}>
                  Try again
                </button>
              </ErrorState>
            )}
            <label>
              What do you list?
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                <option value="" disabled>
                  Choose a service…
                </option>
                {sortedCats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {emojiFor(c.icon)} {c.name}
                  </option>
                ))}
              </select>
              <small>From housekeeping to plumbing to photography — pick the closest match, or “Other”.</small>
            </label>
            <label>
              Title
              <input
                value={title}
                onChange={(e) => setTitle(cleanLine(e.target.value, L.titleMax))}
                placeholder="e.g. Wedding & event photography in Accra"
                minLength={L.titleMin}
                maxLength={L.titleMax}
                required
              />
              <Count value={title} max={L.titleMax} />
            </label>
            <label>
              One-line summary <small>optional</small>
              <input
                value={summary}
                onChange={(e) => setSummary(cleanLine(e.target.value, L.summaryMax))}
                maxLength={L.summaryMax}
                placeholder="What makes you the right person?"
              />
              <Count value={summary} max={L.summaryMax} />
            </label>
            <label>
              About your service
              <textarea
                rows={6}
                value={description}
                onChange={(e) => setDescription(cleanBlock(e.target.value, L.descriptionMax))}
                placeholder="What you do, your experience, what customers get, what to prepare…"
                minLength={L.descriptionMin}
                maxLength={L.descriptionMax}
                required
              />
              <small className="field-hint">
                At least {L.descriptionMin} characters. Letters, numbers and everyday punctuation.
              </small>
              <Count value={description} max={L.descriptionMax} />
            </label>
            <div className="form-grid">
              <MultiSelect
                label="Languages you speak"
                hint="With customers"
                options={LANGUAGE_OPTIONS}
                value={languages}
                onChange={setLanguages}
                max={MAX_LANGUAGES}
                placeholder="Choose languages"
                searchPlaceholder="Search languages"
              />
              <label>
                Keywords <small>optional, comma separated</small>
                <input
                  value={tags}
                  onChange={(e) => setTags(cleanKeywords(e.target.value, L.keywordMax))}
                  placeholder="e.g. weddings, tiling, shoe repair"
                />
              </label>
            </div>
          </div>
        )}

        {stepper.key === 'price' && (
          <div className="step-panel">
            <h2 className="form-section">
              <Wallet size={18} /> Your rate
            </h2>
            <div className="app-choice-row" role="radiogroup" aria-label="How you charge">
              {UNITS.map(([v, t, sub]) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={unit === v}
                  className={`app-choice ${unit === v ? 'app-choice-on' : ''}`}
                  onClick={() => setUnit(v)}
                >
                  <strong>{t}</strong>
                  <small>{sub}</small>
                </button>
              ))}
            </div>
            <div className="form-grid">
              <label>
                Rate (GHS {unit === 'per_job' ? 'per job' : `per ${UNIT_NOUN[unit]}`})
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={rate}
                  onChange={(e) => setRate(cleanMoney(e.target.value))}
                  placeholder={`${L.rateMin} – ${L.rateMax.toLocaleString()}`}
                  required
                />
              </label>
              {unit === 'per_job' ? (
                <label>
                  How long is one job (minutes)
                  <input
                    type="text"
                    inputMode="numeric"
                    value={jobMinutes}
                    onChange={(e) => setJobMinutes(cleanInt(e.target.value, 4))}
                    placeholder={`${L.jobMinutesMin} – ${L.jobMinutesMax}`}
                  />
                </label>
              ) : (
                <>
                  <label>
                    Shortest booking ({UNIT_NOUN[unit]}s)
                    <input
                      type="text"
                      inputMode="numeric"
                      value={minUnits}
                      onChange={(e) => setMinUnits(cleanInt(e.target.value, 2))}
                    />
                  </label>
                  <label>
                    Longest booking ({UNIT_NOUN[unit]}s) <small>up to {MAX_UNITS[unit]}</small>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={maxUnits}
                      onChange={(e) => setMaxUnits(cleanInt(e.target.value, 2))}
                    />
                  </label>
                </>
              )}
            </div>
            <label className="checkbox-row">
              <input type="checkbox" checked={negotiate} onChange={(e) => setNegotiate(e.target.checked)} /> Let
              customers offer a lower price
            </label>
            <p className="muted-inline">
              {negotiate
                ? `Customers can offer up to 20% less than your rate${you ? ` (no lower than GHS ${(you * 0.8).toFixed(2)})` : ''} — never lower. You choose whether to accept, reply with another price, or decline each one.`
                : 'Customers pay your rate. You can turn offers on later.'}{' '}
              Lotnis takes a small commission from what you earn; you see the exact amount before you accept.
            </p>
          </div>
        )}

        {stepper.key === 'where' && (
          <div className="step-panel">
            <h2 className="form-section">
              <MapPin size={18} /> Where you work
            </h2>
            <p className="muted-inline">
              Pin your base. Customers search around them, and you show up for anyone inside the distance you cover.
            </p>
            {catalog ? (
              <LocationPicker catalog={catalog.locations} value={loc} onChange={setLoc} />
            ) : (
              <div className="empty-state">Loading places…</div>
            )}
            <label>
              How far will you travel? <b>{radius} km</b>
              <input type="range" min="1" max="100" value={radius} onChange={(e) => setRadius(e.target.value)} />
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={travels} onChange={(e) => setTravels(e.target.checked)} /> I travel to the
              customer
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={ownPlace} onChange={(e) => setOwnPlace(e.target.checked)} /> Customers
              come to my place (studio, shop, salon)
            </label>
            {ownPlace && (
              <label>
                Your address <small>only shown after a customer has paid</small>
                <input
                  value={address}
                  onChange={(e) => setAddress(cleanLine(e.target.value, L.addressMax))}
                  placeholder="Street, area, landmark"
                  minLength={L.addressMin}
                  maxLength={L.addressMax}
                />
                <Count value={address} max={L.addressMax} />
              </label>
            )}
          </div>
        )}

        {stepper.key === 'hours' && (
          <div className="step-panel">
            <h2 className="form-section">
              <Clock size={18} /> When you work
            </h2>
            <p className="muted-inline">Customers can only ask for times inside these hours (Ghana time).</p>
            <div className="sv-hours">
              {DAYS.map((d, i) => {
                const w = windows.find((x) => x.weekday === i);
                return (
                  <div key={d} className={w ? 'on' : ''}>
                    <label className="checkbox-row">
                      <input type="checkbox" checked={!!w} onChange={() => toggleDay(i)} /> {d}
                    </label>
                    {w ? (
                      <span>
                        <input
                          type="time"
                          value={w.start_time}
                          onChange={(e) => setWin(i, { start_time: e.target.value })}
                          aria-label={`${d} from`}
                        />{' '}
                        to{' '}
                        <input
                          type="time"
                          value={w.end_time}
                          onChange={(e) => setWin(i, { end_time: e.target.value })}
                          aria-label={`${d} until`}
                        />
                      </span>
                    ) : (
                      <em>Not working</em>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="sv-presets">
              <button
                type="button"
                className="button button-quiet"
                onClick={() =>
                  setWindows([1, 2, 3, 4, 5].map((weekday) => ({ weekday, start_time: '08:00', end_time: '17:00' })))
                }
              >
                Weekdays 8–5
              </button>
              <button
                type="button"
                className="button button-quiet"
                onClick={() =>
                  setWindows(
                    [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({ weekday, start_time: '08:00', end_time: '20:00' })),
                  )
                }
              >
                Every day 8–8
              </button>
            </div>
            {existing && <TimeOff serviceId={existing.id} initial={existing.time_off ?? []} />}
          </div>
        )}

        {stepper.key === 'photos' && (
          <div className="step-panel">
            <h2 className="form-section">
              <Check size={18} /> Show your work
            </h2>
            <p className="muted-inline">Real photos of your work get the most requests. The first one is the cover.</p>
            <PhotoPicker urls={photos} onChange={setPhotos} max={10} label="Add photos" upload={uploadImage} />
            {!editing && (
              <p className="muted-inline">
                A new provider's first service is checked by Lotnis before it goes live. After that, new services
                publish straight away.
              </p>
            )}
          </div>
        )}

        {(error || stepper.error) && (
          <div className="form-error" role="alert">
            {error || stepper.error}
          </div>
        )}
        <StepperActions
          index={stepper.index}
          count={STEPS.length}
          last={stepper.last}
          busy={busy}
          submitLabel={existing?.status === 'published' ? 'Save changes' : 'Save & send for review'}
          cancelTo="/host/services"
          onBack={stepper.back}
          onNext={stepper.next}
        />
      </form>
    </section>
  );
}
