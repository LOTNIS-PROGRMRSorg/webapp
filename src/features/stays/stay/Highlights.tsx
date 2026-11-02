import {
  BadgeCheck,
  BedDouble,
  CalendarClock,
  Clock,
  Home,
  KeyRound,
  Plug,
  Ruler,
  Sofa,
  Truck,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import { money, periodLabel, unitNoun, RentalUnitCode } from '@/lib/format';
import type { Property } from '@/types';

type Item = { icon: typeof Home; title: string; detail?: string };
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const RENT_BY: Record<string, string> = {
  day: 'Rented by the night',
  week: 'Rented by the week',
  month: 'Rented by the month',
  year: 'Rented by the year',
};

/** The facts people decide on, as a scannable grid. Only fields the host actually filled in are shown. */
export function Highlights({ property: p }: { property: Property }) {
  const kind = p.sub_type ? (p.sub_type.charAt(0).toUpperCase() + p.sub_type.slice(1)).replace(/-/g, ' ') : 'Space';
  const unit = (p.pricing_period || 'day') as RentalUnitCode;
  const rooms = [
    p.bedrooms != null ? plural(p.bedrooms, 'bedroom') : '',
    p.bathrooms != null ? plural(p.bathrooms, 'bathroom') : '',
  ].filter(Boolean);
  const items: Item[] = [
    { icon: Home, title: kind, detail: p.size_sqm ? `${p.size_sqm} m²` : undefined },
    ...(rooms.length ? [{ icon: BedDouble, title: rooms.join(' · ') }] : []),
    ...(p.max_guests ? [{ icon: Users, title: `Up to ${p.max_guests} people` }] : []),
    {
      icon: CalendarClock,
      title: RENT_BY[unit] ?? `Priced per ${periodLabel(unit)}`,
      detail: p.minimum_stay ? `Minimum ${p.minimum_stay} ${unitNoun(unit, p.minimum_stay)}` : undefined,
    },
    ...(p.furnished != null ? [{ icon: Sofa, title: p.furnished ? 'Furnished' : 'Unfurnished' }] : []),
    ...(p.utilities_included
      ? [{ icon: Plug, title: 'Utilities included', detail: 'Water and electricity in the price' }]
      : []),
    ...(p.power_backup ? [{ icon: Zap, title: 'Power backup' }] : []),
    ...(p.access_24h ? [{ icon: Clock, title: '24-hour access' }] : []),
    ...(p.loading_access ? [{ icon: Truck, title: 'Loading access' }] : []),
    ...(p.ceiling_height_m ? [{ icon: Ruler, title: `${p.ceiling_height_m} m ceiling` }] : []),
    ...(p.security_deposit
      ? [
          {
            icon: Wallet,
            title: `${money(p.currency, p.security_deposit).replace(/\.00$/, '')} deposit`,
            detail: 'Refundable',
          },
        ]
      : []),
    ...(p.host?.verified ? [{ icon: BadgeCheck, title: 'Verified host', detail: 'ID checked by Lotnis' }] : []),
    ...(p.requires_host_acceptance === true
      ? [{ icon: KeyRound, title: 'Host confirms bookings', detail: 'Usually within 48 hours' }]
      : p.requires_host_acceptance === false
        ? [{ icon: KeyRound, title: 'Instant booking', detail: 'Confirmed as soon as you pay' }]
        : []),
  ];
  return (
    <ul className="st-highlights" aria-label="Key facts">
      {items.map(({ icon: Icon, title, detail }) => (
        <li key={title}>
          <span>
            <Icon size={20} />
          </span>
          <div>
            <b>{title}</b>
            {detail && <small>{detail}</small>}
          </div>
        </li>
      ))}
    </ul>
  );
}
