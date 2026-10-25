import { ReactNode, useCallback, useEffect, useState } from 'react';
import { Banknote, Pencil, Plus, Smartphone, Star, Trash2, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ConfirmDialog, FieldDialog } from '@/components/modals';
import { eventApi, PayoutMethod, PayoutOptions } from '@/lib/api/events';
import { money } from '@/lib/format';
import { Seo } from '@/lib/seo/seo';
import { PageHeader } from '@/components/ui';
import { errText } from './hostHomeShared';

// ── Payout accounts ──────────────────────────────────────────────────────────

export const MOMO_LABEL: Record<string, string> = { MTN: 'MTN MoMo', TELECEL: 'Telecel Cash', AIRTELTIGO: 'AirtelTigo Money' };

export function HostPayoutSettings() {
  const [methods, setMethods] = useState<PayoutMethod[] | null>(null);
  const [options, setOptions] = useState<PayoutOptions | null>(null);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState<ReactNode>(null);
  const close = () => setDialog(null);
  const load = useCallback(() => eventApi.payouts.methods().then((m) => { setMethods(m); setError(''); }).catch((e) => { setError(errText(e)); setMethods([]); }), []);
  useEffect(() => { load(); eventApi.payouts.methodOptions().then(setOptions).catch(() => {}); }, [load]);
  const done = async () => { close(); await load(); };

  const momo = (network: string) => (methods ?? []).find((m) => m.kind === 'momo' && m.provider === network);
  const banks = (methods ?? []).filter((m) => m.kind === 'bank');
  const takenBanks = new Set(banks.map((b) => b.provider));

  const addMomo = (network: string) => setDialog(
    <FieldDialog title={`Add ${MOMO_LABEL[network]}`} intro="Lotnis sends your earnings to this number. It must be registered in your name." submitLabel="Add number"
      fields={[{ name: 'account_number', label: 'Mobile money number', type: 'text', required: true, placeholder: '0244 123 456', hint: `a ${network} number` }, { name: 'account_name', label: 'Name on the account', type: 'text', required: true, placeholder: 'Ama Owusu' }]}
      onSubmit={async (v) => { await eventApi.payouts.addMethod({ kind: 'momo', provider: network, account_number: String(v.account_number), account_name: String(v.account_name) }); await done(); }} onClose={close} />);
  const addBank = () => setDialog(
    <FieldDialog title="Add a bank account" intro="Lotnis sends your earnings to this account. It must be in your name (or your business's)." submitLabel="Add account"
      fields={[{ name: 'provider', label: 'Bank', type: 'select', required: true, options: [['', 'Choose your bank…'], ...(options?.banks ?? []).filter((b) => !takenBanks.has(b)).map((b) => [b, b] as [string, string])] },
        { name: 'account_number', label: 'Account number', type: 'text', required: true, placeholder: '1234567890123' }, { name: 'account_name', label: 'Name on the account', type: 'text', required: true }]}
      onSubmit={async (v) => { await eventApi.payouts.addMethod({ kind: 'bank', provider: String(v.provider), account_number: String(v.account_number), account_name: String(v.account_name) }); await done(); }} onClose={close} />);
  const edit = (m: PayoutMethod) => setDialog(
    <FieldDialog title={`Edit ${m.kind === 'momo' ? MOMO_LABEL[m.provider] : m.provider}`} submitLabel="Save changes"
      fields={[{ name: 'account_number', label: m.kind === 'momo' ? 'Mobile money number' : 'Account number', type: 'text', required: true }, { name: 'account_name', label: 'Name on the account', type: 'text', required: true }]}
      initial={{ account_number: m.account_number, account_name: m.account_name }}
      onSubmit={async (v) => { await eventApi.payouts.updateMethod(m.id, { account_number: String(v.account_number), account_name: String(v.account_name) }); await done(); }} onClose={close} />);
  const remove = (m: PayoutMethod) => setDialog(<ConfirmDialog title="Remove this account?" body={`${m.kind === 'momo' ? MOMO_LABEL[m.provider] : m.provider} ${m.account_number_masked} will no longer be used for payouts.${m.is_default ? ' It is your default, so another account (if you have one) becomes the default.' : ''}`} confirmLabel="Remove" danger onConfirm={async () => { await eventApi.payouts.removeMethod(m.id); await done(); }} onClose={close} />);
  const makeDefault = async (m: PayoutMethod) => { try { await eventApi.payouts.makeDefaultMethod(m.id); await load(); } catch (e) { setError(errText(e)); } };

  const Row = ({ m }: { m: PayoutMethod }) => (
    <div className={`ev-payrow ${m.is_default ? 'ev-payrow-default' : ''}`}>
      <span className="ev-payicon">{m.kind === 'momo' ? <Smartphone size={18} /> : <Banknote size={18} />}</span>
      <div><b>{m.kind === 'momo' ? MOMO_LABEL[m.provider] : m.provider}</b><small>{m.account_number_masked} · {m.account_name}</small></div>
      {m.is_default ? <span className="pill ev-pill-published"><Star size={11} /> Default</span> : <button className="button button-quiet" onClick={() => makeDefault(m)}>Make default</button>}
      <div className="form-actions"><button className="icon-btn" aria-label="Edit" onClick={() => edit(m)}><Pencil size={15} /></button><button className="icon-btn" aria-label="Remove" onClick={() => remove(m)}><Trash2 size={15} /></button></div>
    </div>
  );

  return (
    <section className="host-page">
      <Seo title="Payout accounts" description="Where Lotnis pays you" noindex />
      <Link className="back-link" to="/host/earnings">← Earnings</Link>
      <PageHeader eyebrow="Earnings" title="Payout accounts" />
      <p className="lead">Choose where Lotnis sends your money. Add one mobile money number for each network you use, and bank accounts if you prefer. One account is your <b>default</b> — that's where payouts go.</p>
      {error && <div className="form-error">{error}</div>}
      {!methods ? <div className="empty-state">Loading…</div> : <>
        <h2 className="subsection-heading">Mobile money</h2>
        <div className="ev-paylist">{(options?.momo_networks ?? ['MTN', 'TELECEL', 'AIRTELTIGO']).map((n) => {
          const m = momo(n);
          return m ? <Row key={n} m={m} /> : (
            <div className="ev-payrow ev-payrow-empty" key={n}><span className="ev-payicon"><Smartphone size={18} /></span><div><b>{MOMO_LABEL[n]}</b><small>Not added</small></div><span /><button className="button button-secondary" onClick={() => addMomo(n)}><Plus size={15} /> Add number</button></div>);
        })}</div>
        <h2 className="subsection-heading">Bank accounts</h2>
        <div className="ev-paylist">{banks.map((m) => <Row key={m.id} m={m} />)}{!banks.length && <div className="empty-state">No bank account added.</div>}</div>
        <button className="button button-secondary" onClick={addBank} disabled={!options}><Plus size={15} /> Add a bank account</button>
        <div className="notice"><Wallet size={16} /><span>For your security we tell you whenever a payout account is added, changed or made default. Payouts already being sent keep the account they were prepared with.</span></div>
        {dialog}
      </>}
    </section>
  );
}
