import { FormEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { ImagePlus, Trash2, X } from 'lucide-react';
import { eventApi } from './eventApi';

// Lotnis-styled dialogs. These replace the browser's window.prompt / window.confirm, which look
// out of place, can't validate and can't upload a picture.

export type Field =
  | { name: string; label: string; type: 'text' | 'email' | 'textarea' | 'number'; placeholder?: string; hint?: string; required?: boolean; min?: number; max?: number; step?: string; maxLength?: number; rows?: number }
  | { name: string; label: string; type: 'select'; options: Array<[string, string]>; hint?: string; required?: boolean }
  | { name: string; label: string; type: 'checkbox'; hint?: string }
  | { name: string; label: string; type: 'photo'; hint?: string; required?: boolean; round?: boolean };

type Values = Record<string, string | boolean>;

function Shell({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    ref.current?.querySelector<HTMLElement>('input:not([type=hidden]):not([type=checkbox]),textarea,select')?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="ev-modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`ev-modal-card ${wide ? 'ev-modal-wide' : ''}`} ref={ref}>
        <div className="ev-modal-head"><h2>{title}</h2><button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button></div>
        {children}
      </div>
    </div>
  );
}

function PhotoField({ field, value, onChange }: { field: Extract<Field, { type: 'photo' }>; value: string; onChange: (url: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pick = async (file?: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('That picture is over 10 MB — choose a smaller one.'); return; }
    setBusy(true); setError('');
    try { onChange((await eventApi.host.upload(file)).url); } catch (e) { setError(e instanceof Error ? e.message : 'Upload failed'); } finally { setBusy(false); }
  };
  return (
    <div className="fld">
      <span>{field.label}{field.required && <small> required</small>}</span>
      <div className="ev-photofield">
        {value ? <div className={`ev-photo-preview ${field.round ? 'ev-photo-round' : ''}`}><img src={value} alt="" /><button type="button" className="icon-btn" onClick={() => onChange('')} aria-label="Remove picture"><Trash2 size={15} /></button></div>
          : <label className={`ev-drop ${field.round ? 'ev-drop-round' : ''}`}><ImagePlus size={22} /><span>{busy ? 'Uploading…' : 'Choose a picture'}</span><input hidden type="file" accept="image/jpeg,image/png,image/heic,image/heif" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} /></label>}
        <div className="ev-photo-hint">{field.hint || 'A clear, front-facing photo works best.'}{error && <b className="ev-photo-err"> {error}</b>}</div>
      </div>
    </div>
  );
}

/** A form in a modal. `onSubmit` may throw — the message is shown inside the dialog. */
export function FieldDialog({ title, intro, fields, initial = {}, submitLabel = 'Save', danger, onSubmit, onClose, wide }: {
  title: string; intro?: ReactNode; fields: Field[]; initial?: Values; submitLabel?: string; danger?: boolean; wide?: boolean;
  onSubmit: (values: Values) => Promise<unknown> | unknown; onClose: () => void;
}) {
  const [values, setValues] = useState<Values>(() => Object.fromEntries(fields.map((f) => [f.name, initial[f.name] ?? (f.type === 'checkbox' ? false : '')])));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (name: string, v: string | boolean) => setValues((s) => ({ ...s, [name]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    for (const f of fields) {
      const v = values[f.name];
      if ('required' in f && f.required && (v === '' || v == null)) { setError(f.type === 'photo' ? `Please add: ${f.label.toLowerCase()}.` : `${f.label} is required.`); return; }
      if (f.type === 'number' && v !== '') {
        const n = Number(v);
        if (!Number.isFinite(n) || (f.min != null && n < f.min) || (f.max != null && n > f.max)) { setError(`${f.label} must be ${f.min != null ? `at least ${f.min}` : 'a valid number'}${f.max != null ? ` and at most ${f.max}` : ''}.`); return; }
      }
    }
    setBusy(true); setError('');
    try { await onSubmit(values); } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong'); setBusy(false); }
  };

  return (
    <Shell title={title} onClose={onClose} wide={wide}>
      <form className="ev-dialog-form" onSubmit={submit} noValidate>
        {intro && <p className="ev-dialog-intro">{intro}</p>}
        {fields.map((f) => {
          if (f.type === 'photo') return <PhotoField key={f.name} field={f} value={String(values[f.name] || '')} onChange={(u) => set(f.name, u)} />;
          if (f.type === 'checkbox') return <label key={f.name} className="check"><input type="checkbox" checked={!!values[f.name]} onChange={(e) => set(f.name, e.target.checked)} /> <span>{f.label}{f.hint && <small> {f.hint}</small>}</span></label>;
          return (
            <label key={f.name} className="fld">
              <span>{f.label}{'required' in f && f.required && <small> required</small>}{f.hint && <small> {f.hint}</small>}</span>
              {f.type === 'textarea' ? <textarea rows={f.rows ?? 3} maxLength={f.maxLength} placeholder={f.placeholder} value={String(values[f.name])} onChange={(e) => set(f.name, e.target.value)} />
                : f.type === 'select' ? <select value={String(values[f.name])} onChange={(e) => set(f.name, e.target.value)}>{f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                : <input type={f.type} inputMode={f.type === 'number' ? 'decimal' : undefined} min={f.min} max={f.max} step={f.step} maxLength={f.maxLength} placeholder={f.placeholder} value={String(values[f.name])} onChange={(e) => set(f.name, e.target.value)} />}
            </label>
          );
        })}
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="form-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button className={`button ${danger ? 'button-danger' : 'button-primary'}`} disabled={busy}>{busy ? 'Saving…' : submitLabel}</button></div>
      </form>
    </Shell>
  );
}

export function ConfirmDialog({ title, body, confirmLabel = 'Confirm', danger, onConfirm, onClose }: {
  title: string; body: ReactNode; confirmLabel?: string; danger?: boolean; onConfirm: () => Promise<unknown> | unknown; onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const go = async () => { setBusy(true); setError(''); try { await onConfirm(); } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong'); setBusy(false); } };
  return (
    <Shell title={title} onClose={onClose}>
      <p className="ev-dialog-intro">{body}</p>
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="form-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button type="button" className={`button ${danger ? 'button-danger' : 'button-primary'}`} disabled={busy} onClick={go}>{busy ? 'Working…' : confirmLabel}</button></div>
    </Shell>
  );
}
