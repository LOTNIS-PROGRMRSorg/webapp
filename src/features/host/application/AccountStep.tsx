import { Briefcase, User } from 'lucide-react';
import { Field, StepProps } from './applicationShared';

export function AccountStep({ form, set, text, profile, uploading, upload, has, goTo }: StepProps) {
  return (
    <>
      <div className="app-choice-row" role="radiogroup" aria-label="Account type">
        {(
          [
            ['individual', 'Individual', 'I rent out my own space', User],
            ['business', 'Business', 'A registered company or agency', Briefcase],
          ] as const
        ).map(([value, title, sub, Icon]) => (
          <button
            type="button"
            role="radio"
            aria-checked={form.accountType === value}
            key={value}
            className={`app-choice ${form.accountType === value ? 'app-choice-on' : ''}`}
            onClick={() => set('accountType', value)}
          >
            <Icon size={22} />
            <strong>{title}</strong>
            <small>{sub}</small>
          </button>
        ))}
      </div>
      <Field label="Display name" hint="Shown to guests on your listings.">
        <input required placeholder="e.g. Ama's Homes" {...text('displayName')} />
      </Field>
    </>
  );
}
