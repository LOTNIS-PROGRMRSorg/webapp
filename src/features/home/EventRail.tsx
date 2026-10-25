import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cedisShort, fmtDate } from '@/features/events/eventUi';
import { type EventCard } from '@/lib/api/events';

export function EventRail({ events, loading }: { events: EventCard[]; loading: boolean }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: true });
  const updateEdges = useCallback(() => {
    const rail = railRef.current;
    if (rail) setEdges({ atStart: rail.scrollLeft <= 4, atEnd: rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4 });
  }, []);
  useEffect(() => { updateEdges(); }, [events.length, loading, updateEdges]);
  useEffect(() => { window.addEventListener('resize', updateEdges); return () => window.removeEventListener('resize', updateEdges); }, [updateEdges]);
  const scroll = (direction: number) => { const rail = railRef.current; rail?.scrollBy({ left: direction * rail.clientWidth * 0.8, behavior: 'smooth' }); };
  return (
    <section className="lp-section lp-container" aria-labelledby="lp-events-title">
      <div className="lp-section-head">
        <div><span className="lp-eyebrow">Upcoming events</span><h2 id="lp-events-title">What's on in Ghana</h2></div>
        <div className="lp-head-tools">
          <Link className="lp-text-link" to="/events">See all</Link>
          <button type="button" className="lp-arrow" aria-label="Previous events" disabled={edges.atStart} onClick={() => scroll(-1)}><ChevronLeft size={20} /></button>
          <button type="button" className="lp-arrow" aria-label="More events" disabled={edges.atEnd} onClick={() => scroll(1)}><ChevronRight size={20} /></button>
        </div>
      </div>
      <div className="lp-rail" ref={railRef} onScroll={updateEdges} aria-busy={loading}>
        {loading
          ? Array.from({ length: 4 }, (_, index) => <div className="lp-stay lp-skeleton" key={index} aria-hidden="true"><div className="lp-stay-media" /><i /><i /></div>)
          : events.map((ev) => (
            <Link className="lp-stay" to={`/events/${ev.slug}`} key={ev.id}>
              <div className="lp-stay-media">
                {ev.cover_image_url ? <img src={ev.cover_image_url} alt={`${ev.title} in ${ev.city}`} loading="lazy" /> : <div className="lp-stay-noimage"><Ticket size={26} /></div>}
                <span className="lp-badge">{fmtDate(ev.starts_at, { day: 'numeric', month: 'short' })}</span>
              </div>
              <div className="lp-stay-body">
                <div className="lp-stay-row"><h3>{ev.title}</h3></div>
                <p className="lp-stay-meta">{ev.category} · {ev.venue_name}, {ev.city}</p>
                <p className="lp-price"><strong>{ev.sold_out ? 'Sold out' : ev.from_price == null ? 'Tickets' : ev.from_price === 0 ? 'Free' : `From ${cedisShort(ev.from_price, ev.currency)}`}</strong></p>
              </div>
            </Link>))}
        <Link className="lp-stay lp-more" to="/events"><div className="lp-more-inner"><ArrowRight size={22} /><strong>View more events</strong></div></Link>
      </div>
    </section>
  );
}
