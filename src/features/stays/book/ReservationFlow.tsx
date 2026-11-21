import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { reservationsApi, ReservationLineInput, ReservationQuote, SpaceAvailability } from '@/lib/api/reservations';
import { StepIndicator, StepperActions, useStepper } from '@/components/steppers';
import { liveRooms, bookingMode, sortedImages } from '@/features/stays/bookingUi';
import { endDateFor, RentalUnitCode } from '@/lib/format';
import type { Property } from '@/types';
import { addDays, dayMs, isFree, minutesOf, todayIso } from './calendar';
import { SpaceStep, roomUnit } from './SpaceStep';
import { When, WhenStep } from './WhenStep';
import { DetailsStep } from './DetailsStep';
import { Summary } from './Summary';
import './book.css';

type Key = 'space' | 'when' | 'details';

/**
 * Booking a space, start to finish: see the photos and choose the whole place or several rooms, pick the dates
 * (or the hours), read the rules, then pay once for everything. Rooms are held together — all or none.
 */
export function ReservationFlow() {
  const { id = '' } = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [avail, setAvail] = useState<SpaceAvailability | null>(null);
  const [error, setError] = useState('');

  const loadAvailability = useCallback(
    () =>
      reservationsApi
        .availability(id, todayIso(), addDays(todayIso(), 370))
        .then(setAvail)
        .catch((e) => setError(e.message)),
    [id],
  );
  useEffect(() => {
    api
      .getProperty(id)
      .then(setProperty)
      .catch((e) => setError(e.message));
    loadAvailability();
  }, [id, loadAvailability]);

  if (error && !property)
    return (
      <div className="page">
        <div className="error-state">{error}</div>
      </div>
    );
  if (!property || !avail)
    return (
      <div className="page">
        <div className="empty-state">Loading…</div>
      </div>
    );
  return <Flow property={property} avail={avail} refresh={loadAvailability} />;
}

function Flow({ property, avail, refresh }: { property: Property; avail: SpaceAvailability; refresh: () => void }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const rooms = useMemo(() => liveRooms(property), [property]);
  const mode = bookingMode(property);
  const { busy, rules } = avail;

  // what is chosen
  // A room (or the whole place) already chosen on the listing page arrives in the link, so it isn't asked again.
  const first = rooms.some((r) => r.id === params.get('room')) ? params.get('room') : null;
  const wholeChosen = mode === 'both' && !first && params.get('whole') === '1';
  const [whole, setWhole] = useState(mode === 'entire' || wholeChosen);
  const [ids, setIds] = useState<string[]>(
    first ? [first] : mode === 'rooms' && rooms.length === 1 ? [rooms[0].id] : [],
  );
  const [when, setWhen] = useState<When>({
    start: params.get('start') ?? '',
    end: params.get('end') ?? '',
    qty: Math.max(1, Number(params.get('qty')) || 1),
    startTime: '',
    hours: 1,
  });
  const [guests, setGuests] = useState(1);
  const [notes, setNotes] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [quote, setQuote] = useState<ReservationQuote | null>(null);
  const [quoteError, setQuoteError] = useState('');
  const [quoting, setQuoting] = useState(false);
  const [busyBtn, setBusyBtn] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const chosen = whole ? [] : rooms.filter((r) => ids.includes(r.id));
  const roomIds = chosen.map((r) => r.id);
  const unit = (chosen[0] ? roomUnit(chosen[0], property) : property.pricing_period || 'day') as RentalUnitCode;
  const propertyUnit = property.pricing_period || 'day';
  const minStay = Math.max(
    1,
    ...(chosen.length ? chosen : [null]).map(
      (r) => (r?.min_stay ?? (unit === propertyUnit ? property.minimum_stay : 1)) || 1,
    ),
  );
  const effectiveEnd = !when.start
    ? ''
    : unit === 'day'
      ? when.end
      : unit === 'hour'
        ? when.start
        : endDateFor(when.start, unit, Math.max(minStay, when.qty));

  // the dates must be free for every room chosen
  const inMin = minutesOf(rules.check_in_time);
  const outMin = minutesOf(rules.check_out_time);
  const conflict =
    unit !== 'hour' &&
    Boolean(when.start && effectiveEnd && effectiveEnd > when.start) &&
    !isFree(busy, roomIds, dayMs(when.start) + inMin * 60_000, dayMs(effectiveEnd) + outMin * 60_000);

  const lines: ReservationLineInput[] | null = useMemo(() => {
    if (!whole && !roomIds.length) return null;
    let base: Omit<ReservationLineInput, 'room_id'>;
    if (unit === 'hour') {
      if (!when.start || !when.startTime) return null;
      base = { start_date: when.start, start_time: when.startTime, hours: when.hours };
    } else {
      if (!when.start || !effectiveEnd || effectiveEnd <= when.start) return null;
      base = { start_date: when.start, end_date: effectiveEnd };
    }
    return whole ? [{ room_id: null, ...base }] : roomIds.map((room_id) => ({ room_id, ...base }));
  }, [whole, roomIds.join(','), unit, when, effectiveEnd]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setQuote(null);
    setQuoteError('');
    if (!lines || conflict) return;
    let live = true;
    setQuoting(true);
    const t = window.setTimeout(() => {
      reservationsApi
        .quote(property.id, lines, guests)
        .then((q) => live && setQuote(q))
        .catch((e) => live && setQuoteError(e instanceof Error ? e.message : 'We couldn’t price that.'))
        .finally(() => live && setQuoting(false));
    }, 250);
    return () => {
      live = false;
      window.clearTimeout(t);
    };
  }, [property.id, lines, conflict, guests]);

  const needsSpace = mode !== 'entire';
  const steps = useMemo(
    () =>
      (needsSpace
        ? [
            { key: 'space', label: 'Space' },
            { key: 'when', label: unit === 'hour' ? 'Day & time' : 'Dates' },
            { key: 'details', label: 'Details' },
          ]
        : [
            { key: 'when', label: unit === 'hour' ? 'Day & time' : 'Dates' },
            { key: 'details', label: 'Details' },
          ]) as Array<{ key: Key; label: string }>,
    [needsSpace, unit],
  );

  const validate = useCallback(
    (key: Key) => {
      if (key === 'space') return !whole && !ids.length ? 'Choose a room or the whole place to continue.' : '';
      if (key === 'when') {
        if (!when.start) return 'Choose your dates first.';
        if (unit === 'day' && !when.end) return 'Now choose your check-out date.';
        if (unit === 'hour' && !when.startTime) return 'Choose a start time.';
        if (conflict) return 'Part of that stay is already taken.';
        if (quoteError) return quoteError;
        if (!quote) return quoting ? 'One moment — working out your total.' : 'Choose your dates first.';
        return '';
      }
      return agreed ? '' : 'Please agree to the house rules and cancellation terms.';
    },
    [whole, ids, when, unit, conflict, quoteError, quote, quoting, agreed],
  );
  const alreadyChosen = needsSpace && (Boolean(first) || wholeChosen || (mode === 'rooms' && rooms.length === 1));
  const stepper = useStepper<Key>(steps, validate, { initial: alreadyChosen ? 1 : 0 });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stepper.validateAll() || !lines) return;
    setBusyBtn(true);
    setSubmitError('');
    try {
      const r = await reservationsApi.create({
        property_id: property.id,
        lines,
        guests,
        notes: notes.trim() || undefined,
      });
      navigate(`/reservation/${r.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'We couldn’t hold that. Please try again.');
      if ((err as { code?: string }).code === 'UNAVAILABLE') {
        refresh();
        stepper.go(steps.findIndex((s) => s.key === 'when'));
      }
    } finally {
      setBusyBtn(false);
    }
  };

  const toggleRoom = (rid: string) => {
    setWhole(false);
    setIds((cur) => (cur.includes(rid) ? cur.filter((x) => x !== rid) : [...cur, rid]));
    setWhen((w) => ({ ...w, end: '', startTime: '' }));
  };
  const cover = sortedImages(chosen[0]?.room_images)[0] ?? sortedImages(property.property_images)[0];
  const last = stepper.last;
  const indicator = [...steps, { key: 'pay' as Key, label: 'Pay' }];

  return (
    <div className="page rv-page">
      <Link className="back-link" to={`/stays/${property.id}`}>
        ← Back to {property.name}
      </Link>
      <StepIndicator
        steps={indicator}
        current={stepper.index}
        onJump={(i) => i < steps.length && stepper.jump(i)}
        label="Booking progress"
      />
      <div className="rv-layout">
        <form className="rv-main" onSubmit={submit}>
          {stepper.key === 'space' && (
            <SpaceStep
              property={property}
              rooms={rooms}
              mode={mode}
              whole={whole}
              ids={ids}
              onWhole={() => {
                setWhole(true);
                setIds([]);
                setWhen((w) => ({ ...w, end: '', startTime: '' }));
              }}
              onToggle={toggleRoom}
            />
          )}
          {needsSpace && stepper.key !== 'space' && (
            <div className="rv-yours">
              <span>
                <small>Your space</small>
                <b>{whole ? 'The whole place' : chosen.map((r) => r.room_label || 'Room').join(', ')}</b>
              </span>
              <button type="button" onClick={() => stepper.go(0)}>
                Change
              </button>
            </div>
          )}
          {stepper.key === 'when' && (
            <WhenStep
              unit={unit}
              when={when}
              onChange={(n) => setWhen((w) => ({ ...w, ...n }))}
              busy={busy}
              roomIds={roomIds}
              rules={rules}
              minStay={minStay}
              effectiveEnd={effectiveEnd}
              conflict={conflict}
            />
          )}
          {stepper.key === 'details' && (
            <DetailsStep
              rules={rules}
              quote={quote}
              guests={guests}
              max={quote?.capacity ?? property.max_guests ?? null}
              notes={notes}
              agreed={agreed}
              onGuests={setGuests}
              onNotes={setNotes}
              onAgree={setAgreed}
            />
          )}

          {(stepper.error || submitError) && (
            <div className="form-error" role="alert">
              {stepper.error || submitError}
            </div>
          )}
          <StepperActions
            index={stepper.index}
            count={steps.length}
            last={last}
            busy={busyBtn}
            submitLabel={quote?.requires_host_acceptance ? 'Send request' : 'Continue to payment'}
            cancelTo={`/stays/${property.id}`}
            onBack={stepper.back}
            onNext={stepper.next}
          />
        </form>
        <Summary
          name={property.name}
          city={property.city}
          cover={cover?.public_url}
          quote={quote}
          loading={quoting}
          error={quoteError}
          hint="Choose your space and dates to see the total, fees included."
        />
      </div>
    </div>
  );
}
