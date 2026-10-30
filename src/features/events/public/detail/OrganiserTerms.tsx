import { ChevronDown } from 'lucide-react';
import type { EventDetail } from '@/lib/api/events';

/** Refund rules and the organiser's own terms, folded under the tickets so they're read at the point of buying. */
export function OrganiserTerms({ ev }: { ev: EventDetail }) {
  if (!ev.terms && !ev.refund_summary.length) return null;
  return (
    <details className="evd-terms">
      <summary>
        Organiser&apos;s terms <ChevronDown size={16} />
      </summary>
      {ev.refund_summary.length > 0 && (
        <>
          <h3 className="evd-h3">Refunds &amp; changes</h3>
          <ul className="evd-ticks">
            {ev.refund_summary.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </>
      )}
      {ev.terms && (
        <>
          <h3 className="evd-h3">Terms</h3>
          <p>{ev.terms}</p>
        </>
      )}
    </details>
  );
}
