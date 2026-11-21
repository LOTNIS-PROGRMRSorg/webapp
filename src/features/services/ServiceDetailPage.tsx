import { BadgeCheck, MapPin, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { HostCard } from '@/components/cards';
import { emojiFor } from '@/components/maps/categoryIcons';
import { MarkerMap } from '@/components/maps/MarkerMap';
import { ErrorState, LoadingState } from '@/components/ui';
import { ReportSection } from '@/features/reports/ReportSection';
import { marketApi, UNIT_NOUN, type ServiceDetail } from '@/lib/api/market';
import { money } from '@/lib/format';
import { Seo } from '@/lib/seo/seo';
import { useTrackView } from '@/lib/track';
import { RequestForm } from './RequestForm';
import './services.css';

const DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** One provider's service: who they are, what it costs, when they are free, and a form to ask for a time. */
export default function ServiceDetailPage() {
  const { id = '' } = useParams();
  const [s, setS] = useState<ServiceDetail | null>(null);
  const [error, setError] = useState('');
  const [photo, setPhoto] = useState(0);
  useTrackView('service', s?.id);
  useEffect(() => {
    setS(null);
    setError('');
    marketApi
      .detail(id)
      .then(setS)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error)
    return (
      <div className="page">
        <Link className="back-link" to="/services">
          ← All services
        </Link>
        <ErrorState>{error}</ErrorState>
      </div>
    );
  if (!s)
    return (
      <div className="page">
        <LoadingState />
      </div>
    );

  const hours = DAY.map((d, i) => ({ d, w: s.availability.filter((a) => a.weekday === i) }));
  return (
    <div className="page svc-detail">
      <Seo
        title={`${s.title} — ${s.category?.name ?? 'Service'} in ${s.city ?? 'Ghana'}`}
        description={s.summary || s.description.slice(0, 150)}
        path={`/services/${s.id}`}
        image={s.photos[0]}
      />
      <Link className="back-link" to="/services">
        ← All services
      </Link>
      {s.is_paused && (
        <div className="callout callout-warn">
          <div>
            <b>Not taking requests right now</b>
            <p>{s.pause_reason || 'The provider has paused this service for the moment.'}</p>
          </div>
        </div>
      )}
      <div className="svc-layout">
        <div className="svc-main">
          <header>
            <span className="eyebrow">
              {emojiFor(s.category?.icon)} {s.category?.name}
            </span>
            <h1>{s.title}</h1>
            <p className="svc-meta">
              <MapPin size={15} /> {s.city || 'Ghana'} · covers {s.service_radius_km} km
              {s.rating != null && (
                <span>
                  <Star size={14} fill="currentColor" /> {s.rating.toFixed(1)} ({s.review_count})
                </span>
              )}
              {s.jobs_completed > 0 && (
                <span>
                  {s.jobs_completed} job{s.jobs_completed === 1 ? '' : 's'} done on Lotnis
                </span>
              )}
            </p>
          </header>

          <div className="svc-gallery">
            {s.photos.length ? (
              <>
                <img className="svc-hero" src={s.photos[photo]} alt={s.title} />
                {s.photos.length > 1 && (
                  <div className="svc-thumbs">
                    {s.photos.map((p, i) => (
                      <button
                        key={p}
                        type="button"
                        className={i === photo ? 'on' : ''}
                        onClick={() => setPhoto(i)}
                        aria-label={`Photo ${i + 1}`}
                      >
                        <img src={p} alt="" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="svc-hero svc-hero-ph">{emojiFor(s.category?.icon)}</div>
            )}
          </div>

          <section className="svc-section">
            <h2>About this service</h2>
            <p className="svc-desc">{s.description}</p>
            {s.tags.length > 0 && (
              <ul className="fact-chips">
                {s.tags.map((t) => (
                  <li key={t}>
                    <Link to={`/services?q=${encodeURIComponent(t)}`}>{t}</Link>
                  </li>
                ))}
              </ul>
            )}
            <ul className="trust-list">
              <li>
                <BadgeCheck size={16} /> {s.provider?.verified ? 'Verified provider' : 'Provider on Lotnis'}
              </li>
              <li>
                {s.travels_to_customer ? 'Travels to you' : ''}
                {s.travels_to_customer && s.works_at_own_place ? ' · ' : ''}
                {s.works_at_own_place ? 'Works from their own place' : ''}
              </li>
              {s.languages.length > 0 && <li>Speaks {s.languages.join(', ')}</li>}
              <li>
                {money(s.currency, s.rate)} per {UNIT_NOUN[s.pricing_unit]}
                {s.allow_negotiation ? ` — open to offers (up to ${100 - s.min_offer_percent}% less)` : ''}
              </li>
            </ul>
          </section>

          <section className="svc-section">
            <h2>Provider</h2>
            <HostCard
              host={
                s.provider
                  ? { id: s.provider.id, name: s.provider.name, verified: s.provider.verified, since: s.provider.since }
                  : null
              }
              label="Offered by"
            />
          </section>

          <section className="svc-section">
            <h2>When they work</h2>
            <ul className="svc-hours">
              {hours.map(({ d, w }) => (
                <li key={d}>
                  <span>{d}</span>
                  <b>
                    {w.length
                      ? w.map((x) => `${x.start_time.slice(0, 5)}–${x.end_time.slice(0, 5)}`).join(', ')
                      : 'Closed'}
                  </b>
                </li>
              ))}
            </ul>
            <p className="muted-inline">Times are Ghana time. Pick a free time in the box to ask for it.</p>
          </section>

          {s.latitude != null && s.longitude != null && (
            <section className="svc-section">
              <h2>Where they cover</h2>
              <div className="svc-areamap">
                <MarkerMap
                  markers={[
                    {
                      kind: 'service',
                      id: s.id,
                      lat: s.latitude,
                      lng: s.longitude,
                      title: s.title,
                      subtitle: s.city ?? '',
                      price: s.rate,
                      currency: s.currency,
                      unit: s.pricing_unit,
                      icon: s.category?.icon,
                      radius_km: s.service_radius_km,
                      href: `/services/${s.id}`,
                    },
                  ]}
                  selectedKey={`service:${s.id}`}
                  initialCentre={{ lat: s.latitude, lng: s.longitude, zoom: s.service_radius_km > 25 ? 8 : 10 }}
                />
              </div>
            </section>
          )}

          <section className="svc-section">
            <h2>
              Reviews{' '}
              {s.review_count > 0 && (
                <small>
                  {s.rating?.toFixed(1)} · {s.review_count}
                </small>
              )}
            </h2>
            {s.reviews.length === 0 ? (
              <p className="muted-inline">No reviews yet. Reviews come from people who paid for a job here.</p>
            ) : (
              s.reviews.map((r) => (
                <article className="svc-review" key={r.id}>
                  <div>
                    <b>{r.reviewer}</b>{' '}
                    <span className="ev-stars">
                      {'★'.repeat(r.rating)}
                      <i>{'★'.repeat(5 - r.rating)}</i>
                    </span>{' '}
                    <small>{new Date(r.created_at).toLocaleDateString('en-GH', { dateStyle: 'medium' })}</small>
                  </div>
                  {r.comment && <p>{r.comment}</p>}
                  {r.host_reply && (
                    <p className="svc-reply">
                      <b>Reply from the provider:</b> {r.host_reply}
                    </p>
                  )}
                </article>
              ))
            )}
          </section>
          <ReportSection kind="service" target={{ service_id: s.id }} subject={s.title} />
        </div>

        <aside className="svc-side">
          {s.is_owner ? (
            <div className="svc-ask">
              <p>This is your service.</p>
              <Link className="button button-primary" to={`/host/services/${s.id}/edit`}>
                Edit it
              </Link>
            </div>
          ) : (
            <RequestForm s={s} />
          )}
        </aside>
      </div>
    </div>
  );
}
