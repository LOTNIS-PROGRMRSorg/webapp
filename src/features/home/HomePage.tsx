import '@/features/home/home.css';
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
    </div>
  );
}

export default HomePage;
