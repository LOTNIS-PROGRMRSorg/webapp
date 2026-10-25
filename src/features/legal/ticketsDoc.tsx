import { Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Doc, L, P } from './legalShared';

// ─────────────────────────────────────────────────────────────────────────────
// Tickets, events and voting
// ─────────────────────────────────────────────────────────────────────────────
export const TICKETS: Doc = {
  path: '/ticket-terms',
  label: 'Tickets & events',
  title: 'Terms for Tickets, Events & Voting',
  icon: Ticket,
  intro:
    'How buying tickets and voting works on Lotnis: what you pay, how entry works, what happens if an event is cancelled or postponed, and how organisers get paid. Events are run by independent organisers; Lotnis provides the platform, the payments and the support.',
  keyPoints: [
    'You can buy tickets with just an email address — an account is optional.',
    'Each ticket has its own QR code and admits one person, once.',
    'The refund and postponement rules are set by the organiser and shown before you pay.',
    'If an event is cancelled you are refunded the ticket price in full.',
    'The payment-processing fee is paid by the buyer and is not refundable.',
    'Organisers are paid after the event, so cancelled events can always be refunded.',
  ],
  sections: [
    {
      id: 'who',
      title: '1. Who is who',
      body: (
        <>
          <P>
            <b>Lotnis</b> runs the platform, takes your payment, issues tickets and handles refunds and support.{' '}
            <b>The organiser</b> creates the event, sets its price, capacity and rules, and is responsible for putting
            it on. Lotnis is not the organiser and does not guarantee that an event will take place as described; it
            does, however, protect your payment as set out below.
          </P>
          <P>
            These terms apply together with Lotnis's general <Link to="/terms">Terms of Use</Link>. The organiser's own
            terms, shown on the event page, also apply to that event. If they conflict, the rules in this page about
            refunds, payments and entry prevail.
          </P>
        </>
      ),
    },
    {
      id: 'buying',
      title: '2. Buying tickets',
      body: (
        <>
          <L
            items={[
              'You need a valid email address. Your tickets and receipt are sent there. You can sign in to keep every ticket in one place, but you don’t have to.',
              'You can buy several tickets at once and send each to a different email address. The person who receives a ticket is its holder.',
              'Prices are in cedis. Ticket types may be limited in number, sold only between certain dates, or capped per order — this is shown before you pay.',
              'Tickets are held for you for about 10 minutes while you pay. If payment doesn’t complete in that time they are released to other buyers.',
              'Free tickets need no payment but still count towards the event’s capacity and are scanned at the gate like any other.',
            ]}
          />
        </>
      ),
    },
    {
      id: 'price',
      title: '3. What you pay',
      body: (
        <>
          <P>The total is shown before you pay and has up to three parts:</P>
          <L
            items={[
              <>
                <b>The ticket price</b> set by the organiser.
              </>,
              <>
                <b>The Lotnis service fee.</b> Depending on the organiser, this is either already included in the ticket
                price or added on top and shown as its own line.
              </>,
              <>
                <b>A payment-processing fee</b>, charged by our payment provider, paid by the buyer. It is always shown
                separately and is <b>not refundable</b>.
              </>,
            ]}
          />
        </>
      ),
    },
    {
      id: 'tickets',
      title: '4. Your ticket',
      body: (
        <>
          <L
            items={[
              'Each ticket has a unique QR code and a code underneath it. It admits one person, one time. Once scanned it cannot be used again.',
              'Keep your ticket private. Whoever presents the code first is admitted, so don’t post it publicly. Lotnis cannot replace a ticket that has been used by someone else.',
              'A screenshot or a printout works as long as the code is readable. If you can’t find your tickets, open the link in your email, or sign in and open My tickets.',
              'Tickets may not be copied, altered or resold for more than the price paid. Tickets that are duplicated, forged or resold in breach of this can be cancelled without refund.',
            ]}
          />
        </>
      ),
    },
    {
      id: 'entry',
      title: '5. Entry',
      body: (
        <>
          <L
            items={[
              'Gates are staffed by the organiser’s team, who scan your code. A ticket can be refused if it has already been used, has been refunded or cancelled, or belongs to a different event.',
              'The organiser can set age limits, dress codes and entry rules (for example bag restrictions or no re-entry). These are shown on the event page, and you agree to them by buying.',
              'The organiser or venue may refuse entry or remove someone for safety reasons, unlawful behaviour or breaking the entry rules. In that case the ticket is not refunded unless the organiser decides otherwise.',
              'Please arrive in good time. A ticket does not guarantee a seat unless the ticket type says so.',
            ]}
          />
        </>
      ),
    },
    {
      id: 'refunds',
      title: '6. Refunds',
      body: (
        <>
          <P>
            <b>Set by the organiser.</b> Each event shows its refund policy before you pay — either no refunds, or
            refunds that get smaller as the event gets closer (for example 100% until 7 days before, 50% until 2 days
            before, then none).
          </P>
          <P>
            <b>How to ask.</b> Open your order and choose the tickets to refund. The moment you ask, those tickets are
            paused and cannot be scanned. Lotnis reviews the request. If it is approved the tickets are cancelled and
            your money is sent back to you, and we email you when it has been sent. If it is declined, the tickets
            become valid again.
          </P>
          <P>
            <b>What is refunded.</b> The refund percentage applies to what you paid for the tickets (the ticket price,
            plus the Lotnis service fee if it was added on top). The payment-processing fee is not refunded. A ticket
            that has already been scanned cannot be refunded.
          </P>
        </>
      ),
    },
    {
      id: 'cancel',
      title: '7. If an event is cancelled or changed',
      body: (
        <>
          <L
            items={[
              <>
                <b>Cancelled.</b> You are refunded the ticket price in full (not the processing fee), whatever the
                refund policy says. You don’t need to ask — we start the refund as soon as the event is cancelled.
              </>,
              <>
                <b>Postponed.</b> The organiser chooses one of three options and shows it before you buy: your ticket
                carries over to the new date; it carries over but you can ask for a full refund for a limited number of
                days after the new date is announced; or every ticket is refunded automatically.
              </>,
              <>
                <b>Other changes.</b> Small changes to times, line-ups or venue details don’t entitle you to a refund.
                If the venue or date changes significantly, the postponement rules above apply.
              </>,
              <>
                <b>Paused by Lotnis.</b> If we pause an event while we look into a concern, sales stop and payouts are
                held. If it can’t go ahead, it is treated as cancelled.
              </>,
            ]}
          />
        </>
      ),
    },
    {
      id: 'voting',
      title: '8. Paid voting',
      body: (
        <>
          <L
            items={[
              'Some events run paid voting (for example awards or pageants). Each category sets its own price per vote and a time window for voting.',
              'No account is needed; you need an email address for your receipt. You can vote as many times as you like by buying more votes.',
              'Votes are final once your payment is confirmed. They are refunded only if the organiser cancels voting or the event.',
              'Organisers choose whether live vote counts and rankings are public or shown only after voting closes. Lotnis may remove votes found to be fraudulent or the result of abuse.',
              'Each contestant has a shareable page. Sharing it is up to the contestant and organiser; Lotnis doesn’t endorse any contestant.',
            ]}
          />
        </>
      ),
    },
    {
      id: 'reviews',
      title: '9. Reviews',
      body: (
        <>
          <P>
            Only people whose ticket was scanned at the gate can review an event, so reviews come from real attendees.
            Reviews must be honest and respectful. Organisers can reply publicly. Lotnis may hide reviews that break our
            conduct rules.
          </P>
        </>
      ),
    },
    {
      id: 'organisers',
      title: '10. For organisers',
      body: (
        <>
          <L
            items={[
              'Events are reviewed before they go on sale; hosts with a good completed event can publish automatically, but Lotnis can still pause or remove any event.',
              'You set ticket types, prices, capacity, your refund policy and your postponement policy. These are locked once tickets are sold, because buyers agreed to them.',
              'Lotnis takes its commission from every ticket and vote — shown in your dashboard. You choose whether it comes out of your price or is added on top for buyers.',
              'You are paid after the event: 48 hours after it ends for tickets, and 48 hours after voting closes for votes, minus refunds and any amounts owed. Lotnis can hold a payout while a refund request, dispute or investigation is open.',
              'If you cancel an event every buyer is refunded in full and your payout for it is cancelled. If you postpone, your payout moves to the new date.',
              'You are responsible for the event: licences, safety, capacity and what you promised. Share gate links and PINs only with people you trust; you can switch a gate off at any time.',
            ]}
          />
        </>
      ),
    },
    {
      id: 'data',
      title: '11. Your information',
      body: (
        <>
          <P>
            We use your email and name to issue tickets, send receipts and handle refunds, and we share the holder’s
            name and email with the organiser so they can run the event. See our{' '}
            <Link to="/privacy">Privacy Policy</Link> for the details.
          </P>
        </>
      ),
    },
    {
      id: 'liability',
      title: '12. Responsibility',
      body: (
        <>
          <P>
            The organiser is responsible for the event itself. Lotnis is responsible for taking your payment, issuing
            valid tickets and refunds under these terms. Nothing here limits rights you have under Ghanaian law. We
            aren’t liable for losses caused by events outside our control, or for the conduct of organisers or other
            attendees, except where the law says we must be.
          </P>
        </>
      ),
    },
    {
      id: 'contact',
      title: '13. Questions',
      body: (
        <>
          <P>
            Problem with a ticket, a refund or an event? Email{' '}
            <a href="mailto:support@lotnis.com">support@lotnis.com</a> with your order number and we’ll help.
          </P>
        </>
      ),
    },
  ],
};
