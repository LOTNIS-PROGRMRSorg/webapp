import { Field, FileField, StepProps } from './applicationShared';

export function ContactStep({ form, set, text, profile, uploading, upload, has, goTo }: StepProps) {
  return (
    <>
      <Field label="Phone number" hint="We verify this number — guests and Lotnis may call it.">
        <input required type="tel" placeholder="024 000 0000" {...text('phone')} />
      </Field>
      <Field label="Street address">
        <input required {...text('streetAddress')} />
      </Field>
      <div className="app-grid">
        <Field label="City">
          <input required {...text('city')} />
        </Field>
        <Field label="Region / State">
          <input {...text('state')} />
        </Field>
        <Field label="Postal code">
          <input {...text('postalCode')} />
        </Field>
        <Field label="Country">
          <input required {...text('country')} />
        </Field>
      </div>
      <FileField
        label="Proof of address"
        hint="A recent utility bill or tenancy agreement"
        existingUrl={profile?.proof_image_url}
        uploading={uploading === 'proof-of-address'}
        onPick={(f) => upload('proof-of-address', f)}
      />
      {!profile && <p className="muted-inline">You can upload this on the next screen once your details are saved.</p>}
    </>
  );
}
