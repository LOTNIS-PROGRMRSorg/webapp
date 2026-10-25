import { Building2 } from 'lucide-react';
import { StepKey, StepProps } from './applicationShared';

export function ReviewStep({ form, set, text, profile, uploading, upload, has, goTo }: StepProps) {
  return (
    <>
            <div className="app-review">
              {([
                ['account', 'Account', [form.accountType === 'business' ? 'Business' : 'Individual', form.displayName]],
                ['contact', 'Contact & address', [form.phone, [form.streetAddress, form.city, form.country].filter(Boolean).join(', '), has.proof ? 'Proof of address ✓' : 'Proof of address missing']],
                ['identity', 'Identity', [`${form.legalFirstName} ${form.legalLastName}`.trim(), form.dateOfBirth, has.idFront && has.selfie ? 'ID & selfie ✓' : 'ID or selfie missing']],
                ...(form.accountType === 'business' ? [['business', 'Business', [form.businessName, has.cert ? 'Certificate ✓' : 'Certificate missing']]] as const : []),
                ['payout', 'Payouts', [form.payoutMethod === 'bank' ? `${form.bankName} · ${form.bankAccountNumber}` : `${form.momoProvider} · ${form.momoNumber}`]],
              ] as ReadonlyArray<readonly [StepKey, string, string[]]>).map(([key, title, lines]) => (
                <div className="app-review-row" key={key}>
                  <div><strong>{title}</strong>{lines.filter(Boolean).map((l) => <span key={l}>{l}</span>)}</div>
                  <button type="button" className="button button-quiet" onClick={() => goTo(key)}>Edit</button>
                </div>
              ))}
            </div>
            <div className="notice"><Building2 size={16} /><span>After you submit, our team verifies your details. You'll see the progress here and get a notification at each stage — your host dashboard unlocks once you're approved.</span></div>
    </>
  );
}
