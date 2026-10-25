import { request } from '@/lib/api';

export type EngagementAction = 'view' | 'click_book' | 'click_tickets' | 'click_vote' | 'click_share' | 'click_contact' | 'click_host';
export type EngagementDay = { day: string; views: number; visitors: number; clicks: number };
export type EngagementSeries = {
  days: EngagementDay[]; totals: { views: number; visitors: number; clicks: number }; by_action: Record<string, number>; not_ready?: boolean;
};
export type PropertyEngagement = EngagementSeries & { listing: { id: string; name: string }; conversions: { requests: number; booked: number; revenue: number } };
export type EventEngagement = EngagementSeries & { conversions: { checkouts_started: number; ticket_orders_paid: number; vote_orders_paid: number; [k: string]: number } };
export type HostEngagementOverview = { days: number; per_target: Record<string, { views: number; clicks: number }>; properties: EngagementSeries; events: EngagementSeries };

export const engagementApi = {
  track: (target_type: 'property' | 'event', target_id: string, action: EngagementAction, session_id: string) =>
    request<void>('/engagement/track', { method: 'POST', body: JSON.stringify({ target_type, target_id, action, session_id }), keepalive: true } as RequestInit),
  hostOverview: (days = 30) => request<HostEngagementOverview>(`/engagement/host/overview?days=${days}`),
  property: (id: string, days = 30) => request<PropertyEngagement>(`/engagement/host/properties/${id}?days=${days}`),
  event: (id: string, days = 30) => request<EventEngagement>(`/engagement/host/events/${id}?days=${days}`),
};
