// Link previews for shareable event pages.
//
// WhatsApp, Facebook, X, Telegram and Google read a page's Open Graph tags from the raw HTML —
// they don't run JavaScript — so the single-page app's own tags never reach them. vercel.json routes
// /events/:slug, /events/:slug/vote/:category and /events/:slug/vote/:category/:contestant here. This
// function loads the normal app shell (index.html), swaps in tags for that exact page (the contestant's
// picture, "Vote for {name} as {category}", the price of a vote…) and returns it. Browsers then boot the
// app as usual. If the API is slow or down the untouched shell is returned, so pages never break.

const API = (process.env.API_URL || process.env.VITE_API_URL || '').replace(/\/$/, '');
const SITE = (process.env.SITE_URL || process.env.VITE_SITE_URL || '').replace(/\/$/, '');

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
const money = (currency, n) =>
  `${currency === 'GHS' || !currency ? 'GH₵' : `${currency} `}${Number(n).toLocaleString('en-GH', { maximumFractionDigits: 2, minimumFractionDigits: Number(n) % 1 ? 2 : 0 })}`;
const clip = (s, n) => {
  const t = String(s ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  return t.length <= n ? t : `${t.slice(0, n - 1).trimEnd()}…`;
};

/** Replace (or add) <meta {attr}="{key}" content="…">. */
function setMeta(html, attr, key, value) {
  const tag = `<meta ${attr}="${key}" content="${esc(value)}" />`;
  const re = new RegExp(`<meta\\s+${attr}="${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`, 'i');
  return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `    ${tag}\n  </head>`);
}
const dropMeta = (html, attr, key) =>
  html.replace(new RegExp(`\\s*<meta\\s+${attr}="${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`, 'i'), '');

export function applyPreview(html, p) {
  let out = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(p.title)}</title>`);
  out = setMeta(out, 'name', 'description', p.description);
  out = out.replace(/<link\s+rel="canonical"[^>]*>/i, `<link rel="canonical" href="${esc(p.url)}" />`);
  out = setMeta(out, 'property', 'og:type', 'website');
  out = setMeta(out, 'property', 'og:title', p.title);
  out = setMeta(out, 'property', 'og:description', p.description);
  out = setMeta(out, 'property', 'og:url', p.url);
  if (p.image) {
    out = setMeta(out, 'property', 'og:image', p.image);
    out = setMeta(out, 'property', 'og:image:alt', p.imageAlt || p.title);
    // The default image's size no longer applies to this picture.
    out = dropMeta(out, 'property', 'og:image:width');
    out = dropMeta(out, 'property', 'og:image:height');
    out = setMeta(out, 'name', 'twitter:image', p.image);
  }
  out = setMeta(out, 'name', 'twitter:card', 'summary_large_image');
  out = setMeta(out, 'name', 'twitter:title', p.title);
  out = setMeta(out, 'name', 'twitter:description', p.description);
  return out;
}

async function get(path) {
  const res = await fetch(`${API}${path}`, {
    signal: AbortSignal.timeout(6000),
    headers: { accept: 'application/json' },
  });
  if (!res.ok) return null;
  const body = await res.json();
  return body?.success ? body.data : null;
}

/** Build the preview for a request, or null to serve the app shell unchanged. */
export async function previewFor({ slug, cat, nominee }, origin, fetchData = get) {
  const site = SITE || origin;
  if (!slug) return null;
  if (cat) {
    const page = await fetchData(
      `/events/${encodeURIComponent(slug)}/vote/${encodeURIComponent(cat)}${nominee ? `/${encodeURIComponent(nominee)}` : ''}`,
    );
    if (!page) return null;
    const { event, category } = page;
    const price = money(event.currency, category.price_per_vote);
    if (nominee && page.nominee) {
      const n = page.nominee;
      return {
        title: `Vote for ${n.name} as ${category.name} — ${event.title}`,
        description: `Vote for ${n.name} as ${category.name} at ${event.title}. A vote costs ${price}.`,
        image: n.photo_url || event.cover_image_url,
        imageAlt: `${n.name} — ${category.name}`,
        url: `${site}/events/${slug}/vote/${cat}/${nominee}`,
      };
    }
    return {
      title: `Vote for ${category.name} — ${event.title}`,
      description: `Vote for your favourite in ${category.name} at ${event.title}. A vote costs ${price}. ${category.nominee_count} contestant${category.nominee_count === 1 ? '' : 's'}.`,
      image: event.cover_image_url,
      imageAlt: event.title,
      url: `${site}/events/${slug}/vote/${cat}`,
    };
  }
  const ev = await fetchData(`/events/${encodeURIComponent(slug)}`);
  if (!ev) return null;
  return {
    title: `${ev.title} — tickets${ev.city ? `, ${ev.city}` : ''}`,
    description: clip(ev.summary || ev.description, 160),
    image: ev.cover_image_url,
    imageAlt: ev.title,
    url: `${site}/events/${slug}`,
  };
}

export default async function handler(req, res) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const origin = `https://${host}`;
  const q = req.query || {};
  let shell;
  try {
    const r = await fetch(`${origin}/index.html`, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) throw new Error(`shell ${r.status}`);
    shell = await r.text();
  } catch (err) {
    res.status(502).send('Lotnis is temporarily unavailable. Please try again.');
    return;
  }
  let html = shell;
  try {
    const preview = API ? await previewFor({ slug: q.slug, cat: q.cat, nominee: q.nominee }, origin) : null;
    if (preview) html = applyPreview(shell, preview);
  } catch {
    /* keep the plain shell */
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=900');
  res.status(200).send(html);
}
