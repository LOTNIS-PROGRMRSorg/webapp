import { useCallback, useEffect, useRef, useState } from 'react';
import { BadgeCheck, Building2, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice, periodLabel, primaryImage } from '@/lib/format';
import type { Property } from '@/types';
import { PERIODS, Period, StaySource } from './homeShared';

export function StayRail({ stays, source, loading }: { stays: Property[]; source: StaySource; loading: boolean }) {
  const [period, setPeriod] = useState<Period | 'all'>('all');
  const railRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: true });
  const periodOf = (stay: Property) => (stay.pricing_period || 'day') as Period;
  const periods = PERIODS.filter(({ value }) => stays.some((stay) => periodOf(stay) === value));
  const visible = period === 'all' ? stays : stays.filter((stay) => periodOf(stay) === period);

  const updateEdges = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    setEdges({ atStart: rail.scrollLeft <= 4, atEnd: rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4 });
  }, []);
  useEffect(() => { railRef.current?.scrollTo({ left: 0 }); updateEdges(); }, [period, visible.length, loading, updateEdges]);
  useEffect(() => {
    window.addEventListener('resize', updateEdges);
    return () => window.removeEventListener('resize', updateEdges);
  }, [updateEdges]);
  const scroll = (direction: number) => {
    const rail = railRef.current;
    rail?.scrollBy({ left: direction * rail.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <section className="lp-section lp-container" aria-labelledby="lp-stays-title">
      <div className="lp-section-head">
        <div>
          <span className="lp-eyebrow">{source === 'featured' ? 'Featured spaces' : 'New spaces'}</span>
          <h2 id="lp-stays-title">{source === 'featured' ? 'Hand-picked spaces to rent' : 'Freshly listed spaces to rent'}</h2>
        </div>
        <div className="lp-head-tools">
          {periods.length > 1 && (
            <div className="lp-segmented" role="group" aria-label="Filter by length of stay">
              <button type="button" aria-pressed={period === 'all'} onClick={() => setPeriod('all')}>All</button>
              {periods.map(({ value, label }) => <button type="button" key={value} aria-pressed={period === value} onClick={() => setPeriod(value)}>{label}</button>)}
            </div>
          )}
          <Link className="lp-text-link" to={period === 'all' ? '/explore' : `/explore?pricingPeriod=${period}`}>See all</Link>
          <button type="button" className="lp-arrow" aria-label="Previous stays" disabled={edges.atStart} onClick={() => scroll(-1)}><ChevronLeft size={20} /></button>
          <button type="button" className="lp-arrow" aria-label="More stays" disabled={edges.atEnd} onClick={() => scroll(1)}><ChevronRight size={20} /></button>
        </div>
      </div>
      <div className="lp-rail" ref={railRef} onScroll={updateEdges} aria-busy={loading}>
        {loading
          ? Array.from({ length: 4 }, (_, index) => <div className="lp-stay lp-skeleton" key={index} aria-hidden="true"><div className="lp-stay-media" /><i /><i /></div>)
          : visible.map((stay) => <StayCard key={stay.id} stay={stay} />)}
      </div>
    </section>
  );
}

export function StayCard({ stay }: { stay: Property }) {
  const image = primaryImage(stay);
  const kind = stay.sub_type ? stay.sub_type.charAt(0).toUpperCase() + stay.sub_type.slice(1) : 'Stay';
  const place = [stay.city, stay.country].filter(Boolean).join(', ');
  return (
    <Link className="lp-stay" to={`/stays/${stay.id}`}>
      <div className="lp-stay-media">
        {image ? <img src={image} alt={`${stay.name} — ${kind.toLowerCase()} in ${stay.city ?? 'Ghana'}`} loading="lazy" /> : <div className="lp-stay-noimage"><Building2 size={26} />Photos coming soon</div>}
        {stay.verified && <span className="lp-badge"><BadgeCheck size={14} /> Verified</span>}
      </div>
      <div className="lp-stay-body">
        <div className="lp-stay-row">
          <h3>{stay.name}</h3>
          {stay.rating
            ? <span className="lp-rating"><Star size={13} strokeWidth={0} /> {stay.rating.toFixed(1)}{stay.review_count ? <small>({stay.review_count})</small> : null}</span>
            : <span className="lp-new">New</span>}
        </div>
        <p className="lp-stay-meta">{kind}{place ? ` · ${place}` : ''}</p>
        <p className="lp-price">
          <strong>{formatPrice(stay.currency, stay.price)}</strong>
          {stay.price != null && <span> {periodLabel(stay.pricing_period)}</span>}
        </p>
      </div>
    </Link>
  );
}
