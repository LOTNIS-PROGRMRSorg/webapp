import { request } from '@/lib/api';

export type ServiceKind = 'property' | 'event';
export type HostService = {
  id: string; kind: ServiceKind; name: string; city?: string | null; image?: string | null;
  is_paused: boolean; paused_at?: string | null; pause_reason?: string | null;
  // property
  sub_type?: string; approval_status?: string; price?: number; currency?: string; pricing_period?: string;
  // event
  slug?: string; status?: string; starts_at?: string; ends_at?: string; venue_name?: string;
};
export type HostServices = { pause_available: boolean; properties: HostService[]; events: HostService[] };

export const servicesApi = {
  list: () => request<HostServices>('/host-services'),
  pause: (kind: ServiceKind, id: string, reason?: string) => request<{ is_paused: boolean }>(`/host-services/${kind}/${id}/pause`, { method: 'POST', body: JSON.stringify({ reason }) }),
  resume: (kind: ServiceKind, id: string) => request<{ is_paused: boolean }>(`/host-services/${kind}/${id}/resume`, { method: 'POST' }),
};
