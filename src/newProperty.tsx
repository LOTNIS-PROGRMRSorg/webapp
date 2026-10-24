import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowRight, DoorOpen, Home, Layers, Plus, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from './api';
import { policyLine } from './format';
import { emptyLocation, LocationPicker, locationPayload, validateLocation, type LocationValue } from './locationPicker';
import { PhotoPicker } from './photoPicker';
import type { BookingMode, CatalogOptions } from './types';

type Unit = 'day' | 'week' | 'month' | 'year';
type RoomDraft = { photos: string[]; key: string; label: string; price: string; capacity: string; bedType: string; privateBathroom: boolean; sizeSqm: string; description: string };

const blankRoom = (): RoomDraft => ({ photos: [], key: crypto.randomUUID(), label: '', price: '', capacity: '', bedType: '', privateBathroom: false, sizeSqm: '', description: '' });
const BED_TYPES = ['Single bed', 'Double bed', 'Queen bed', 'King bed', 'Bunk beds', 'Shared dorm'];

const MODES: Array<{ value: BookingMode; title: string; sub: string; icon: typeof Home }> = [
  { value: 'entire', title: 'Whole property', sub: 'Guests book all of it — a house, an office, a warehouse.', icon: Home },
  { value: 'rooms', title: 'Room by room', sub: 'Each room is let separately to different guests.', icon: DoorOpen },
  { value: 'both', title: 'Either', sub: 'Guests can take the whole place or just a room. Booking one blocks the other for those dates.', icon: Layers },
];

/**
 * Listing form. Type, rental unit and refund policy come from the admin-managed
 * catalog. Which detail fields appear (bedrooms, ceiling height, loading access…)
 * is driven by the chosen type, so a villa asks about bedrooms and a warehouse
 * asks about ceiling height and loading bays.
 */
export function NewPropertyPage() {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<CatalogOptions | null>(null);
  const [typeId, setTypeId] = useState('');
  const [mode, setMode] = useState<BookingMode>('entire');
  const [unit, setUnit] = useState<Unit>('day');
  const [policyId, setPolicyId] = useState('');
  const [rooms, setRooms] = useState<RoomDraft[]>([blankRoom()]);
  // Uploads need a property id before the listing exists; this one is used for storage paths only.
  const draftId = useMemo(() => crypto.randomUUID(), []);
  const [photos, setPhotos] = useState<string[]>([]);
  const [location, setLocation] = useState<LocationValue>(emptyLocation);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getCatalog().then((options) => {
      setCatalog(options);
      setPolicyId((options.cancellation_policies.find((p) => p.code === 'standard') ?? options.cancellation_policies[0])?.id ?? '');
    }).catch((err) => setError(err instanceof Error ? err.message : 'Unable to load listing options'));
  }, []);

  const type = catalog?.property_types.find((t) => t.id === typeId);
  const fields = type?.applicable_fields ?? {};
  const unitInfo = catalog?.rental_units.find((u) => u.code === unit);
  const grouped = useMemo(() => {
    const groups: Record<string, CatalogOptions['property_types']> = {};
    for (const t of catalog?.property_types ?? []) (groups[t.category] ??= []).push(t);
    return groups;
  }, [catalog]);
  const categoryLabel: Record<string, string> = { residential: 'Homes & rooms', hospitality: 'Hotels & hostels', commercial: 'Commercial & storage' };
  const updateRoom = (key: string, patch: Partial<RoomDraft>) => setRooms((list) => list.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const num = (v: FormDataEntryValue | null) => (v === null || String(v).trim() === '' ? undefined : Number(v));
  const flag = (form: FormData, name: string) => (form.has(name) ? form.get(name) === 'on' : undefined);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const policy = catalog?.cancellation_policies.find((p) => p.id === policyId);
    if (!type) { setError('Choose a type of space.'); return; }
    const locationProblem = catalog ? validateLocation(location) : 'Loading…';
    if (locationProblem) { setError(locationProblem); document.getElementById('location')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    if (!photos.length) { setError('Add at least one photo of the place — listings with pictures get far more bookings.'); return; }
    if (!policy) { setError('Choose a refund policy.'); return; }
    const usedRooms = mode === 'entire' ? [] : rooms;
    if (mode !== 'entire') {
      if (!usedRooms.length) { setError('Add at least one room.'); return; }
      const bad = usedRooms.find((r) => !r.label.trim() || !r.price || Number(r.price) <= 0);
      if (bad) { setError('Every room needs a name and a price.'); return; }
    }
    setBusy(true); setError('');
    try {
      await api.publishProperty({
        draft: {
          category: type.category, subType: type.name, propertyTypeId: type.id,
          allowsIndividualBookings: mode !== 'entire', bookingMode: mode,
          requiresHostAcceptance: form.get('requiresHostAcceptance') === 'on',
          name: String(form.get('name')), tagline: String(form.get('tagline') || ''), description: String(form.get('description')),
          sizeSqm: String(form.get('sizeSqm') || '') || undefined,
          location: locationPayload(location),
          price: mode === 'rooms' ? undefined : String(form.get('price')), pricingPeriod: unit, currency: 'GHS',
          securityDeposit: String(form.get('securityDeposit') || '') || undefined,
          minimumStay: String(form.get('minimumStay') || '') || undefined,
          maxStay: String(form.get('maxStay') || '') || undefined,
          bedrooms: fields.bedrooms ? num(form.get('bedrooms')) : undefined,
          bathrooms: fields.bathrooms ? num(form.get('bathrooms')) : undefined,
          maxGuests: fields.capacity ? num(form.get('maxGuests')) : undefined,
          ceilingHeightM: fields.ceiling_height ? num(form.get('ceilingHeightM')) : undefined,
          furnished: fields.furnished ? flag(form, 'furnished') : undefined,
          loadingAccess: fields.loading_access ? flag(form, 'loadingAccess') : undefined,
          access24h: fields.access_24h ? flag(form, 'access24h') : undefined,
          powerBackup: fields.power_backup ? flag(form, 'powerBackup') : undefined,
          utilitiesIncluded: fields.utilities_included ? flag(form, 'utilitiesIncluded') : undefined,
          cancellationPolicy: policy.code, cancellationPolicyId: policy.id,
          selectedAmenities: [],
        },
        images: {
          frontImage: { url: photos[0], tag: 'cover', caption: '', sortOrder: 0 },
          buildingImages: photos.slice(1).map((url, i) => ({ url, tag: 'gallery', caption: '', sortOrder: i + 1 })),
          rooms: usedRooms.map((r) => ({
            roomId: r.key, roomLabel: r.label.trim(), images: r.photos.map((url, i) => ({ url, tag: 'room', caption: '', sortOrder: i })), pricePerPeriod: r.price, currency: 'GHS',
            description: r.description.trim() || undefined, capacity: r.capacity ? Number(r.capacity) : undefined,
            bedType: r.bedType || undefined, privateBathroom: r.privateBathroom, sizeSqm: r.sizeSqm ? Number(r.sizeSqm) : undefined,
          })),
        },
      });
      navigate('/host/accommodation');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create listing');
    } finally { setBusy(false); }
  };

  const check = (name: string, label: string) => <label className="checkbox-row"><input type="checkbox" name={name} /> {label}</label>;

  return (
    <section className="host-page host-form-page">
      <Link className="back-link" to="/host/accommodation">← Accommodation</Link>
      <span className="eyebrow">New listing</span>
      <h1>Tell guests about your space.</h1>
      <form className="listing-form" onSubmit={submit}>
        <h2 className="form-section">The basics</h2>
        <div className="form-grid">
          <label>Space name<input name="name" required placeholder="e.g. The Palm House, Osu Office Suite, Tema Warehouse" /></label>
          <label>Type of space
            <select required value={typeId} onChange={(e) => setTypeId(e.target.value)}>
              <option value="" disabled>Choose a type…</option>
              {Object.entries(grouped).map(([category, types]) => (
                <optgroup key={category} label={categoryLabel[category] || category}>
                  {types.map((t) => <option key={t.id} value={t.id}>{t.name.charAt(0).toUpperCase() + t.name.slice(1)}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
          <label>Floor area (m²)<input name="sizeSqm" type="number" min="1" step="0.1" placeholder="Optional" /></label>
        </div>
        <h2 className="form-section" id="location">Where is it?</h2>
        <p className="muted-inline">Guests search and filter by place, so we keep locations consistent: choose from Ghana's regions and towns, and pin the exact spot.</p>
        {catalog ? <LocationPicker catalog={catalog.locations} value={location} onChange={setLocation} /> : <div className="empty-state">Loading places…</div>}

        <h2 className="form-section">Photos</h2>
        <p className="muted-inline">Show the place at its best — the first photo is the cover guests see in search. Add the building, living areas, bedrooms, bathrooms and anything special.</p>
        <PhotoPicker propertyId={draftId} urls={photos} onChange={setPhotos} max={15} label="Add photos" />

        <label>Description<textarea name="description" required rows={4} placeholder="What should guests know about this place?" /></label>
        <label>Tagline<input name="tagline" placeholder="A short line guests will remember" /></label>

        <h2 className="form-section">How can guests book it?</h2>
        <div className="app-choice-row app-choice-row-3" role="radiogroup" aria-label="Booking mode">
          {MODES.map(({ value, title, sub, icon: Icon }) => (
            <button type="button" role="radio" aria-checked={mode === value} key={value} className={`app-choice ${mode === value ? 'app-choice-on' : ''}`} onClick={() => setMode(value)}>
              <Icon size={22} /><strong>{title}</strong><small>{sub}</small>
            </button>
          ))}
        </div>

        <h2 className="form-section">Pricing</h2>
        <div className="form-grid">
          <label>Rent it out
            <select value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
              {(catalog?.rental_units ?? []).map((u) => <option key={u.code} value={u.code} disabled={!u.bookable}>{u.label}{u.bookable ? '' : ' — coming soon'}</option>)}
            </select>
          </label>
          {mode !== 'rooms' && <label>Price for the whole place, per {unitInfo?.per ?? 'night'} (GHS)<input name="price" required type="number" min="0" step="0.01" /></label>}
          <label>Minimum stay ({unitInfo?.quantity ?? 'nights'})<input name="minimumStay" type="number" min="1" placeholder="Optional" /></label>
          <label>Maximum stay ({unitInfo?.quantity ?? 'nights'})<input name="maxStay" type="number" min="1" placeholder="Optional" /></label>
          <label>Refundable security deposit (GHS)<input name="securityDeposit" type="number" min="0" step="0.01" placeholder="Optional" /></label>
        </div>
        <p className="muted-inline">Guests book {unitInfo?.quantity ?? 'nights'} in whole units — a monthly space is let for whole calendar months, never pro-rated by days.</p>

        {mode !== 'entire' && <>
          <h2 className="form-section">Rooms</h2>
          <p className="muted-inline">Priced per {unitInfo?.per ?? 'night'}, same as above. {mode === 'both' && 'When a guest books a room, the whole place is unavailable for those dates, and the other way round.'}</p>
          <div className="room-list">
            {rooms.map((room, index) => (
              <div className="room-card" key={room.key}>
                <div className="room-card-head"><strong>Room {index + 1}</strong>
                  {rooms.length > 1 && <button type="button" className="icon-btn" aria-label={`Remove room ${index + 1}`} onClick={() => setRooms((l) => l.filter((r) => r.key !== room.key))}><Trash2 size={16} /></button>}
                </div>
                <div className="form-grid">
                  <label>Room name<input value={room.label} onChange={(e) => updateRoom(room.key, { label: e.target.value })} placeholder="e.g. Master room, Room 2" /></label>
                  <label>Price per {unitInfo?.per ?? 'night'} (GHS)<input type="number" min="0" step="0.01" value={room.price} onChange={(e) => updateRoom(room.key, { price: e.target.value })} /></label>
                  <label>Sleeps<input type="number" min="1" value={room.capacity} onChange={(e) => updateRoom(room.key, { capacity: e.target.value })} placeholder="Guests" /></label>
                  <label>Bed type
                    <select value={room.bedType} onChange={(e) => updateRoom(room.key, { bedType: e.target.value })}><option value="">Not specified</option>{BED_TYPES.map((b) => <option key={b}>{b}</option>)}</select>
                  </label>
                  <label>Size (m²)<input type="number" min="1" step="0.1" value={room.sizeSqm} onChange={(e) => updateRoom(room.key, { sizeSqm: e.target.value })} /></label>
                  <label className="checkbox-row"><input type="checkbox" checked={room.privateBathroom} onChange={(e) => updateRoom(room.key, { privateBathroom: e.target.checked })} /> Private bathroom</label>
                </div>
                <div className="fld"><span>Room photos <small>(up to 3)</small></span><PhotoPicker propertyId={draftId} roomId={room.key} urls={room.photos} onChange={(urls) => updateRoom(room.key, { photos: urls })} max={3} label="Add" cover={false} /></div>
                <label>About this room<input value={room.description} onChange={(e) => updateRoom(room.key, { description: e.target.value })} placeholder="Optional" /></label>
              </div>
            ))}
          </div>
          <button type="button" className="button button-secondary" onClick={() => setRooms((l) => [...l, blankRoom()])}><Plus size={16} /> Add another room</button>
        </>}

        {type && Object.values(fields).some(Boolean) && <>
          <h2 className="form-section">About this {type.name}</h2>
          <div className="form-grid">
            {fields.bedrooms && <label>Bedrooms<input name="bedrooms" type="number" min="0" /></label>}
            {fields.bathrooms && <label>Bathrooms<input name="bathrooms" type="number" min="0" step="0.5" /></label>}
            {fields.capacity && <label>Maximum guests / capacity<input name="maxGuests" type="number" min="1" /></label>}
            {fields.ceiling_height && <label>Ceiling height (m)<input name="ceilingHeightM" type="number" min="1" step="0.1" /></label>}
          </div>
          <div className="check-grid">
            {fields.furnished && check('furnished', 'Furnished')}
            {fields.utilities_included && check('utilitiesIncluded', 'Utilities included')}
            {fields.power_backup && check('powerBackup', 'Power backup / generator')}
            {fields.loading_access && check('loadingAccess', 'Loading access for vehicles')}
            {fields.access_24h && check('access24h', '24-hour access')}
          </div>
        </>}

        <h2 className="form-section">Refund policy</h2>
        <p className="muted-inline">Choose how much a guest gets back if they cancel. Lotnis calculates refunds from this automatically and shows guests the exact amount before they book.</p>
        <div className="policy-options" role="radiogroup" aria-label="Refund policy">
          {(catalog?.cancellation_policies ?? []).map((p) => (
            <label key={p.id} className={`policy-option ${policyId === p.id ? 'policy-selected' : ''}`}>
              <input type="radio" name="policy" checked={policyId === p.id} onChange={() => setPolicyId(p.id)} />
              <span><strong>{p.name}</strong>{p.description && <small>{p.description}</small>}
                <ul>{p.tiers.map((t, i) => <li key={t.days_before_start}>{policyLine(t, p.tiers[i - 1])}</li>)}</ul></span>
            </label>
          ))}
        </div>

        <label className="checkbox-row"><input type="checkbox" name="requiresHostAcceptance" /> Require my approval before each booking is confirmed</label>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="form-actions">
          <button type="button" className="button button-quiet" onClick={() => navigate('/host/accommodation')}>Cancel</button>
          <button className="button button-primary" disabled={busy || !catalog}>{busy ? 'Submitting…' : 'Submit for approval'} <ArrowRight size={16} /></button>
        </div>
      </form>
    </section>
  );
}
