import { useLayoutEffect } from 'react';
import type { Property } from './types';
import { sortedImages } from './bookingUi';

// ─────────────────────────────────────────────────────────────────────────────
// SEO layer.
//
// • <Seo> sets the document title, description, canonical URL, robots directive,
//   Open Graph / Twitter card tags and JSON-LD for the current page. It edits the
//   tags that already exist in index.html (instead of adding duplicates), so a
//   crawler always sees exactly one of each.
// • index.html carries the same defaults, so crawlers that don't run JavaScript
//   still get a sensible title/description for every URL.
// • Private pages (account, host dashboard, payment, move-outs) are noindex.
// ─────────────────────────────────────────────────────────────────────────────

export const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) || 'https://lotnis.com').replace(/\/$/, '');
export const SITE_NAME = 'Lotnis';
export const DEFAULT_IMAGE = `${SITE_URL}/og-default.jpg`;
export const DEFAULT_DESCRIPTION = 'Rent spaces today — rooms, homes, offices, garages and warehouses — with food, trusted service providers and events coming next. One account, mobile-money payments, verified hosts across Ghana.';

export const abs = (pathOrUrl: string) => (/^https?:\/\//.test(pathOrUrl) ? pathOrUrl : `${SITE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`);

/** Trim to a search-snippet friendly length without cutting mid-word. */
export function clip(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 20))}…`;
}

type SeoProps = {
  title: string;
  description: string;
  /** Canonical path, e.g. "/explore?subType=office". Defaults to the current path. */
  path?: string;
  image?: string | null;
  imageAlt?: string;
  type?: 'website' | 'article' | 'product';
  /** Keep out of search results (private or thin pages). */
  noindex?: boolean;
  /** Allow link-following even when not indexed. */
  follow?: boolean;
  jsonLd?: Array<Record<string, unknown> | null | undefined>;
};

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); document.head.appendChild(el); }
  el.setAttribute('href', href);
}

export function Seo({ title, description, path, image, imageAlt, type = 'website', noindex = false, follow = false, jsonLd }: SeoProps) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const desc = clip(description, 160);
  const canonical = abs(path ?? (typeof window !== 'undefined' ? window.location.pathname : '/'));
  const img = abs(image || DEFAULT_IMAGE);
  const robots = noindex
    ? `noindex,${follow ? 'follow' : 'nofollow'}`
    : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';
  const ld = JSON.stringify((jsonLd ?? []).filter(Boolean));

  useLayoutEffect(() => {
    document.title = fullTitle;
    upsertMeta('name', 'description', desc);
    upsertMeta('name', 'robots', robots);
    upsertLink('canonical', canonical);
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:type', type === 'product' ? 'website' : type);
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', desc);
    upsertMeta('property', 'og:url', canonical);
    upsertMeta('property', 'og:image', img);
    upsertMeta('property', 'og:image:alt', imageAlt || fullTitle);
    upsertMeta('property', 'og:locale', 'en_GH');
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', desc);
    upsertMeta('name', 'twitter:image', img);

    const scripts: HTMLScriptElement[] = [];
    if (ld !== '[]') {
      for (const block of JSON.parse(ld) as unknown[]) {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.dataset.seo = 'page';
        script.text = JSON.stringify({ '@context': 'https://schema.org', ...(block as object) });
        document.head.appendChild(script);
        scripts.push(script);
      }
    }
    return () => scripts.forEach((s) => s.remove());
  }, [fullTitle, desc, robots, canonical, img, imageAlt, type, ld]);

  return null;
}

// ── Structured data builders ────────────────────────────────────────────────

export const organizationLd = () => ({
  '@type': 'Organization', '@id': `${SITE_URL}/#organization`, name: SITE_NAME, url: SITE_URL,
  logo: `${SITE_URL}/favicon.svg`, email: 'support@lotnis.com',
  areaServed: { '@type': 'Country', name: 'Ghana' },
  description: DEFAULT_DESCRIPTION,
});

export const websiteLd = () => ({
  '@type': 'WebSite', '@id': `${SITE_URL}/#website`, url: SITE_URL, name: SITE_NAME, inLanguage: 'en-GH',
  publisher: { '@id': `${SITE_URL}/#organization` },
  potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/explore?query={search_term_string}` }, 'query-input': 'required name=search_term_string' },
});

export const breadcrumbLd = (items: Array<{ name: string; path: string }>) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: abs(item.path) })),
});

export const faqLd = (faqs: Array<{ question: string; answer: string }>) => ({
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
});

export const webPageLd = (name: string, description: string, path: string, type = 'WebPage') => ({
  '@type': type, name, description, url: abs(path), inLanguage: 'en-GH', isPartOf: { '@id': `${SITE_URL}/#website` },
});

export const itemListLd = (name: string, properties: Property[]) => ({
  '@type': 'ItemList', name, numberOfItems: properties.length,
  itemListElement: properties.map((p, i) => ({
    '@type': 'ListItem', position: i + 1, url: abs(`/stays/${p.id}`), name: p.name,
    image: sortedImages(p.property_images)[0]?.public_url,
  })),
});

export function propertyLd(p: Property) {
  const images = sortedImages(p.property_images).map((i) => i.public_url);
  const rooms = (p.rooms ?? []).filter((r) => !r.deleted_at);
  const prices = [p.price, ...rooms.map((r) => r.price_per_period)].filter((v): v is number => typeof v === 'number' && v > 0);
  const low = prices.length ? Math.min(...prices) : undefined;
  const high = prices.length ? Math.max(...prices) : undefined;
  const url = abs(`/stays/${p.id}`);
  return {
    '@type': 'Product',
    '@id': `${url}#listing`, name: p.name, url, image: images.length ? images : undefined,
    description: clip(p.description || p.tagline || `${p.name}, a ${p.sub_type ?? 'space'} for rent in ${p.city ?? 'Ghana'}.`, 500),
    category: p.sub_type ?? p.category, sku: p.id,
    brand: { '@type': 'Brand', name: SITE_NAME },
    ...(p.rating && p.review_count ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: p.rating, reviewCount: p.review_count } } : {}),
    ...(low !== undefined ? {
      offers: {
        '@type': 'AggregateOffer', priceCurrency: p.currency || 'GHS', lowPrice: low, highPrice: high, offerCount: Math.max(1, rooms.length + (p.price != null ? 1 : 0)),
        availability: 'https://schema.org/InStock', url,
        priceSpecification: { '@type': 'UnitPriceSpecification', price: low, priceCurrency: p.currency || 'GHS', unitText: p.pricing_period ?? 'night' },
      },
    } : {}),
    additionalProperty: [
      p.bedrooms != null && { '@type': 'PropertyValue', name: 'Bedrooms', value: p.bedrooms },
      p.bathrooms != null && { '@type': 'PropertyValue', name: 'Bathrooms', value: p.bathrooms },
      p.max_guests != null && { '@type': 'PropertyValue', name: 'Maximum guests', value: p.max_guests },
      p.size_sqm != null && { '@type': 'PropertyValue', name: 'Floor area (m²)', value: p.size_sqm },
      p.ceiling_height_m != null && { '@type': 'PropertyValue', name: 'Ceiling height (m)', value: p.ceiling_height_m },
    ].filter(Boolean),
  };
}

/** Where the listing is — lets search engines show it for "near me" and place searches. */
export const placeLd = (p: Property) => p.city ? ({
  '@type': 'Place', name: p.name, url: abs(`/stays/${p.id}`),
  address: { '@type': 'PostalAddress', streetAddress: p.street_address ?? undefined, addressLocality: p.city, addressRegion: p.state ?? undefined, addressCountry: 'GH' },
  ...(p.latitude != null && p.longitude != null ? { geo: { '@type': 'GeoCoordinates', latitude: p.latitude, longitude: p.longitude } } : {}),
}) : null;
