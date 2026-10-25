import { Undo2 } from 'lucide-react';
import { Doc, L, P } from './legalShared';

// ─────────────────────────────────────────────────────────────────────────────
// Refund & cancellation policy
// ─────────────────────────────────────────────────────────────────────────────
export const REFUNDS: Doc = {
  path: '/refund-policy',
  label: 'Refunds & cancellations',
  title: 'Cancellation & Refund Policy',
  icon: Undo2,
  intro:
    'A plain-language guide to every way a booking can end — before you move in, after you move in, and when the host cancels — and exactly how the money is worked out.',
  keyPoints: [
    "Before move-in: you get back a share of the stay price set by the listing's policy, plus your deposit.",
    'The Lotnis service fee is kept when a guest cancels or leaves early.',
    'Host cancels: you get everything back.',
    'After move-in: pay for nights stayed plus any missing notice (7 nights), credited if the host re-lets.',
    'Lotnis reviews and sends every refund, and tells you each step.',
  ],
  sections: [
    {
      id: 'overview',
      title: 'The three situations',
      body: (
        <>
          <div className="legal-table-wrap">
            <table className="legal-table">
              <thead>
                <tr>
                  <th>Situation</th>
                  <th>What you get back</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>You cancel before check-in</td>
                  <td>
                    The share of the stay price set by the listing's refund policy, depending on how early you cancel —
                    plus your full deposit. Service fee kept.
                  </td>
                </tr>
                <tr>
                  <td>The host (or Lotnis) cancels before check-in</td>
                  <td>Everything you paid, including the service fee and deposit.</td>
                </tr>
                <tr>
                  <td>You leave after moving in</td>
                  <td>
                    The unused nights, after paying for nights stayed and any missing notice (up to 7 nights). Deposit
                    returned after move-out, less itemised deductions.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ),
    },
    {
      id: 'tiers',
      title: 'Refund policies (before check-in)',
      body: (
        <>
          <P>
            Hosts choose one of the policies below (Lotnis may add more). The tiers are shown on every listing and on
            your booking. The percentage applies to the <b>stay price</b> — not to the service fee or the deposit.
          </P>
          <div className="legal-table-wrap">
            <table className="legal-table">
              <thead>
                <tr>
                  <th>Policy</th>
                  <th>Cancel…</th>
                  <th>Stay price refunded</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td rowSpan={2}>
                    <b>Flexible</b>
                  </td>
                  <td>1 or more days before check-in</td>
                  <td>100%</td>
                </tr>
                <tr>
                  <td>Less than 1 day</td>
                  <td>0%</td>
                </tr>
                <tr>
                  <td rowSpan={3}>
                    <b>Standard</b>
                  </td>
                  <td>7 or more days before</td>
                  <td>100%</td>
                </tr>
                <tr>
                  <td>3–6 days before</td>
                  <td>50%</td>
                </tr>
                <tr>
                  <td>Less than 3 days</td>
                  <td>0%</td>
                </tr>
                <tr>
                  <td rowSpan={2}>
                    <b>Strict</b>
                  </td>
                  <td>14 or more days before</td>
                  <td>50%</td>
                </tr>
                <tr>
                  <td>Less than 14 days</td>
                  <td>0%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <P>
            <i>
              These are Lotnis's current defaults; the live tiers for your booking are always the ones displayed when
              you booked.
            </i>{' '}
            Days are counted to your check-in date in Ghana time (Africa/Accra).
          </P>
        </>
      ),
    },
    {
      id: 'example-before',
      title: 'Example: cancelling before check-in',
      body: (
        <>
          <P>
            You book a place for GHS 1,000 under the Standard policy, with a 2% service fee (GHS 20) and a GHS 100
            deposit. You pay GHS 1,120. You cancel 5 days before check-in: 50% of GHS 1,000 = GHS 500 is refunded, plus
            the GHS 100 deposit. You receive <b>GHS 600</b>. The service fee (GHS 20) is kept by Lotnis and the host
            keeps the remaining GHS 500 (less Lotnis's commission).
          </P>
        </>
      ),
    },
    {
      id: 'host-cancel',
      title: 'When the host or Lotnis cancels',
      body: (
        <>
          <P>
            If the host cancels a confirmed booking, or Lotnis cancels it (for example the listing was unsafe or
            inaccurate), you're refunded <b>in full</b> — stay price, service fee and deposit — whatever the policy
            says. The host's payout for that booking is cancelled. Hosts who cancel repeatedly can be penalised or
            removed.
          </P>
        </>
      ),
    },
    {
      id: 'leaving',
      title: 'Leaving after you have moved in',
      body: (
        <>
          <L
            items={[
              <>
                Open the trip in <b>My trips → Leave early</b> and choose your departure date. You'll see the exact
                estimate before you send the notice.
              </>,
              <>
                Your host and Lotnis are notified immediately and can see your reason. The host can reply, confirm your
                move-out, and tell us if they've re-let the space.
              </>,
              <>
                <b>The notice rule:</b> you pay for the nights you stay plus any part of a 7-night notice period you
                didn't give. Notice never runs past your original end date. Nights the host re-lets in that period are
                credited back.
              </>,
              <>
                <b>If the host is at fault</b> (unlivable space, broken promises), no notice charge applies and Lotnis
                may refund the service fee too.
              </>,
              <>The unused rent is refunded; the service fee is kept unless the host is at fault.</>,
            ]}
          />
          <div className="legal-table-wrap">
            <table className="legal-table">
              <thead>
                <tr>
                  <th>Example: 31-night monthly stay, GHS 3,100</th>
                  <th>Nights charged</th>
                  <th>Rent refunded</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Leave after 10 nights, no notice</td>
                  <td>10 + 7 = 17</td>
                  <td>GHS 1,400</td>
                </tr>
                <tr>
                  <td>Leave after 10 nights, gave 7+ nights' notice</td>
                  <td>10</td>
                  <td>GHS 2,100</td>
                </tr>
                <tr>
                  <td>Leave after 10 nights, no notice, host re-lets 2 nights after you go</td>
                  <td>10 + 2 = 12</td>
                  <td>GHS 1,900</td>
                </tr>
                <tr>
                  <td>Leave after 28 nights, no notice (3 nights left)</td>
                  <td>28 + 3 = 31</td>
                  <td>GHS 0</td>
                </tr>
                <tr>
                  <td>Leave after 10 nights, host at fault</td>
                  <td>10</td>
                  <td>GHS 2,100 (+ service fee at Lotnis's discretion)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ),
    },
    {
      id: 'deposit',
      title: 'Your deposit',
      body: (
        <>
          <P>
            Deposits are returned after move-out. A host can list deductions, each with an amount, a reason and photo or
            receipt evidence — never more than the deposit in total. You can accept or dispute each one. Lotnis rules on
            disputes and records a written reason. Deductions that aren't backed by evidence, or that cover normal wear
            and tear, are waived. The remaining deposit is then included in your refund.
          </P>
        </>
      ),
    },
    {
      id: 'process',
      title: 'How and when refunds are sent',
      body: (
        <>
          <L
            items={[
              <>Every cancellation or settled move-out creates a refund that Lotnis reviews.</>,
              <>
                The refund shows in your trip as <i>pending</i>, <i>being sent</i>, <i>sent</i> or{' '}
                <i>needs attention</i>.
              </>,
              <>
                When it's sent you receive a notification with the payment reference and method. Your host is notified
                too.
              </>,
              <>
                If a refund fails, we tell you why and retry. You never need to chase — but you can always contact
                support.
              </>,
            ]}
          />
        </>
      ),
    },
    {
      id: 'overrides',
      title: 'Exceptions and Lotnis decisions',
      body: (
        <>
          <P>
            Real life is messy. Lotnis can adjust a refund where the rules above don't fit — for example a serious
            emergency, a safety problem, or a host who didn't deliver what was listed. Every adjustment needs a written
            reason, which both guest and host can see on the case.
          </P>
        </>
      ),
    },
  ],
};
