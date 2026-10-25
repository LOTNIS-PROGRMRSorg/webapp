import { Landmark, Smartphone } from 'lucide-react';
import { Field, MOMO_PROVIDERS, StepProps } from './applicationShared';

export function PayoutStep({ form, set, text, profile, uploading, upload, has, goTo }: StepProps) {
  return (
    <>
      <div className="app-choice-row" role="radiogroup" aria-label="Payout method">
        {(
          [
            ['mobile_money', 'Mobile money', 'Paid to your MoMo wallet', Smartphone],
            ['bank', 'Bank transfer', 'Paid to your bank account', Landmark],
          ] as const
        ).map(([value, title, sub, Icon]) => (
          <button
            type="button"
            role="radio"
            aria-checked={form.payoutMethod === value}
            key={value}
            className={`app-choice ${form.payoutMethod === value ? 'app-choice-on' : ''}`}
            onClick={() => set('payoutMethod', value)}
          >
            <Icon size={22} />
            <strong>{title}</strong>
            <small>{sub}</small>
          </button>
        ))}
      </div>
      {form.payoutMethod === 'mobile_money' ? (
        <div className="app-grid">
          <Field label="Provider">
            <select required {...text('momoProvider')}>
              <option value="" disabled>
                Choose a provider…
              </option>
              {MOMO_PROVIDERS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="Mobile money number">
            <input required type="tel" {...text('momoNumber')} />
          </Field>
        </div>
      ) : (
        <div className="app-grid">
          <Field label="Bank name">
            <input required {...text('bankName')} />
          </Field>
          <Field label="Account number">
            <input required inputMode="numeric" {...text('bankAccountNumber')} />
          </Field>
          <Field label="Account name">
            <input required {...text('bankAccountName')} />
          </Field>
        </div>
      )}
      <p className="muted-inline">Payouts are released after your guest checks in, minus Lotnis's commission.</p>
    </>
  );
}
