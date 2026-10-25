import type { ExitStatus } from '@/types';

export const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Accra' });
export const addDays = (iso: string, n: number) => new Date(new Date(`${iso}T00:00:00Z`).getTime() + n * 86_400_000).toISOString().slice(0, 10);
export const nights = (n: number) => `${n} night${n === 1 ? '' : 's'}`;
export const when = (iso: string) => new Date(iso).toLocaleString('en-GH', { dateStyle: 'medium', timeStyle: 'short' });


export const STEPS: Array<{ key: string; label: string; match: ExitStatus[] }> = [
  { key: 'notice', label: 'Notice', match: ['notice_given'] },
  { key: 'host', label: 'Host response', match: ['host_responded'] },
  { key: 'out', label: 'Move-out', match: ['moved_out'] },
  { key: 'deposit', label: 'Deposit review', match: ['in_dispute'] },
  { key: 'done', label: 'Settled', match: ['settled'] },
];

export const REASONS = [
  ['relocation', 'Relocating or plans changed'], ['emergency', 'Emergency'], ['dissatisfied', 'Not what I expected'],
  ['host_issue', 'Problem with the host or space'], ['other', 'Something else'],
];
export const EVENT_COPY: Record<string, string> = {
  notice_given: 'gave notice to leave early', withdrawn: 'withdrew the notice', host_responded: 'responded to the notice',
  moved_out: 'confirmed the move-out', checkout_started: 'started the checkout', deduction_proposed: 'listed a deposit deduction',
  deduction_accepted: 'accepted a deduction', deduction_disputed: 'disputed a deduction', deduction_ruled: 'ruled on a deduction',
  flags_changed: 'updated the case', settled: 'settled the case',
};
export const ROLE_LABEL: Record<string, string> = { guest: 'Guest', host: 'Host', admin: 'Lotnis', system: 'System' };
