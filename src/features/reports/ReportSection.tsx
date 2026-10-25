import { Flag } from 'lucide-react';
import { useState } from 'react';
import { ReportDialog } from '@/components/modals';
import type { ReportInput, ReportKind } from '@/lib/api/reports';

/**
 * The quiet "Report this listing" block at the bottom of a listing or event page.
 * Reports from the public go to Lotnis admins only; if the reporter actually booked or bought, the host can see it too —
 * the server works that out, this just words it.
 */
export function ReportSection({ kind, target, subject }: { kind: 'property' | 'event'; target: Pick<ReportInput, 'property_id' | 'event_id'>; subject: string }) {
  const [open, setOpen] = useState(false);
  const noun = kind === 'event' ? 'event' : 'listing';
  return (
    <section className="report-section" aria-label={`Report this ${noun}`}>
      <div><Flag size={18} /><div><b>See something wrong with this {noun}?</b><p>Tell Lotnis if it looks fake, misleading or unsafe. Your report goes to our team only, unless you have booked or bought here, in which case the host can see it too.</p></div></div>
      <button className="button button-quiet" onClick={() => setOpen(true)}>Report this {noun}</button>
      {open && <ReportDialog kind={kind as ReportKind} target={target} title={`Report: ${subject}`} onClose={() => setOpen(false)} audienceNote="Reports from people who haven't booked or bought are only seen by Lotnis." />}
    </section>
  );
}
