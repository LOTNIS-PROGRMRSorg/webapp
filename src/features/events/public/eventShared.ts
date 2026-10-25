

export const errText = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);
