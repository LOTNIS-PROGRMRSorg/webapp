import { request } from '@/lib/api';
import type { EventCard } from './events';

export type PublicHost = {
  id: string;
  name: string;
  verified: boolean;
  type: string;
  city?: string | null;
  region?: string | null;
  since: string;
  stats: { listings: number; upcoming_events: number; past_events: number; rating: number | null };
  listings: Array<{
    id: string;
    name: string;
    city: string;
    sub_type: string;
    price: number;
    currency: string;
    pricing_period: string;
    rating?: number | null;
    review_count?: number | null;
    verified?: boolean;
    image: string | null;
  }>;
  events: EventCard[];
};

export const hostsApi = { profile: (id: string) => request<PublicHost>(`/hosts/${id}`) };
