import palette from './palette.json';

/**
 * Every colour in the app, by name. Use these (or `var(--c-<name>)` in CSS) — never a raw hex.
 *   style={{ color: colors.danger }}    ·    border: 1px solid var(--c-line);
 */
export const colors = palette.colors;
export type ColorName = keyof typeof colors;

/** `cssVar('ink')` → `var(--c-ink)`, for inline styles that should follow the theme. */
export const cssVar = (name: ColorName) => `var(--c-${name})`;

/** A translucent version of a palette colour: `alpha('ink', 12)` → 12% ink. Same thing the stylesheets do with color-mix. */
export const alpha = (name: ColorName, percent: number) =>
  `color-mix(in srgb, var(--c-${name}) ${percent}%, transparent)`;

/** Medal colours for ranks 1–3, shared by the leaderboard and podium. */
export const medalColors = {
  1: { solid: colors.gold, light: colors['gold-light'], bg: colors['gold-bg'] },
  2: { solid: colors.silver, light: colors['silver-light'], bg: colors['silver-bg'] },
  3: { solid: colors.bronze, light: colors['bronze-light'], bg: colors['bronze-bg'] },
} as const;

/** Colour for a status, so every "paid / pending / failed" pill agrees. */
export const statusTone = {
  good: { fg: colors['good-ink'], bg: colors['good-bg'] },
  warn: { fg: colors.warn, bg: colors['warn-bg'] },
  danger: { fg: colors.danger, bg: colors['danger-bg'] },
  info: { fg: colors.info, bg: colors['info-bg'] },
  neutral: { fg: colors['ink-muted'], bg: colors['surface-3'] },
} as const;
export type Tone = keyof typeof statusTone;
