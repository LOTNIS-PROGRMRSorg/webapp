import { colors } from '@/theme';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BedDouble,
  Bath,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  MapPin,
  ShieldCheck,
  Star,
  Users,
  X,
} from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, getSession } from '@/lib/api';
import { bookingMode, liveRooms, Photo, sortedImages, useReveal } from '@/features/stays/bookingUi';
import { money, periodLabel, policyLine } from '@/lib/format';
import { breadcrumbLd, clip, placeLd, propertyLd, Seo } from '@/lib/seo/seo';
import { loadMaps, mapsEnabled } from '@/lib/maps/maps';
import { mapsLink } from '@/lib/maps/places';
import { SpaceFacts, startingPrice } from '@/components/cards/ListingCard';
import { HostCard } from '@/components/cards';
import { ReportSection } from '@/features/reports/ReportSection';
import { track, useTrackView } from '@/lib/track';
import type { CatalogOptions, Property, PropertyImage, Room } from '@/types';

function useProperty(id: string) {
  const [property, setProperty] = useState<Property | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api
      .getProperty(id)
      .then(setProperty)
      .catch((e) => setError(e.message));
  }, [id]);
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
function SpaceCard({
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

/** Area map with a soft circle (about 300 m) so the page shows where, without a pin on the doorstep. */
function StayMap({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const el = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!mapsEnabled || !el.current) return;
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
  }, [lat, lng]);
  return (
    <div className="stay-map">
      {mapsEnabled && !failed ? (
        <div ref={el} className="stay-map-canvas" role="img" aria-label={`Map of the area around ${label}`} />
      ) : null}
      <a className="button button-secondary" href={mapsLink(lat, lng)} target="_blank" rel="noreferrer">
        Open in Google Maps ↗
      </a>
    </div>
  );
}

export function StayPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { property, error } = useProperty(id);
  const [catalog, setCatalog] = useState<CatalogOptions | null>(null);
  useEffect(() => {
    api
      .getCatalog()
      .then(setCatalog)
      .catch(() => {});
  }, []);
  useReveal(property?.id);
  useTrackView('property', property?.id);

  const rooms = useMemo(() => (property ? liveRooms(property) : []), [property]);
  if (error)
    return (
      <div className="page">
        <Seo title="Listing not found" description="This listing is no longer available." noindex follow />
        <div className="error-state">{error}</div>
      </div>
    );
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
  const reserve = (roomId?: string) => {
    track('property', property.id, 'click_book');
    const target = `/reserve/${property.id}${roomId ? `?room=${roomId}` : ''}`;
    navigate(getSession() ? target : `/auth?next=${encodeURIComponent(target)}`);
  };
  const per = periodLabel(property.pricing_period);
  const canBookWhole = mode !== 'rooms';

  const kind = property.sub_type ? property.sub_type.charAt(0).toUpperCase() + property.sub_type.slice(1) : 'Space';
  const where = [property.city, property.country].filter(Boolean).join(', ');
  const priceText = startingPrice(property).replace(/^From /, 'from ');
  const noun = property.sub_type ?? 'space';
  const article = /^[aeiou]/i.test(noun) ? 'an' : 'a';
  const blurb = property.description ? clip(property.description, 75).replace(/[.…]*$/, '') + '. ' : '';
  const seoDesc = `Rent ${property.name}, ${article} ${noun} in ${where || 'Ghana'}, ${priceText}. ${blurb}Verified host, clear refunds, pay by mobile money.`;
  return (
    <div className="page stay">
      <Seo
        title={`${property.name} — ${kind} for rent in ${property.city ?? 'Ghana'}`}
        description={seoDesc}
        path={`/stays/${property.id}`}
        image={images[0]?.public_url}
        imageAlt={`${property.name} in ${where}`}
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
            { name: property.name, path: `/stays/${property.id}` },
          ]),
        ]}
      />
      <Link className="back-link" to="/explore">
        ← All stays
      </Link>
      <div className="stay-head">
        <div>
          <span className="eyebrow">
            {property.sub_type || 'Space'} · {property.city}
          </span>
          <h1>{property.name}</h1>
          <p className="stay-loc">
            <MapPin size={15} /> {property.formatted_address || `${property.city}, ${property.country}`}
            {property.rating ? (
              <span className="stay-rate">
                <Star size={14} fill="currentColor" /> {property.rating.toFixed(1)}
                {property.review_count ? ` · ${property.review_count} reviews` : ''}
              </span>
            ) : null}
          </p>
        </div>
      </div>

      {property.is_paused && (
        <div className="callout callout-warn">
          <div>
            <b>Not taking bookings right now</b>
            <p>{property.pause_reason || 'The host has paused this listing for the moment. Check back soon.'}</p>
          </div>
        </div>
      )}
      <Mosaic images={images} propertyId={property.id} name={property.name} />

      <div className="stay-grid">
        <div className="stay-main">
          <section className="reveal">
            <SpaceFacts property={property} />
            <p className="stay-desc">
              {property.description || property.tagline || 'A welcoming place to stay, listed on Lotnis.'}
            </p>
            <ul className="trust-list">
              <li>
                <ShieldCheck size={16} /> Verified host and approved listing
              </li>
              <li>
                <ShieldCheck size={16} /> See the full price before you pay
              </li>
              {property.requires_host_acceptance && (
                <li>
                  <ShieldCheck size={16} /> The host confirms each request within 48 hours
                </li>
              )}
            </ul>
          </section>

          {rooms.length > 0 && (
            <section id="spaces" className="stay-section">
              <h2 className="reveal">Choose your space</h2>
              <div className="space-list-cards">
                {canBookWhole && (
                  <SpaceCard
                    title={rooms.length ? 'The whole property' : property.name}
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
                    onSelect={() => reserve()}
                    cta="Select whole property"
                  />
                )}
                {rooms.map((room: Room) => (
                  <SpaceCard
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
                    onSelect={() => reserve(room.id)}
                    cta="Select this room"
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
              <p className="stay-desc" style={{ marginBottom: 12 }}>
                <MapPin size={16} style={{ verticalAlign: '-2px' }} />{' '}
                {property.formatted_address ||
                  [property.street_address, property.city, property.state, property.country].filter(Boolean).join(', ')}
              </p>
              {property.latitude != null && property.longitude != null ? (
                <StayMap lat={Number(property.latitude)} lng={Number(property.longitude)} label={property.name} />
              ) : (
                <p className="muted-inline">The host hasn't pinned this space on the map yet.</p>
              )}
              <p className="muted-inline">
                Browse more in{' '}
                <Link to={`/in/${(property.city ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
                  {property.city}
                </Link>
                .
              </p>
            </section>
          )}

          <section className="stay-section reveal">
            <h2>Your host</h2>
            <HostCard host={property.host ?? null} label="Hosted by" />
          </section>

          {policy && (
            <section className="stay-section reveal">
              <h2>Refund policy · {policy.name}</h2>
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
          <div className="buy-card">
            <small>{rooms.length && !canBookWhole ? 'Rooms from' : 'From'}</small>
            <div className="buy-price">{startingPrice(property).replace(/^From /, '')}</div>
            {property.security_deposit ? (
              <p className="muted-inline">Refundable deposit {money(property.currency, property.security_deposit)}</p>
            ) : null}
            {rooms.length > 0 && !canBookWhole ? (
              <a className="button button-primary button-wide" href="#spaces">
                Choose a room <ArrowRight size={16} />
              </a>
            ) : (
              <button
                className="button button-primary button-wide"
                disabled={property.is_paused}
                onClick={() => reserve()}
              >
                {property.is_paused ? (
                  'Not available right now'
                ) : (
                  <>
                    Reserve dates <ArrowRight size={16} />
                  </>
                )}
              </button>
            )}
            <ul className="buy-points">
              <li>No charge until you confirm</li>
              <li>Pay by mobile money or card</li>
              <li>Free, clear refund rules</li>
            </ul>
          </div>
        </aside>
      </div>
      <ReportSection kind="property" target={{ property_id: property.id }} subject={property.name} />
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
