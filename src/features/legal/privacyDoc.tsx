import { Lock } from 'lucide-react';
import { Doc, L, P } from './legalShared';

// ─────────────────────────────────────────────────────────────────────────────
// Privacy
// ─────────────────────────────────────────────────────────────────────────────
export const PRIVACY: Doc = {
  path: '/privacy',
  label: 'Privacy',
  title: 'Privacy Policy',
  icon: Lock,
  intro:
    "What information Lotnis collects, why, who can see it, and the choices you have. We handle personal data in line with Ghana's Data Protection Act, 2012 (Act 843).",
  keyPoints: [
    'We collect only what we need to run bookings, payments, verification and support.',
    "Hosts' ID documents are stored privately and seen only by Lotnis reviewers.",
    'We never sell your personal data.',
    'You can ask to see, correct or delete your data.',
  ],
  sections: [
    {
      id: 'collect',
      title: '1. What we collect',
      body: (
        <>
          <L
            items={[
              <>
                <b>Account:</b> name, email, profile photo and phone number (from Google sign-in and what you add).
              </>,
              <>
                <b>Bookings:</b> the spaces and dates you book, prices, payments, cancellations, notices to leave,
                messages in a case, and deposit disputes.
              </>,
              <>
                <b>Hosts:</b> legal name, date of birth, nationality, address, phone, a government ID (front and back),
                a selfie, proof of address, business registration and tax details for businesses, and payout details
                (mobile money or bank account).
              </>,
              <>
                <b>Listings:</b> descriptions, photos, prices and rules you publish. Evidence photos uploaded for a
                deposit case.
              </>,
              <>
                <b>Technical:</b> device and browser details, pages viewed and listing view counts, to keep the service
                secure and improve it. We store your sign-in session in your browser's local storage.
              </>,
            ]}
          />
        </>
      ),
    },
    {
      id: 'use',
      title: '2. How we use it',
      body: (
        <>
          <L
            items={[
              'To run bookings, take payments, send refunds and pay hosts.',
              'To verify hosts and keep guests and hosts safe, and to prevent fraud.',
              'To send notifications about your bookings, refunds, move-outs and verification status.',
              'To resolve disputes and enforce our terms.',
              'To improve Lotnis and understand how it is used.',
              'To meet legal and tax obligations.',
            ]}
          />
        </>
      ),
    },
    {
      id: 'share',
      title: '3. Who sees your information',
      body: (
        <>
          <L
            items={[
              <>
                <b>Your host</b> sees your name and contact details for bookings you make with them, and the details of
                any move-out or deposit case.
              </>,
              <>
                <b>Guests</b> see a host's display name, listing and, once booked, contact details needed for the stay.
              </>,
              <>
                <b>Lotnis staff</b> with a dashboard role see what they need to verify hosts, review bookings, decide
                disputes and send refunds. Their actions are logged.
              </>,
              <>
                <b>Paystack</b> processes payments and receives payment details you enter at checkout.{' '}
                <b>Our hosting and infrastructure providers</b> store data on our behalf.
              </>,
              <>We don't sell personal data. We share information with authorities where the law requires it.</>,
            ]}
          />
        </>
      ),
    },
    {
      id: 'docs',
      title: '4. Verification documents',
      body: (
        <>
          <P>
            Host ID, selfie and proof-of-address images are stored in a private storage area and reached through
            time-limited links used by Lotnis reviewers. They're never shown on public listing pages. Evidence photos
            uploaded for deposit cases are visible to the guest, host and Lotnis involved in that case.
          </P>
        </>
      ),
    },
    {
      id: 'retain',
      title: '5. How long we keep it',
      body: (
        <>
          <P>
            We keep account and booking records for as long as your account is active and for the period needed for tax,
            accounting and dispute purposes after that. Verification documents are kept while you host and for a limited
            period afterwards. When data is no longer needed we delete or anonymise it.
          </P>
        </>
      ),
    },
    {
      id: 'rights',
      title: '6. Your choices and rights',
      body: (
        <>
          <L
            items={[
              'Ask for a copy of the personal data we hold about you.',
              'Ask us to correct anything inaccurate — hosts can edit details until an application is under review.',
              'Ask us to delete your account and data, subject to records we must keep by law.',
              'Turn off non-essential notifications where offered.',
              "Complain to us, or to Ghana's Data Protection Commission.",
            ]}
          />
          <P>
            Email <a href="mailto:privacy@lotnis.com">privacy@lotnis.com</a> to use these rights.
          </P>
        </>
      ),
    },
    {
      id: 'security',
      title: '7. Security',
      body: (
        <>
          <P>
            We use encrypted connections, private storage for sensitive documents, role-based access for staff and audit
            logs for important actions. No system is perfectly secure, so please use a strong password on the Google
            account you sign in with.
          </P>
        </>
      ),
    },
    {
      id: 'children',
      title: '8. Children',
      body: (
        <>
          <P>Lotnis is for people 18 and over. We don't knowingly collect data from children.</P>
        </>
      ),
    },
    {
      id: 'changes',
      title: '9. Changes',
      body: (
        <>
          <P>
            We'll update this policy as we add services such as Food and Service providers, and tell you about important
            changes.
          </P>
        </>
      ),
    },
  ],
};
