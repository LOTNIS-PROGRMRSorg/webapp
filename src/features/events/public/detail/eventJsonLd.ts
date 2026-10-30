import { SITE_URL } from '@/lib/seo/seo';
import type { EventDetail } from '@/lib/api/events';

/** schema.org Event markup for search results. */
export function eventJsonLd(ev: EventDetail) {
  const cancelled = ev.status === 'cancelled';
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: ev.title,
    description: ev.summary || ev.description.slice(0, 300),
    startDate: ev.starts_at,
    endDate: ev.ends_at,
    eventStatus: cancelled
      ? 'https://schema.org/EventCancelled'
      : ev.postponed
        ? 'https://schema.org/EventRescheduled'
        : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    image: ev.cover_image_url ? [ev.cover_image_url] : undefined,
    location: {
      '@type': 'Place',
      name: ev.venue_name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: ev.address || undefined,
        addressLocality: ev.city,
        addressCountry: 'GH',
      },
    },
    organizer: ev.host ? { '@type': 'Organization', name: ev.host.name } : undefined,
    offers: ev.ticket_types.map((t) => ({
      '@type': 'Offer',
      name: t.name,
      price: t.price,
      priceCurrency: ev.currency,
      url: `${SITE_URL}/events/${ev.slug}`,
      availability: t.status === 'sold_out' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
    })),
  };
}
