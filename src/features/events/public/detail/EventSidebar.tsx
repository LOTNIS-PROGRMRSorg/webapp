import { Ban, Mail, Phone, Shirt, UserRound } from 'lucide-react';
import type { EventDetail } from '@/lib/api/events';

/** Optional practical details that are only shown when the organiser supplied them. */
export function EventSidebar({ ev }: { ev: EventDetail }) {
  const facts: Array<[React.ReactNode, string, string | null | undefined]> = [
    [<UserRound size={16} />, 'Age', ev.age_limit],
    [<Shirt size={16} />, 'Dress code', ev.dress_code],
    [<Ban size={16} />, 'Entry rules', ev.entry_rules],
    [<Phone size={16} />, 'Phone', ev.contact_phone],
    [<Mail size={16} />, 'Email', ev.contact_email],
  ];
  const shown = facts.filter(([, , v]) => v);
  if (!shown.length) return null;
  return (
    <section className="evd-card evd-sidecard">
      <h3>Good to know</h3>
      <dl>
        {shown.map(([icon, label, value]) => (
          <div key={label}>
            <dt>
              {icon} {label}
            </dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
