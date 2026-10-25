import { FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Doc, L, P } from './legalShared';

// ─────────────────────────────────────────────────────────────────────────────
// Terms of Use
// ─────────────────────────────────────────────────────────────────────────────
export const TERMS: Doc = {
  path: '/terms', label: 'Terms of Use', title: 'Terms of Use', icon: FileText,
  intro: 'These terms explain how Lotnis works for guests: how you book, what you pay, what happens if plans change, and how we keep things fair between you and your host. Please read them before you book.',
  keyPoints: [
    'You see the full price — stay, Lotnis service fee and any deposit — before you pay.',
    'Stays are booked in whole units: nights, weeks, calendar months or years.',
    'Your refund if you cancel before moving in follows the policy the host chose, shown before you book.',
    'If you leave after moving in, a 7-night notice period applies, with fair credits.',
    'Lotnis reviews every refund and every deposit dispute, and tells you at each step.',
  ],
  sections: [
    { id: 'about', title: '1. About Lotnis', body: <>
      <P>Lotnis is a marketplace that connects people who need space with people who have it — rooms, houses, villas, apartments, hotels and hostels, offices, shops, garages, warehouses and venues. Lotnis is not the owner or landlord of listed spaces and is not a party to the agreement between a guest and a host, but it runs the booking, payment, refund and dispute process described here.</P>
      <P>Lotnis also sells event tickets and paid votes (see section 12a), and is planning Food and Service-provider offerings. Extra terms will be published before any new service launches.</P></> },
    { id: 'accounts', title: '2. Your account', body: <>
      <L items={['You must be 18 or over and give accurate information. You are responsible for activity on your account.', 'You sign in with Google. Keep access to that account secure and tell us at once if you think it has been misused.', 'Your phone number lets hosts and Lotnis reach you about a booking. Keep it up to date.', 'We may suspend or close accounts that break these terms, commit fraud, or put others at risk.']} /></> },
    { id: 'booking', title: '3. How booking works', body: <>
      <L items={[
        <><b>Choose a space.</b> Some listings are booked as a whole property, some room by room, some either way. When a listing allows both, booking a room blocks the whole property for those dates and booking the whole property blocks every room.</>,
        <><b>Pick dates in whole units.</b> A nightly space is booked per night. Weekly spaces are booked in whole weeks (7 nights), monthly spaces in whole calendar months (for example 1 March → 1 April), yearly spaces in whole years. We never pro-rate a month by days. Hourly spaces are not yet bookable online.</>,
        <><b>Minimum and maximum stay</b> set by the host are enforced when you pick dates.</>,
        <><b>Instant or on request.</b> Many listings confirm once you pay. Some hosts review requests first: the host has 48 hours to accept or decline. If they accept, you have up to 72 hours (or until your start date, whichever is sooner) to pay. If they decline or don't answer, you are not charged and the dates are released.</>,
        <><b>Instant listings</b> hold your dates for a short payment window (currently 30 minutes). If payment isn't completed, the hold is released.</>,
        <>A booking is confirmed only when your payment is received and verified by Lotnis.</>]} /></> },
    { id: 'price', title: '4. Prices, fees and deposits', body: <>
      <L items={[
        <>Prices are in Ghana cedis (GHS). The price on the listing is per night, week, month or year as shown.</>,
        <><b>Lotnis service fee.</b> A percentage of the stay price (currently 2%) is added at checkout. It pays for verification, payments, support and dispute handling. It is shown before you pay and is not refunded when a guest cancels or leaves early, except where the host is found at fault (see section 8).</>,
        <><b>Security deposit.</b> Some listings require a refundable deposit, collected with your payment. It is returned after move-out, less any itemised deductions you can review and dispute (section 9).</>,
        <>Discounts shown on a listing are applied to the stay price before the service fee is calculated.</>,
        <>Fee percentages and rules can change. Changes never affect a booking you have already made: the price and refund terms you saw when you booked are frozen for that booking.</>]} /></> },
    { id: 'payments', title: '5. Payments', body: <>
      <P>Payments are processed by Paystack using mobile money (MTN, Telecel, AirtelTigo) or Visa and Mastercard. Lotnis never sees or stores your card number or mobile-money PIN. Your payment is checked with Paystack before your booking is confirmed. If a charge succeeds but your booking can't be confirmed (for example the dates were taken), contact us and we will refund you in full.</P></> },
    { id: 'cancel-before', title: '6. Cancelling before you move in', body: <>
      <L items={[
        <>Every listing has a <b>refund policy</b> chosen by the host from the options Lotnis offers. You see its exact tiers before you pay and on your booking.</>,
        <>The share of the <b>stay price</b> refunded depends on how many days remain before check-in. For example under a "Standard" policy: 7 or more days before → 100%; 3–6 days → 50%; under 3 days → 0%.</>,
        <>The <b>Lotnis service fee is not refunded</b> when you cancel. Any <b>security deposit is refunded in full</b>.</>,
        <>The terms you saw when you booked are the terms that apply, even if the host or Lotnis later edits the policy.</>,
        <>If your booking was never paid, nothing is charged and nothing is refunded.</>,
        <>Before you confirm a cancellation, Lotnis shows you the exact amount you will receive.</>]} />
      <P>See the full <Link to="/refund-policy">Cancellation &amp; Refund Policy</Link> for examples.</P></> },
    { id: 'host-cancel', title: '7. If the host cancels', body: <>
      <P>If a host cancels a confirmed booking before you move in, or Lotnis cancels it because of a problem with the listing or host, you receive a <b>full refund of everything you paid</b>, including the service fee and deposit, regardless of the refund policy. Lotnis may also apply penalties to hosts who cancel.</P></> },
    { id: 'leave-early', title: '8. Leaving early after you have moved in', body: <>
      <P>Once your stay has started you can't "cancel" — you give <b>notice to leave</b> from My trips. Your host and Lotnis see your notice straight away, along with your reason, so everyone can plan.</P>
      <L items={[
        <><b>You pay for the nights you stayed, plus any notice you didn't give.</b> We ask for 7 nights' notice. If you give 7 or more nights in advance, there is nothing extra to pay. If you give less, the shortfall is charged.</>,
        <><b>Never past your booking end.</b> The notice charge can't extend beyond the date your booking was due to end.</>,
        <><b>Re-let credit.</b> If your host lets the space again during your notice period, those nights are credited back to you so the host isn't paid twice.</>,
        <><b>Host at fault.</b> If the space was unlivable or the host broke the agreement, no notice charge applies and Lotnis may also refund the service fee.</>,
        <>You get the rest of your stay price back. The service fee is not refunded unless the host is at fault.</>]} />
      <P><b>Worked example.</b> A monthly stay of 31 nights costs GHS 3,100 (GHS 100 a night). You leave after 10 nights with no advance notice. You pay for 10 nights + 7 notice nights = 17 nights (GHS 1,700) and are refunded the other 14 nights: GHS 1,400. If you gave 7 nights' notice in advance, you'd pay for 10 nights and be refunded GHS 2,100. If your host re-lets the room two nights after you leave, the other five notice nights are credited back and you pay for just 12 nights in total.</P>
      <P>You can withdraw a notice any time before you move out. Lotnis reviews every case and decides anything the guest and host can't agree on.</P></> },
    { id: 'deposit', title: '9. Deposits, deductions and disputes', body: <>
      <L items={[
        <>After you move out, your host has the chance to list deductions from the deposit — for example damage beyond normal wear, or unpaid bills.</>,
        <><b>Every deduction must be itemised</b> with an amount, a reason and photo or receipt evidence. A host can't deduct more than the deposit.</>,
        <>You can <b>accept or dispute each deduction</b> and add comments. Disputes go to Lotnis, who review the evidence from both sides and rule — uphold, reduce or waive — and give a written reason that both of you can see.</>,
        <>Once all deductions are decided, Lotnis settles the case and sends the remaining deposit back to you.</>,
        <>Normal wear and tear, and cleaning that is part of an ordinary turnover, aren't valid deductions.</>]} /></> },
    { id: 'refund-process', title: '10. How refunds are sent', body: <>
      <P>Refunds are reviewed and sent by Lotnis, not automatically by the host. Each refund appears in your trip with a status — <i>pending</i>, <i>being sent</i>, <i>sent</i> or <i>needs attention</i> — and you get a notification at each step, including the payment reference when it has been sent. Refunds go back to the original payment method where possible, or to a mobile-money number you confirm with us. Contact support if a refund hasn't arrived within the time shown on your refund.</P></> },
    { id: 'conduct', title: '11. Conduct and reviews', body: <>
      <L items={['Treat the space, the host and neighbours with respect, and follow the house rules on the listing.', 'Don\'t exceed the stated number of guests, run events, sublet, or use the space for anything unlawful.', 'Reviews must be honest and based on your own stay. We remove reviews that are abusive, fake or off-topic.', 'You\'re responsible for damage you or your guests cause beyond normal wear.']} /></> },
    { id: 'disputes', title: '12. Problems and disputes', body: <>
      <P>If something goes wrong, tell your host and contact Lotnis support as early as you can. For cancellations, notices, deposits and refunds, Lotnis acts as the decision-maker between guest and host and records every decision and reason on your case. If you still disagree, Ghanaian law governs these terms and the courts of Ghana have jurisdiction, without limiting any rights you have under consumer-protection law.</P>
      <P><b>Report a problem after you check in.</b> If something is not as described, tell us from My trips within <b>24–48 hours of checking in</b>. A report pauses your host's payout while Lotnis looks into it. After that window the host is paid, and any later problem is between you and your host — Lotnis support will still help you resolve it.</P>
    </> },
    { id: 'events', title: '12a. Events, tickets and voting', body: <>
      <P><b>Tickets.</b> You can buy event tickets with only an email address; signing in is optional but keeps your tickets together. Each ticket has its own QR code and works once. You can send each ticket to a different email address. Keep your ticket private — whoever scans it first gets in.</P>
      <P><b>What you pay.</b> The price shown is the ticket price. Depending on the organiser, Lotnis's service fee is either already inside that price or added on top and shown as a separate line. A payment-processing fee, charged by our payment provider, is always added at checkout and is <b>not refundable</b>.</P>
      <P><b>Refunds.</b> Each organiser chooses their refund policy and it is shown before you pay. If you ask for a refund your ticket is paused straight away and cannot be scanned; Lotnis reviews the request and, if approved, the ticket is cancelled and the money is sent back to you. A scanned ticket cannot be refunded. If an event is <b>cancelled</b> you are refunded the ticket price in full. If it is <b>postponed</b>, the organiser's postponement policy applies: your ticket carries over, you may be offered a refund for a limited time, or everyone is refunded automatically — the policy is shown before you buy.</P>
      <P><b>Voting.</b> Votes are paid, final once confirmed, and are only refunded if voting is cancelled. Lotnis may remove votes that are found to be fraudulent.</P>
      <P><b>Organisers.</b> Events are run by independent organisers, not by Lotnis. Lotnis holds ticket money until after the event so cancelled events can be refunded, then pays the organiser.</P>
      <P>The full rules are in our <Link to="/ticket-terms">Terms for Tickets, Events &amp; Voting</Link>.</P></> },
    { id: 'liability', title: '13. Responsibility', body: <>
      <P>Hosts are responsible for the accuracy of their listings and the condition and safety of their spaces. Lotnis verifies host identity and reviews listings, but we can't guarantee every detail. To the extent the law allows, Lotnis isn't liable for losses caused by a host, another guest, or events outside our control, and our total liability for any booking is limited to the amount you paid for it. Nothing in these terms limits liability that can't be limited by law.</P></> },
    { id: 'changes', title: '14. Changes to these terms', body: <>
      <P>We may update these terms as Lotnis grows. We'll show the date at the top and notify you of important changes. Bookings you've already made stay under the terms and prices they were made under.</P></> },
    { id: 'contact', title: '15. Contact', body: <><P>Questions about these terms? Email <a href="mailto:support@lotnis.com">support@lotnis.com</a>.</P></> },
  ],
};
