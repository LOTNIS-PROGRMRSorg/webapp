import { useEffect, useRef, useState } from 'react';
import { Check, CheckCircle2, FileCheck2 } from 'lucide-react';
import type { HostProfile } from '@/types';

export type StepKey = 'account' | 'contact' | 'identity' | 'business' | 'payout' | 'review';
export type Form = {
  accountType: 'individual' | 'business'; displayName: string;
  phone: string; streetAddress: string; city: string; state: string; postalCode: string; country: string;
  legalFirstName: string; legalLastName: string; dateOfBirth: string; nationality: string;
  businessName: string; businessTaxId: string; businessWebsite: string; businessPhone: string; businessEmail: string;
  payoutMethod: 'bank' | 'mobile_money'; bankName: string; bankAccountNumber: string; bankAccountName: string;
  momoProvider: string; momoNumber: string;
};

export const EMPTY: Form = {
  accountType: 'individual', displayName: '', phone: '', streetAddress: '', city: '', state: '', postalCode: '', country: 'Ghana',
  legalFirstName: '', legalLastName: '', dateOfBirth: '', nationality: 'Ghanaian',
  businessName: '', businessTaxId: '', businessWebsite: '', businessPhone: '', businessEmail: '',
  payoutMethod: 'mobile_money', bankName: '', bankAccountNumber: '', bankAccountName: '', momoProvider: '', momoNumber: '',
};
export const DRAFT_KEY = 'lotnis_host_application_draft';
export const MOMO_PROVIDERS = ['MTN MoMo', 'Telecel Cash', 'AirtelTigo Money'];

export const STEP_META: Record<StepKey, { title: string; blurb: string }> = {
  account:  { title: 'Account', blurb: 'How you will host' },
  contact:  { title: 'Contact & address', blurb: 'Where we can reach you' },
  identity: { title: 'Identity', blurb: 'Confirm who you are' },
  business: { title: 'Business', blurb: 'Your registered business' },
  payout:   { title: 'Payouts', blurb: 'Where we send your money' },
  review:   { title: 'Review', blurb: 'Check and submit' },
};
// Which admin review item lives on which step, so "fix this" lands in the right place.
export const REQUIREMENT_STEP: Record<string, StepKey> = {
  identity: 'identity', phone: 'contact', ownership: 'contact', business: 'business', tax: 'business', payout: 'payout',
};
export const REQUIREMENT_LABEL: Record<string, string> = {
  identity: 'Identity', phone: 'Phone number', ownership: 'Proof of address', business: 'Business registration', tax: 'Tax information', payout: 'Payout details',
};

export function fromProfile(p: HostProfile): Form {
  return {
    accountType: p.account_type, displayName: p.display_name || '', phone: p.phone || '',
    streetAddress: p.street_address || '', city: p.city || '', state: p.state || '', postalCode: p.postal_code || '', country: p.country || 'Ghana',
    legalFirstName: p.legal_first_name || '', legalLastName: p.legal_last_name || '', dateOfBirth: p.date_of_birth || '', nationality: p.nationality || 'Ghanaian',
    businessName: p.business_name || '', businessTaxId: p.business_tax_id || '', businessWebsite: p.business_website || '',
    businessPhone: p.business_phone || '', businessEmail: p.business_email || '',
    payoutMethod: p.payout_method || 'mobile_money', bankName: p.bank_name || '', bankAccountNumber: p.bank_account_number || '', bankAccountName: p.bank_account_name || '',
    momoProvider: p.momo_provider || '', momoNumber: p.momo_number || '',
  };
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="app-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

export function FileField({ label, hint, existingUrl, uploading, onPick }: { label: string; hint?: string; existingUrl?: string | null; uploading: boolean; onPick: (file: File) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [local, setLocal] = useState<{ url: string; name: string; canPreview: boolean } | null>(null);
  const [zoom, setZoom] = useState(false);
  // Free the temporary blob URL when it is replaced or the field unmounts.
  useEffect(() => () => { if (local) URL.revokeObjectURL(local.url); }, [local]);

  const pick = (file: File) => {
    setLocal({ url: URL.createObjectURL(file), name: file.name, canPreview: /^image\/(jpeg|png|webp|gif)$/.test(file.type) });
    onPick(file);
  };
  const uploaded = !!existingUrl;
  const preview = local?.canPreview ? local.url : local ? null : existingUrl;
  return (
    <div className={`app-file ${uploaded ? 'app-file-done' : ''}`}>
      <button type="button" className="app-file-thumb" disabled={!preview} onClick={() => setZoom(true)} aria-label={preview ? `Preview ${label}` : label}>
        {preview ? <img src={preview} alt="" /> : uploaded ? <CheckCircle2 size={22} /> : <FileCheck2 size={22} />}
      </button>
      <div className="app-file-text">
        <strong>{label}</strong>
        <small>{uploading ? `Uploading ${local?.name ?? ''}…` : local && !uploaded ? local.name : uploaded ? (local ? `${local.name} — uploaded` : 'Uploaded — click the picture to view it') : hint || 'JPG or PNG, up to 10 MB'}</small>
      </div>
      <button type="button" className="button button-secondary" disabled={uploading} onClick={() => input.current?.click()}>{uploaded ? 'Replace' : 'Choose file'}</button>
      <input ref={input} hidden type="file" accept="image/jpeg,image/png,image/heic" onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); e.target.value = ''; }} />
      {zoom && preview && <div className="lightbox" onClick={() => setZoom(false)} role="presentation"><button type="button" className="lightbox-x" aria-label="Close preview">×</button><img src={preview} alt={label} /></div>}
    </div>
  );
}

export type StepProps = {
  form: Form; set: <K extends keyof Form>(key: K, value: Form[K]) => void;
  text: (key: keyof Form) => { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void };
  profile: HostProfile | null; uploading: string; upload: (slot: string, file: File) => void;
  has: { idFront: boolean; selfie: boolean; proof: boolean; cert: boolean }; goTo: (key: StepKey) => void;
};
