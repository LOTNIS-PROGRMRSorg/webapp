import { ArrowRight, CalendarCheck, CreditCard, LogOut, Plus, Search, ShieldCheck, Ticket, Undo2, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { breadcrumbLd, faqLd, Seo } from '@/lib/seo/seo';

// Everything that explains how Lotnis works lives here, so the home page can stay short.

const STEPS_GUEST: Array<[string, string, typeof Search]> = [
  ['Find it', 'Search spaces by place and type, or browse events by city and date.', Search],
  ['Choose', 'Pick your dates for a stay, or your tickets for an event. The full price is shown first.', CalendarCheck],
  ['Pay securely', 'Mobile money (MTN, Telecel, AirtelTigo) or card, handled by Paystack.', CreditCard],
  ['You\'re set', 'Stays live in My trips. Tickets arrive by email with a QR code for the gate.', Ticket],
];
const STEPS_HOST: Array<[string, string, typeof Search]> = [
  ['Get verified', 'One application with ID, a selfie and payout details. We review each part.', ShieldCheck],
  ['List it', 'Add a space with photos and prices, or create an event with tickets, gates and optional voting.', Plus],
  ['Take bookings', 'Guests pay through Lotnis. You see every booking, ticket and scan in one dashboard.', CalendarCheck],
  ['Get paid', 'After the stay or event, straight to your MoMo or bank account — your choice.', Wallet],
];

export const FAQS = [
  { id: 'what', question: 'What is Lotnis?', answer: 'Lotnis is one place to rent a space (rooms, homes, offices, garages, warehouses and venues) and to buy tickets for events across Ghana. Food ordering and service providers are coming next, all on the same account.' },
  { id: 'account', question: 'Do I need an account?', answer: 'To rent a space, yes — sign in with Google. To buy event tickets or vote, no: an email address is enough. Signing in just keeps your tickets and receipts together.' },
  { id: 'pay', question: 'Can I pay with mobile money?', answer: 'Yes. Checkout runs through Paystack, which accepts MTN, Telecel and AirtelTigo mobile money as well as Visa and Mastercard. A small payment-processing fee is added at checkout.' },
  { id: 'when-pay', question: 'When do I pay for a stay?', answer: 'If a space confirms instantly, you pay right after you reserve and your dates are held for a short window. If the host reviews requests first, they have 48 hours to reply and you pay only after they accept.' },
  { id: 'cancel', question: 'What if I need to cancel a stay?', answer: 'Every listing shows its refund policy before you book. For example, under a Standard policy you get 100% of the stay price back with 14 or more days to go. If the host cancels, you get everything back.' },
  { id: 'leave-early', question: 'What if I need to leave a stay early?', answer: 'Once you have moved in, give notice from My trips. We ask for 7 nights\' notice: give it and there is no extra charge, give less and the missing nights are charged. Your deposit is returned less any evidence-backed deductions you can dispute.' },
  { id: 'problem', question: 'What if something is wrong when I arrive?', answer: 'Report it from My trips within 24–48 hours of checking in. Your host\'s payout is paused while we look into it. After that window the host is paid and any issue is between you and your host — our support team will still help.' },
  { id: 'tickets', question: 'How do event tickets work?', answer: 'Buy one or several, and send each to a different email if you like. Every ticket has its own QR code and works once. The organiser sets the refund policy, shown before you pay; cancelled events are always refunded in full.' },
  { id: 'voting', question: 'How does paid voting work?', answer: 'Some events run awards or pageants. Each category has a price per vote and its own page, and every contestant has a link to share. Votes are final once paid, and refunded only if voting is cancelled.' },
  { id: 'verify', question: 'How are hosts verified?', answer: 'Hosts submit a government ID, a selfie, proof of address and payout details, and the Lotnis team reviews each requirement separately before the host can take bookings.' },
  { id: 'host-pay', question: 'When do hosts get paid?', answer: 'After delivery: stays 24–48 hours after check-in, event tickets 48 hours after the event ends, and votes 48 hours after voting closes. That is how cancelled events can always be refunded.' },
];

export function HowItWorksPage() {
  return (
    <div className="page how">
      <Seo title="How Lotnis works" description="How to rent a space or buy event tickets on Lotnis, how payments, refunds and deposits work, and how hosts and organisers get paid." path="/how-it-works"
        jsonLd={[faqLd(FAQS), breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'How it works', path: '/how-it-works' }])]} />
      <div className="page-head"><div><span className="eyebrow">How it works</span><h1>Simple, fair and clear.</h1><p className="lead">Everything you need to know about renting a space or going to an event on Lotnis — and about hosting.</p></div></div>

      <section className="how-block"><h2>If you're booking</h2>
        <ol className="how-steps">{STEPS_GUEST.map(([t, d, Icon], i) => <li key={t}><span className="how-n">{i + 1}</span><Icon size={22} /><h3>{t}</h3><p>{d}</p></li>)}</ol>
        <div className="how-actions"><Link className="button button-primary" to="/explore">Find a space <ArrowRight size={16} /></Link><Link className="button button-secondary" to="/events">Find an event</Link></div></section>

      <section className="how-block how-trust">
        <div><h2>Verified people. Clear prices. Fair rules.</h2>
          <ul className="policy-ticks">
            <li><b>Verified hosts.</b> ID, selfie and contact checks before anyone can take a booking.</li>
            <li><b>The full price first.</b> Stay, service fee and deposit — or ticket, fee and processing — all shown before you pay.</li>
            <li><b>Refunds worked out for you.</b> Each listing and event shows its refund rules up front.</li>
            <li><b>Fair move-outs.</b> 7 nights' notice, honest deposits, and evidence for any deduction.</li>
          </ul>
          <p><Link to="/refund-policy">Stay refunds &amp; cancellations</Link> · <Link to="/ticket-terms">Ticket &amp; event terms</Link> · <Link to="/terms">Terms of Use</Link></p></div>
        <figure className="how-policy"><figcaption>Example · a stay with a Standard policy</figcaption>
          {[['14+ days before check-in', 100], ['7–13 days before', 50], ['Under 7 days', 0]].map(([l, p]) => <div key={l as string}><span>{l}</span><div className="how-bar"><i style={{ width: `${p}%` }} /></div><b>{p}%</b></div>)}
          <p>of the stay price refunded. Your deposit is returned in full; the Lotnis service fee is not.</p></figure>
      </section>

      <section className="how-block"><h2>If you're hosting</h2>
        <ol className="how-steps">{STEPS_HOST.map(([t, d, Icon], i) => <li key={t}><span className="how-n">{i + 1}</span><Icon size={22} /><h3>{t}</h3><p>{d}</p></li>)}</ol>
        <div className="how-actions"><Link className="button button-primary" to="/host">Start hosting <ArrowRight size={16} /></Link><Link className="button button-quiet" to="/host-agreement">Read the host agreement</Link></div></section>

      <section className="how-block"><h2>Questions, answered</h2>
        <div className="how-faq">{FAQS.map((f, i) => <details key={f.id} id={f.id} open={i === 0}><summary>{f.question}</summary><p>{f.answer}</p></details>)}</div></section>
      <p className="muted-inline"><Undo2 size={14} /> <LogOut size={14} /> Still stuck? Email <a href="mailto:support@lotnis.com">support@lotnis.com</a>.</p>
    </div>
  );
}
