import {
  AlarmSmoke,
  Car,
  Cctv,
  CircleCheck,
  Droplets,
  FireExtinguisher,
  Gauge,
  PawPrint,
  Phone,
  ShieldCheck,
  Wifi,
  Zap,
} from 'lucide-react';
import type { Property } from '@/types';
import './amenities.css';

// Amenity keys are chosen by hosts in the mobile app. Known keys get a friendly label and icon, listed
// power/water/security first because those are the first things renters in Ghana ask about.
const KNOWN: Array<{ key: string; label: string; icon: typeof Zap }> = [
  { key: 'backup_generator', label: 'Backup generator', icon: Zap },
  { key: 'borehole_water', label: 'Borehole water', icon: Droplets },
  { key: 'prepaid_meter', label: 'Prepaid electricity meter', icon: Gauge },
  { key: 'security_guard', label: 'Security guard', icon: ShieldCheck },
  { key: 'cctv', label: 'CCTV', icon: Cctv },
  { key: 'intercom', label: 'Intercom', icon: Phone },
  { key: 'wifi_common', label: 'Wi-Fi in shared areas', icon: Wifi },
  { key: 'smoke_detector', label: 'Smoke detector', icon: AlarmSmoke },
  { key: 'fire_extinguisher', label: 'Fire extinguisher', icon: FireExtinguisher },
];

/** "solar_panels" → "Solar panels", for keys we don't have a label for yet. */
const humanize = (key: string) => {
  const words = key.replace(/[_-]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/** "What this place offers": the host's amenities, plus parking and pets from the listing's own fields. */
export function Amenities({ property }: { property: Property }) {
  const chosen = new Set(property.selected_amenities ?? []);
  const items = [
    ...KNOWN.filter((k) => chosen.has(k.key)),
    ...[...chosen]
      .filter((key) => !KNOWN.some((k) => k.key === key))
      .map((key) => ({ key, label: humanize(key), icon: CircleCheck })),
    ...(property.parking_available ? [{ key: 'parking', label: 'Parking', icon: Car }] : []),
    ...(property.pet_friendly ? [{ key: 'pets', label: 'Pets allowed', icon: PawPrint }] : []),
  ];
  if (!items.length) return null;
  return (
    <section className="stay-section amenities reveal" aria-labelledby="amenities-title">
      <h2 id="amenities-title">What this place offers</h2>
      <ul>
        {items.map(({ key, label, icon: Icon }) => (
          <li key={key}>
            <Icon size={20} />
            {label}
          </li>
        ))}
      </ul>
    </section>
  );
}
