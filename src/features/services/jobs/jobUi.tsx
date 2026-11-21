import type { JobStatus } from '@/lib/api/market';
import { Pill } from '@/components/ui';

export const STATUS_COPY: Record<JobStatus, { label: string; tone: 'good' | 'warn' | 'danger' | 'info' | 'neutral' }> =
  {
    requested: { label: 'Waiting for the provider', tone: 'warn' },
    negotiating: { label: 'Agreeing a price', tone: 'info' },
    accepted: { label: 'Accepted — waiting for payment', tone: 'warn' },
    paid: { label: 'Paid — job booked', tone: 'good' },
    awaiting_confirmation: { label: 'Done — waiting for the customer', tone: 'info' },
    completed: { label: 'Completed', tone: 'good' },
    disputed: { label: 'Under review by Lotnis', tone: 'danger' },
    declined: { label: 'Declined', tone: 'neutral' },
    cancelled: { label: 'Cancelled', tone: 'neutral' },
    expired: { label: 'Expired', tone: 'neutral' },
    refunded: { label: 'Refunded', tone: 'neutral' },
  };
export const JobPill = ({ status }: { status: JobStatus }) => (
  <Pill tone={STATUS_COPY[status].tone}>{STATUS_COPY[status].label}</Pill>
);

export const fmtWhen = (iso: string) =>
  new Date(iso).toLocaleString('en-GH', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Accra',
  });
export const fmtLeft = (iso: string) => {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'now';
  const h = Math.floor(ms / 3_600_000);
  return h >= 24
    ? `${Math.floor(h / 24)}d ${h % 24}h`
    : h >= 1
      ? `${h}h ${Math.floor((ms % 3_600_000) / 60_000)}m`
      : `${Math.max(1, Math.floor(ms / 60_000))}m`;
};

/** The five steps of a job, as a progress strip. */
const STEPS = ['Requested', 'Agreed', 'Paid', 'Done', 'Confirmed'];
export function stepIndex(s: JobStatus): number {
  if (s === 'requested' || s === 'negotiating') return 0;
  if (s === 'accepted') return 1;
  if (s === 'paid') return 2;
  if (s === 'awaiting_confirmation') return 3;
  if (s === 'completed') return 4;
  if (s === 'disputed') return 3;
  return -1;
}
export function JobSteps({ status }: { status: JobStatus }) {
  const at = stepIndex(status);
  if (at < 0) return null;
  return (
    <ol className="job-steps" aria-label="Progress">
      {STEPS.map((l, i) => (
        <li key={l} className={i < at ? 'done' : i === at ? 'now' : ''}>
          <span>{i < at ? '✓' : i + 1}</span>
          {l}
        </li>
      ))}
    </ol>
  );
}
