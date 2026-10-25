import type { Tone } from '@/theme';

/** One place that says what colour and wording every status gets, so "paid", "pending" and "failed" look the same everywhere. */
const STATUS: Record<string, { label: string; tone: Tone }> = {
  // events
  draft: { label: 'Draft', tone: 'neutral' }, pending_review: { label: 'In review', tone: 'warn' }, published: { label: 'On sale', tone: 'good' },
  rejected: { label: 'Needs changes', tone: 'danger' }, cancelled: { label: 'Cancelled', tone: 'danger' }, suspended: { label: 'Paused by Lotnis', tone: 'danger' },
  // tickets
  valid: { label: 'Valid', tone: 'good' }, used: { label: 'Used', tone: 'info' }, refund_pending: { label: 'Refund pending', tone: 'warn' },
  refunded: { label: 'Refunded', tone: 'danger' }, void: { label: 'Not valid', tone: 'danger' },
  // money
  paid: { label: 'Paid', tone: 'good' }, pending: { label: 'Pending', tone: 'warn' }, processing: { label: 'Being sent', tone: 'info' }, processed: { label: 'Sent', tone: 'good' },
  approved: { label: 'Approved', tone: 'info' }, failed: { label: 'Failed', tone: 'danger' }, declined: { label: 'Declined', tone: 'danger' },
  due: { label: 'Ready', tone: 'warn' }, awaiting_release: { label: 'Waiting', tone: 'neutral' }, on_hold: { label: 'On hold', tone: 'danger' },
  // bookings
  confirmed: { label: 'Confirmed', tone: 'good' }, active: { label: 'Staying', tone: 'good' }, completed: { label: 'Completed', tone: 'neutral' }, no_show: { label: 'No show', tone: 'danger' },
  // reports
  open: { label: 'Open', tone: 'warn' }, in_review: { label: 'In review', tone: 'info' }, resolved: { label: 'Resolved', tone: 'good' }, dismissed: { label: 'Dismissed', tone: 'neutral' },
  low: { label: 'Low', tone: 'neutral' }, normal: { label: 'Normal', tone: 'info' }, high: { label: 'High', tone: 'warn' }, urgent: { label: 'Urgent', tone: 'danger' },
  // listings
  live: { label: 'Live', tone: 'good' }, paused: { label: 'Paused', tone: 'warn' }, under_review: { label: 'Under review', tone: 'info' },
};

export const statusMeta = (status: string | null | undefined): { label: string; tone: Tone } =>
  STATUS[status ?? ''] ?? { label: String(status ?? '—').replace(/_/g, ' '), tone: 'neutral' };
