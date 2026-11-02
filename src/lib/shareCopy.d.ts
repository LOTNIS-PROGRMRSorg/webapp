export type ShareCopy = { title: string; description: string; text: string };
export function eventShare(
  ev: {
    title: string;
    category?: string;
    city?: string;
    venue_name?: string;
    starts_at?: string;
    currency?: string;
    from_price?: number | null;
    sold_out?: boolean;
  },
  url?: string,
): ShareCopy;
export function propertyShare(
  p: { name: string; city?: string | null; sub_type?: string | null; verified?: boolean },
  price?: string,
  url?: string,
): ShareCopy;
