import { ReactNode, useEffect } from 'react';
import { FileText, Lock, Scale, Undo2, UserCheck } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { breadcrumbLd, faqLd, Seo, webPageLd } from './seo';

const UPDATED = '24 October 2026';

type Section = { id: string; title: string; body: ReactNode };
type Doc = { path: string; label: string; title: string; icon: typeof FileText; intro: string; keyPoints: string[]; sections: Section[] };

const P = ({ children }: { children: ReactNode }) => <p>{children}</p>;
const L = ({ items }: { items: ReactNode[] }) => <ul>{items.map((item, i) => <li key={i}>{item}</li>)}</ul>;

// ─────────────────────────────────────────────────────────────────────────────
// Terms of Use
// ─────────────────────────────────────────────────────────────────────────────
const TERMS: Doc = {
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
      <P><b>Organisers.</b> Events are run by independent organisers, not by Lotnis. Lotnis holds ticket money until after the event so cancelled events can be refunded, then pays the organiser.</P></> },
    { id: 'liability', title: '13. Responsibility', body: <>
      <P>Hosts are responsible for the accuracy of their listings and the condition and safety of their spaces. Lotnis verifies host identity and reviews listings, but we can't guarantee every detail. To the extent the law allows, Lotnis isn't liable for losses caused by a host, another guest, or events outside our control, and our total liability for any booking is limited to the amount you paid for it. Nothing in these terms limits liability that can't be limited by law.</P></> },
    { id: 'changes', title: '14. Changes to these terms', body: <>
      <P>We may update these terms as Lotnis grows. We'll show the date at the top and notify you of important changes. Bookings you've already made stay under the terms and prices they were made under.</P></> },
    { id: 'contact', title: '15. Contact', body: <><P>Questions about these terms? Email <a href="mailto:support@lotnis.com">support@lotnis.com</a>.</P></> },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Refund & cancellation policy
// ─────────────────────────────────────────────────────────────────────────────
const REFUNDS: Doc = {
  path: '/refund-policy', label: 'Refunds & cancellations', title: 'Cancellation & Refund Policy', icon: Undo2,
  intro: 'A plain-language guide to every way a booking can end — before you move in, after you move in, and when the host cancels — and exactly how the money is worked out.',
  keyPoints: [
    'Before move-in: you get back a share of the stay price set by the listing\'s policy, plus your deposit.',
    'The Lotnis service fee is kept when a guest cancels or leaves early.',
    'Host cancels: you get everything back.',
    'After move-in: pay for nights stayed plus any missing notice (7 nights), credited if the host re-lets.',
    'Lotnis reviews and sends every refund, and tells you each step.',
  ],
  sections: [
    { id: 'overview', title: 'The three situations', body: <>
      <div className="legal-table-wrap"><table className="legal-table"><thead><tr><th>Situation</th><th>What you get back</th></tr></thead><tbody>
        <tr><td>You cancel before check-in</td><td>The share of the stay price set by the listing's refund policy, depending on how early you cancel — plus your full deposit. Service fee kept.</td></tr>
        <tr><td>The host (or Lotnis) cancels before check-in</td><td>Everything you paid, including the service fee and deposit.</td></tr>
        <tr><td>You leave after moving in</td><td>The unused nights, after paying for nights stayed and any missing notice (up to 7 nights). Deposit returned after move-out, less itemised deductions.</td></tr>
      </tbody></table></div></> },
    { id: 'tiers', title: 'Refund policies (before check-in)', body: <>
      <P>Hosts choose one of the policies below (Lotnis may add more). The tiers are shown on every listing and on your booking. The percentage applies to the <b>stay price</b> — not to the service fee or the deposit.</P>
      <div className="legal-table-wrap"><table className="legal-table"><thead><tr><th>Policy</th><th>Cancel…</th><th>Stay price refunded</th></tr></thead><tbody>
        <tr><td rowSpan={2}><b>Flexible</b></td><td>1 or more days before check-in</td><td>100%</td></tr><tr><td>Less than 1 day</td><td>0%</td></tr>
        <tr><td rowSpan={3}><b>Standard</b></td><td>7 or more days before</td><td>100%</td></tr><tr><td>3–6 days before</td><td>50%</td></tr><tr><td>Less than 3 days</td><td>0%</td></tr>
        <tr><td rowSpan={2}><b>Strict</b></td><td>14 or more days before</td><td>50%</td></tr><tr><td>Less than 14 days</td><td>0%</td></tr>
      </tbody></table></div>
      <P><i>These are Lotnis's current defaults; the live tiers for your booking are always the ones displayed when you booked.</i> Days are counted to your check-in date in Ghana time (Africa/Accra).</P></> },
    { id: 'example-before', title: 'Example: cancelling before check-in', body: <>
      <P>You book a place for GHS 1,000 under the Standard policy, with a 2% service fee (GHS 20) and a GHS 100 deposit. You pay GHS 1,120. You cancel 5 days before check-in: 50% of GHS 1,000 = GHS 500 is refunded, plus the GHS 100 deposit. You receive <b>GHS 600</b>. The service fee (GHS 20) is kept by Lotnis and the host keeps the remaining GHS 500 (less Lotnis's commission).</P></> },
    { id: 'host-cancel', title: 'When the host or Lotnis cancels', body: <>
      <P>If the host cancels a confirmed booking, or Lotnis cancels it (for example the listing was unsafe or inaccurate), you're refunded <b>in full</b> — stay price, service fee and deposit — whatever the policy says. The host's payout for that booking is cancelled. Hosts who cancel repeatedly can be penalised or removed.</P></> },
    { id: 'leaving', title: 'Leaving after you have moved in', body: <>
      <L items={[
        <>Open the trip in <b>My trips → Leave early</b> and choose your departure date. You'll see the exact estimate before you send the notice.</>,
        <>Your host and Lotnis are notified immediately and can see your reason. The host can reply, confirm your move-out, and tell us if they've re-let the space.</>,
        <><b>The notice rule:</b> you pay for the nights you stay plus any part of a 7-night notice period you didn't give. Notice never runs past your original end date. Nights the host re-lets in that period are credited back.</>,
        <><b>If the host is at fault</b> (unlivable space, broken promises), no notice charge applies and Lotnis may refund the service fee too.</>,
        <>The unused rent is refunded; the service fee is kept unless the host is at fault.</>]} />
      <div className="legal-table-wrap"><table className="legal-table"><thead><tr><th>Example: 31-night monthly stay, GHS 3,100</th><th>Nights charged</th><th>Rent refunded</th></tr></thead><tbody>
        <tr><td>Leave after 10 nights, no notice</td><td>10 + 7 = 17</td><td>GHS 1,400</td></tr>
        <tr><td>Leave after 10 nights, gave 7+ nights' notice</td><td>10</td><td>GHS 2,100</td></tr>
        <tr><td>Leave after 10 nights, no notice, host re-lets 2 nights after you go</td><td>10 + 2 = 12</td><td>GHS 1,900</td></tr>
        <tr><td>Leave after 28 nights, no notice (3 nights left)</td><td>28 + 3 = 31</td><td>GHS 0</td></tr>
        <tr><td>Leave after 10 nights, host at fault</td><td>10</td><td>GHS 2,100 (+ service fee at Lotnis's discretion)</td></tr>
      </tbody></table></div></> },
    { id: 'deposit', title: 'Your deposit', body: <>
      <P>Deposits are returned after move-out. A host can list deductions, each with an amount, a reason and photo or receipt evidence — never more than the deposit in total. You can accept or dispute each one. Lotnis rules on disputes and records a written reason. Deductions that aren't backed by evidence, or that cover normal wear and tear, are waived. The remaining deposit is then included in your refund.</P></> },
    { id: 'process', title: 'How and when refunds are sent', body: <>
      <L items={[<>Every cancellation or settled move-out creates a refund that Lotnis reviews.</>, <>The refund shows in your trip as <i>pending</i>, <i>being sent</i>, <i>sent</i> or <i>needs attention</i>.</>, <>When it's sent you receive a notification with the payment reference and method. Your host is notified too.</>, <>If a refund fails, we tell you why and retry. You never need to chase — but you can always contact support.</>]} /></> },
    { id: 'overrides', title: 'Exceptions and Lotnis decisions', body: <>
      <P>Real life is messy. Lotnis can adjust a refund where the rules above don't fit — for example a serious emergency, a safety problem, or a host who didn't deliver what was listed. Every adjustment needs a written reason, which both guest and host can see on the case.</P></> },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Privacy
// ─────────────────────────────────────────────────────────────────────────────
const PRIVACY: Doc = {
  path: '/privacy', label: 'Privacy', title: 'Privacy Policy', icon: Lock,
  intro: 'What information Lotnis collects, why, who can see it, and the choices you have. We handle personal data in line with Ghana\'s Data Protection Act, 2012 (Act 843).',
  keyPoints: ['We collect only what we need to run bookings, payments, verification and support.', 'Hosts\' ID documents are stored privately and seen only by Lotnis reviewers.', 'We never sell your personal data.', 'You can ask to see, correct or delete your data.'],
  sections: [
    { id: 'collect', title: '1. What we collect', body: <>
      <L items={[
        <><b>Account:</b> name, email, profile photo and phone number (from Google sign-in and what you add).</>,
        <><b>Bookings:</b> the spaces and dates you book, prices, payments, cancellations, notices to leave, messages in a case, and deposit disputes.</>,
        <><b>Hosts:</b> legal name, date of birth, nationality, address, phone, a government ID (front and back), a selfie, proof of address, business registration and tax details for businesses, and payout details (mobile money or bank account).</>,
        <><b>Listings:</b> descriptions, photos, prices and rules you publish. Evidence photos uploaded for a deposit case.</>,
        <><b>Technical:</b> device and browser details, pages viewed and listing view counts, to keep the service secure and improve it. We store your sign-in session in your browser's local storage.</>]} /></> },
    { id: 'use', title: '2. How we use it', body: <>
      <L items={['To run bookings, take payments, send refunds and pay hosts.', 'To verify hosts and keep guests and hosts safe, and to prevent fraud.', 'To send notifications about your bookings, refunds, move-outs and verification status.', 'To resolve disputes and enforce our terms.', 'To improve Lotnis and understand how it is used.', 'To meet legal and tax obligations.']} /></> },
    { id: 'share', title: '3. Who sees your information', body: <>
      <L items={[
        <><b>Your host</b> sees your name and contact details for bookings you make with them, and the details of any move-out or deposit case.</>,
        <><b>Guests</b> see a host's display name, listing and, once booked, contact details needed for the stay.</>,
        <><b>Lotnis staff</b> with a dashboard role see what they need to verify hosts, review bookings, decide disputes and send refunds. Their actions are logged.</>,
        <><b>Paystack</b> processes payments and receives payment details you enter at checkout. <b>Our hosting and infrastructure providers</b> store data on our behalf.</>,
        <>We don't sell personal data. We share information with authorities where the law requires it.</>]} /></> },
    { id: 'docs', title: '4. Verification documents', body: <>
      <P>Host ID, selfie and proof-of-address images are stored in a private storage area and reached through time-limited links used by Lotnis reviewers. They're never shown on public listing pages. Evidence photos uploaded for deposit cases are visible to the guest, host and Lotnis involved in that case.</P></> },
    { id: 'retain', title: '5. How long we keep it', body: <><P>We keep account and booking records for as long as your account is active and for the period needed for tax, accounting and dispute purposes after that. Verification documents are kept while you host and for a limited period afterwards. When data is no longer needed we delete or anonymise it.</P></> },
    { id: 'rights', title: '6. Your choices and rights', body: <>
      <L items={['Ask for a copy of the personal data we hold about you.', 'Ask us to correct anything inaccurate — hosts can edit details until an application is under review.', 'Ask us to delete your account and data, subject to records we must keep by law.', 'Turn off non-essential notifications where offered.', 'Complain to us, or to Ghana\'s Data Protection Commission.']} /><P>Email <a href="mailto:privacy@lotnis.com">privacy@lotnis.com</a> to use these rights.</P></> },
    { id: 'security', title: '7. Security', body: <><P>We use encrypted connections, private storage for sensitive documents, role-based access for staff and audit logs for important actions. No system is perfectly secure, so please use a strong password on the Google account you sign in with.</P></> },
    { id: 'children', title: '8. Children', body: <><P>Lotnis is for people 18 and over. We don't knowingly collect data from children.</P></> },
    { id: 'changes', title: '9. Changes', body: <><P>We'll update this policy as we add services such as Food and Service providers, and tell you about important changes.</P></> },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Host agreement
// ─────────────────────────────────────────────────────────────────────────────
const HOSTS: Doc = {
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

export const LEGAL_DOCS = [TERMS, REFUNDS, PRIVACY, HOSTS];

function LegalPage({ doc }: { doc: Doc }) {
  useEffect(() => { window.scrollTo({ top: 0 }); }, [doc]);
  const Icon = doc.icon;
  return (
    <div className="page legal">
      <Seo title={doc.title} description={doc.intro} path={doc.path}
        jsonLd={[webPageLd(doc.title, doc.intro, doc.path), breadcrumbLd([{ name: 'Home', path: '/' }, { name: doc.title, path: doc.path }]), doc.path === '/refund-policy' ? faqLd(doc.sections.slice(0, 1).map(() => ({ question: 'What do I get back if I cancel a Lotnis booking?', answer: doc.keyPoints.join(' ') }))) : null]} />
      <nav className="legal-tabs" aria-label="Legal documents">
        {LEGAL_DOCS.map((d) => <NavLink key={d.path} to={d.path} className={({ isActive }) => `legal-tab ${isActive ? 'legal-tab-on' : ''}`}><d.icon size={15} /> {d.label}</NavLink>)}
      </nav>
      <header className="legal-head">
        <span className="legal-badge"><Icon size={18} /></span>
        <div><h1>{doc.title}</h1><p className="lead">{doc.intro}</p><small>Last updated {UPDATED}</small></div>
      </header>
      <div className="legal-grid">
        <aside className="legal-toc" aria-label="On this page">
          <b>On this page</b>
          {doc.sections.map((s) => <a key={s.id} href={`#${s.id}`}>{s.title}</a>)}
        </aside>
        <article className="legal-body">
          <div className="legal-summary"><b><Scale size={16} /> The short version</b><ul>{doc.keyPoints.map((k) => <li key={k}>{k}</li>)}</ul></div>
          {doc.sections.map((s) => <section key={s.id} id={s.id}><h2>{s.title}</h2>{s.body}</section>)}
        </article>
        <aside className="legal-rail">
          <div className="rail-card"><b>Questions?</b><p>Our team is happy to explain how any of this applies to your booking.</p><a className="button button-primary button-wide" href="mailto:support@lotnis.com">Email support</a></div>
          <div className="rail-card"><b>Related</b>{LEGAL_DOCS.filter((d) => d.path !== doc.path).map((d) => <Link key={d.path} to={d.path}><d.icon size={15} /> {d.label}</Link>)}</div>
          <div className="rail-card rail-note"><b>In plain words</b><p>Everything on this page applies to the booking you make today. If we change anything later, your existing bookings keep the prices and refund terms you agreed.</p></div>
        </aside>
      </div>
    </div>
  );
}

export const TermsPage = () => <LegalPage doc={TERMS} />;
export const RefundPolicyPage = () => <LegalPage doc={REFUNDS} />;
export const PrivacyPage = () => <LegalPage doc={PRIVACY} />;
export const HostAgreementPage = () => <LegalPage doc={HOSTS} />;
