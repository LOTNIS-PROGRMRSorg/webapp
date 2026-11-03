// Hosts upload photos at full camera size (6 MB is common). Supabase Storage can serve a resized copy of any
// public image, as WebP where the browser takes it, so each place asks for only the size it shows.
// `resize=contain` keeps the photo's shape: a width-only request otherwise keeps the full height and crops.
import type { SyntheticEvent } from 'react';

const ORIGINAL = '/storage/v1/object/public/';
const RESIZED = '/storage/v1/render/image/public/';
const WIDTHS = [160, 320, 640, 960, 1440, 1920];

export function resizedPhoto(url: string, width: number) {
  if (!url.includes(ORIGINAL)) return url;
  return `${url.replace(ORIGINAL, RESIZED)}?width=${width}&resize=contain&quality=70`;
}

/**
 * `<img>` attributes that let the browser pick the right size. `sizes` says how wide the photo shows on the page,
 * e.g. "(max-width: 640px) 100vw, 420px". If resizing fails (a plan change, a photo over Supabase's limits) the
 * image falls back to the original upload.
 */
export function photoProps(url: string, sizes: string) {
  if (!url.includes(ORIGINAL)) return { src: url };
  return {
    src: resizedPhoto(url, 960),
    srcSet: WIDTHS.map((w) => `${resizedPhoto(url, w)} ${w}w`).join(', '),
    sizes,
    onError: (e: SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      if (img.getAttribute('src') === url) return;
      img.removeAttribute('srcset');
      img.src = url;
    },
  };
}
