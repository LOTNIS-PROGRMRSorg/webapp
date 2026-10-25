import { request } from '@/lib/api';

export type ReportKind = 'property' | 'event' | 'booking' | 'ticket_order' | 'host' | 'other';
export type ReportStatus = 'open' | 'in_review' | 'resolved' | 'dismissed';
export type ReportCategory = {
  value: string;
  label: string;
  severity: 'low' | 'normal' | 'high' | 'urgent';
  hint?: string;
};
export type ReportInput = {
  target_type: ReportKind;
  category: string;
  description: string;
  email?: string;
  name?: string;
  property_id?: string;
  event_id?: string;
  booking_id?: string;
  order_id?: string;
  host_id?: string;
  token?: string;
  evidence_urls?: string[];
};
export type HostReport = {
  id: string;
  target_type: ReportKind;
  category: string;
  description: string;
  status: ReportStatus;
  severity: string;
  created_at: string;
  reporter_name?: string | null;
  host_response?: string | null;
  host_responded_at?: string | null;
  evidence_urls?: string[];
  property?: { id: string; name: string } | null;
  event?: { id: string; title: string } | null;
};
export type MyReport = {
  id: string;
  target_type: ReportKind;
  category: string;
  status: ReportStatus;
  description: string;
  created_at: string;
  host_response?: string | null;
  property?: { name: string } | null;
  event?: { title: string } | null;
};

export const reportsApi = {
  categories: () => request<Record<ReportKind, ReportCategory[]>>('/reports/categories'),
  create: (input: ReportInput) => request<{ id: string }>('/reports', { method: 'POST', body: JSON.stringify(input) }),
  mine: () => request<MyReport[]>('/reports/mine'),
  forHost: (filter: { property_id?: string; event_id?: string; status?: string } = {}) =>
    request<HostReport[]>(`/reports/host?${new URLSearchParams(filter as Record<string, string>)}`),
  respond: (id: string, response: string) =>
    request<{ ok: boolean }>(`/reports/${id}/respond`, { method: 'POST', body: JSON.stringify({ response }) }),
};
