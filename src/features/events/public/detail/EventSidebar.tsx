import { Ban, Mail, Phone, Shirt, UserRound } from 'lucide-react';
import { HostCard } from '@/components/cards';
import { fmtTime } from '@/features/events/eventUi';
import type { EventDetail } from '@/lib/api/events';
import { mapsUrl } from '../eventShared';

/** Quick facts, how to find the venue and who is organising. */
export function EventSidebar({ ev }: { ev: EventDetail }) {
  const facts: Array<[React.ReactNode, string, string | null | undefined]> = [
    [<UserRound size={16} />, 'Age', ev.age_limit],
    [<Shirt size={16} />, 'Dress code', ev.dress_code],
    [<Ban size={16} />, 'Entry rules', ev.entry_rules],
    [<Phone size={16} />, 'Phone', ev.contact_phone],
    [<Mail size={16} />, 'Email', ev.contact_email],
  ];
  const shown = facts.filter(([, , v]) => v);
  return (
    <aside className="evd-side">
      <div className="evd-card evd-sidecard">
        <h3>Good to know</h3>
        <dl>
          {ev.doors_open_at && (
            <div>
              <dt>Doors open</dt>
              <dd>{fmtTime(ev.doors_open_at)}</dd>
            </div>
          )}
          {shown.map(([icon, label, value]) => (
            <div key={label}>
              <dt>
                {icon} {label}
              </dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <a className="button button-secondary button-wide" href={mapsUrl(ev)} target="_blank" rel="noreferrer">
          Get directions
        </a>
      </div>
      <HostCard host={ev.host} label="Organised by" />
    </aside>
  );
}
