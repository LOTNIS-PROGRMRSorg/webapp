import { colors } from '@/theme';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BedDouble,
  Bath,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  Heart,
  MapPin,
  Star,
  Users,
  X,
} from 'lucide-react';
import { useAuthModal } from '@/features/auth/AuthModal';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, getSession } from '@/lib/api';
import { bookingMode, liveRooms, Photo, sortedImages, useReveal } from '@/features/stays/bookingUi';
import { money, periodLabel, policyLine } from '@/lib/format';
import { breadcrumbLd, clip, placeLd, propertyLd, Seo } from '@/lib/seo/seo';
import { loadMaps, mapsAuthFailed, mapsEnabled } from '@/lib/maps/maps';
import { mapsLink } from '@/lib/maps/places';
import { startingPrice } from '@/components/cards/ListingCard';
import { HostCard } from '@/components/cards';
import { ShareMenu } from '@/components/share/ShareMenu';
import { propertyShare } from '@/lib/shareCopy';
import { ReportSection } from '@/features/reports/ReportSection';
import { Amenities } from '@/features/stays/Amenities';
import { areaOf } from '@/features/stays/explore/SpaceCard';
import { rememberViewed, useSavedSpaces } from '@/features/stays/explore/spaceMemory';
import { BookingCard, QuoteSummary, ReserveChoice } from '@/features/stays/stay/BookingCard';
import { Highlights } from '@/features/stays/stay/Highlights';
import { NearbySpaces } from '@/features/stays/stay/NearbySpaces';
import '@/features/stays/stay/stay.css';
import { track, useTrackView } from '@/lib/track';
import type { CatalogOptions, Property, PropertyImage, Room } from '@/types';

function useProperty(id: string, attempt = 0) {
  const [property, setProperty] = useState<Property | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    setError('');
    api
      .getProperty(id)
      .then(setProperty)
      .catch((e) => setError(e.message));
  }, [id, attempt]);
  return { property, error };
}

// ── Gallery mosaic: a big cover and four more, with a route to see the rest ──
function Mosaic({ images, propertyId, name }: { images: PropertyImage[]; propertyId: string; name: string }) {
  const shown = images.slice(0, 5);
  return (
    <div className={`mosaic mosaic-${Math.min(shown.length, 5)}`}>
      {shown.length === 0 && <Photo className="mosaic-cell mosaic-main" alt={name} />}
      {shown.map((img, i) => (
        <Link
          key={img.id ?? img.public_url}
          to={`/stays/${propertyId}/photos?i=${i}`}
          className={`mosaic-cell ${i === 0 ? 'mosaic-main' : ''}`}
          aria-label={`Open photo ${i + 1} of ${images.length}`}
        >
          <Photo src={img.public_url} alt={`${name} — photo ${i + 1}`} />
        </Link>
      ))}
      {images.length > 1 && (
        <Link className="mosaic-all" to={`/stays/${propertyId}/photos`}>
          <Grid3x3 size={16} /> Show all {images.length} photos
        </Link>
      )}
    </div>
  );
}

// ── A bookable space (room or whole property) as a card with pictures ───────
function RoomCard({
  title,
  subtitle,
  images,
  price,
  per,
  meta,
  onSelect,
  cta,
}: {
  title: string;
  subtitle?: string;
  images: PropertyImage[];
  price: string;
  per: string;
  meta: Array<[React.ReactNode, string]>;
  onSelect: () => void;
  cta: string;
}) {
  const [i, setI] = useState(0);
  const img = images[i];
  return (
    <article className="space-card reveal">
      <div className="space-photo">
        <Photo src={img?.public_url} alt={title} />
        {images.length > 1 && (
          <>
            <button
              className="space-nav space-prev"
              aria-label="Previous photo"
              onClick={() => setI((n) => (n - 1 + images.length) % images.length)}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              className="space-nav space-next"
              aria-label="Next photo"
              onClick={() => setI((n) => (n + 1) % images.length)}
            >
              <ChevronRight size={18} />
            </button>
            <span className="space-dots">
              {images.map((_, n) => (
                <i key={n} className={n === i ? 'on' : ''} />
              ))}
            </span>
          </>
        )}
      </div>
      <div className="space-body">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
          <ul className="space-meta">
            {meta.map(([icon, text]) => (
              <li key={text}>
                {icon}
                {text}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-buy">
          <strong>{price}</strong>
          <small>per {per}</small>
          <button className="button button-primary" onClick={onSelect}>
            {cta} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}

/** Area map with a soft circle (about 300 m) so the page shows where, without a pin on the doorstep.
 *  If Google Maps can't load (no key, rejected key), it falls back to a plain area card. */
function StayMap({ lat, lng, label, area }: { lat: number; lng: number; label: string; area: string }) {
  const el = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(!mapsEnabled || mapsAuthFailed());
  useEffect(() => {
    const fail = () => setFailed(true);
    window.addEventListener('lotnis-maps-auth-failed', fail);
    return () => window.removeEventListener('lotnis-maps-auth-failed', fail);
  }, []);
  useEffect(() => {
    if (failed || !el.current) return;
    let live = true;
    loadMaps()
      .then(async (google) => {
        if (!live || !el.current) return;
        const { Map } = await google.maps.importLibrary('maps');
        const map = new Map(el.current, {
          center: { lat, lng },
          zoom: 15,
          streetViewControl: false,
          mapTypeControl: false,
          gestureHandling: 'cooperative',
        });
        new google.maps.Circle({
          map,
          center: { lat, lng },
          radius: 300,
          strokeColor: colors.ink,
          strokeOpacity: 0.9,
          strokeWeight: 2,
          fillColor: colors.good,
          fillOpacity: 0.22,
        });
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [lat, lng, failed]);
  return (
    <div className="stay-map">
      {/* Keys make React swap the element, dropping whatever Google drew into the map div. */}
      {failed ? (
        <div className="st-area-card" key="area">
          <span>
            <MapPin size={22} />
          </span>
          <div>
            <b>{area}</b>
            <small>The exact spot is shown in Google Maps.</small>
          </div>
        </div>
      ) : (
        <div ref={el} key="map" className="stay-map-canvas" role="img" aria-label={`Map of the area around ${label}`} />
      )}
      <a className="button button-secondary" href={mapsLink(lat, lng)} target="_blank" rel="noreferrer">
        Open in Google Maps ↗
      </a>
    </div>
  );
}

/** Long descriptions open in place rather than pushing everything else down. */
function Description({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 420;
  return (
    <div className="st-desc">
      <p className={long && !open ? 'st-desc-clamp' : undefined}>{text}</p>
      {long && (
        <button type="button" className="st-link" onClick={() => setOpen((o) => !o)}>
          {open ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}

export function StayPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { openSignIn } = useAuthModal();
  const [attempt, setAttempt] = useState(0);
  const { property, error } = useProperty(id, attempt);
  const [catalog, setCatalog] = useState<CatalogOptions | null>(null);
  const [roomChoice, setRoomChoice] = useState<string | undefined>();
  const [sheet, setSheet] = useState(false);
  const [summary, setSummary] = useState<QuoteSummary>({ quote: null, ready: false });
  const { isSaved, toggle } = useSavedSpaces();
  useEffect(() => {
    api
      .getCatalog()
      .then(setCatalog)
      .catch(() => {});
  }, []);
  // The cancellation section waits on the catalog, so look for new sections again once it arrives.
  useReveal(`${property?.id}:${catalog ? 1 : 0}`);
  useTrackView('property', property?.id);
  // Opening a listing directly (a shared link) also counts as "recently viewed".
  useEffect(() => {
    if (property) rememberViewed(property);
  }, [property]);
  // The phone booking sheet: stop the page scrolling behind it, and let Escape close it.
  useEffect(() => {
    if (!sheet) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheet(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [sheet]);

  const rooms = useMemo(() => (property ? liveRooms(property) : []), [property]);
  if (error) {
    const gone = /not found|404/i.test(error);
    return (
      <div className="page">
        <Seo
          title={gone ? 'Listing not found' : 'Couldn’t load this space'}
          description="This listing is no longer available."
          noindex
          follow
        />
        <div className="st-problem">
          <h1>{gone ? 'This space is no longer listed' : 'We couldn’t load this space'}</h1>
          <p>
            {gone
              ? 'The host may have removed it, or the link is out of date.'
              : 'This is usually a brief connection problem. Please try again.'}
          </p>
          <div>
            {!gone && (
              <button type="button" className="button button-primary" onClick={() => setAttempt((n) => n + 1)}>
                Try again
              </button>
            )}
            <Link className="button button-secondary" to="/explore">
              Browse other spaces
            </Link>
          </div>
        </div>
      </div>
    );
  }
  if (!property)
    return (
      <div className="page">
        <div className="skeleton-hero" />
      </div>
    );

  const mode = bookingMode(property);
  const images = sortedImages(property.property_images);
  const policy =
    catalog?.cancellation_policies.find((p) => p.id === property.cancellation_policy_id) ??
    catalog?.cancellation_policies.find((p) => p.code === property.cancellation_policy);
  const reserve = ({ roomId, start, end, qty }: ReserveChoice = {}) => {
    track('property', property.id, 'click_book');
    const q = new URLSearchParams();
    if (roomId) q.set('room', roomId);
    if (start) q.set('start', start);
    if (end) q.set('end', end);
    if (qty) q.set('qty', String(qty));
    const target = `/reserve/${property.id}${q.size ? `?${q}` : ''}`;
    if (getSession()) navigate(target);
    else openSignIn(target);
  };
  // Choosing from the room list fills in the booking card (on phones it opens it).
  const pickRoom = (roomId: string) => {
    setRoomChoice(roomId);
    if (window.matchMedia('(max-width: 1000px)').matches) setSheet(true);
    else document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const per = periodLabel(property.pricing_period);
  const canBookWhole = mode !== 'rooms';

  const name = property.name.trim();
  const kind = property.sub_type
    ? (property.sub_type.charAt(0).toUpperCase() + property.sub_type.slice(1)).replace(/-/g, ' ')
    : 'Space';
  const where = [property.city, property.country].filter(Boolean).join(', ');
  const area = areaOf(property, catalog?.locations.cities ?? []);
  const place = [area, property.city].filter(Boolean).join(', ');
  const region = property.state?.replace(/ Region$/, '');
  const priceText = startingPrice(property).replace(/^From /, 'from ');
  const noun = property.sub_type ?? 'space';
  const article = /^[aeiou]/i.test(noun) ? 'an' : 'a';
  const blurb = property.description ? clip(property.description, 75).replace(/[.…]*$/, '') + '. ' : '';
  const seoDesc = `Rent ${name}, ${article} ${noun} in ${where || 'Ghana'}, ${priceText}. ${blurb}Verified host, clear refunds, pay by mobile money.`;
  const citySlug = (property.city ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const saved = isSaved(property.id);
  const share = propertyShare(property, startingPrice(property));
  const barPrice = summary.quote
    ? { main: money(summary.quote.currency, summary.quote.final_amount), sub: `Total · ${summary.quote.stay_label}` }
    : { main: startingPrice(property).replace(/\.00(?= )/, ''), sub: 'Add dates for the total' };

  return (
    <div className="page stay st-page">
      <Seo
        title={`${name} — ${kind} for rent in ${property.city ?? 'Ghana'}`}
        description={seoDesc}
        path={`/stays/${property.id}`}
        image={images[0]?.public_url}
        imageAlt={`${name} in ${where}`}
        type="product"
        jsonLd={[
          propertyLd(property),
          placeLd(property),
          breadcrumbLd([
            { name: 'Home', path: '/' },
            { name: 'Explore', path: '/explore' },
            ...(property.sub_type
              ? [{ name: `${kind}s for rent`, path: `/rent/${property.sub_type.toLowerCase()}` }]
              : []),
            { name, path: `/stays/${property.id}` },
          ]),
        ]}
      />

      <nav className="crumbs" aria-label="Breadcrumb">
        <span>
          <Link to="/explore">Spaces</Link>
        </span>
        {property.city && (
          <span>
            <ChevronRight size={14} />
            <Link to={`/in/${citySlug}`}>{property.city}</Link>
          </span>
        )}
        <span>
          <ChevronRight size={14} />
          <b aria-current="page">{name}</b>
        </span>
      </nav>

      <header className="st-head">
        <div>
          <h1>{name}</h1>
          <p className="st-sub">
            <span>{kind}</span>
            {place && (
              <span>
                <MapPin size={14} /> {place}
              </span>
            )}
            {property.rating ? (
              <span className="st-rate">
                <Star size={14} fill="currentColor" /> {property.rating.toFixed(1)}
                {property.review_count ? <small>({property.review_count} reviews)</small> : null}
              </span>
            ) : (
              <span className="st-new">New listing</span>
            )}
          </p>
        </div>
        <div className="st-actions">
          <ShareMenu
            url={`${window.location.origin}/stays/${property.id}`}
            title={share.title}
            text={share.description}
            label="Share"
            onShare={() => track('property', property.id, 'click_share')}
          />
          <button
            type="button"
            className={`st-save${saved ? ' on' : ''}`}
            aria-pressed={saved}
            onClick={() => toggle(property)}
          >
            <Heart size={17} /> {saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </header>

      {property.is_paused && (
        <div className="callout callout-warn">
          <div>
            <b>Not taking bookings right now</b>
            <p>{property.pause_reason || 'The host has paused this listing for the moment. Check back soon.'}</p>
          </div>
        </div>
      )}
      <Mosaic images={images} propertyId={property.id} name={name} />

      <div className="stay-grid">
        <div className="stay-main">
          <section className="reveal">
            <Highlights property={property} />
          </section>

          <section className="stay-section reveal" aria-labelledby="st-about">
            <h2 id="st-about">About this space</h2>
            <Description text={property.description || property.tagline || 'A welcoming place, listed on Lotnis.'} />
          </section>

          <Amenities property={property} />

          {rooms.length > 0 && (
            <section id="spaces" className="stay-section">
              <h2 className="reveal">Choose your space</h2>
              <div className="space-list-cards">
                {canBookWhole && (
                  <RoomCard
                    title={rooms.length ? 'The whole property' : name}
                    subtitle={rooms.length ? 'Exclusive use — every room is yours for the dates.' : undefined}
                    images={images}
                    price={property.price != null ? money(property.currency, property.price) : 'Price on request'}
                    per={per}
                    meta={[
                      [
                        <Users size={14} key="u" />,
                        property.max_guests ? `Up to ${property.max_guests} guests` : 'Whole place',
                      ],
                      ...(property.bedrooms != null
                        ? [
                            [
                              <BedDouble size={14} key="b" />,
                              `${property.bedrooms} bedroom${property.bedrooms === 1 ? '' : 's'}`,
                            ] as [React.ReactNode, string],
                          ]
                        : []),
                    ]}
                    onSelect={() => pickRoom('')}
                    cta="Choose whole property"
                  />
                )}
                {rooms.map((room: Room) => (
                  <RoomCard
                    key={room.id}
                    title={room.room_label || 'Room'}
                    subtitle={room.description || undefined}
                    images={sortedImages(room.room_images)}
                    price={money(room.currency || property.currency, room.price_per_period)}
                    per={periodLabel(room.pricing_period || property.pricing_period)}
                    meta={[
                      ...(room.capacity
                        ? [[<Users size={14} key="u" />, `Sleeps ${room.capacity}`] as [React.ReactNode, string]]
                        : []),
                      ...(room.bed_type
                        ? [[<BedDouble size={14} key="b" />, room.bed_type] as [React.ReactNode, string]]
                        : []),
                      ...(room.private_bathroom != null
                        ? [
                            [
                              <Bath size={14} key="a" />,
                              room.private_bathroom ? 'Private bathroom' : 'Shared bathroom',
                            ] as [React.ReactNode, string],
                          ]
                        : []),
                      ...(room.size_sqm ? [[null, `${room.size_sqm} m²`] as [React.ReactNode, string]] : []),
                    ]}
                    onSelect={() => pickRoom(room.id)}
                    cta="Choose this room"
                  />
                ))}
              </div>
              {mode === 'both' && rooms.length > 0 && (
                <p className="muted-inline">
                  Booking a room blocks the whole property for those dates, and booking the whole property blocks every
                  room.
                </p>
              )}
            </section>
          )}

          {(property.city || property.formatted_address) && (
            <section className="stay-section reveal" aria-labelledby="stay-where">
              <h2 id="stay-where">Where you'll be</h2>
              <p className="st-where">
                <b>{[place || property.city, region].filter(Boolean).join(' · ')}</b>
                <span>
                  {property.formatted_address ||
                    [property.street_address, property.city, property.state, property.country]
                      .filter(Boolean)
                      .join(', ')}
                </span>
              </p>
              {property.latitude != null && property.longitude != null ? (
                <StayMap
                  lat={Number(property.latitude)}
                  lng={Number(property.longitude)}
                  label={name}
                  area={place || property.city || 'This area'}
                />
              ) : (
                <p className="muted-inline">The host hasn't pinned this space on the map yet.</p>
              )}
            </section>
          )}

          <section className="stay-section reveal">
            <h2>Your host</h2>
            <HostCard host={property.host ?? null} label="Hosted by" />
          </section>

          {policy && (
            <section className="stay-section reveal" id="refunds">
              <h2>Cancellation · {policy.name}</h2>
              <ul className="policy-ticks">
                {policy.tiers.map((t, i) => (
                  <li key={t.days_before_start}>{policyLine(t, policy.tiers[i - 1])}</li>
                ))}
              </ul>
              <p className="muted-inline">
                The Lotnis service fee isn't refunded if you cancel; any deposit is returned. If the host cancels, you
                get everything back. If you leave after moving in, a short notice period applies —{' '}
                <Link to="/refund-policy">read the full policy</Link>.
              </p>
            </section>
          )}
        </div>

        <aside className="stay-aside">
          {sheet && <div className="st-scrim" onClick={() => setSheet(false)} role="presentation" />}
          <div
            id="book"
            className={`st-book${sheet ? ' open' : ''}`}
            role={sheet ? 'dialog' : undefined}
            aria-modal={sheet || undefined}
            aria-label="Book this space"
          >
            <div className="st-book-head">
              <b>Book {name}</b>
              <button type="button" onClick={() => setSheet(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <BookingCard
              property={property}
              rooms={rooms}
              mode={mode}
              policy={policy}
              initialRoomId={roomChoice}
              onReserve={reserve}
              onQuote={setSummary}
              onPolicy={() => setSheet(false)}
            />
          </div>
        </aside>
      </div>

      <NearbySpaces property={property} cities={catalog?.locations.cities ?? []} />

      <ReportSection kind="property" target={{ property_id: property.id }} subject={name} />

      {/* Phones: price and the next step are always one tap away. */}
      <div className="st-bar">
        <div>
          <b>{barPrice.main}</b>
          <small>{barPrice.sub}</small>
        </div>
        <button type="button" disabled={property.is_paused} onClick={() => setSheet(true)}>
          {property.is_paused ? 'Unavailable' : summary.quote ? 'Review & book' : 'Check dates'}
        </button>
      </div>
    </div>
  );
}

// ── Full photo gallery route ────────────────────────────────────────────────
export function PhotosPage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const { property, error } = useProperty(id);
  const [open, setOpen] = useState<number | null>(null);

  const groups = useMemo(() => {
    if (!property) return [] as Array<{ title: string; images: PropertyImage[] }>;
    const g = [{ title: 'The place', images: sortedImages(property.property_images) }];
    for (const r of liveRooms(property)) {
      const imgs = sortedImages(r.room_images);
      if (imgs.length) g.push({ title: r.room_label || 'Room', images: imgs });
    }
    return g.filter((x) => x.images.length);
  }, [property]);
  const flat = useMemo(() => groups.flatMap((g) => g.images), [groups]);

  useEffect(() => {
    const i = Number(params.get('i'));
    if (property && params.has('i') && flat[i]) setOpen(i);
  }, [property]); // eslint-disable-line
  const step = useCallback(
    (d: number) => setOpen((n) => (n === null ? n : (n + d + flat.length) % flat.length)),
    [flat.length],
  );
  useEffect(() => {
    if (open === null) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [open, step]);

  if (error)
    return (
      <div className="page">
        <Seo title="Photos unavailable" description="These photos aren't available." noindex />
        <div className="error-state">{error}</div>
      </div>
    );
  if (!property)
    return (
      <div className="page">
        <div className="empty-state">Loading photos…</div>
      </div>
    );
  let counter = -1;
  return (
    <div className="page">
      <Seo
        title={`${property.name} — all photos`}
        description={`Photo gallery for ${property.name} in ${property.city ?? 'Ghana'}.`}
        path={`/stays/${id}`}
        image={flat[0]?.public_url}
        noindex
        follow
      />
      <Link className="back-link" to={`/stays/${id}`}>
        ← Back to {property.name}
      </Link>
      <div className="page-head">
        <div>
          <span className="eyebrow">Photos</span>
          <h1>{property.name}</h1>
        </div>
      </div>
      {flat.length === 0 && <div className="empty-state">The host hasn't added photos yet.</div>}
      {groups.map((group) => (
        <section key={group.title} className="photo-group">
          <h2>{group.title}</h2>
          <div className="photo-grid">
            {group.images.map((img) => {
              counter += 1;
              const idx = counter;
              return (
                <button
                  key={img.id ?? img.public_url}
                  className="photo-tile"
                  onClick={() => setOpen(idx)}
                  aria-label={`Open photo ${idx + 1}`}
                >
                  <Photo src={img.public_url} alt={`${group.title} photo`} />
                </button>
              );
            })}
          </div>
        </section>
      ))}
      {open !== null && flat[open] && (
        <div className="lightbox" role="dialog" aria-label="Photo viewer" onClick={() => setOpen(null)}>
          <button className="lightbox-x" aria-label="Close" onClick={() => setOpen(null)}>
            <X size={20} />
          </button>
          <button
            className="lb-nav lb-prev"
            aria-label="Previous"
            onClick={(e) => {
              e.stopPropagation();
              step(-1);
            }}
          >
            <ChevronLeft size={26} />
          </button>
          <img src={flat[open].public_url} alt="" onClick={(e) => e.stopPropagation()} />
          <button
            className="lb-nav lb-next"
            aria-label="Next"
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
          >
            <ChevronRight size={26} />
          </button>
          <span className="lb-count">
            {open + 1} / {flat.length}
          </span>
        </div>
      )}
    </div>
  );
}
