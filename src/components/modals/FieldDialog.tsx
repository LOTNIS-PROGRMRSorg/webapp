import { FormEvent, ReactNode, useState } from 'react';
import { PhotoField } from '@/components/forms/PhotoField';
import { Modal } from './Modal';

export type Field =
  | {
      name: string;
      label: string;
      type: 'text' | 'email' | 'textarea' | 'number';
      placeholder?: string;
      hint?: string;
      required?: boolean;
      min?: number;
      max?: number;
      step?: string;
      maxLength?: number;
      rows?: number;
    }
  | { name: string; label: string; type: 'select'; options: Array<[string, string]>; hint?: string; required?: boolean }
  | { name: string; label: string; type: 'checkbox'; hint?: string }
  | { name: string; label: string; type: 'photo'; hint?: string; required?: boolean; round?: boolean };

export type FieldValues = Record<string, string | boolean>;

/** A form in a Lotnis-styled modal. `onSubmit` may throw — the message is shown inside the dialog. */
export function FieldDialog({
  title,
  intro,
  fields,
  initial = {},
  submitLabel = 'Save',
  danger,
  onSubmit,
  onClose,
  wide,
}: {
  title: string;
  intro?: ReactNode;
  fields: Field[];
  initial?: FieldValues;
  submitLabel?: string;
  danger?: boolean;
  wide?: boolean;
  onSubmit: (values: FieldValues) => Promise<unknown> | unknown;
  onClose: () => void;
}) {
  const [values, setValues] = useState<FieldValues>(() =>
    Object.fromEntries(fields.map((f) => [f.name, initial[f.name] ?? (f.type === 'checkbox' ? false : '')])),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (name: string, v: string | boolean) => setValues((s) => ({ ...s, [name]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    for (const f of fields) {
      const v = values[f.name];
      if ('required' in f && f.required && (v === '' || v == null)) {
        setError(f.type === 'photo' ? `Please add: ${f.label.toLowerCase()}.` : `${f.label} is required.`);
        return;
      }
      if (f.type === 'number' && v !== '') {
        const n = Number(v);
        if (!Number.isFinite(n) || (f.min != null && n < f.min) || (f.max != null && n > f.max)) {
          setError(
            `${f.label} must be ${f.min != null ? `at least ${f.min}` : 'a valid number'}${f.max != null ? ` and at most ${f.max}` : ''}.`,
          );
          return;
        }
      }
    }
    setBusy(true);
    setError('');
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setBusy(false);
    }
  };

  return (
    <Modal title={title} onClose={onClose} wide={wide}>
      <form className="dialog-form" onSubmit={submit} noValidate>
        {intro && <p className="dialog-intro">{intro}</p>}
        {fields.map((f) => {
          if (f.type === 'photo')
            return (
              <PhotoField
                key={f.name}
                label={f.label}
                required={f.required}
                round={f.round}
                hint={f.hint}
                value={String(values[f.name] || '')}
                onChange={(u) => set(f.name, u)}
              />
            );
          if (f.type === 'checkbox')
            return (
              <label key={f.name} className="check">
                <input type="checkbox" checked={!!values[f.name]} onChange={(e) => set(f.name, e.target.checked)} />{' '}
                <span>
                  {f.label}
                  {f.hint && <small> {f.hint}</small>}
                </span>
              </label>
            );
          return (
            <label key={f.name} className="fld">
              <span>
                {f.label}
                {'required' in f && f.required && <small> required</small>}
                {f.hint && <small> {f.hint}</small>}
              </span>
              {f.type === 'textarea' ? (
                <textarea
                  rows={f.rows ?? 3}
                  maxLength={f.maxLength}
                  placeholder={f.placeholder}
                  value={String(values[f.name])}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              ) : f.type === 'select' ? (
                <select value={String(values[f.name])} onChange={(e) => set(f.name, e.target.value)}>
                  {f.options.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={f.type}
                  inputMode={f.type === 'number' ? 'decimal' : undefined}
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  maxLength={f.maxLength}
                  placeholder={f.placeholder}
                  value={String(values[f.name])}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              )}
            </label>
          );
        })}
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <div className="form-actions">
          <button type="button" className="button button-quiet" onClick={onClose}>
            Cancel
          </button>
          <button className={`button ${danger ? 'button-danger' : 'button-primary'}`} disabled={busy}>
            {busy ? 'Saving…' : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
