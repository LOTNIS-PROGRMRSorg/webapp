import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, ImagePlus, Plus, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { cedis, fmtDateTime, fromLocalInput, toLocalInput } from '@/features/events/eventUi';
import { eventApi, RefundTier } from '@/lib/api/events';
import { Seo } from '@/lib/seo/seo';
import { emptyLocation, LocationPicker, type LocationValue } from '@/components/forms/LocationPicker';
import { mapsAuthFailed, mapsEnabled } from '@/lib/maps/maps';
import { inGhana } from '@/lib/maps/places';
import type { CatalogOptions } from '@/types';
import { PageHeader, errText } from './hostShared';

export const BLANK = {
  title: '', category: '', summary: '', description: '', venue_name: '', address: '', city: '', region: '', starts_at: '', ends_at: '', doors_open_at: '',
  age_limit: '', dress_code: '', entry_rules: '', terms: '', contact_phone: '', contact_email: '', cover_image_url: '', gallery: [] as string[],
  fee_mode: 'included', max_tickets_per_order: 10, refund_policy: 'none', postponement_policy: 'carry_over_or_refund', postponement_refund_days: 7,
  voting_enabled: false, voting_opens_at: '', voting_closes_at: '', show_vote_counts: true,
};
export type Form = typeof BLANK;

export function HostEventForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>({ ...BLANK });
  const [tiers, setTiers] = useState<RefundTier[]>([{ days_before: 7, percent: 100 }, { days_before: 2, percent: 50 }]);
  const [categories, setCategories] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<CatalogOptions['locations'] | null>(null);
  const [loc, setLoc] = useState<LocationValue>({ ...emptyLocation });
  const [evLoc, setEvLoc] = useState<{ region?: string; city?: string; address?: string; lat?: number | null; lng?: number | null } | null>(null);
  const [locked, setLocked] = useState(false);
  const [published, setPublished] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [commission, setCommission] = useState(7);

  useEffect(() => {
    eventApi.categories().then(setCategories).catch(() => {});
    api.getCatalog().then((c) => setCatalog(c.locations)).catch(() => {});
  }, []);
  useEffect(() => {
    if (!id) return;
    eventApi.host.overview(id).then((o) => {
      const e = o.event as any;
      setPublished(e.status === 'published'); setLocked((o.stats.orders_paid ?? 0) > 0 || o.stats.votes_total > 0);
      setForm({ ...BLANK, ...Object.fromEntries(Object.keys(BLANK).map((k) => [k, e[k] ?? (BLANK as any)[k]])), starts_at: toLocalInput(e.starts_at), ends_at: toLocalInput(e.ends_at), doors_open_at: toLocalInput(e.doors_open_at), voting_opens_at: toLocalInput(e.voting_opens_at), voting_closes_at: toLocalInput(e.voting_closes_at) } as Form);
      if (Array.isArray(e.refund_tiers) && e.refund_tiers.length) setTiers(e.refund_tiers);
      setEvLoc({ region: e.region, city: e.city, address: e.address, lat: e.latitude != null ? Number(e.latitude) : null, lng: e.longitude != null ? Number(e.longitude) : null });
    }).catch((e) => setError(errText(e)));
  }, [id]);
  useEffect(() => {
    if (!catalog || !evLoc) return;
    const known = catalog.cities.find((c) => c.name.toLowerCase() === (evLoc.city || '').toLowerCase());
    setLoc({ ...emptyLocation, region: known?.region || evLoc.region || '', city: known ? known.name : evLoc.city ? '__other__' : '', cityOther: known ? '' : evLoc.city || '', street: evLoc.address || '', lat: evLoc.lat ?? null, lng: evLoc.lng ?? null });
  }, [catalog, evLoc]);
  useEffect(() => { eventApi.fees().then((f) => setCommission(f.ticket_commission_percent)).catch(() => {}); }, []);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
  const upload = async (e: ChangeEvent<HTMLInputElement>, kind: 'cover' | 'gallery') => {
    const files = Array.from(e.target.files || []); if (!files.length) return;
    setUploading(true); setError('');
    try {
      const urls: string[] = [];
      for (const f of files.slice(0, kind === 'cover' ? 1 : 6)) urls.push((await eventApi.host.upload(f)).url);
      if (kind === 'cover') set('cover_image_url', urls[0]); else set('gallery', [...form.gallery, ...urls].slice(0, 12));
    } catch (err) { setError(errText(err, 'Upload failed')); } finally { setUploading(false); e.target.value = ''; }
  };

  const cityName = loc.city === '__other__' ? loc.cityOther.trim() : loc.city;
  // ── Stepper ────────────────────────────────────────────────────────────────
  type StepKey = 'basics' | 'where' | 'details' | 'tickets' | 'money' | 'voting' | 'review';
  const steps = useMemo(() => ([
    ['basics', 'Basics'], ['where', 'When & where'], ['details', 'Pictures & details'], ...(id ? [] : [['tickets', 'Tickets']]),
    ['money', 'Fees & refunds'], ['voting', 'Voting'], ['review', 'Review'],
  ] as Array<[StepKey, string]>), [id]);
  const [stepIndex, setStepIndex] = useState(0);
  const [reached, setReached] = useState(0);
  const [drafts, setDrafts] = useState<Array<{ name: string; price: string; quantity: string; unlimited: boolean }>>([{ name: 'General admission', price: '', quantity: '', unlimited: true }]);
  const at = (k: StepKey) => steps[stepIndex]?.[0] === k;
  const last = stepIndex === steps.length - 1;

  const validate = (k: StepKey): string => {
    if (k === 'basics') {
      if (form.title.trim().length < 3) return 'Give the event a title (at least 3 characters).';
      if (!form.category) return 'Choose a category.';
      if (form.description.trim().length < 30) return 'Describe the event in at least 30 characters so guests know what to expect.';
    }
    if (k === 'where') {
      if (!published) {
        if (!form.starts_at || !form.ends_at) return 'Set when the event starts and ends.';
        if (new Date(form.ends_at) <= new Date(form.starts_at)) return 'The event must end after it starts.';
        if (!id && new Date(form.starts_at) <= new Date()) return 'The start time must be in the future.';
      }
      if (!form.venue_name.trim()) return 'Enter the venue name.';
      if (!loc.region) return 'Choose the region of the event.';
      if (!cityName) return 'Choose the city or town of the event.';
      if (mapsEnabled && !mapsAuthFailed() && (loc.lat === null || loc.lng === null)) return 'Pin the venue on the map so guests can find it.';
      if (loc.lat !== null && loc.lng !== null && !inGhana(loc.lat, loc.lng)) return 'The map pin is outside Ghana — move it onto the venue.';
    }
    if (k === 'tickets') {
      for (const d of drafts) {
        if (!d.name.trim() && !d.price && !d.quantity) continue;
        if (!d.name.trim()) return 'Give every ticket a name.';
        if (d.price === '' || Number(d.price) < 0) return `Set a price for "${d.name}" (0 for free).`;
        if (!d.unlimited && !(Number(d.quantity) >= 1)) return `Set how many "${d.name}" tickets, or choose unlimited.`;
      }
    }
    if (k === 'money' && form.refund_policy === 'tiers') {
      if (!tiers.length) return 'Add at least one refund tier, or choose "No refunds".';
      if (tiers.some((t) => !(t.days_before >= 0) || !(t.percent >= 0 && t.percent <= 100))) return 'Each refund tier needs days (0 or more) and a percent between 0 and 100.';
    }
    if (k === 'voting' && form.voting_enabled) {
      if (!form.voting_opens_at || !form.voting_closes_at) return 'Set when voting opens and closes.';
      if (new Date(form.voting_closes_at) <= new Date(form.voting_opens_at)) return 'Voting must close after it opens.';
    }
    return '';
  };
  const goTo = (i: number) => { setError(''); setStepIndex(i); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const next = () => {
    const problem = validate(steps[stepIndex][0]);
    if (problem) { setError(problem); return; }
    setReached((r) => Math.max(r, stepIndex + 1)); goTo(stepIndex + 1);
  };
  const jump = (i: number) => {
    if (i === stepIndex) return;
    if (i < stepIndex || id || i <= reached) { goTo(i); return; }
    next();   // moving forward in create mode must pass each step's checks
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!last) { next(); return; }
    for (const [k] of steps) { const problem = validate(k); if (problem) { setError(problem); setStepIndex(steps.findIndex(([x]) => x === k)); return; } }
    setError(''); setBusy(true);
    try {
      const body: Record<string, unknown> = {
        ...form, starts_at: fromLocalInput(form.starts_at), ends_at: fromLocalInput(form.ends_at), doors_open_at: fromLocalInput(form.doors_open_at),
        voting_opens_at: fromLocalInput(form.voting_opens_at), voting_closes_at: fromLocalInput(form.voting_closes_at), refund_tiers: form.refund_policy === 'tiers' ? tiers : [],
        city: cityName, region: loc.region, address: [loc.street.trim(), loc.area.trim()].filter(Boolean).join(', ') || null, latitude: loc.lat, longitude: loc.lng,
      };
      if (published) { delete body.starts_at; delete body.ends_at; }
      if (locked) for (const k of ['fee_mode', 'refund_policy', 'refund_tiers', 'postponement_policy', 'postponement_refund_days']) delete body[k];
      const saved = id ? await eventApi.host.update(id, body) : await eventApi.host.create(body);
      if (!id) {
        const failed: string[] = [];
        for (const d of drafts.filter((x) => x.name.trim())) {
          try { await eventApi.host.addTicketType(saved.id, { name: d.name.trim(), price: Number(d.price || 0), quantity: d.unlimited ? null : Number(d.quantity) }); }
          catch { failed.push(d.name); }
        }
        if (failed.length) window.alert(`Your event was saved, but these tickets could not be added: ${failed.join(', ')}. You can add them on the Tickets tab.`);
      }
      navigate(`/host/events/${saved.id}${id ? '' : '?tab=tickets'}`);
    } catch (err) { setError(errText(err)); window.scrollTo({ top: 0, behavior: 'smooth' }); } finally { setBusy(false); }
  };

  const examplePrice = 100;
  const fee = Math.round(examplePrice * commission) / 100;
  return (
    <section className="host-page host-form-page">
      <Seo title={id ? 'Edit event' : 'Create event'} description="Create an event" noindex />
      <Link className="back-link" to={id ? `/host/events/${id}` : '/host/events'}>← {id ? 'Back to event' : 'Your events'}</Link>
      <PageHeader eyebrow="Events" title={id ? 'Edit event' : 'Create an event'} />
      <ol className="stepper stepper-wide" aria-label="Event setup progress">
        {steps.map(([k, label], i) => (
          <li key={k} className={`step ${i < stepIndex ? 'step-done' : ''} ${i === stepIndex ? 'step-now' : ''}`} aria-current={i === stepIndex ? 'step' : undefined}>
            <button type="button" className="step-btn" onClick={() => jump(i)}><span className="step-dot">{i < stepIndex ? <Check size={14} strokeWidth={3} /> : i + 1}</span><span className="step-label">{label}</span></button>
          </li>))}
      </ol>
      {error && <div className="form-error" role="alert">{error}</div>}
      <form className="listing-form" onSubmit={submit} noValidate>
        {at('basics') && <>
        <h2 className="form-section">The basics</h2>
        <label className="fld">Event title<input required maxLength={120} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Accra Rooftop Sessions Vol. 4" /></label>
        <div className="form-grid">
          <label className="fld">Category<select required value={form.category} onChange={(e) => set('category', e.target.value)}><option value="">Choose…</option>{categories.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="fld">One-line summary <small>shown on cards and in search</small><input maxLength={200} value={form.summary} onChange={(e) => set('summary', e.target.value)} /></label>
        </div>
        <label className="fld">Description<textarea required rows={7} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What is it, who is it for, who's performing or speaking, what should people expect?" /><small>{form.description.length} characters — at least 30</small></label>

        </>}
        {at('where') && <>
        <h2 className="form-section">When</h2>
        <div className="form-grid">
          <label className="fld">Starts<input required type="datetime-local" disabled={published} value={form.starts_at} onChange={(e) => set('starts_at', e.target.value)} /></label>
          <label className="fld">Ends<input required type="datetime-local" disabled={published} value={form.ends_at} onChange={(e) => set('ends_at', e.target.value)} /></label>
          <label className="fld">Doors open <small>optional</small><input type="datetime-local" value={form.doors_open_at} onChange={(e) => set('doors_open_at', e.target.value)} /></label>
        </div>
        {published && <p className="muted-inline">A published event's date moves through <b>Postpone</b> so ticket holders are told and refunds are handled.</p>}

        <h2 className="form-section">Where</h2>
        <label className="fld">Venue name<input required value={form.venue_name} onChange={(e) => set('venue_name', e.target.value)} placeholder="Skybar, Osu" /></label>
        {catalog ? <LocationPicker catalog={catalog} value={loc} onChange={setLoc} /> : <div className="empty-state">Loading places…</div>}
        </>}
        {at('details') && <>
        <h2 className="form-section">Pictures</h2>
        <div className="ev-uploads">
          <div>
            <b>Cover image</b>
            {form.cover_image_url ? <div className="ev-thumb"><img src={form.cover_image_url} alt="Cover" /><button type="button" className="icon-btn" onClick={() => set('cover_image_url', '')} aria-label="Remove cover"><Trash2 size={15} /></button></div>
              : <label className="drop"><ImagePlus size={22} /> {uploading ? 'Uploading…' : 'Add a cover (landscape works best)'}<input hidden type="file" accept="image/*" onChange={(e) => upload(e, 'cover')} /></label>}
          </div>
          <div>
            <b>Gallery <small>optional</small></b>
            <div className="ev-thumbs">{form.gallery.map((u) => <div className="ev-thumb" key={u}><img src={u} alt="" /><button type="button" className="icon-btn" onClick={() => set('gallery', form.gallery.filter((x) => x !== u))} aria-label="Remove"><Trash2 size={15} /></button></div>)}
              {form.gallery.length < 12 && <label className="drop drop-sm"><Plus size={18} /><input hidden multiple type="file" accept="image/*" onChange={(e) => upload(e, 'gallery')} /></label>}</div>
          </div>
        </div>

        <h2 className="form-section">What guests need to know</h2>
        <div className="form-grid">
          <label className="fld">Age limit<input value={form.age_limit} onChange={(e) => set('age_limit', e.target.value)} placeholder="18+" /></label>
          <label className="fld">Dress code<input value={form.dress_code} onChange={(e) => set('dress_code', e.target.value)} placeholder="Smart casual" /></label>
          <label className="fld">Contact phone<input value={form.contact_phone} onChange={(e) => set('contact_phone', e.target.value)} /></label>
          <label className="fld">Contact email<input type="email" value={form.contact_email} onChange={(e) => set('contact_email', e.target.value)} /></label>
        </div>
        <label className="fld">Entry rules <small>bags, re-entry, ID, what's banned…</small><textarea rows={3} value={form.entry_rules} onChange={(e) => set('entry_rules', e.target.value)} /></label>
        <label className="fld">Your terms <small>shown to buyers before they pay</small><textarea rows={3} value={form.terms} onChange={(e) => set('terms', e.target.value)} /></label>
        <label className="fld">Most tickets per order<input type="number" min={1} max={50} value={form.max_tickets_per_order} onChange={(e) => set('max_tickets_per_order', Number(e.target.value))} /></label>

        </>}
        {at('tickets') && <>
        <h2 className="form-section">Tickets</h2>
        <p className="muted-inline">Add the ticket types guests can buy. Prices are in cedis — use 0 for free tickets (they skip payment but still count towards capacity and are scanned at the gate). You can add more, change them or set sales dates later on the Tickets tab.</p>
        <div className="ev-drafts">
          {drafts.map((d, i) => (
            <div className="ev-draft" key={i}>
              <label className="fld">Ticket name<input value={d.name} onChange={(e) => setDrafts(drafts.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="Regular, VIP, Early bird…" /></label>
              <label className="fld">Price (GH₵)<input type="number" min={0} step="0.01" value={d.price} onChange={(e) => setDrafts(drafts.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} placeholder="0 = free" /></label>
              <label className="fld">How many{!d.unlimited ? <input type="number" min={1} value={d.quantity} onChange={(e) => setDrafts(drafts.map((x, j) => j === i ? { ...x, quantity: e.target.value } : x))} /> : <input disabled value="Unlimited" />}<span className="check"><input type="checkbox" checked={d.unlimited} onChange={(e) => setDrafts(drafts.map((x, j) => j === i ? { ...x, unlimited: e.target.checked } : x))} /> Unlimited</span></label>
              {drafts.length > 1 && <button type="button" className="icon-btn" aria-label="Remove ticket" onClick={() => setDrafts(drafts.filter((_, j) => j !== i))}><Trash2 size={16} /></button>}
            </div>))}
        </div>
        <button type="button" className="button button-secondary" onClick={() => setDrafts([...drafts, { name: '', price: '', quantity: '', unlimited: true }])}><Plus size={15} /> Add another ticket type</button>
        </>}
        {at('money') && <>
        <h2 className="form-section">Lotnis fee</h2>
        {locked && <div className="notice"><span>Fees and refund rules are locked because tickets have been sold — buyers agreed to them.</span></div>}
        <div className="policy-options">
          {([['included', 'Take it from my price', `Buyers pay exactly the price you list. On a GH₵${examplePrice} ticket, Lotnis keeps GH₵${fee.toFixed(2)} and you receive GH₵${(examplePrice - fee).toFixed(2)}.`], ['on_top', 'Add it on top for buyers', `Buyers pay the price plus Lotnis's ${commission}% service fee. On a GH₵${examplePrice} ticket they pay GH₵${(examplePrice + fee).toFixed(2)} and you receive the full GH₵${examplePrice}.`]] as const).map(([v, t, d]) => (
            <label key={v} className={`policy-option ${form.fee_mode === v ? 'policy-selected' : ''}`}><input type="radio" name="fee" disabled={locked} checked={form.fee_mode === v} onChange={() => set('fee_mode', v)} /><span><b>{t}</b><small>{d}</small></span></label>))}
        </div>
        <p className="muted-inline">Lotnis's commission is {commission}% of the ticket price either way. Card / mobile-money processing fees are always added to the buyer's total, never taken from you.</p>

        <h2 className="form-section">Refunds</h2>
        <div className="policy-options">
          <label className={`policy-option ${form.refund_policy === 'none' ? 'policy-selected' : ''}`}><input type="radio" name="refund" disabled={locked} checked={form.refund_policy === 'none'} onChange={() => set('refund_policy', 'none')} /><span><b>No refunds</b><small>Buyers are only refunded if you cancel the event.</small></span></label>
          <label className={`policy-option ${form.refund_policy === 'tiers' ? 'policy-selected' : ''}`}><input type="radio" name="refund" disabled={locked} checked={form.refund_policy === 'tiers'} onChange={() => set('refund_policy', 'tiers')} /><span><b>Refundable until a deadline</b><small>The closer to the event, the smaller the refund.</small></span></label>
        </div>
        {form.refund_policy === 'tiers' && <div className="ev-tiers">
          {tiers.map((t, i) => (
            <div className="ev-tier" key={i}>
              <label className="fld">If cancelled at least<div className="ev-inline"><input type="number" min={0} disabled={locked} value={t.days_before} onChange={(e) => setTiers(tiers.map((x, j) => j === i ? { ...x, days_before: Number(e.target.value) } : x))} /> days before</div></label>
              <label className="fld">Refund<div className="ev-inline"><input type="number" min={0} max={100} disabled={locked} value={t.percent} onChange={(e) => setTiers(tiers.map((x, j) => j === i ? { ...x, percent: Number(e.target.value) } : x))} /> %</div></label>
              {!locked && <button type="button" className="icon-btn" onClick={() => setTiers(tiers.filter((_, j) => j !== i))} aria-label="Remove tier"><Trash2 size={15} /></button>}
            </div>))}
          {!locked && <button type="button" className="button button-quiet" onClick={() => setTiers([...tiers, { days_before: 1, percent: 25 }])}><Plus size={15} /> Add a tier</button>}
          <p className="muted-inline">Closer to the event than your last tier: no refund. Cancelled events are always refunded in full.</p>
        </div>}

        <h2 className="form-section">If you postpone</h2>
        <div className="policy-options">
          {([['carry_over', 'Tickets carry over', 'Tickets stay valid for the new date. No refunds because of the postponement.'], ['carry_over_or_refund', 'Carry over, or refund if they ask', 'Tickets carry over, but buyers can claim a full refund for a set number of days after the new date is announced.'], ['refund_all', 'Refund everyone', 'Every ticket is refunded in full automatically.']] as const).map(([v, t, d]) => (
            <label key={v} className={`policy-option ${form.postponement_policy === v ? 'policy-selected' : ''}`}><input type="radio" name="post" disabled={locked} checked={form.postponement_policy === v} onChange={() => set('postponement_policy', v)} /><span><b>{t}</b><small>{d}</small></span></label>))}
        </div>
        {form.postponement_policy === 'carry_over_or_refund' && <label className="fld">Refund window<div className="ev-inline"><input type="number" min={1} max={60} disabled={locked} value={form.postponement_refund_days} onChange={(e) => set('postponement_refund_days', Number(e.target.value))} /> days</div></label>}

        </>}
        {at('voting') && <>
        <h2 className="form-section">Voting <small>(optional)</small></h2>
        <label className="check"><input type="checkbox" checked={form.voting_enabled} onChange={(e) => {
          const on = e.target.checked;
          // Starting point: voting opens right now and runs until the event ends. Change either below.
          setForm((f) => ({ ...f, voting_enabled: on, ...(on ? { voting_opens_at: f.voting_opens_at || toLocalInput(new Date().toISOString()), voting_closes_at: f.voting_closes_at || f.ends_at } : {}) }));
        }} /> This event has paid voting (awards, pageants, best-of…)</label>
        {form.voting_enabled && <>
          <div className="form-grid">
            <label className="fld">Voting opens <small>starts as soon as this time passes and the event is published</small><input type="datetime-local" value={form.voting_opens_at} onChange={(e) => set('voting_opens_at', e.target.value)} /></label>
            <label className="fld">Voting closes<input type="datetime-local" value={form.voting_closes_at} onChange={(e) => set('voting_closes_at', e.target.value)} /></label>
          </div>
          <label className="check"><input type="checkbox" checked={form.show_vote_counts} onChange={(e) => set('show_vote_counts', e.target.checked)} /> Show live vote counts to the public <small>(off = hidden until voting closes)</small></label>
          <p className="muted-inline">You'll add categories, nominees and the price per vote after saving.</p>
        </>}

        </>}
        {at('review') && <>
        <h2 className="form-section">Check everything</h2>
        <div className="ev-review-sum">
          {[
            ['Event', `${form.title} · ${form.category}`],
            ['When', form.starts_at && form.ends_at ? `${fmtDateTime(fromLocalInput(form.starts_at)!)} → ${fmtDateTime(fromLocalInput(form.ends_at)!)}` : '—'],
            ['Where', `${form.venue_name}, ${[loc.street, cityName].filter(Boolean).join(', ')}${loc.lat !== null ? ' · pinned on the map' : ''}`],
            ['Cover image', form.cover_image_url ? 'Added' : 'Not added — you need one before you can submit for review'],
            ...(!id ? [['Tickets', drafts.filter((d) => d.name.trim()).map((d) => `${d.name} (${Number(d.price || 0) === 0 ? 'free' : `GH₵${Number(d.price)}`}, ${d.unlimited ? 'unlimited' : d.quantity})`).join(' · ') || 'None yet — add them next']] : []),
            ['Lotnis fee', form.fee_mode === 'included' ? `Taken from your price (${commission}%)` : `Added on top for buyers (${commission}%)`],
            ['Refunds', form.refund_policy === 'none' ? 'No refunds (except if you cancel)' : tiers.map((t) => `${t.days_before}+ days before: ${t.percent}%`).join(' · ')],
            ['If postponed', { carry_over: 'Tickets carry over', carry_over_or_refund: `Carry over, or refund within ${form.postponement_refund_days} days`, refund_all: 'Refund everyone' }[form.postponement_policy]],
            ['Voting', form.voting_enabled ? `On — ${fmtDateTime(fromLocalInput(form.voting_opens_at) || new Date().toISOString())} → ${fmtDateTime(fromLocalInput(form.voting_closes_at) || new Date().toISOString())}` : 'Off'],
          ].map(([k, v]) => <div key={k as string}><span>{k}</span><b>{v}</b></div>)}
        </div>
        <p className="muted-inline">{id ? 'Saving keeps your event as it is.' : "We'll save this as a draft. Next you'll add gates and submit it for review — guests can't see it until then."}</p>
        </>}
        <div className="form-actions ev-stepnav">
          {stepIndex === 0 ? <Link className="button button-quiet" to={id ? `/host/events/${id}` : '/host/events'}>Cancel</Link> : <button type="button" className="button button-quiet" onClick={() => goTo(stepIndex - 1)}>← Back</button>}
          <span className="muted-inline">Step {stepIndex + 1} of {steps.length}</span>
          {last ? <button className="button button-primary" disabled={busy || uploading}>{busy ? 'Saving…' : id ? 'Save changes' : 'Save draft & continue'} <ArrowRight size={16} /></button>
            : <button type="button" className="button button-primary" onClick={next} disabled={uploading}>Continue <ArrowRight size={16} /></button>}
        </div>
      </form>
    </section>
  );
}

// ── Manage one event ──────────────────────────────────────────────────────────
