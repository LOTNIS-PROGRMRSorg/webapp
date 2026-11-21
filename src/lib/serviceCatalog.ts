// Shared rules for service listings: the languages a provider can say they speak, and the field limits the
// listing form and the API both enforce. (Categories come from the database: GET /services/categories.)

// ── Languages ────────────────────────────────────────────────────────────────
// Ghanaian languages first (the government-sponsored languages plus widely spoken ones), then the international
// languages. Stored by name in a service's `languages`.
export type Language = { name: string; group: 'ghanaian' | 'international' };

export const LANGUAGES: Language[] = [
  ...[
    'Asante Twi',
    'Akuapem Twi',
    'Fante',
    'Ga',
    'Ewe',
    'Dangme',
    'Nzema',
    'Dagbani',
    'Dagaare',
    'Gonja',
    'Kasem',
    'Hausa',
    'Frafra (Gurene)',
    'Kusaal',
    'Mampruli',
    'Sisaala',
    'Likpakpaanl (Konkomba)',
    'Buli',
    'Bono',
    'Wasa',
  ].map((name) => ({ name, group: 'ghanaian' as const })),
  ...['English', 'French'].map((name) => ({ name, group: 'international' as const })),
];

/** The API keeps at most this many languages per service. */
export const MAX_LANGUAGES = 8;
/** The API keeps at most this many keyword tags per service. */
export const MAX_TAGS = 10;

// ── Field limits for a service listing (the API enforces the same numbers) ──
export const SERVICE_LIMITS = {
  titleMin: 5,
  titleMax: 80,
  summaryMax: 140,
  descriptionMin: 50,
  descriptionMax: 2000,
  keywordMin: 2,
  keywordMax: 30,
  addressMin: 5,
  addressMax: 200,
  rateMin: 1,
  rateMax: 100_000,
  jobMinutesMin: 15,
  jobMinutesMax: 1440,
} as const;

/** The longest booking a customer can make, per pricing unit: 8 hours of half-hours, 12 hours, 30 days. */
export const MAX_UNITS: Record<'per_30min' | 'per_hour' | 'per_day', number> = {
  per_30min: 16,
  per_hour: 12,
  per_day: 30,
};
