import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { HostAccess, HostProfile } from '@/types';
import {
  DRAFT_KEY,
  EMPTY,
  Form,
  REQUIREMENT_LABEL,
  REQUIREMENT_STEP,
  STEP_META,
  StepKey,
  StepProps,
  fromProfile,
} from './applicationShared';
import { AccountStep } from './AccountStep';
import { ContactStep } from './ContactStep';
import { IdentityStep } from './IdentityStep';
import { BusinessStep } from './BusinessStep';
import { PayoutStep } from './PayoutStep';
import { ReviewStep } from './ReviewStep';

export function HostApplicationPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>(() => {
    try {
      return { ...EMPTY, ...JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}') };
    } catch {
      return EMPTY;
    }
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
    () =>
      form.accountType === 'business'
        ? ['account', 'contact', 'identity', 'business', 'payout', 'review']
        : ['account', 'contact', 'identity', 'payout', 'review'],
    [form.accountType],
  );
  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
  const text = (key: keyof Form) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => set(key, e.target.value as never),
  });

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {
      /* storage unavailable */
    }
  }, [form]);

  const load = useCallback(async () => {
    try {
      const [p, a] = await Promise.all([api.getHostProfile(), api.getHostAccess()]);
      // Queued, under review or already verified: nothing to edit here.
      if (['submitted', 'in_review', 'verified'].includes(a.state)) {
        navigate('/host', { replace: true });
        return;
      }
      setAccess(a);
      setProfile(p);
      if (p) setForm(fromProfile(p));
      if (!started.current) {
        started.current = true;
        // Jump to the first step an admin flagged so the host lands on what to fix.
        const flagged = a.items.map((i) => REQUIREMENT_STEP[i.requirement]).filter(Boolean);
        if (flagged.length) {
          const order: StepKey[] =
            (p?.account_type ?? 'individual') === 'business'
              ? ['account', 'contact', 'identity', 'business', 'payout', 'review']
              : ['account', 'contact', 'identity', 'payout', 'review'];
          setStepIndex(Math.max(0, order.indexOf(flagged.sort((x, y) => order.indexOf(x) - order.indexOf(y))[0])));
        } else if (p) setStepIndex(1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load your application');
    } finally {
      setLoading(false);
    }
  }, [navigate]);
  useEffect(() => {
    load();
  }, [load]);

  const flaggedBySteps = useMemo(() => {
    const map: Partial<Record<StepKey, Array<{ requirement: string; reason: string }>>> = {};
    for (const item of access?.items ?? []) {
      const key = REQUIREMENT_STEP[item.requirement];
      if (key)
        (map[key] ??= []).push({
          requirement: item.requirement,
          reason: [item.reason, item.note].filter(Boolean).join(' — ') || 'Please review and update this.',
        });
    }
    return map;
  }, [access]);

  const has = {
    idFront: !!profile?.gov_id_front_image_url,
    selfie: !!profile?.selfie_image_url,
    proof: !!profile?.proof_image_url,
    cert: !!profile?.biz_certificate_image_url,
  };

  const validate = (key: StepKey): string => {
    const blank = (v: string) => !v.trim();
    switch (key) {
      case 'account':
        return blank(form.displayName) ? 'Enter the name guests will see.' : '';
      case 'contact':
        return [form.phone, form.streetAddress, form.city, form.country].some(blank)
          ? 'Phone number, street address, city and country are required.'
          : '';
      case 'identity':
        if ([form.legalFirstName, form.legalLastName, form.dateOfBirth, form.nationality].some(blank))
          return 'Enter your legal name, date of birth and nationality exactly as on your ID.';
        if (!has.idFront || !has.selfie) return 'Upload the front of your government ID and a selfie.';
        return '';
      case 'business':
        if (blank(form.businessName)) return 'Enter your registered business name.';
        return has.cert ? '' : 'Upload your business registration certificate.';
      case 'payout':
        return form.payoutMethod === 'bank'
          ? [form.bankName, form.bankAccountNumber, form.bankAccountName].some(blank)
            ? 'Enter your bank, account number and account name.'
            : ''
          : [form.momoProvider, form.momoNumber].some(blank)
            ? 'Choose a provider and enter your mobile money number.'
            : '';
      default:
        return '';
    }
  };

  const payload = () => ({
    categories: ['property'],
    accountType: form.accountType,
    displayName: form.displayName.trim(),
    phone: form.phone.trim(),
    legalFirstName: form.legalFirstName || undefined,
    legalLastName: form.legalLastName || undefined,
    dateOfBirth: form.dateOfBirth || undefined,
    nationality: form.nationality || undefined,
    streetAddress: form.streetAddress,
    city: form.city,
    state: form.state || undefined,
    postalCode: form.postalCode || undefined,
    country: form.country,
    ...(form.accountType === 'business'
      ? {
          businessName: form.businessName,
          businessTaxId: form.businessTaxId,
          businessWebsite: form.businessWebsite,
          businessPhone: form.businessPhone,
          businessEmail: form.businessEmail,
        }
      : {}),
    payoutMethod: form.payoutMethod,
    ...(form.payoutMethod === 'bank'
      ? { bankName: form.bankName, bankAccountNumber: form.bankAccountNumber, bankAccountName: form.bankAccountName }
      : { momoProvider: form.momoProvider, momoNumber: form.momoNumber }),
  });

  const save = async (): Promise<boolean> => {
    try {
      setProfile(await api.saveHostProfile(payload()));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save your details');
      return false;
    }
  };

  const next = async (event?: FormEvent) => {
    event?.preventDefault();
    const problem = validate(step);
    if (problem) {
      setError(problem);
      return;
    }
    setError('');
    setBusy(true);
    // The profile row is created once name + address are known (document uploads need it).
    const shouldSave = step === 'contact' || (profile !== null && step !== 'account');
    if (shouldSave && !(await save())) {
      setBusy(false);
      return;
    }
    setBusy(false);
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const back = () => {
    setError('');
    setStepIndex((i) => Math.max(0, i - 1));
  };

  const upload = async (slot: string, file: File) => {
    if (!profile) {
      setError('Save your contact details first, then upload documents.');
      return;
    }
    setUploading(slot);
    setError('');
    try {
      await api.uploadHostDocument(slot, file);
      setProfile(await api.getHostProfile());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed — please try again');
    } finally {
      setUploading('');
    }
  };

  const submit = async () => {
    const order = steps.filter((s) => s !== 'review' && s !== 'account');
    for (const key of order) {
      const problem =
        validate(key) ||
        (key === 'contact' && !has.proof ? 'Upload a proof of address (utility bill or tenancy agreement).' : '');
      if (problem) {
        setError(problem);
        setStepIndex(steps.indexOf(key));
        return;
      }
    }
    setBusy(true);
    setError('');
    try {
      if (!(await save())) return;
      await api.submitHostApplication();
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      navigate('/host', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit your application');
    } finally {
      setBusy(false);
    }
  };

  const sp: StepProps = {
    form,
    set,
    text,
    profile,
    uploading,
    upload,
    has,
    goTo: (key) => setStepIndex(steps.indexOf(key)),
  };
  if (loading) return <div className="section empty-state">Loading your application…</div>;
  const stepFlags = flaggedBySteps[step] ?? [];
  const isReview = step === 'review';

  return (
    <section className="section app-wrap">
      <Link className="back-link" to="/host">
        ← Back
      </Link>
      <span className="eyebrow">Host application</span>
      <h1 className="app-title">
        {access?.state === 'action_required' ? 'Fix and resubmit.' : 'Become a Lotnis host.'}
      </h1>
      <p className="lead">
        We verify every host so guests can book with confidence. It takes about five minutes — your progress is saved as
        you go.
      </p>

      <div className="app-layout">
        <ol className="app-steps" aria-label="Application steps">
          {steps.map((key, i) => {
            const flagged = (flaggedBySteps[key]?.length ?? 0) > 0;
            const done = i < stepIndex;
            return (
              <li
                key={key}
                className={`app-step ${i === stepIndex ? 'app-step-current' : ''} ${done ? 'app-step-done' : ''} ${flagged ? 'app-step-flag' : ''}`}
              >
                <button
                  type="button"
                  disabled={i > stepIndex && !profile}
                  onClick={() => {
                    setError('');
                    setStepIndex(i);
                  }}
                >
                  <span className="app-step-dot">
                    {flagged ? <AlertTriangle size={14} /> : done ? <Check size={14} /> : i + 1}
                  </span>
                  <span className="app-step-text">
                    <strong>{STEP_META[key].title}</strong>
                    <small>{STEP_META[key].blurb}</small>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <form className="app-card" onSubmit={next}>
          <div className="app-progress" aria-hidden="true">
            <span style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} />
          </div>
          <div className="app-card-head">
            <small>
              Step {stepIndex + 1} of {steps.length}
            </small>
            <h2>{STEP_META[step].title}</h2>
          </div>

          {stepFlags.length > 0 && (
            <div className="app-flag">
              <AlertTriangle size={18} />
              <div>
                <strong>Needs your attention</strong>
                <ul>
                  {stepFlags.map((f) => (
                    <li key={f.requirement}>
                      <b>{REQUIREMENT_LABEL[f.requirement]}:</b> {f.reason}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {step === 'account' && <AccountStep {...sp} />}
          {step === 'contact' && <ContactStep {...sp} />}
          {step === 'identity' && <IdentityStep {...sp} />}
          {step === 'business' && <BusinessStep {...sp} />}
          {step === 'payout' && <PayoutStep {...sp} />}
          {isReview && <ReviewStep {...sp} />}

          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}

          <div className="app-footer">
            <button type="button" className="button button-quiet" onClick={back} disabled={stepIndex === 0 || busy}>
              <ArrowLeft size={16} /> Back
            </button>
            {isReview ? (
              <button type="button" className="button button-primary" onClick={submit} disabled={busy}>
                {busy
                  ? 'Submitting…'
                  : access?.state === 'action_required'
                    ? 'Resubmit for review'
                    : 'Submit for review'}{' '}
                <ArrowRight size={16} />
              </button>
            ) : (
              <button className="button button-primary" disabled={busy || !!uploading}>
                {busy ? 'Saving…' : 'Save and continue'} <ArrowRight size={16} />
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
