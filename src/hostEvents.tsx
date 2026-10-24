import { ChangeEvent, FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Ban, CalendarClock, Check, Copy, Download, ImagePlus, KeyRound, Link2, Plus, QrCode, RefreshCw, Send, Star, Trash2, Trophy, Wallet } from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from './api';
import { cedis, EventStatusPill, fmtDate, fmtDateTime, fromLocalInput, TicketStatusPill, toLocalInput } from './eventUi';
import { eventApi, GateRow, HostEventOverview, PayoutBucket, PayoutItem, PayoutSummary, RefundTier } from './eventApi';
import { Seo } from './seo';
import { ConfirmDialog, FieldDialog } from './dialogs';
import { emptyLocation, LocationPicker, type LocationValue } from './locationPicker';
import { mapsAuthFailed, mapsEnabled } from './maps';
import { inGhana } from './places';
import type { CatalogOptions } from './types';
import { categoryPath, clientVotingState, nomineePath, ShareBar, shareText, votingMessage } from './voting';

const errText = (e: unknown, fallback = 'Something went wrong') => (e instanceof Error ? e.message : fallback);
const PageHeader = ({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) => (
  <div className="host-page-head"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1></div>{children}</div>
);
const copy = (text: string) => navigator.clipboard?.writeText(text).catch(() => {});

// ── Event list ────────────────────────────────────────────────────────────────

export function HostEvents() {
  const [events, setEvents] = useState<Array<Record<string, any>> | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { eventApi.host.list().then(setEvents).catch((e) => setError(errText(e))); }, []);
  return (
    <section className="host-page">
      <PageHeader eyebrow="Events" title="Your events">
        <Link className="button button-primary" to="/host/events/new">Create an event <ArrowRight size={16} /></Link>
      </PageHeader>
      {error ? <div className="error-state">{error}</div> : !events ? <div className="empty-state">Loading…</div> : events.length ? (
        <div className="space-list">{events.map((e) => (
          <Link key={e.id} to={`/host/events/${e.id}`} className="space-row ev-hostrow">
            <div><strong>{e.title}</strong><p>{fmtDateTime(e.starts_at)} · {e.venue_name}, {e.city}</p>
              <small>{e.stats.tickets_sold} sold · {e.stats.tickets_scanned} scanned · {cedis(e.stats.gross, e.currency)} gross{e.stats.votes_total ? ` · ${e.stats.votes_total.toLocaleString()} votes` : ''}{e.stats.refund_requests_pending ? ` · ${e.stats.refund_requests_pending} refund request(s)` : ''}</small></div>
            <EventStatusPill status={e.status} />
            <span className="button button-secondary">Manage</span>
          </Link>))}</div>
      ) : <div className="empty-state"><CalendarClock size={28} /><p>You haven't created an event yet.</p><Link className="button button-secondary" to="/host/events/new">Create your first event</Link></div>}
    </section>
  );
}

// ── Create / edit form ────────────────────────────────────────────────────────

const BLANK = {
  title: '', category: '', summary: '', description: '', venue_name: '', address: '', city: '', region: '', starts_at: '', ends_at: '', doors_open_at: '',
  age_limit: '', dress_code: '', entry_rules: '', terms: '', contact_phone: '', contact_email: '', cover_image_url: '', gallery: [] as string[],
  fee_mode: 'included', max_tickets_per_order: 10, refund_policy: 'none', postponement_policy: 'carry_over_or_refund', postponement_refund_days: 7,
  voting_enabled: false, voting_opens_at: '', voting_closes_at: '', show_vote_counts: true,
};
type Form = typeof BLANK;

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
      <ol className="bk-progress ev-steps" aria-label="Event setup progress">
        {steps.map(([k, label], i) => (
          <li key={k} className={`bk-step ${i < stepIndex ? 'bk-done' : ''} ${i === stepIndex ? 'bk-now' : ''}`} aria-current={i === stepIndex ? 'step' : undefined}>
            <button type="button" className="ev-step-btn" onClick={() => jump(i)}><span className="bk-dot">{i < stepIndex ? <Check size={14} strokeWidth={3} /> : i + 1}</span><span className="bk-label">{label}</span></button>
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
              : <label className="ev-drop"><ImagePlus size={22} /> {uploading ? 'Uploading…' : 'Add a cover (landscape works best)'}<input hidden type="file" accept="image/*" onChange={(e) => upload(e, 'cover')} /></label>}
          </div>
          <div>
            <b>Gallery <small>optional</small></b>
            <div className="ev-thumbs">{form.gallery.map((u) => <div className="ev-thumb" key={u}><img src={u} alt="" /><button type="button" className="icon-btn" onClick={() => set('gallery', form.gallery.filter((x) => x !== u))} aria-label="Remove"><Trash2 size={15} /></button></div>)}
              {form.gallery.length < 12 && <label className="ev-drop ev-drop-sm"><Plus size={18} /><input hidden multiple type="file" accept="image/*" onChange={(e) => upload(e, 'gallery')} /></label>}</div>
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

const TABS = ['overview', 'tickets', 'gates', 'attendees', 'orders', 'voting', 'reviews', 'refunds', 'payout'] as const;
type TabKey = typeof TABS[number];
const TAB_LABEL: Record<TabKey, string> = { overview: 'Overview', tickets: 'Tickets', gates: 'Gates', attendees: 'Attendees', orders: 'Orders', voting: 'Voting', reviews: 'Reviews', refunds: 'Refunds', payout: 'Payout' };

export function HostEventManage() {
  const { id = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = (TABS.includes(params.get('tab') as TabKey) ? params.get('tab') : 'overview') as TabKey;
  const [data, setData] = useState<HostEventOverview | null>(null);
  const [error, setError] = useState('');
  const reload = useCallback(() => eventApi.host.overview(id).then((d) => { setData(d); setError(''); }).catch((e) => setError(errText(e))), [id]);
  useEffect(() => { reload(); }, [reload]);
  if (error) return <section className="host-page"><Link className="back-link" to="/host/events">← Your events</Link><div className="error-state">{error}</div></section>;
  if (!data) return <section className="host-page"><div className="empty-state">Loading…</div></section>;
  const ev = data.event;
  const tabs = TABS.filter((t) => t !== 'voting' || ev.voting_enabled);
  return (
    <section className="host-page ev-manage">
      <Seo title={ev.title} description="Manage event" noindex />
      <Link className="back-link" to="/host/events">← Your events</Link>
      <PageHeader eyebrow="Event" title={ev.title}>
        <div className="form-actions"><EventStatusPill status={ev.status} />{ev.status === 'published' && <Link className="button button-secondary" to={`/events/${ev.slug}`}>View public page</Link>}{['draft', 'rejected', 'pending_review', 'published'].includes(ev.status) && <Link className="button button-quiet" to={`/host/events/${ev.id}/edit`}>Edit</Link>}</div>
      </PageHeader>
      <p className="muted-inline">{fmtDateTime(ev.starts_at)} → {fmtDateTime(ev.ends_at)} · {ev.venue_name}, {ev.city}</p>
      <StatusBanner data={data} reload={reload} />
      <div className="ev-tabs ev-tabs-host" role="tablist">{tabs.map((t) => <button key={t} role="tab" aria-selected={tab === t} className={`ev-tab ${tab === t ? 'ev-tab-on' : ''}`} onClick={() => setParams({ tab: t }, { replace: true })}>{TAB_LABEL[t]}{t === 'refunds' && data.stats.refund_requests_pending ? <em className="host-link-badge">{data.stats.refund_requests_pending}</em> : null}</button>)}</div>
      {tab === 'overview' && <Overview data={data} reload={reload} />}
      {tab === 'tickets' && <TicketsTab data={data} reload={reload} />}
      {tab === 'gates' && <GatesTab data={data} />}
      {tab === 'attendees' && <AttendeesTab id={id} />}
      {tab === 'orders' && <OrdersTab id={id} currency={ev.currency} />}
      {tab === 'voting' && <VotingTab data={data} reload={reload} />}
      {tab === 'reviews' && <ReviewsTab id={id} />}
      {tab === 'refunds' && <RefundsTab id={id} currency={ev.currency} />}
      {tab === 'payout' && <PayoutTab data={data} />}
    </section>
  );
}

function StatusBanner({ data, reload }: { data: HostEventOverview; reload: () => void }) {
  const ev = data.event; const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(''); const [missing, setMissing] = useState(false);
  const submit = async () => {
    setBusy(true); setMsg(''); setMissing(false);
    try { const r = await eventApi.host.submit(ev.id); setMsg(r.auto_published ? 'Your event is live.' : 'Submitted — we usually review within a day.'); reload(); }
    catch (e) { setMsg(errText(e)); setMissing(true); } finally { setBusy(false); }
  };
  if (ev.status === 'draft' || ev.status === 'rejected') return (
    <div className={`bk-callout ${ev.status === 'rejected' ? 'bk-callout-warm' : ''}`}><Send size={22} /><div>
      <b>{ev.status === 'rejected' ? 'Changes needed' : 'This event is a draft'}</b>
      <p>{ev.status === 'rejected' ? ev.rejection_reason : 'Add your tickets (and gates), then send it for review. Guests can\'t see it yet.'}</p>
      {msg && <div className={missing ? 'form-error' : 'notice notice-ok'}><span>{msg}</span></div>}
      <button className="button button-primary" disabled={busy} onClick={submit}>{busy ? 'Submitting…' : 'Submit for review'}</button></div></div>
  );
  if (ev.status === 'pending_review') return <div className="bk-callout"><CalendarClock size={22} /><div><b>In review</b><p>We'll email you when it's approved. You can keep adding tickets and gates meanwhile.</p></div></div>;
  if (ev.status === 'suspended') return <div className="bk-callout bk-callout-warm"><Ban size={22} /><div><b>Paused by Lotnis</b><p>{ev.rejection_reason}. Sales are stopped — contact support to resolve it.</p></div></div>;
  if (ev.status === 'cancelled') return <div className="bk-callout ev-banner-bad"><Ban size={22} /><div><b>Cancelled</b><p>{ev.cancellation_reason}</p></div></div>;
  return null;
}

const Stat = ({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) => <div><span>{label}</span><strong>{value}</strong>{sub && <small>{sub}</small>}</div>;

function Overview({ data, reload }: { data: HostEventOverview; reload: () => void }) {
  const { stats, event: ev, payout } = data; const c = ev.currency;
  const [modal, setModal] = useState<'cancel' | 'postpone' | null>(null);
  const maxHour = Math.max(1, ...stats.scans_by_hour.map((h) => h.count));
  const gross = stats.ticket_gross + stats.vote_gross;
  return (
    <>
      <div className="metric-grid metric-grid-4">
        <Stat label="Tickets sold" value={stats.tickets_sold.toLocaleString()} sub={`${stats.orders_paid} orders`} />
        <Stat label="Scanned in" value={stats.tickets_scanned.toLocaleString()} sub={stats.tickets_sold ? `${Math.round((stats.tickets_scanned / stats.tickets_sold) * 100)}% of sold` : undefined} />
        <Stat label="Revenue" value={cedis(gross, c)} sub="tickets + votes, before Lotnis's fee" />
        <Stat label="You'll receive" value={cedis(stats.ticket_host_net + stats.vote_host_net, c)} sub={`after ${cedis(stats.ticket_commission + stats.vote_commission, c)} Lotnis fee`} />
        <Stat label="Refunded" value={cedis(stats.refunded_amount, c)} sub={`${stats.tickets_refunded} ticket(s)`} />
        {ev.voting_enabled && <Stat label="Votes" value={stats.votes_total.toLocaleString()} sub={cedis(stats.vote_gross, c)} />}
        <Stat label="Reviews" value={stats.review_count ? `${stats.review_average} ★` : '—'} sub={`${stats.review_count} verified`} />
        <Stat label="Refund requests" value={stats.refund_requests_pending} sub="waiting for Lotnis" />
      </div>
      <h2 className="subsection-heading">Sales by ticket</h2>
      <div className="ev-bars">{stats.by_ticket_type.map((t) => { const cap = t.quantity ?? Math.max(t.sold, 1); return (
        <div key={t.id} className="ev-barrow"><span>{t.name} <small>{cedis(t.price, c)}</small></span><div className="ev-bar ev-bar-lg"><i style={{ width: `${Math.min(100, (t.sold / cap) * 100)}%` }} /><i className="ev-bar-scan" style={{ width: `${Math.min(100, (t.scanned / cap) * 100)}%` }} /></div><b>{t.sold}{t.quantity != null ? ` / ${t.quantity}` : ' sold'}</b><small>{t.scanned} scanned{t.refunded ? ` · ${t.refunded} refunded` : ''}</small></div>); })}</div>
      {stats.by_gate.length > 0 && <><h2 className="subsection-heading">Gates</h2>
        <div className="booking-list">{stats.by_gate.map((g) => <div className="booking-row" key={g.id}><div><strong>{g.name}</strong><p>{g.last_used_at ? `Last scan ${fmtDateTime(g.last_used_at)}` : 'No scans yet'}</p></div><span><b>{g.admitted}</b> admitted</span><span className={g.rejected ? 'ev-warn' : ''}>{g.rejected} rejected</span></div>)}</div></>}
      {stats.scans_by_hour.length > 0 && <><h2 className="subsection-heading">Entry by hour</h2><div className="ev-hours">{stats.scans_by_hour.map((h) => <div key={h.hour} title={`${h.count} at ${fmtDateTime(h.hour)}`}><i style={{ height: `${(h.count / maxHour) * 100}%` }} /><small>{new Date(h.hour).toLocaleTimeString('en-GH', { hour: 'numeric', timeZone: 'Africa/Accra' })}</small></div>)}</div></>}
      {Object.keys(stats.scan_results).length > 0 && <p className="muted-inline">Scan results: {Object.entries(stats.scan_results).map(([k, v]) => `${k.replace('_', ' ')} ${v}`).join(' · ')}</p>}
      <h2 className="subsection-heading">Payout</h2>
      <p className="muted-inline">You're paid after the event{payout.next_release_at ? ` — next release ${fmtDateTime(payout.next_release_at)}` : ''}. <Link to="/host/earnings">All your earnings</Link></p>
      <div className="metric-grid metric-grid-4"><Stat label="Waiting for release" value={cedis(payout.awaiting_release, c)} /><Stat label="Ready to send" value={cedis(payout.due, c)} /><Stat label="On hold" value={cedis(payout.on_hold, c)} /><Stat label="Paid out" value={cedis(payout.paid, c)} /></div>
      {['published', 'suspended'].includes(ev.status) && <div className="form-actions ev-danger">
        <button className="button button-quiet" onClick={() => setModal('postpone')}><CalendarClock size={16} /> Postpone</button>
        <button className="button button-danger" onClick={() => setModal('cancel')}><Ban size={16} /> Cancel event</button></div>}
      {modal === 'cancel' && <CancelDialog ev={ev} onClose={() => setModal(null)} onDone={reload} />}
      {modal === 'postpone' && <PostponeDialog ev={ev} onClose={() => setModal(null)} onDone={reload} />}
    </>
  );
}

function CancelDialog({ ev, onClose, onDone }: { ev: any; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const go = async () => { setBusy(true); try { await eventApi.host.cancel(ev.id, reason); onDone(); onClose(); } catch (e) { setError(errText(e)); } finally { setBusy(false); } };
  return (
    <div className="ev-modal" role="dialog" aria-modal="true"><div className="ev-modal-card">
      <h2>Cancel "{ev.title}"?</h2>
      <p>Every ticket and vote is refunded in full (the payment-processing fee is not refundable), buyers are emailed, and the event comes off sale. This can't be undone.</p>
      <label className="fld">Reason — guests will see this<textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} /></label>
      {error && <div className="form-error">{error}</div>}
      <div className="form-actions"><button className="button button-quiet" onClick={onClose}>Keep event</button><button className="button button-danger" disabled={busy || !reason.trim()} onClick={go}>{busy ? 'Cancelling…' : 'Cancel and refund everyone'}</button></div>
    </div></div>
  );
}

function PostponeDialog({ ev, onClose, onDone }: { ev: any; onClose: () => void; onDone: () => void }) {
  const [s, setS] = useState(''); const [e, setE] = useState(''); const [reason, setReason] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const what = ev.postponement_policy === 'refund_all' ? 'Every ticket will be refunded in full automatically.' : ev.postponement_policy === 'carry_over' ? 'Tickets stay valid for the new date.' : `Tickets stay valid, and buyers can ask for a full refund for ${ev.postponement_refund_days} days.`;
  const go = async () => { setBusy(true); try { await eventApi.host.postpone(ev.id, { starts_at: fromLocalInput(s)!, ends_at: fromLocalInput(e)!, reason }); onDone(); onClose(); } catch (err) { setError(errText(err)); } finally { setBusy(false); } };
  return (
    <div className="ev-modal" role="dialog" aria-modal="true"><div className="ev-modal-card">
      <h2>Postpone "{ev.title}"</h2>
      <p>{what} Everyone who bought is emailed the new date. Your payout moves to the new date too.</p>
      <div className="two"><label className="fld">New start<input type="datetime-local" value={s} onChange={(x) => setS(x.target.value)} /></label><label className="fld">New end<input type="datetime-local" value={e} onChange={(x) => setE(x.target.value)} /></label></div>
      <label className="fld">Why <small>optional</small><input value={reason} onChange={(x) => setReason(x.target.value)} /></label>
      {error && <div className="form-error">{error}</div>}
      <div className="form-actions"><button className="button button-quiet" onClick={onClose}>Never mind</button><button className="button button-primary" disabled={busy || !s || !e} onClick={go}>{busy ? 'Postponing…' : 'Postpone event'}</button></div>
    </div></div>
  );
}

// ── Tickets tab ───────────────────────────────────────────────────────────────

function TicketsTab({ data, reload }: { data: HostEventOverview; reload: () => void }) {
  const ev = data.event; const [editing, setEditing] = useState<any | 'new' | null>(null); const [error, setError] = useState('');
  const [dialog, setDialog] = useState<ReactNode>(null);
  const remove = (t: any) => setDialog(<ConfirmDialog title={t.sold ? `Switch off “${t.name}”?` : `Delete “${t.name}”?`} body={t.sold ? 'It already has sales, so it will be switched off (no new sales) rather than deleted.' : 'This ticket type will be deleted.'} confirmLabel={t.sold ? 'Switch off' : 'Delete'} danger onConfirm={async () => { await eventApi.host.removeTicketType(t.id); setDialog(null); reload(); }} onClose={() => setDialog(null)} />);
  return (
    <>
      <div className="host-page-head"><h2>Ticket types</h2><button className="button button-primary" onClick={() => setEditing('new')}><Plus size={16} /> Add ticket type</button></div>
      <p className="muted-inline">Prices are in cedis. Set a quantity, or leave it unlimited. Free tickets skip payment but still count towards capacity and are scanned at the gate.</p>
      {error && <div className="form-error">{error}</div>}
      <div className="booking-list">{data.ticket_types.length ? data.ticket_types.map((t) => (
        <div className="booking-row" key={t.id}>
          <div><strong>{t.name} {!t.is_active && <span className="pill">Off</span>}</strong><p>{t.description || ''}{t.sales_end ? ` Sales close ${fmtDateTime(t.sales_end)}.` : ''}</p><small>{t.sold} sold{t.reserved ? ` · ${t.reserved} held in checkouts` : ''} · {t.quantity == null ? 'unlimited' : `${Math.max(0, t.quantity - t.sold - t.reserved)} left of ${t.quantity}`}</small></div>
          <strong>{Number(t.price) === 0 ? 'Free' : cedis(Number(t.price), ev.currency)}</strong>
          <div className="form-actions"><button className="button button-secondary" onClick={() => setEditing(t)}>Edit</button><button className="icon-btn" onClick={() => remove(t)} aria-label="Delete ticket type"><Trash2 size={16} /></button></div>
        </div>)) : <div className="empty-state">No tickets yet — add your first ticket type.</div>}</div>
      {dialog}
      {editing && <TicketTypeDialog eventId={ev.id} ticket={editing === 'new' ? null : editing} currency={ev.currency} onClose={() => setEditing(null)} onDone={() => { setEditing(null); reload(); }} />}
    </>
  );
}

function TicketTypeDialog({ eventId, ticket, onClose, onDone }: { eventId: string; ticket: any | null; currency: string; onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({
    name: ticket?.name ?? '', description: ticket?.description ?? '', price: ticket ? String(ticket.price) : '', unlimited: ticket ? ticket.quantity == null : false, quantity: ticket?.quantity != null ? String(ticket.quantity) : '',
    sales_start: toLocalInput(ticket?.sales_start), sales_end: toLocalInput(ticket?.sales_end), min_per_order: ticket?.min_per_order ?? 1, max_per_order: ticket?.max_per_order ?? 10, is_active: ticket?.is_active ?? true,
  });
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const save = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setError('');
    const body = { name: f.name, description: f.description, price: Number(f.price || 0), quantity: f.unlimited ? null : Number(f.quantity), sales_start: fromLocalInput(f.sales_start), sales_end: fromLocalInput(f.sales_end), min_per_order: f.min_per_order, max_per_order: f.max_per_order, is_active: f.is_active };
    try { if (ticket) await eventApi.host.updateTicketType(ticket.id, body); else await eventApi.host.addTicketType(eventId, body); onDone(); } catch (err) { setError(errText(err)); } finally { setBusy(false); }
  };
  return (
    <div className="ev-modal" role="dialog" aria-modal="true"><form className="ev-modal-card" onSubmit={save}>
      <h2>{ticket ? 'Edit ticket' : 'New ticket type'}</h2>
      <label className="fld">Name<input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Regular, VIP, Early bird, Table for 6…" /></label>
      <label className="fld">What's included <small>optional</small><input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>
      <div className="two">
        <label className="fld">Price (GH₵)<input required type="number" min={0} step="0.01" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} placeholder="0 for free" /></label>
        <label className="fld">How many{!f.unlimited && <input required type="number" min={1} value={f.quantity} onChange={(e) => setF({ ...f, quantity: e.target.value })} />}<span className="check"><input type="checkbox" checked={f.unlimited} onChange={(e) => setF({ ...f, unlimited: e.target.checked })} /> Unlimited</span></label>
      </div>
      <div className="two"><label className="fld">Sales open <small>optional</small><input type="datetime-local" value={f.sales_start} onChange={(e) => setF({ ...f, sales_start: e.target.value })} /></label><label className="fld">Sales close <small>optional</small><input type="datetime-local" value={f.sales_end} onChange={(e) => setF({ ...f, sales_end: e.target.value })} /></label></div>
      <div className="two"><label className="fld">Min per order<input type="number" min={1} value={f.min_per_order} onChange={(e) => setF({ ...f, min_per_order: Number(e.target.value) })} /></label><label className="fld">Max per order<input type="number" min={1} max={50} value={f.max_per_order} onChange={(e) => setF({ ...f, max_per_order: Number(e.target.value) })} /></label></div>
      {ticket && <label className="check"><input type="checkbox" checked={f.is_active} onChange={(e) => setF({ ...f, is_active: e.target.checked })} /> On sale</label>}
      {error && <div className="form-error">{error}</div>}
      <div className="form-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? 'Saving…' : 'Save ticket'}</button></div>
    </form></div>
  );
}

// ── Gates tab ─────────────────────────────────────────────────────────────────

function GatesTab({ data }: { data: HostEventOverview }) {
  const id = data.event.id;
  const [gates, setGates] = useState<GateRow[] | null>(null);
  const [form, setForm] = useState({ name: '', pin: '', assigned_to: '', send_to: '' });
  const [fresh, setFresh] = useState<{ name: string; link: string; pin?: string; emailed: boolean } | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const load = useCallback(() => eventApi.host.gates(id).then(setGates).catch((e) => setError(errText(e))), [id]);
  useEffect(() => { load(); }, [load]);
  const add = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setError('');
    try { const r = await eventApi.host.addGate(id, { name: form.name, pin: form.pin || undefined, assigned_to: form.assigned_to || undefined, send_to: form.send_to || undefined }); setFresh({ name: form.name, link: r.link, pin: form.pin || undefined, emailed: r.emailed }); setForm({ name: '', pin: '', assigned_to: '', send_to: '' }); load(); }
    catch (err) { setError(errText(err)); } finally { setBusy(false); }
  };
  const [dialog, setDialog] = useState<ReactNode>(null);
  const regen = (g: GateRow) => setDialog(<FieldDialog title={`New link for ${g.name}`} intro="The old link stops working immediately. You can email the new one to the person scanning." fields={[{ name: 'send_to', label: 'Email the new link to', type: 'email', hint: 'optional' }]} submitLabel="Create new link"
    onSubmit={async (v) => { const r = await eventApi.host.regenerateGate(g.id, { send_to: String(v.send_to) || undefined }); setFresh({ name: g.name, link: r.link, emailed: r.emailed }); setDialog(null); load(); }} onClose={() => setDialog(null)} />);
  const toggle = async (g: GateRow) => { try { await eventApi.host.updateGate(g.id, { is_active: !g.is_active }); load(); } catch (err) { setError(errText(err)); } };
  const setPin = (g: GateRow) => setDialog(<FieldDialog title={g.has_pin ? `Change PIN for ${g.name}` : `Set a PIN for ${g.name}`} intro="A PIN is a second lock: the scanner needs the link and the PIN. Give it to the person separately." fields={[{ name: 'pin', label: 'PIN', type: 'text', hint: g.has_pin ? '4–10 letters or numbers — leave empty to remove the PIN' : '4–10 letters or numbers', maxLength: 10 }]} submitLabel="Save PIN"
    onSubmit={async (v) => { await eventApi.host.updateGate(g.id, { pin: String(v.pin).trim() }); setDialog(null); load(); }} onClose={() => setDialog(null)} />);
  const remove = (g: GateRow) => setDialog(<ConfirmDialog title={`Remove ${g.name}?`} body="Its link stops working. If it has scan history it is switched off instead of deleted." confirmLabel="Remove" danger onConfirm={async () => { await eventApi.host.removeGate(g.id); setDialog(null); load(); }} onClose={() => setDialog(null)} />);
  return (
    <>
      <h2>Gates &amp; scanners</h2>
      <p className="muted-inline">Name each entrance (Gate 1, VIP door…) and give it to the person scanning. They open a private link on their phone — no account — and see the gate name and a scanner. Add a PIN as a second lock and give it to them separately.</p>
      {error && <div className="form-error">{error}</div>}
      {fresh && <div className="bk-callout"><Link2 size={22} /><div><b>{fresh.name} is ready</b><p>This link is shown once — copy it now{fresh.emailed ? ' (we also emailed it)' : ''}.</p>
        <div className="ev-linkbox"><code>{fresh.link}</code><button className="button button-secondary" onClick={() => copy(fresh.link)}><Copy size={15} /> Copy</button></div>
        {fresh.pin && <p>PIN: <code>{fresh.pin}</code> — share it separately.</p>}
        <button className="button button-quiet" onClick={() => setFresh(null)}>Done</button></div></div>}
      <form className="ev-gateform" onSubmit={add}>
        <label className="fld">Gate name <small>required</small><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Gate 1" /></label>
        <label className="fld">Given to <small>your note</small><input value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} placeholder="Kwame" /></label>
        <label className="fld">PIN <small>optional</small><input value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} placeholder="4–10 characters" /></label>
        <label className="fld">Email the link to <small>optional</small><input type="email" value={form.send_to} onChange={(e) => setForm({ ...form, send_to: e.target.value })} /></label>
        <button className="button button-primary" disabled={busy}><Plus size={16} /> Create gate</button>
      </form>
      <div className="booking-list">{!gates ? <div className="empty-state">Loading…</div> : gates.length ? gates.map((g) => (
        <div className="booking-row" key={g.id}>
          <div><strong><QrCode size={15} /> {g.name} {!g.is_active && <span className="pill">Off</span>}</strong><p>{g.assigned_to ? `With ${g.assigned_to} · ` : ''}{g.has_pin ? 'PIN protected' : 'No PIN'} · {g.last_used_at ? `last scan ${fmtDateTime(g.last_used_at)}` : 'not used yet'}</p></div>
          <span />
          <div className="form-actions"><button className="button button-quiet" onClick={() => setPin(g)}><KeyRound size={15} /> PIN</button><button className="button button-quiet" onClick={() => regen(g)}><RefreshCw size={15} /> New link</button><button className="button button-quiet" onClick={() => toggle(g)}>{g.is_active ? 'Switch off' : 'Switch on'}</button><button className="icon-btn" onClick={() => remove(g)} aria-label="Remove gate"><Trash2 size={16} /></button></div>
        </div>)) : <div className="empty-state">No gates yet. Create one above to get a scanner link.</div>}</div>
      <h2 className="subsection-heading">Recent scans</h2><RecentScans id={id} />
      {dialog}
    </>
  );
}

const SCAN_LABEL: Record<string, string> = { valid: 'Admitted', already_used: 'Already used', not_found: 'Not found', refunded: 'Refunded', refund_pending: 'Refund pending', cancelled: 'Cancelled', wrong_event: 'Wrong event', outside_window: 'Outside window', event_cancelled: 'Event cancelled' };
function RecentScans({ id }: { id: string }) {
  const [rows, setRows] = useState<any[] | null>(null);
  useEffect(() => { const load = () => eventApi.host.scans(id).then(setRows).catch(() => setRows([])); load(); const t = window.setInterval(load, 15000); return () => window.clearInterval(t); }, [id]);
  if (!rows) return <div className="empty-state">Loading…</div>;
  return rows.length ? <div className="booking-list">{rows.map((r) => <div className="booking-row" key={r.id}><div><strong>{r.ticket?.holder_name || r.ticket?.holder_email || r.code}</strong><p>{r.ticket?.ticket_type?.name || ''} · {r.gate?.name || 'Gate'} · {fmtDateTime(r.scanned_at)}</p></div><span className={`status status-${r.result === 'valid' ? 'confirmed' : 'cancelled'}`}>{SCAN_LABEL[r.result] || r.result}</span><span /></div>)}</div> : <div className="empty-state">No scans yet.</div>;
}

// ── Attendees / orders ────────────────────────────────────────────────────────

function AttendeesTab({ id }: { id: string }) {
  const [q, setQ] = useState(''); const [status, setStatus] = useState(''); const [page, setPage] = useState(1);
  const [res, setRes] = useState<Awaited<ReturnType<typeof eventApi.host.attendees>> | null>(null);
  useEffect(() => { const t = window.setTimeout(() => eventApi.host.attendees(id, { query: q, status, page, limit: 40 }).then(setRes).catch(() => setRes({ data: [], total: 0, page: 1, limit: 40 })), q ? 250 : 0); return () => window.clearTimeout(t); }, [id, q, status, page]);
  const download = async () => {
    const { getSession } = await import('./api'); const base = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
    const r = await fetch(`${base}${eventApi.host.csvUrl(id)}`, { headers: { Authorization: `Bearer ${getSession()?.accessToken}` } });
    const blob = await r.blob(); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'attendees.csv'; a.click(); URL.revokeObjectURL(a.href);
  };
  return (
    <>
      <div className="notif-toolbar"><input className="ev-searchbox" placeholder="Search name, email or ticket code" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        {['', 'valid', 'used', 'refund_pending', 'refunded'].map((s) => <button key={s} className={`chip ${status === s ? 'chip-active' : ''}`} onClick={() => { setStatus(s); setPage(1); }}>{s ? s.replace('_', ' ') : 'All'}</button>)}
        <button className="button button-quiet" onClick={download}><Download size={15} /> CSV</button></div>
      {!res ? <div className="empty-state">Loading…</div> : res.data.length ? <>
        <div className="booking-list">{res.data.map((t: any) => <div className="booking-row" key={t.id}><div><strong>{t.holder_name || t.holder_email}</strong><p>{t.ticket_type?.name} · <code>{t.code}</code>{t.holder_email !== t.order?.buyer_email ? ` · bought by ${t.order?.buyer_email}` : ''}{t.used_at ? ` · in at ${fmtDateTime(t.used_at)}${t.gate?.name ? ` (${t.gate.name})` : ''}` : ''}</p></div><TicketStatusPill status={t.status} /><span /></div>)}</div>
        <Pager page={res.page} limit={res.limit} total={res.total} onPage={setPage} />
      </> : <div className="empty-state">No tickets match.</div>}
    </>
  );
}

function Pager({ page, limit, total, onPage }: { page: number; limit: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / limit)); if (pages <= 1) return <p className="muted-inline">{total} total</p>;
  return <div className="notif-toolbar"><button className="chip" disabled={page <= 1} onClick={() => onPage(page - 1)}>← Prev</button><span className="muted-inline">Page {page} of {pages} · {total} total</span><button className="chip" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next →</button></div>;
}

function OrdersTab({ id, currency }: { id: string; currency: string }) {
  const [kind, setKind] = useState(''); const [page, setPage] = useState(1);
  const [res, setRes] = useState<Awaited<ReturnType<typeof eventApi.host.orders>> | null>(null);
  useEffect(() => { eventApi.host.orders(id, { kind, page, limit: 30 }).then(setRes).catch(() => setRes({ data: [], total: 0, page: 1, limit: 30 })); }, [id, kind, page]);
  return (
    <>
      <div className="notif-toolbar">{[['', 'All'], ['ticket', 'Tickets'], ['vote', 'Votes']].map(([v, l]) => <button key={v} className={`chip ${kind === v ? 'chip-active' : ''}`} onClick={() => { setKind(v); setPage(1); }}>{l}</button>)}</div>
      {!res ? <div className="empty-state">Loading…</div> : res.data.length ? <>
        <div className="booking-list">{res.data.map((o: any) => <div className="booking-row" key={o.id}><div><strong>{o.buyer_name || o.buyer_email}</strong><p>{o.kind === 'vote' ? 'Votes' : `${o.tickets?.length ?? 0} ticket(s)`} · {o.buyer_email} · {fmtDateTime(o.paid_at || o.created_at)}</p></div><span className={`status status-${o.status === 'paid' ? 'confirmed' : o.status === 'refunded' || o.status === 'needs_refund' ? 'cancelled' : 'pending'}`}>{o.status.replace('_', ' ')}</span><div><strong>{cedis(o.subtotal + o.service_fee, currency)}</strong><p>you get {cedis(o.host_net, currency)}</p></div></div>)}</div>
        <Pager page={res.page} limit={res.limit} total={res.total} onPage={setPage} /></> : <div className="empty-state">No orders yet.</div>}
    </>
  );
}

// ── Voting tab ────────────────────────────────────────────────────────────────

function VotingTab({ data, reload }: { data: HostEventOverview; reload: () => void }) {
  const id = data.event.id; const c = data.event.currency; const slug = data.event.slug as string;
  const [res, setRes] = useState<Awaited<ReturnType<typeof eventApi.host.votes>> | null>(null);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState<ReactNode>(null);
  const close = () => setDialog(null);
  const load = useCallback(() => eventApi.host.votes(id).then(setRes).catch((e) => setError(errText(e))), [id]);
  useEffect(() => { load(); }, [load]);
  const done = async () => { close(); await load(); reload(); };
  const linkFor = (catId: string, nomId?: string) => `${window.location.origin}${nomId ? nomineePath(slug, catId, nomId) : categoryPath(slug, catId)}`;

  const categoryDialog = (cat?: any) => setDialog(
    <FieldDialog
      title={cat ? `Edit “${cat.name}”` : 'Add a voting category'}
      intro={cat ? undefined : 'A category is one award, like “Best DJ” or “Miss Lotnis”. Each has its own price per vote and its own shareable page.'}
      fields={[
        { name: 'name', label: 'Category name', type: 'text', required: true, placeholder: 'Best Artist of the Year', maxLength: 80 },
        { name: 'description', label: 'Description', type: 'textarea', hint: 'optional — shown on the category page', rows: 3, maxLength: 500 },
        { name: 'price_per_vote', label: 'Price per vote (GH₵)', type: 'number', required: true, min: 0.1, step: '0.01', placeholder: '1.00' },
        ...(cat ? [{ name: 'is_open', label: 'Open for voting', type: 'checkbox' } as const] : []),
      ]}
      initial={cat ? { name: cat.name, description: cat.description || '', price_per_vote: String(cat.price_per_vote), is_open: cat.is_open } : {}}
      submitLabel={cat ? 'Save category' : 'Add category'}
      onSubmit={async (v) => {
        const body = { name: v.name, description: v.description, price_per_vote: Number(v.price_per_vote), ...(cat ? { is_open: v.is_open } : {}) };
        if (cat) await eventApi.host.updateCategory(cat.id, body); else await eventApi.host.addCategory(id, body);
        await done();
      }}
      onClose={close} />);

  const nomineeDialog = (cat: any, nom?: any) => setDialog(
    <FieldDialog
      title={nom ? `Edit ${nom.name}` : `Add a contestant to “${cat.name}”`}
      intro={nom ? undefined : 'Every contestant needs a picture. It shows on their voting page and in the preview when their link is shared.'}
      fields={[
        { name: 'photo_url', label: 'Picture of the contestant', type: 'photo', required: true, round: true, hint: 'A clear, front-facing photo works best.' },
        { name: 'name', label: 'Name', type: 'text', required: true, maxLength: 80, placeholder: 'Ama Owusu' },
        { name: 'code', label: 'Contestant code', type: 'text', hint: 'optional, e.g. A01', maxLength: 20 },
        { name: 'bio', label: 'A line about them', type: 'textarea', hint: 'optional', rows: 3, maxLength: 600 },
      ]}
      initial={nom ? { photo_url: nom.photo_url || '', name: nom.name, code: nom.code || '', bio: nom.bio || '' } : {}}
      submitLabel={nom ? 'Save contestant' : 'Add contestant'}
      onSubmit={async (v) => {
        const body = { name: v.name, code: v.code, bio: v.bio, photo_url: v.photo_url };
        if (nom) await eventApi.host.updateNominee(nom.id, body); else await eventApi.host.addNominee(cat.id, body);
        await done();
      }}
      onClose={close} />);

  const confirm = (title: string, body: ReactNode, label: string, work: () => Promise<unknown>) =>
    setDialog(<ConfirmDialog title={title} body={body} confirmLabel={label} danger onConfirm={async () => { await work(); await done(); }} onClose={close} />);

  return (
    <>
      <div className="host-page-head"><h2>Voting</h2><button className="button button-primary" onClick={() => categoryDialog()}><Plus size={16} /> Add category</button></div>
      <p className="muted-inline">Voters need only an email. Every category and every contestant has its own link to copy and share — the shared preview shows the contestant's picture. {data.event.show_vote_counts ? 'Live counts and the top 3 are public.' : 'Counts and rankings are hidden from the public until voting closes (you always see them).'} Turn counts on or off in <Link to={`/host/events/${id}/edit`}>Edit event</Link>.</p>
      {(() => { const m = votingMessage(clientVotingState(data.event), data.event.voting_opens_at, data.event.voting_closes_at, true); return (
        <div className={`bk-callout ${m.ok ? '' : 'bk-callout-warm'}`}><Trophy size={22} /><div><b>{m.title}</b><p>{m.body} {data.event.voting_opens_at ? `Voting starts ${fmtDateTime(data.event.voting_opens_at)}` : 'Voting has no start time, so it opens as soon as the event is published'}{data.event.voting_closes_at ? ` and ends ${fmtDateTime(data.event.voting_closes_at)}` : ' and has no end time'}. Change this in <Link to={`/host/events/${id}/edit`}>Edit event → Voting</Link>.</p></div></div>); })()}
      {error && <div className="form-error">{error}</div>}
      {res && <div className="metric-grid metric-grid-4"><Stat label="Vote orders" value={res.orders} /><Stat label="Votes" value={data.stats.votes_total.toLocaleString()} /><Stat label="Revenue" value={cedis(res.gross, c)} /><Stat label="You'll receive" value={cedis(res.host_net, c)} sub={`after ${cedis(res.commission, c)} Lotnis fee`} /></div>}
      {!res ? <div className="empty-state">Loading…</div> : res.categories.length ? res.categories.map((cat: any) => {
        const catLink = linkFor(cat.id);
        return (
          <div className="ev-cat ev-cat-host" key={cat.id}>
            <div className="ev-cat-head">
              <h3>{cat.name} {!cat.is_open && <span className="pill">Closed</span>}</h3>
              <span className="pill">{cedis(cat.price_per_vote, c)} / vote · {cat.total_votes.toLocaleString()} votes</span>
              <div className="form-actions">
                <button className="button button-quiet" onClick={() => categoryDialog(cat)}>Edit</button>
                <button className="button button-quiet" onClick={() => eventApi.host.updateCategory(cat.id, { is_open: !cat.is_open }).then(done).catch((e) => setError(errText(e)))}>{cat.is_open ? 'Close voting' : 'Reopen'}</button>
                <button className="icon-btn" aria-label="Remove category" onClick={() => confirm(`Remove “${cat.name}”?`, cat.total_votes ? 'This category already has votes, so it will be closed instead of deleted.' : 'The category and its contestants will be deleted.', cat.total_votes ? 'Close it' : 'Delete', () => eventApi.host.removeCategory(cat.id))}><Trash2 size={16} /></button>
              </div>
            </div>
            <div className="ev-linkrow"><Link2 size={15} /><code>{catLink}</code><ShareBar compact url={catLink} title={cat.name} text={`Vote in ${cat.name} at ${data.event.title}! ${cedis(cat.price_per_vote, c)} per vote. ${catLink}`} /></div>
            <div className="booking-list">{cat.nominees.map((n: any, i: number) => {
              const link = linkFor(cat.id, n.id);
              return (
                <div className="ev-nomrow" key={n.id}>
                  {n.photo_url ? <img className="ev-avatar ev-avatar-md" src={n.photo_url} alt={n.name} /> : <span className="ev-avatar ev-avatar-md ev-avatar-ph">{n.name.slice(0, 1)}</span>}
                  <div className="ev-nomrow-info">
                    <strong>{i + 1}. {n.name} {!n.is_active && <span className="pill">Off</span>}{!n.photo_url && <span className="pill ev-pill-rejected">Picture needed</span>}</strong>
                    <small>{n.votes_count.toLocaleString()} votes{n.code ? ` · code ${n.code}` : ''}</small>
                    <div className="ev-linkrow ev-linkrow-sm"><code>{link}</code></div>
                  </div>
                  <div className="ev-nomrow-actions">
                    <ShareBar compact url={link} title={`Vote for ${n.name}`} text={shareText(n.name, cat.name, data.event.title, cedis(cat.price_per_vote, c), link)} />
                    <button className="button button-quiet" onClick={() => nomineeDialog(cat, n)}>Edit</button>
                    <button className="icon-btn" aria-label={`Remove ${n.name}`} onClick={() => confirm(`Remove ${n.name}?`, n.votes_count ? `${n.name} already has ${n.votes_count.toLocaleString()} votes, so they will be switched off (hidden) rather than deleted.` : `${n.name} will be removed from “${cat.name}”.`, n.votes_count ? 'Switch off' : 'Remove', () => eventApi.host.removeNominee(n.id))}><Trash2 size={16} /></button>
                  </div>
                </div>);
            })}</div>
            <button className="button button-secondary" onClick={() => nomineeDialog(cat)}><Plus size={15} /> Add contestant</button>
          </div>);
      }) : <div className="empty-state"><Trophy size={26} /><p>Add a category (like “Best Artist”), then its contestants with their pictures.</p><button className="button button-secondary" onClick={() => categoryDialog()}>Add your first category</button></div>}
      {dialog}
    </>
  );
}

// ── Reviews / refunds / payout tabs ───────────────────────────────────────────

function ReviewsTab({ id }: { id: string }) {
  const [rows, setRows] = useState<any[] | null>(null);
  const load = useCallback(() => eventApi.host.reviews(id).then(setRows).catch(() => setRows([])), [id]);
  useEffect(() => { load(); }, [load]);
  const [dialog, setDialog] = useState<ReactNode>(null);
  const reply = (r: any) => setDialog(<FieldDialog title="Reply to this review" intro="Your reply is public, under the review." fields={[{ name: 'reply', label: 'Your reply', type: 'textarea', required: true, rows: 4, maxLength: 1000 }]} initial={{ reply: r.host_reply || '' }} submitLabel="Post reply" onSubmit={async (v) => { await eventApi.host.reply(r.id, String(v.reply)); setDialog(null); load(); }} onClose={() => setDialog(null)} />);
  if (!rows) return <div className="empty-state">Loading…</div>;
  return <>{rows.length ? <div className="booking-list">{rows.map((r) => <div className="booking-row" key={r.id}><div><strong>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)} {r.reviewer_name || 'Attendee'}</strong><p>{r.comment || 'No comment'} · {fmtDate(r.created_at)}</p>{r.host_reply && <small>Your reply: {r.host_reply}</small>}</div><span /><button className="button button-quiet" onClick={() => reply(r)}>{r.host_reply ? 'Edit reply' : 'Reply'}</button></div>)}</div>
    : <div className="empty-state"><Star size={26} /><p>No reviews yet. Attendees whose ticket was scanned can review after the event.</p></div>}{dialog}</>;
}

function RefundsTab({ id, currency }: { id: string; currency: string }) {
  const [rows, setRows] = useState<any[] | null>(null);
  useEffect(() => { eventApi.host.refunds(id).then(setRows).catch(() => setRows([])); }, [id]);
  if (!rows) return <div className="empty-state">Loading…</div>;
  return <>
    <p className="muted-inline">Lotnis reviews and sends refunds. A ticket is paused the moment a refund is requested, and cannot be scanned once refunded. The refunded amount is taken out of your payout.</p>
    {rows.length ? <div className="booking-list">{rows.map((r) => <div className="booking-row" key={r.id}><div><strong>{cedis(r.amount, currency)} · {r.ticket_ids?.length || 1} ticket(s)</strong><p>{r.trigger === 'buyer_request' ? 'Requested by buyer' : r.trigger.replace('_', ' ')} · {fmtDate(r.created_at)}{r.reason ? ` · “${r.reason}”` : ''}{r.refund_reference ? ` · ref ${r.refund_reference}` : ''}</p></div><span className={`status status-${r.status === 'processed' ? 'confirmed' : r.status === 'rejected' || r.status === 'failed' ? 'cancelled' : 'pending'}`}>{r.status === 'processed' ? 'sent' : r.status}</span><span /></div>)}</div> : <div className="empty-state">No refund requests.</div>}</>;
}

function PayoutTab({ data }: { data: HostEventOverview }) {
  const p = data.payout; const c = data.event.currency;
  return <>
    <div className="bk-callout"><Wallet size={22} /><div><b>You're paid after the event</b><p>Ticket money is released 48 hours after the event ends (voting money 48 hours after voting closes), minus Lotnis's fee and any refunds. Lotnis then sends it to your payout account.</p></div></div>
    <div className="metric-grid metric-grid-4"><Stat label="Waiting for release" value={cedis(p.awaiting_release, c)} sub={p.next_release_at ? `from ${fmtDateTime(p.next_release_at)}` : undefined} /><Stat label="Ready to send" value={cedis(p.due, c)} /><Stat label="On hold" value={cedis(p.on_hold, c)} /><Stat label="Paid" value={cedis(p.paid, c)} /></div>
    <p><Link className="button button-secondary" to="/host/earnings">See all earnings <ArrowRight size={15} /></Link></p></>;
}

// ── Earnings: payouts across every service ───────────────────────────────────

const BUCKET_LABEL: Record<PayoutBucket, string> = { awaiting_release: 'Waiting for release', due: 'Ready to send', on_hold: 'On hold', processing: 'Being sent', paid: 'Paid' };
export function HostEarnings() {
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [items, setItems] = useState<PayoutItem[] | null>(null);
  const [batches, setBatches] = useState<Awaited<ReturnType<typeof eventApi.payouts.batches>>>([]);
  const [bucket, setBucket] = useState(''); const [service, setService] = useState(''); const [error, setError] = useState('');
  useEffect(() => { eventApi.payouts.summary().then(setSummary).catch((e) => setError(errText(e))); eventApi.payouts.batches().then(setBatches).catch(() => {}); }, []);
  useEffect(() => { setItems(null); eventApi.payouts.items({ bucket, service, limit: 60 }).then((r) => setItems(r.data)).catch(() => setItems([])); }, [bucket, service]);
  const c = summary?.currency || 'GHS';
  const d = summary?.payout_details;
  return (
    <section className="host-page">
      <Seo title="Earnings" description="Your payouts" noindex />
      <PageHeader eyebrow="Earnings" title="What you're owed" />
      {error ? <div className="error-state">{error}</div> : !summary ? <div className="empty-state">Loading…</div> : <>
        <div className="metric-grid metric-grid-4">{(Object.keys(BUCKET_LABEL) as PayoutBucket[]).map((k) => <Stat key={k} label={BUCKET_LABEL[k]} value={cedis(summary.totals[k], c)} sub={k === 'awaiting_release' && summary.next_release_at ? `next ${fmtDate(summary.next_release_at)}` : undefined} />)}</div>
        {summary.adjustments !== 0 && <div className="notice"><span>Refunds after a payout are netted off your next one: {cedis(summary.adjustments, c)}.</span></div>}
        <div className="bk-callout"><Wallet size={22} /><div><b>How you're paid</b><p><b>Stays:</b> 24–48 hours after check-in (guests can report a problem until then). <b>Event tickets:</b> 48 hours after the event ends. <b>Votes:</b> 48 hours after voting closes. Lotnis then sends the money to {d ? (d.method === 'bank' ? `${d.bank_name} ····${String(d.account_number).slice(-4)}` : `${d.provider} ${d.number}`) : 'your payout account — add one in your host profile'}.</p></div></div>
        {summary.by_service.length > 1 && <div className="booking-list">{summary.by_service.map((s) => <div className="booking-row" key={s.service}><div><strong>{s.label}</strong><p>{cedis(s.awaiting_release, c)} waiting · {cedis(s.due, c)} ready</p></div><span /><strong>{cedis(s.paid, c)} paid</strong></div>)}</div>}
        <h2 className="subsection-heading">Payments</h2>
        <div className="notif-toolbar">{[['', 'All'], ...(Object.keys(BUCKET_LABEL) as PayoutBucket[]).map((k) => [k, BUCKET_LABEL[k]])].map(([v, l]) => <button key={v} className={`chip ${bucket === v ? 'chip-active' : ''}`} onClick={() => setBucket(v)}>{l}</button>)}
          <select className="ev-mini-select" value={service} onChange={(e) => setService(e.target.value)}><option value="">All services</option>{summary.by_service.map((s) => <option key={s.service} value={s.service}>{s.label}</option>)}</select></div>
        {!items ? <div className="empty-state">Loading…</div> : items.length ? <div className="booking-list">{items.map((i) => <div className="booking-row" key={i.id}><div><strong>{i.title}</strong><p>{i.service_label}{i.detail ? ` · ${i.detail}` : ''} · {i.bucket === 'paid' ? `paid ${i.paid_at ? fmtDate(i.paid_at) : ''}${i.provider_reference ? ` · ref ${i.provider_reference}` : ''}` : i.bucket === 'awaiting_release' && i.release_at ? `releases ${fmtDateTime(i.release_at)}` : i.on_hold ? `on hold: ${i.hold_reason}` : i.bucket === 'due' ? 'ready — Lotnis will send it' : i.bucket === 'processing' ? 'being sent' : ''}</p></div><span className={`status status-${i.bucket === 'paid' ? 'confirmed' : i.on_hold ? 'cancelled' : 'pending'}`}>{i.bucket ? BUCKET_LABEL[i.bucket] : i.status}</span><strong>{cedis(i.amount, i.currency)}</strong></div>)}</div> : <div className="empty-state">Nothing here yet.</div>}
        {batches.length > 0 && <><h2 className="subsection-heading">Payouts sent</h2><div className="booking-list">{batches.map((b) => <div className="booking-row" key={b.id}><div><strong>{cedis(b.amount, b.currency)}</strong><p>{fmtDate(b.paid_at || b.created_at)} · to {b.destination?.method === 'bank' ? `${b.destination.bank_name}` : b.destination?.provider || 'your account'}{b.reference ? ` · ref ${b.reference}` : ''}</p></div><span className={`status status-${b.status === 'paid' ? 'confirmed' : b.status === 'failed' ? 'cancelled' : 'pending'}`}>{b.status}</span><span /></div>)}</div></>}
      </>}
    </section>
  );
}
void useMemo; void Check;
