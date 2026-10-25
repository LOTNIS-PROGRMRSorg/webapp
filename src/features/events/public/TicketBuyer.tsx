import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Mail, Minus, Plus, Ticket } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getSession } from '@/lib/api';
import { cedis, fmtDateTime, forgetPayment, payWithPaystack, rememberPayment } from '@/features/events/eventUi';
import { eventApi, EventDetail, Quote } from '@/lib/api/events';
import { errText } from './eventShared';
import { POLICY_ICON } from './EventPage';

// ── Ticket picker + checkout ──────────────────────────────────────────────────

export function TicketBuyer({ ev, disabled }: { ev: EventDetail; disabled: boolean }) {
  const navigate = useNavigate();
  const session = getSession();
  const [qty, setQty] = useState<Record<string, number>>({});
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [step, setStep] = useState<'pick' | 'details'>('pick');
  const [email, setEmail] = useState(session?.email || '');
  const [name, setName] = useState('');
  const [split, setSplit] = useState(false);
  const [holders, setHolders] = useState<Record<number, { email: string; name: string }>>({});
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState<{ orderId: string; token: string; reference: string; amount: number; currency: string } | null>(null);

  const items = useMemo(() => Object.entries(qty).filter(([, n]) => n > 0).map(([ticket_type_id, quantity]) => ({ ticket_type_id, quantity })), [qty]);
  const count = items.reduce((a, i) => a + i.quantity, 0);
  const tickets = useMemo(() => items.flatMap((i) => Array.from({ length: i.quantity }, () => i.ticket_type_id)), [items]);

  useEffect(() => {
    if (!items.length) { setQuote(null); return; }
    setQuoting(true);
    const t = window.setTimeout(() => eventApi.quote(ev.id, items).then((q) => { setQuote(q); setError(''); }).catch((e) => { setQuote(null); setError(errText(e, 'Unable to price your tickets')); }).finally(() => setQuoting(false)), 250);
    return () => window.clearTimeout(t);
  }, [ev.id, items]);

  const change = (id: string, delta: number, max: number) => setQty((q) => {
    const total = Object.values(q).reduce((a, b) => a + b, 0);
    const next = Math.max(0, Math.min(max, (q[id] ?? 0) + delta));
    if (delta > 0 && total >= ev.max_tickets_per_order) return q;
    return { ...q, [id]: next };
  });

  const finish = async (orderId: string, token: string) => { forgetPayment(orderId); navigate(`/orders/${orderId}?token=${token}`); };
  const pay = async (p: NonNullable<typeof pending>, buyerEmail: string) => {
    const reference = await payWithPaystack({ email: buyerEmail, amountPesewas: Math.round(p.amount * 100), currency: p.currency, reference: p.reference, orderId: p.orderId });
    if (!reference) { setError('Payment window closed. Your tickets are held for 10 minutes — you can try again.'); return; }
    rememberPayment(p.orderId, reference, p.token);
    await eventApi.confirm(p.orderId, reference, p.token);
    await finish(p.orderId, p.token);
  };
  const checkout = async () => {
    setError('');
    if (!/^\S+@\S+\.\S{2,}$/.test(email.trim())) { setError('Enter a valid email — your tickets and receipt go there.'); return; }
    if (split) { for (let i = 0; i < tickets.length; i++) { const h = holders[i]?.email?.trim(); if (h && !/^\S+@\S+\.\S{2,}$/.test(h)) { setError(`Ticket ${i + 1}: that email isn't valid.`); return; } } }
    if (!agree) { setError('Please accept the refund policy and event terms to continue.'); return; }
    setBusy(true);
    try {
      if (pending) { const fresh = await eventApi.newReference(pending.orderId, pending.token); const next = { ...pending, reference: fresh.reference }; setPending(next); await pay(next, email.trim()); return; }
      const res = await eventApi.checkout(ev.id, {
        email: email.trim(), name: name.trim() || undefined, accepted_terms: true,
        tickets: tickets.map((id, i) => ({ ticket_type_id: id, holder_email: split ? holders[i]?.email?.trim() || undefined : undefined, holder_name: split ? holders[i]?.name?.trim() || undefined : undefined })),
      });
      if (res.free) { await finish(res.order_id, res.access_token); return; }
      const p = { orderId: res.order_id, token: res.access_token, reference: res.reference!, amount: (res.amount_pesewas ?? 0) / 100, currency: res.currency || ev.currency };
      setPending(p); await pay(p, email.trim());
    } catch (e) { setError(errText(e, 'Something went wrong. Please try again.')); } finally { setBusy(false); }
  };

  const typeName = (id: string) => ev.ticket_types.find((t) => t.id === id)?.name || 'Ticket';
  if (!ev.ticket_types.length) return <div className="empty-state">Tickets haven't been added yet.</div>;

  return (
    <div className="ev-buy">
      <div className="ev-types">
        {ev.ticket_types.map((t) => {
          const q = qty[t.id] ?? 0; const max = Math.min(t.max_per_order, ev.max_tickets_per_order, t.remaining ?? 50);
          const live = t.status === 'on_sale' && !disabled;
          return (
            <div className={`ev-type ${q > 0 ? 'ev-type-on' : ''}`} key={t.id}>
              <div className="ev-type-info">
                <b>{t.name}</b>{t.description && <p>{t.description}</p>}
                <small>{t.status === 'sold_out' ? 'Sold out' : t.status === 'not_started' ? `Sales open ${t.sales_start ? fmtDateTime(t.sales_start) : 'soon'}` : t.status === 'ended' ? 'Sales closed' : t.remaining != null ? `Only ${t.remaining} left` : t.max_per_order < ev.max_tickets_per_order ? `Up to ${t.max_per_order} per order` : ''}</small>
              </div>
              <strong className="ev-type-price">{t.is_free ? 'Free' : cedis(t.price, ev.currency)}</strong>
              <div className="ev-stepper" aria-label={`${t.name} quantity`}>
                <button type="button" onClick={() => change(t.id, -1, max)} disabled={!live || q === 0} aria-label="Fewer"><Minus size={16} /></button>
                <output>{q}</output>
                <button type="button" onClick={() => change(t.id, 1, max)} disabled={!live || q >= max} aria-label="More"><Plus size={16} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {count > 0 && quote && (
        <div className="ev-checkout">
          <div className="ev-lines">
            {quote.lines.map((l) => <div key={l.ticket_type_id}><span>{l.quantity} × {l.name}</span><b>{(l.unit_price ?? 0) === 0 ? 'Free' : cedis((l.quantity ?? 0) * (l.unit_price ?? 0), quote.currency)}</b></div>)}
            {quote.service_fee > 0 && <div><span>Lotnis service fee</span><b>{cedis(quote.service_fee, quote.currency)}</b></div>}
            {quote.processing_fee > 0 && <div><span>Payment processing</span><b>{cedis(quote.processing_fee, quote.currency)}</b></div>}
            <div className="ev-total"><span>Total</span><b>{quote.total === 0 ? 'Free' : cedis(quote.total, quote.currency)}</b></div>
          </div>
          {step === 'pick' ? (
            <button className="button button-primary button-lg button-wide" onClick={() => setStep('details')} disabled={quoting}>{quoting ? 'Pricing…' : 'Continue'} <ArrowRight size={18} /></button>
          ) : (
            <div className="ev-details">
              <h3>Where should we send your tickets?</h3>
              {!session && <div className="notice"><Mail size={16} /><span>No account needed — just an email. <Link to="/auth">Sign in</Link> to keep all your tickets in one place.</span></div>}
              <div className="two">
                <label className="fld">Email{session && <small>Using your account email — change it if you want the tickets elsewhere</small>}<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" /></label>
                <label className="fld">Your name <small>optional</small><input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
              </div>
              {count > 1 && <label className="check"><input type="checkbox" checked={split} onChange={(e) => setSplit(e.target.checked)} /> Send each ticket to a different person</label>}
              {split && <div className="ev-holders">{tickets.map((id, i) => (
                <div className="ev-holder" key={i}>
                  <b>Ticket {i + 1} · {typeName(id)}</b>
                  <input type="email" placeholder={`Email (defaults to ${email || 'yours'})`} value={holders[i]?.email || ''} onChange={(e) => setHolders({ ...holders, [i]: { name: holders[i]?.name || '', email: e.target.value } })} />
                  <input placeholder="Name on ticket (optional)" value={holders[i]?.name || ''} onChange={(e) => setHolders({ ...holders, [i]: { email: holders[i]?.email || '', name: e.target.value } })} />
                </div>))}</div>}
              <details className="policy-detail" open><summary>Refunds &amp; changes for this event</summary><ul>{ev.refund_summary.map((l) => <li key={l}>{l}</li>)}</ul></details>
              <label className="check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> <span>I've read the refund policy and the organiser's terms, and agree to Lotnis's <Link to="/ticket-terms" target="_blank">ticket terms</Link> and <Link to="/terms" target="_blank">Terms of Use</Link>.</span></label>
              {error && <div className="form-error" role="alert">{error}</div>}
              <button className="button button-primary button-lg button-wide" onClick={checkout} disabled={busy}>{busy ? 'Working…' : quote.total === 0 ? 'Get my free tickets' : pending ? `Retry payment · ${cedis(quote.total, quote.currency)}` : `Pay ${cedis(quote.total, quote.currency)}`} <ArrowRight size={18} /></button>
              <p className="muted-inline">{POLICY_ICON} Secured by Paystack. Lotnis never sees your card or PIN.</p>
            </div>
          )}
        </div>
      )}
      {error && step === 'pick' && <div className="form-error" role="alert">{error}</div>}
    </div>
  );
}
