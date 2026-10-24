import type { ExitStatus } from './types';

export const STATUS_LABEL: Record<ExitStatus, string> = {
  notice_given: 'Notice given', host_responded: 'Host responded', moved_out: 'Moved out',
  in_dispute: 'In dispute', settled: 'Settled', withdrawn: 'Withdrawn',
};
