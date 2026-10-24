import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, Briefcase, Building2, Check, CheckCircle2, FileCheck2, Landmark, Smartphone, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from './api';
import type { HostAccess, HostProfile } from './types';

type StepKey = 'account' | 'contact' | 'identity' | 'business' | 'payout' | 'review';
type Form = {
  accountType: 'individual' | 'business'; displayName: string;
  phone: string; streetAddress: string; city: string; state: string; postalCode: string; country: string;
  legalFirstName: string; legalLastName: string; dateOfBirth: string; nationality: string;
  businessName: string; businessTaxId: string; businessWebsite: string; businessPhone: string; businessEmail: string;
  payoutMethod: 'bank' | 'mobile_money'; bankName: string; bankAccountNumber: string; bankAccountName: string;
  momoProvider: string; momoNumber: string;
};

const EMPTY: Form = {
  accountType: 'individual', displayName: '', phone: '', streetAddress: '', city: '', state: '', postalCode: '', country: 'Ghana',
  legalFirstName: '', legalLastName: '', dateOfBirth: '', nationality: 'Ghanaian',
  businessName: '', businessTaxId: '', businessWebsite: '', businessPhone: '', businessEmail: '',
  payoutMethod: 'mobile_money', bankName: '', bankAccountNumber: '', bankAccountName: '', momoProvider: '', momoNumber: '',
};
const DRAFT_KEY = 'lotnis_host_application_draft';
const MOMO_PROVIDERS = ['MTN MoMo', 'Telecel Cash', 'AirtelTigo Money'];

const STEP_META: Record<StepKey, { title: string; blurb: string }> = {
  account:  { title: 'Account', blurb: 'How you will host' },
  contact:  { title: 'Contact & address', blurb: 'Where we can reach you' },
  identity: { title: 'Identity', blurb: 'Confirm who you are' },
  business: { title: 'Business', blurb: 'Your registered business' },
  payout:   { title: 'Payouts', blurb: 'Where we send your money' },
  review:   { title: 'Review', blurb: 'Check and submit' },
};
// Which admin review item lives on which step, so "fix this" lands in the right place.
const REQUIREMENT_STEP: Record<string, StepKey> = {
  identity: 'identity', phone: 'contact', ownership: 'contact', business: 'business', tax: 'business', payout: 'payout',
};
const REQUIREMENT_LABEL: Record<string, string> = {
  identity: 'Identity', phone: 'Phone number', ownership: 'Proof of address', business: 'Business registration', tax: 'Tax information', payout: 'Payout details',
};

function fromProfile(p: HostProfile): Form {
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

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="app-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

function FileField({ label, hint, existingUrl, uploading, onPick }: { label: string; hint?: string; existingUrl?: string | null; uploading: boolean; onPick: (file: File) => void }) {
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

export function HostApplicationPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>(() => {
    try { return { ...EMPTY, ...JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}') }; } catch { return EMPTY; }
  });
  const [profile, setProfile] = useState<HostProfile | null>(null);
  const [access, setAccess] = useState<HostAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState('');
  const started = useRef(false);

  const steps = useMemo<StepKey[]>(
    () => (form.accountType === 'business' ? ['account', 'contact', 'identity', 'business', 'payout', 'review'] : ['account', 'contact', 'identity', 'payout', 'review']),
    [form.accountType],
  );
  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
  const text = (key: keyof Form) => ({ value: form[key] as string, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => set(key, e.target.value as never) });

  useEffect(() => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(form)); } catch { /* storage unavailable */ } }, [form]);

  const load = useCallback(async () => {
    try {
      const [p, a] = await Promise.all([api.getHostProfile(), api.getHostAccess()]);
      // Queued, under review or already verified: nothing to edit here.
      if (['submitted', 'in_review', 'verified'].includes(a.state)) { navigate('/host', { replace: true }); return; }
      setAccess(a); setProfile(p);
      if (p) setForm(fromProfile(p));
      if (!started.current) {
        started.current = true;
        // Jump to the first step an admin flagged so the host lands on what to fix.
        const flagged = a.items.map((i) => REQUIREMENT_STEP[i.requirement]).filter(Boolean);
        if (flagged.length) {
          const order: StepKey[] = (p?.account_type ?? 'individual') === 'business'
            ? ['account', 'contact', 'identity', 'business', 'payout', 'review'] : ['account', 'contact', 'identity', 'payout', 'review'];
          setStepIndex(Math.max(0, order.indexOf(flagged.sort((x, y) => order.indexOf(x) - order.indexOf(y))[0])));
        } else if (p) setStepIndex(1);
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load your application'); }
    finally { setLoading(false); }
  }, [navigate]);
  useEffect(() => { load(); }, [load]);

  const flaggedBySteps = useMemo(() => {
    const map: Partial<Record<StepKey, Array<{ requirement: string; reason: string }>>> = {};
    for (const item of access?.items ?? []) {
      const key = REQUIREMENT_STEP[item.requirement];
      if (key) (map[key] ??= []).push({ requirement: item.requirement, reason: [item.reason, item.note].filter(Boolean).join(' — ') || 'Please review and update this.' });
    }
    return map;
  }, [access]);

  const has = {
    idFront: !!profile?.gov_id_front_image_url, selfie: !!profile?.selfie_image_url,
    proof: !!profile?.proof_image_url, cert: !!profile?.biz_certificate_image_url,
  };

  const validate = (key: StepKey): string => {
    const blank = (v: string) => !v.trim();
    switch (key) {
      case 'account': return blank(form.displayName) ? 'Enter the name guests will see.' : '';
      case 'contact': return [form.phone, form.streetAddress, form.city, form.country].some(blank) ? 'Phone number, street address, city and country are required.' : '';
      case 'identity':
        if ([form.legalFirstName, form.legalLastName, form.dateOfBirth, form.nationality].some(blank)) return 'Enter your legal name, date of birth and nationality exactly as on your ID.';
        if (!has.idFront || !has.selfie) return 'Upload the front of your government ID and a selfie.';
        return '';
      case 'business':
        if (blank(form.businessName)) return 'Enter your registered business name.';
        return has.cert ? '' : 'Upload your business registration certificate.';
      case 'payout':
        return form.payoutMethod === 'bank'
          ? ([form.bankName, form.bankAccountNumber, form.bankAccountName].some(blank) ? 'Enter your bank, account number and account name.' : '')
          : ([form.momoProvider, form.momoNumber].some(blank) ? 'Choose a provider and enter your mobile money number.' : '');
      default: return '';
    }
  };

  const payload = () => ({
    categories: ['property'], accountType: form.accountType, displayName: form.displayName.trim(), phone: form.phone.trim(),
    legalFirstName: form.legalFirstName || undefined, legalLastName: form.legalLastName || undefined,
    dateOfBirth: form.dateOfBirth || undefined, nationality: form.nationality || undefined,
    streetAddress: form.streetAddress, city: form.city, state: form.state || undefined, postalCode: form.postalCode || undefined, country: form.country,
    ...(form.accountType === 'business' ? {
      businessName: form.businessName, businessTaxId: form.businessTaxId, businessWebsite: form.businessWebsite,
      businessPhone: form.businessPhone, businessEmail: form.businessEmail,
    } : {}),
    payoutMethod: form.payoutMethod,
    ...(form.payoutMethod === 'bank'
      ? { bankName: form.bankName, bankAccountNumber: form.bankAccountNumber, bankAccountName: form.bankAccountName }
      : { momoProvider: form.momoProvider, momoNumber: form.momoNumber }),
  });

  const save = async (): Promise<boolean> => {
    try { setProfile(await api.saveHostProfile(payload())); return true; }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to save your details'); return false; }
  };

  const next = async (event?: FormEvent) => {
    event?.preventDefault();
    const problem = validate(step);
    if (problem) { setError(problem); return; }
    setError(''); setBusy(true);
    // The profile row is created once name + address are known (document uploads need it).
    const shouldSave = step === 'contact' || (profile !== null && step !== 'account');
    if (shouldSave && !(await save())) { setBusy(false); return; }
    setBusy(false);
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const back = () => { setError(''); setStepIndex((i) => Math.max(0, i - 1)); };

  const upload = async (slot: string, file: File) => {
    if (!profile) { setError('Save your contact details first, then upload documents.'); return; }
    setUploading(slot); setError('');
    try { await api.uploadHostDocument(slot, file); setProfile(await api.getHostProfile()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Upload failed — please try again'); }
    finally { setUploading(''); }
  };

  const submit = async () => {
    const order = steps.filter((s) => s !== 'review' && s !== 'account');
    for (const key of order) {
      const problem = validate(key) || (key === 'contact' && !has.proof ? 'Upload a proof of address (utility bill or tenancy agreement).' : '');
      if (problem) { setError(problem); setStepIndex(steps.indexOf(key)); return; }
    }
    setBusy(true); setError('');
    try {
      if (!(await save())) return;
      await api.submitHostApplication();
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      navigate('/host', { replace: true });
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to submit your application'); }
    finally { setBusy(false); }
  };

  if (loading) return <div className="section empty-state">Loading your application…</div>;
  const stepFlags = flaggedBySteps[step] ?? [];
  const isReview = step === 'review';

  return (
    <section className="section app-wrap">
      <Link className="back-link" to="/host">← Back</Link>
      <span className="eyebrow">Host application</span>
      <h1 className="app-title">{access?.state === 'action_required' ? 'Fix and resubmit.' : 'Become a Lotnis host.'}</h1>
      <p className="lead">We verify every host so guests can book with confidence. It takes about five minutes — your progress is saved as you go.</p>

      <div className="app-layout">
        <ol className="app-steps" aria-label="Application steps">
          {steps.map((key, i) => {
            const flagged = (flaggedBySteps[key]?.length ?? 0) > 0;
            const done = i < stepIndex;
            return (
              <li key={key} className={`app-step ${i === stepIndex ? 'app-step-current' : ''} ${done ? 'app-step-done' : ''} ${flagged ? 'app-step-flag' : ''}`}>
                <button type="button" disabled={i > stepIndex && !profile} onClick={() => { setError(''); setStepIndex(i); }}>
                  <span className="app-step-dot">{flagged ? <AlertTriangle size={14} /> : done ? <Check size={14} /> : i + 1}</span>
                  <span className="app-step-text"><strong>{STEP_META[key].title}</strong><small>{STEP_META[key].blurb}</small></span>
                </button>
              </li>
            );
          })}
        </ol>

        <form className="app-card" onSubmit={next}>
          <div className="app-progress" aria-hidden="true"><span style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} /></div>
          <div className="app-card-head"><small>Step {stepIndex + 1} of {steps.length}</small><h2>{STEP_META[step].title}</h2></div>

          {stepFlags.length > 0 && (
            <div className="app-flag"><AlertTriangle size={18} /><div>
              <strong>Needs your attention</strong>
              <ul>{stepFlags.map((f) => <li key={f.requirement}><b>{REQUIREMENT_LABEL[f.requirement]}:</b> {f.reason}</li>)}</ul>
            </div></div>
          )}

          {step === 'account' && <>
            <div className="app-choice-row" role="radiogroup" aria-label="Account type">
              {([['individual', 'Individual', 'I rent out my own space', User], ['business', 'Business', 'A registered company or agency', Briefcase]] as const).map(([value, title, sub, Icon]) => (
                <button type="button" role="radio" aria-checked={form.accountType === value} key={value} className={`app-choice ${form.accountType === value ? 'app-choice-on' : ''}`} onClick={() => set('accountType', value)}>
                  <Icon size={22} /><strong>{title}</strong><small>{sub}</small>
                </button>
              ))}
            </div>
            <Field label="Display name" hint="Shown to guests on your listings."><input required placeholder="e.g. Ama's Homes" {...text('displayName')} /></Field>
          </>}

          {step === 'contact' && <>
            <Field label="Phone number" hint="We verify this number — guests and Lotnis may call it."><input required type="tel" placeholder="024 000 0000" {...text('phone')} /></Field>
            <Field label="Street address"><input required {...text('streetAddress')} /></Field>
            <div className="app-grid">
              <Field label="City"><input required {...text('city')} /></Field>
              <Field label="Region / State"><input {...text('state')} /></Field>
              <Field label="Postal code"><input {...text('postalCode')} /></Field>
              <Field label="Country"><input required {...text('country')} /></Field>
            </div>
            <FileField label="Proof of address" hint="A recent utility bill or tenancy agreement" existingUrl={profile?.proof_image_url} uploading={uploading === 'proof-of-address'} onPick={(f) => upload('proof-of-address', f)} />
            {!profile && <p className="muted-inline">You can upload this on the next screen once your details are saved.</p>}
          </>}

          {step === 'identity' && <>
            <div className="app-grid">
              <Field label="Legal first name"><input required {...text('legalFirstName')} /></Field>
              <Field label="Legal last name"><input required {...text('legalLastName')} /></Field>
              <Field label="Date of birth"><input required type="date" max={new Date().toISOString().slice(0, 10)} {...text('dateOfBirth')} /></Field>
              <Field label="Nationality"><input required {...text('nationality')} /></Field>
            </div>
            <FileField label="Government ID — front" hint="Ghana Card, passport or driver's licence" existingUrl={profile?.gov_id_front_image_url} uploading={uploading === 'gov-id-front'} onPick={(f) => upload('gov-id-front', f)} />
            <FileField label="Government ID — back" hint="If your ID has a back (optional)" existingUrl={profile?.gov_id_back_image_url} uploading={uploading === 'gov-id-back'} onPick={(f) => upload('gov-id-back', f)} />
            <FileField label="Selfie" hint="A clear photo of your face" existingUrl={profile?.selfie_image_url} uploading={uploading === 'selfie'} onPick={(f) => upload('selfie', f)} />
          </>}

          {step === 'business' && <>
            <div className="app-grid">
              <Field label="Registered business name"><input required {...text('businessName')} /></Field>
              <Field label="Tax ID (TIN)"><input {...text('businessTaxId')} /></Field>
              <Field label="Business phone"><input type="tel" {...text('businessPhone')} /></Field>
              <Field label="Business email"><input type="email" {...text('businessEmail')} /></Field>
            </div>
            <Field label="Website"><input placeholder="https://" {...text('businessWebsite')} /></Field>
            <FileField label="Business registration certificate" existingUrl={profile?.biz_certificate_image_url} uploading={uploading === 'business-certificate'} onPick={(f) => upload('business-certificate', f)} />
          </>}

          {step === 'payout' && <>
            <div className="app-choice-row" role="radiogroup" aria-label="Payout method">
              {([['mobile_money', 'Mobile money', 'Paid to your MoMo wallet', Smartphone], ['bank', 'Bank transfer', 'Paid to your bank account', Landmark]] as const).map(([value, title, sub, Icon]) => (
                <button type="button" role="radio" aria-checked={form.payoutMethod === value} key={value} className={`app-choice ${form.payoutMethod === value ? 'app-choice-on' : ''}`} onClick={() => set('payoutMethod', value)}>
                  <Icon size={22} /><strong>{title}</strong><small>{sub}</small>
                </button>
              ))}
            </div>
            {form.payoutMethod === 'mobile_money' ? (
              <div className="app-grid">
                <Field label="Provider"><select required {...text('momoProvider')}><option value="" disabled>Choose a provider…</option>{MOMO_PROVIDERS.map((p) => <option key={p}>{p}</option>)}</select></Field>
                <Field label="Mobile money number"><input required type="tel" {...text('momoNumber')} /></Field>
              </div>
            ) : (
              <div className="app-grid">
                <Field label="Bank name"><input required {...text('bankName')} /></Field>
                <Field label="Account number"><input required inputMode="numeric" {...text('bankAccountNumber')} /></Field>
                <Field label="Account name"><input required {...text('bankAccountName')} /></Field>
              </div>
            )}
            <p className="muted-inline">Payouts are released after your guest checks in, minus Lotnis's commission.</p>
          </>}

          {isReview && <>
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
                  <button type="button" className="button button-quiet" onClick={() => setStepIndex(steps.indexOf(key))}>Edit</button>
                </div>
              ))}
            </div>
            <div className="notice"><Building2 size={16} /><span>After you submit, our team verifies your details. You'll see the progress here and get a notification at each stage — your host dashboard unlocks once you're approved.</span></div>
          </>}

          {error && <div className="form-error" role="alert">{error}</div>}

          <div className="app-footer">
            <button type="button" className="button button-quiet" onClick={back} disabled={stepIndex === 0 || busy}><ArrowLeft size={16} /> Back</button>
            {isReview
              ? <button type="button" className="button button-primary" onClick={submit} disabled={busy}>{busy ? 'Submitting…' : access?.state === 'action_required' ? 'Resubmit for review' : 'Submit for review'} <ArrowRight size={16} /></button>
              : <button className="button button-primary" disabled={busy || !!uploading}>{busy ? 'Saving…' : 'Save and continue'} <ArrowRight size={16} /></button>}
          </div>
        </form>
      </div>
    </section>
  );
}
