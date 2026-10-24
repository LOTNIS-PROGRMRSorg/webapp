// Builds public/sitemap.xml from the live API: static pages, space-type and city landing
// pages, rental-length pages, and every approved listing (with its photos).
// Runs before each production build. If the API can't be reached the existing sitemap is kept.
import { writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SITE = (process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://lotnis.com').replace(/\/$/, '');
const API = (process.env.API_URL || process.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'sitemap.xml');

const TYPES = ['apartment', 'house', 'villa', 'room', 'hotel', 'office', 'shop', 'garage', 'warehouse', 'venue'];
// Curated city pages always; any other place only once it has a listing (no empty pages in the sitemap).
const CITIES = ['accra', 'kumasi', 'cape-coast', 'takoradi', 'aburi', 'tema'];
const slug = (name) => String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const UNITS = ['day', 'week', 'month', 'year'];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const today = new Date().toISOString().slice(0, 10);

const url = (loc, { priority = '0.6', changefreq = 'weekly', lastmod = today, images = [] } = {}) =>
  `  <url>\n    <loc>${esc(SITE + loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n${images.map((i) => `    <image:image><image:loc>${esc(i.url)}</image:loc>${i.title ? `<image:title>${esc(i.title)}</image:title>` : ''}</image:image>`).join('\n')}${images.length ? '\n' : ''}  </url>`;

async function listings() {
  const all = [];
  for (let page = 1; page <= 50; page += 1) {
    // A sleeping free-tier API can take a while to wake; never let that hold up a deploy.
    const res = await fetch(`${API}/explore/search?page=${page}&limit=100`, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new Error(`API responded ${res.status}`);
    const body = await res.json();
    all.push(...(body.data ?? []));
    if (all.length >= (body.total ?? 0) || !(body.data ?? []).length) break;
  }
  return all;
}

const entries = [
  url('/', { priority: '1.0', changefreq: 'daily' }),
  url('/explore', { priority: '0.9', changefreq: 'daily' }),
  ...TYPES.map((t) => url(`/rent/${t}`, { priority: '0.8', changefreq: 'daily' })),
  ...UNITS.map((u) => url(`/explore?pricingPeriod=${u}`, { priority: '0.6', changefreq: 'daily' })),
  url('/refund-policy', { priority: '0.5', changefreq: 'monthly' }), url('/ticket-terms', { priority: '0.5', changefreq: 'monthly' }), url('/terms', { priority: '0.4', changefreq: 'monthly' }),
  url('/privacy', { priority: '0.4', changefreq: 'monthly' }), url('/host-agreement', { priority: '0.5', changefreq: 'monthly' }),
  url('/food', { priority: '0.3', changefreq: 'monthly' }), url('/events', { priority: '0.8', changefreq: 'daily' }), url('/services', { priority: '0.3', changefreq: 'monthly' }),
];

try {
  const stays = await listings();
  for (const p of stays) {
    const images = (p.property_images ?? []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).slice(0, 8)
      .map((i) => ({ url: i.public_url, title: p.name }));
    entries.push(url(`/stays/${p.id}`, { priority: p.featured ? '0.9' : '0.7', changefreq: 'weekly', images }));
  }
  // Upcoming events are optional: a missing events table must not break the sitemap.
  try {
    const res = await fetch(`${API}/events?limit=48`, { signal: AbortSignal.timeout(20_000) });
    const upcoming = res.ok ? ((await res.json()).data?.data ?? []) : [];
    for (const e of upcoming) entries.push(url(`/events/${e.slug}`, { priority: '0.7', changefreq: 'daily', images: e.cover_image_url ? [{ url: e.cover_image_url, title: e.title }] : [] }));
    if (upcoming.length) console.log(`[sitemap] ${upcoming.length} upcoming events`);
  } catch (err) { console.warn(`[sitemap] events skipped (${err.message})`); }
  const places = new Set([...CITIES, ...stays.map((p) => slug(p.city)).filter(Boolean)]);
  for (const place of places) entries.push(url(`/in/${place}`, { priority: '0.8', changefreq: 'daily' }));
  console.log(`[sitemap] ${stays.length} listings + ${entries.length - stays.length} static/landing pages`);
} catch (err) {
  for (const place of CITIES) entries.push(url(`/in/${place}`, { priority: '0.8', changefreq: 'daily' }));
  if (existsSync(OUT)) { console.warn(`[sitemap] API unavailable (${err.message}); keeping the existing sitemap.xml`); process.exit(0); }
  console.warn(`[sitemap] API unavailable (${err.message}); writing a static-only sitemap`);
}

writeFileSync(OUT, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${entries.join('\n')}\n</urlset>\n`);
