import { Field, FileField, StepProps } from './applicationShared';

export function BusinessStep({ form, set, text, profile, uploading, upload, has, goTo }: StepProps) {
  return (
    <>
      <div className="app-grid">
        <Field label="Registered business name">
          <input required {...text('businessName')} />
        </Field>
        <Field label="Tax ID (TIN)">
          <input {...text('businessTaxId')} />
        </Field>
        <Field label="Business phone">
          <input type="tel" {...text('businessPhone')} />
        </Field>
        <Field label="Business email">
          <input type="email" {...text('businessEmail')} />
        </Field>
      </div>
      <Field label="Website">
        <input placeholder="https://" {...text('businessWebsite')} />
      </Field>
      <FileField
        label="Business registration certificate"
        existingUrl={profile?.biz_certificate_image_url}
        uploading={uploading === 'business-certificate'}
        onPick={(f) => upload('business-certificate', f)}
      />
    </>
  );
}
