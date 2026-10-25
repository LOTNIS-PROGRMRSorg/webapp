import { UserCheck } from 'lucide-react';
import { Doc, L, P } from './legalShared';

// ─────────────────────────────────────────────────────────────────────────────
// Host agreement
// ─────────────────────────────────────────────────────────────────────────────
export const HOSTS: Doc = {
  path: '/host-agreement', label: 'Host agreement', title: 'Host Agreement', icon: UserCheck,
  intro: 'What Lotnis expects from hosts, and what hosts can expect from us: verification, listings, bookings, payouts, cancellations and deposits.',
  keyPoints: ['Every host is verified before the dashboard unlocks.', 'You choose your refund policy from the options Lotnis offers.', 'Respond to booking requests within 48 hours.', 'Stays are paid 24–48 hours after check-in; event money is paid after the event. Lotnis\'s commission is taken first.', 'Deposit deductions need evidence; Lotnis decides disputes.'],
  sections: [
    { id: 'verify', title: '1. Becoming a host', body: <>
      <P>To host you apply with your identity, contact, address, payout details (and business details if you operate as a business). The application is a step-by-step form; you can leave and return, and you can preview each document you upload.</P>
      <L items={[
        <>A Lotnis reviewer checks each requirement — identity, phone, ownership/address, business, tax and payout — <b>separately</b>.</>,
        <>If something needs fixing, you see exactly which item and why, your dashboard stays locked, and you only re-do what was flagged. Items already approved stay approved.</>,
        <>While your application waits or is being reviewed, you can see its progress and send a reminder to the team once every 24 hours.</>,
        <>You're notified at each step. When every requirement is approved, your host dashboard unlocks.</>,
        <>Lotnis can pause or remove a host who gives false information or breaks these terms, and will tell you why.</>]} /></> },
    { id: 'listings', title: '2. Your listings', body: <>
      <L items={['Describe the space honestly and show it with real photos — the cover photo and room photos are what guests rely on.', 'Choose the type of space, how it can be booked (whole property, room by room, or either) and the rental unit (nightly, weekly, monthly or yearly).', 'Set your price, any minimum/maximum stay and any refundable deposit. Add the details that apply to your type of space (bedrooms and bathrooms, ceiling height, loading access, 24-hour access, power backup, furnished, utilities).', 'Choose a refund policy from those Lotnis offers. Guests see it before they book and it\'s locked in for each booking.', 'Every listing is reviewed before it goes live. Material changes (price, unit, policy) may need review again.', 'If you list both the whole property and its rooms, a booking of one blocks the other for those dates.']} /></> },
    { id: 'bookings', title: '3. Handling bookings', body: <>
      <L items={['If you require approval, reply to each request within 48 hours. Requests you don\'t answer expire and count against your reliability.', 'Once a guest has paid, honour the booking. Cancelling a confirmed booking gives the guest a full refund, cancels your payout for it, and may lead to penalties.', 'Keep your calendar accurate. Don\'t take bookings off-platform for dates already booked on Lotnis.']} /></> },
    { id: 'fees', title: '4. Fees and payouts', body: <>
      <L items={['Lotnis charges the guest a service fee and takes a commission from your stay price (currently 3%). The percentages in force when a booking is made apply to that booking.', 'You\'re paid 24–48 hours after the guest checks in, to the mobile-money number or bank account you gave us. During that window guests can report a problem, which pauses your payout until Lotnis reviews it. Payouts are adjusted automatically if the stay is shortened or cancelled.', 'Deposits are never part of your payout; they are held for the guest and only reduced by approved deductions.']} /></> },
    { id: 'exits', title: '5. Guests leaving early', body: <>
      <L items={['When a guest gives notice you\'re notified, and can reply, confirm the move-out, and say if you\'ve re-let the space.', 'Guests owe the nights stayed plus any of the 7-night notice they didn\'t give, never past the booking end. Nights you re-let during the notice period are credited back to the guest.', 'If the space was unlivable or you broke the agreement, no notice charge applies.']} /></> },
    { id: 'deposits', title: '6. Deposit deductions', body: <>
      <L items={['After move-out you may list deductions, each with an amount, a reason and photo or receipt evidence — never more than the deposit.', 'Normal wear and tear isn\'t a valid deduction.', 'The guest can accept or dispute each one. Lotnis rules on disputes (uphold, reduce or waive) with a written reason.', 'Deductions without evidence will be waived.']} /></> },
    { id: 'conduct', title: '7. Standards and enforcement', body: <>
      <L items={['Follow the law, including any permits, safety, tax and tenancy rules that apply to your space.', 'Treat guests fairly and without discrimination.', 'Lotnis may suspend listings or accounts for false information, safety risks, repeated cancellations or abuse, and will give a reason. You can appeal by contacting support.']} /></> },
    { id: 'events-host', title: '8a. Hosting events', body: <>
      <L items={[
        'Events are submitted for review before they go on sale. After a first completed event, hosts with a clean record publish automatically; Lotnis can still pause or remove any event.',
        'You set ticket types and prices in cedis, how many of each (or unlimited), your refund policy and what happens if you postpone. Buyers see these before paying and they are locked once tickets are sold.',
        'Lotnis takes its commission (shown in your dashboard and set by Lotnis) from every ticket and vote. You choose whether it comes out of your price or is added on top for buyers — Lotnis receives the same amount either way. Payment-processing fees are always paid by the buyer.',
        'You are paid <b>after</b> the event: 48 hours after it ends for tickets and 48 hours after voting closes for votes, minus refunds. Lotnis can hold a payout while a dispute, refund request or investigation is open.',
        'If you cancel an event, every buyer is refunded in full and your payout for it is cancelled. If you postpone, your payout moves to the new date.',
        'You are responsible for the event itself: licences, safety, capacity and what you promised. Share gate links only with people you trust; you can switch any gate off at any time.',
      ].map((t, i) => <span key={i} dangerouslySetInnerHTML={{ __html: t }} />)} /></> },
    { id: 'more', title: '8. More services', body: <><P>Events are live (see 8a). Lotnis plans to add Food and Service-provider hosting to the same host account; extra terms will be published before they launch.</P></> },
  ],
};
