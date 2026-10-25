import { useEffect, useState } from 'react';
import { ArrowRight, Minus, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getSession } from '@/lib/api';
import { cedis, forgetPayment, payWithPaystack, rememberPayment } from '@/features/events/eventUi';
import { eventApi, Quote } from '@/lib/api/events';
import { errText } from './votingShared';

// ── Vote checkout (shared by the category page and the contestant page) ───────

export function VoteCheckout({
  eventId,
  lines,
  onClear,
}: {
  eventId: string;
  lines: Array<{ nominee_id: string; votes: number }>;
  onClear?: () => void;
}) {
  const navigate = useNavigate();
  const session = getSession();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [email, setEmail] = useState(session?.email || '');
  const [name, setName] = useState('');
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const key = JSON.stringify(lines);

  useEffect(() => {
    if (!lines.length) {
      setQuote(null);
      return;
    }
    const t = window.setTimeout(
      () =>
        eventApi
          .voteQuote(eventId, lines)
          .then((q) => {
            setQuote(q);
            setError('');
          })
          .catch((e) => {
            setQuote(null);
            setError(errText(e, 'Unable to price your votes'));
          }),
      250,
    );
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, key]);

  if (!lines.length) return null;
  const pay = async () => {
    setError('');
    if (!/^\S+@\S+\.\S{2,}$/.test(email.trim())) {
      setError('Enter your email — your vote receipt goes there.');
      return;
    }
    if (!agree) {
      setError('Please accept the voting terms to continue.');
      return;
    }
    setBusy(true);
    try {
      const res = await eventApi.voteCheckout(eventId, {
        email: email.trim(),
        name: name.trim() || undefined,
        votes: lines,
        accepted_terms: true,
      });
      const reference = await payWithPaystack({
        email: email.trim(),
        amountPesewas: res.amount_pesewas ?? 0,
        currency: res.currency || 'GHS',
        reference: res.reference!,
        orderId: res.order_id,
      });
      if (!reference) {
        setError('Payment window closed. You have not been charged.');
        return;
      }
      rememberPayment(res.order_id, reference, res.access_token);
      await eventApi.confirm(res.order_id, reference, res.access_token);
      forgetPayment(res.order_id);
      navigate(`/orders/${res.order_id}?token=${res.access_token}`);
    } catch (e) {
      setError(errText(e, 'Something went wrong. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ev-checkout ev-votecart">
      {quote ? (
        <div className="ev-lines">
          {quote.lines.map((l) => (
            <div key={l.nominee}>
              <span>
                {l.votes} vote{(l.votes ?? 0) > 1 ? 's' : ''} · {l.nominee}
              </span>
              <b>{cedis(l.amount, quote.currency)}</b>
            </div>
          ))}
          {quote.service_fee > 0 && (
            <div>
              <span>Lotnis service fee</span>
              <b>{cedis(quote.service_fee, quote.currency)}</b>
            </div>
          )}
          {quote.processing_fee > 0 && (
            <div>
              <span>Payment processing</span>
              <b>{cedis(quote.processing_fee, quote.currency)}</b>
            </div>
          )}
          <div className="ev-total">
            <span>Total</span>
            <b>{cedis(quote.total, quote.currency)}</b>
          </div>
        </div>
      ) : (
        <div className="muted-inline">Pricing your votes…</div>
      )}
      <div className="two">
        <label className="fld">
          Email <small>for your receipt</small>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </label>
        <label className="fld">
          Name <small>optional</small>
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </label>
      </div>
      {!session && (
        <div className="notice">
          <span>
            No account needed. <Link to="/auth">Sign in</Link> to keep your receipts together.
          </span>
        </div>
      )}
      <label className="check">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />{' '}
        <span>
          I understand votes are final once paid and are only refunded if voting is cancelled. See the{' '}
          <Link to="/ticket-terms#voting" target="_blank">
            voting terms
          </Link>
          .
        </span>
      </label>
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      <div className="bk-actions">
        <button className="button button-primary button-lg" disabled={busy || !quote} onClick={pay}>
          {busy ? 'Working…' : quote ? `Pay ${cedis(quote.total, quote.currency)}` : 'Pay'} <ArrowRight size={18} />
        </button>
        {onClear && (
          <button type="button" className="button button-quiet" onClick={onClear}>
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

export function VoteStepper({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
}) {
  const clamp = (n: number) => Math.max(0, Math.min(10000, n));
  return (
    <div className="ev-vote-ctl">
      <div className="ev-stepper">
        <button type="button" onClick={() => onChange(clamp(value - 1))} aria-label="Fewer votes">
          <Minus size={16} />
        </button>
        <input
          aria-label={label}
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value.replace(/\D/g, '')) || 0))}
        />
        <button type="button" onClick={() => onChange(clamp(value + 1))} aria-label="More votes">
          <Plus size={16} />
        </button>
      </div>
      <div className="ev-quick">
        {[5, 10, 50, 100].map((k) => (
          <button type="button" key={k} onClick={() => onChange(clamp(value + k))}>
            +{k}
          </button>
        ))}
      </div>
    </div>
  );
}
