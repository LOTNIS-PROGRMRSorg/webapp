import { PillAnchorTabs } from '@/components/tabs';
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Seo } from '@/lib/seo/seo';
import { eventApi, EventDetail } from '@/lib/api/events';
import { VoteShowcase } from '@/features/voting';
import { ReportSection } from '@/features/reports/ReportSection';
import { track, useTrackView } from '@/lib/track';
import { errText } from './eventShared';
import { TicketBuyer } from './TicketBuyer';
import {
  AboutSection,
  EventHero,
  EventNotices,
  EventSidebar,
  OrganiserTerms,
  eventJsonLd,
  ReviewsSection,
} from './detail';
import { useEventPalette } from './detail/useEventPalette';
import { Countdown } from './detail/Countdown';

// ── Event page ────────────────────────────────────────────────────────────────

export function EventPage() {
  const { slug = '' } = useParams();
  const [ev, setEv] = useState<EventDetail | null>(null);
  const [error, setError] = useState('');
  const [query] = useSearchParams();
  const wanted = query.get('tab');
  useTrackView('event', ev?.id);
  const theme = useEventPalette(ev?.cover_image_url, ev?.slug ?? slug);
  const [reviews, setReviews] = useState<Awaited<ReturnType<typeof eventApi.reviews>>>([]);
  useEffect(() => {
    setEv(null);
    setError('');
    eventApi
      .get(slug)
      .then((e) => {
        setEv(e);
        eventApi
          .reviews(slug)
          .then(setReviews)
          .catch(() => {});
      })
      .catch((e) => setError(errText(e, 'Event not found')));
  }, [slug]);

  // Links like ?tab=vote land on that section.
  useEffect(() => {
    if (!ev || !wanted) return;
    const id = wanted === 'tickets' || wanted === 'about' || wanted === 'vote' || wanted === 'reviews' ? wanted : null;
    if (id) window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }), 50);
  }, [ev, wanted]);

  if (error)
    return (
      <div className="page">
        <Link className="back-link" to="/events">
          ← All events
        </Link>
        <div className="error-state">{error}</div>
      </div>
    );
  if (!ev)
    return (
      <div className="page evd evd-loading" aria-busy="true" aria-label="Loading event details">
        <div className="skeleton-hero" />
      </div>
    );

  const cancelled = ev.status === 'cancelled';
  const ended = new Date(ev.ends_at) < new Date();
  const sections = [
    { id: 'about', label: 'About' },
    { id: 'tickets', label: cancelled || ended ? 'Ticket information' : 'Tickets' },
    ...(ev.voting ? [{ id: 'vote', label: 'Vote' }] : []),
    { id: 'reviews', label: `Reviews${ev.rating ? ` (${ev.rating.count})` : ''}` },
  ];

  return (
    <div className="page evd" style={theme}>
      <div className="evd-backdrop" aria-hidden="true" />
      <Seo
        title={`${ev.title} — tickets, ${ev.city}`}
        description={ev.summary || ev.description.slice(0, 160)}
        path={`/events/${ev.slug}`}
        image={ev.cover_image_url}
        imageAlt={ev.title}
        type="article"
        jsonLd={[eventJsonLd(ev)]}
        noindex={ev.status !== 'published'}
      />
      <Link className="back-link" to="/events">
        ← All events
      </Link>
      <EventNotices ev={ev} />
      <EventHero ev={ev} canBuy={!cancelled && !ended && ev.status === 'published'} />
      <PillAnchorTabs
        label="Event sections"
        sections={sections}
        onJump={(id) => {
          if (id === 'tickets') track('event', ev.id, 'click_tickets');
          if (id === 'vote') track('event', ev.id, 'click_vote');
        }}
      />
      <div className="evd-layout">
        <aside className="evd-side" aria-label="Tickets and event information">
          <section className="evd-ticket-panel evd-card" id="tickets">
            <div className="evd-ticket-panel-heading">
              <span className="eyebrow">{cancelled || ended ? 'Event information' : 'Make it yours'}</span>
              <h2>{cancelled || ended ? 'Ticket information' : 'Choose your tickets'}</h2>
            </div>
            <Countdown gateAt={ev.doors_open_at || ev.starts_at} endsAt={ev.ends_at} />
            <TicketBuyer ev={ev} disabled={cancelled || ended || ev.status !== 'published'} />
            <OrganiserTerms ev={ev} />
          </section>
          <EventSidebar ev={ev} />
        </aside>
        <div className="evd-main">
          <AboutSection ev={ev} />
          {ev.voting && <VoteShowcase ev={ev} />}
          <ReviewsSection ev={ev} reviews={reviews} />
        </div>
      </div>
      <ReportSection kind="event" target={{ event_id: ev.id }} subject={ev.title} />
    </div>
  );
}
