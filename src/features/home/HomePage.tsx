import '@/features/home/home.css';
import { ArrowRight, CalendarCheck2, Search, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useReveal } from '@/features/stays/bookingUi';
import { primaryImage } from '@/lib/format';
import { DEFAULT_DESCRIPTION, organizationLd, Seo, websiteLd } from '@/lib/seo/seo';
import { useHomeEvents, useHomeStays } from './homeShared';
import { Hero } from './Hero';
import { HeroSearch } from './HeroSearch';
import { LinesGrid, Providers } from './LinesGrid';
import { StayRail } from './StayRail';
import { EventRail } from './EventRail';

export function HomePage() {
  const { stays, source, loading } = useHomeStays();
  const { events, loading: eventsLoading } = useHomeEvents();
  const heroStay = source === 'featured' ? stays.find((stay) => primaryImage(stay)) : undefined;
  useReveal(loading || eventsLoading);
  return (
    <div className="lp">
      <Seo
        title="Rent spaces and buy event tickets in Ghana"
        description={DEFAULT_DESCRIPTION}
        path="/"
        jsonLd={[organizationLd(), websiteLd()]}
      />
      <Hero heroStay={heroStay} />
      <HeroSearch />
      <LinesGrid />
      {(loading || stays.length > 0) && <StayRail stays={stays} source={source} loading={loading} />}
      {(eventsLoading || events.length > 0) && <EventRail events={events} loading={eventsLoading} />}
      <Providers />
      <section className="lp-how-home lp-container reveal" aria-labelledby="lp-how-home-title">
        <div className="lp-how-home-intro">
          <span className="lp-eyebrow">Simple by design</span>
          <h2 id="lp-how-home-title">How Lotnis works.</h2>
          <p>Everything you need to find your next place, plan your next experience, or share what you offer.</p>
          <Link className="lp-text-link" to="/how-it-works">
            See the full guide <ArrowRight size={15} />
          </Link>
        </div>
        <ol className="lp-how-home-steps">
          <li>
            <span className="lp-how-home-icon">
              <Search size={20} />
            </span>
            <div>
              <span className="lp-how-home-number">01</span>
              <h3>Discover</h3>
              <p>Browse trusted spaces and events in the places you care about.</p>
            </div>
          </li>
          <li>
            <span className="lp-how-home-icon">
              <CalendarCheck2 size={20} />
            </span>
            <div>
              <span className="lp-how-home-number">02</span>
              <h3>Book or connect</h3>
              <p>See clear details, prices, availability, and provider information.</p>
            </div>
          </li>
          <li>
            <span className="lp-how-home-icon">
              <ShieldCheck size={20} />
            </span>
            <div>
              <span className="lp-how-home-number">03</span>
              <h3>Enjoy with confidence</h3>
              <p>Pay securely with straightforward policies and support when you need it.</p>
            </div>
          </li>
        </ol>
      </section>
      <section className="lp-final-cta lp-container reveal" aria-labelledby="lp-final-cta-title">
        <div className="lp-final-cta-copy">
          <span className="lp-eyebrow">Make your next move</span>
          <h2 id="lp-final-cta-title">Find your place in Ghana.</h2>
          <p>
            Looking for a space, planning an event, or offering something people need? Lotnis gives you one trusted
            place to start.
          </p>
          <div className="lp-final-cta-actions">
            <Link className="lp-btn lp-btn-light" to="/explore">
              Find a space <ArrowRight size={17} />
            </Link>
            <Link className="lp-btn lp-btn-ghost" to="/host">
              Become a host
            </Link>
          </div>
        </div>
        <div className="lp-final-cta-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </section>
    </div>
  );
}

export default HomePage;
