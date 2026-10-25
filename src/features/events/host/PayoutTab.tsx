import { ArrowRight, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cedis, fmtDateTime } from '@/features/events/eventUi';
import { HostEventOverview } from '@/lib/api/events';
import { Stat } from './OverviewTab';

export function PayoutTab({ data }: { data: HostEventOverview }) {
  const p = data.payout;
  const c = data.event.currency;
  return (
    <>
      <div className="callout">
        <Wallet size={22} />
        <div>
          <b>You're paid after the event</b>
          <p>
            Ticket money is released 48 hours after the event ends (voting money 48 hours after voting closes), minus
            Lotnis's fee and any refunds. Lotnis then sends it to your payout account.
          </p>
        </div>
      </div>
      <div className="metric-grid metric-grid-4">
        <Stat
          label="Waiting for release"
          value={cedis(p.awaiting_release, c)}
          sub={p.next_release_at ? `from ${fmtDateTime(p.next_release_at)}` : undefined}
        />
        <Stat label="Ready to send" value={cedis(p.due, c)} />
        <Stat label="On hold" value={cedis(p.on_hold, c)} />
        <Stat label="Paid" value={cedis(p.paid, c)} />
      </div>
      <p>
        <Link className="button button-secondary" to="/host/earnings">
          See all earnings <ArrowRight size={15} />
        </Link>
      </p>
    </>
  );
}

// ── Earnings: payouts across every service ───────────────────────────────────
