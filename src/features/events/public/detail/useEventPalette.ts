import { CSSProperties, useEffect, useState } from 'react';

type Palette = { h1: number; h2: number; vivid: number };

const hsl = (h: number, s: number, l: number) => `hsl(${Math.round(h)} ${s}% ${l}%)`;

/** A stable hue from the event's slug, for covers we can't read (no image, or one the browser won't let us sample). */
const hueFromText = (text: string) => {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 360;
  return h;
};

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

/** The two strongest hues in the cover, weighted towards vivid mid-tones so skies and shadows don't win. */
function readPalette(img: HTMLImageElement): Palette | null {
  const size = 48;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  const bins = new Array(12).fill(0);
  let vivid = 0;
  for (let i = 0; i < data.length; i += 4) {
    const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
    const weight = s * (1 - Math.abs(2 * l - 1)) ** 1.5;
    bins[Math.floor(h / 30) % 12] += weight;
    vivid += weight;
  }
  if (vivid / (size * size) < 0.04) return null; // near-greyscale cover: use the brand fallback
  const first = bins.indexOf(Math.max(...bins));
  const rest = bins.map((w, i) => (Math.min(Math.abs(i - first), 12 - Math.abs(i - first)) >= 2 ? w : 0));
  const second = rest.indexOf(Math.max(...rest));
  return { h1: first * 30 + 15, h2: (rest[second] > bins[first] * 0.25 ? second : (first + 1) % 12) * 30 + 15, vivid: vivid / (size * size) };
}

/** Theme variables for an event page, taken from its cover image. */
export function useEventPalette(cover: string | null | undefined, seed: string): CSSProperties {
  const [palette, setPalette] = useState<Palette>(() => ({ h1: hueFromText(seed), h2: (hueFromText(seed) + 40) % 360, vivid: 0 }));
  useEffect(() => {
    const fallback = hueFromText(seed);
    setPalette({ h1: fallback, h2: (fallback + 40) % 360, vivid: 0 });
    if (!cover) return;
    let live = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const p = readPalette(img);
        if (live && p) setPalette(p);
      } catch {
        /* image host doesn't allow pixel reads — keep the fallback hue */
      }
    };
    img.src = cover;
    return () => {
      live = false;
    };
  }, [cover, seed]);

  const { h1, h2 } = palette;
  return {
    '--evd-accent': hsl(h1, 72, 40),
    '--evd-c1': hsl(h1, 78, 56),
    '--evd-c2': hsl(h2, 78, 58),
    '--evd-dark': hsl(h1, 46, 13),
    '--evd-deep': hsl(h1, 52, 22),
    '--evd-bg': hsl(h1, 55, 96),
    '--evd-wash': hsl(h1, 75, 88),
  } as CSSProperties;
}
