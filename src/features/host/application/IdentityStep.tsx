import { Field, FileField, StepProps } from './applicationShared';

export function IdentityStep({ form, set, text, profile, uploading, upload, has, goTo }: StepProps) {
  return (
    <>
      <div className="app-grid">
        <Field label="Legal first name">
          <input required {...text('legalFirstName')} />
        </Field>
        <Field label="Legal last name">
          <input required {...text('legalLastName')} />
        </Field>
        <Field label="Date of birth">
          <input required type="date" max={new Date().toISOString().slice(0, 10)} {...text('dateOfBirth')} />
        </Field>
        <Field label="Nationality">
          <input required {...text('nationality')} />
        </Field>
      </div>
      <FileField
        label="Government ID — front"
        hint="Ghana Card, passport or driver's licence"
        existingUrl={profile?.gov_id_front_image_url}
        uploading={uploading === 'gov-id-front'}
        onPick={(f) => upload('gov-id-front', f)}
      />
      <FileField
        label="Government ID — back"
        hint="If your ID has a back (optional)"
        existingUrl={profile?.gov_id_back_image_url}
        uploading={uploading === 'gov-id-back'}
        onPick={(f) => upload('gov-id-back', f)}
      />
      <FileField
        label="Selfie"
        hint="A clear photo of your face"
        existingUrl={profile?.selfie_image_url}
        uploading={uploading === 'selfie'}
        onPick={(f) => upload('selfie', f)}
      />
    </>
  );
}
