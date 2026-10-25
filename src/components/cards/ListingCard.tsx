import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice, money, periodLabel, primaryImage } from '@/lib/format';
import type { Property, Transaction } from '@/types';

/** "GHS 500 / month", or "From GHS 300 / month" for room-only listings. */
export function startingPrice(property: Property): string {
  if (property.price != null) return `${formatPrice(property.currency, property.price)} / ${periodLabel(property.pricing_period)}`;
  const rooms = (property.rooms ?? []).filter((r) => !r.deleted_at);
  if (!rooms.length) return 'Price on request';
  const cheapest = rooms.reduce((a, b) => (b.price_per_period < a.price_per_period ? b : a));
  return `From ${money(cheapest.currency || property.currency, cheapest.price_per_period)} / ${periodLabel(cheapest.pricing_period || property.pricing_period)}`;
}

/** Type-specific facts (bedrooms for homes; ceiling height, loading access… for commercial). */
export function SpaceFacts({ property }: { property: Property }) {
  const yes = (v: boolean | null | undefined) => v === true;
  const facts: string[] = [
    property.bedrooms != null ? `${property.bedrooms} bedroom${property.bedrooms === 1 ? '' : 's'}` : '',
    property.bathrooms != null ? `${property.bathrooms} bathroom${property.bathrooms === 1 ? '' : 's'}` : '',
    property.max_guests != null ? `Up to ${property.max_guests} guests` : '',
    property.size_sqm != null ? `${property.size_sqm} m²` : '',
    property.ceiling_height_m != null ? `${property.ceiling_height_m} m ceiling` : '',
    yes(property.furnished) ? 'Furnished' : '',
    yes(property.utilities_included) ? 'Utilities included' : '',
    yes(property.power_backup) ? 'Power backup' : '',
    yes(property.loading_access) ? 'Loading access' : '',
    yes(property.access_24h) ? '24-hour access' : '',
  ].filter(Boolean);
  return facts.length ? <ul className="fact-chips">{facts.map((f) => <li key={f}>{f}</li>)}</ul> : null;
}

export function PropertyCard({ property }: { property: Property }) {
  const image = primaryImage(property);
  const kind = property.sub_type ? property.sub_type.charAt(0).toUpperCase() + property.sub_type.slice(1) : 'Space';
  return (
    <Link className="property-card" to={`/stays/${property.id}`}>
      <div className="property-image">
        {image && <img src={image} alt={`${property.name} — ${kind.toLowerCase()} for rent in ${property.city ?? 'Ghana'}`} loading="lazy" decoding="async" />}
        <span className="image-label">{property.verified ? 'Verified' : kind}</span>
      </div>
      <div className="property-card-body">
        <div className="property-title-row"><h3>{property.name}</h3><span>{property.rating ? `★ ${property.rating.toFixed(1)}` : 'New'}</span></div>
        <p><MapPin size={14} /> {[kind, property.city].filter(Boolean).join(' · ')}{property.distance_km != null && <b className="dist"> · {property.distance_km} km away</b>}</p>
        <strong>{startingPrice(property)}</strong>
      </div>
    </Link>
  );
}

export function TransactionRows({ transactions, hostView = false }: { transactions: Transaction[]; hostView?: boolean }) {
  return transactions.length ? <div className="booking-list">{transactions.map((transaction) => <div className="booking-row" key={transaction.id}><div><strong>{transaction.property?.name || 'Accommodation transaction'}</strong><p>{new Date(transaction.created_at).toLocaleDateString()} · {transaction.service}</p></div><span className={`status status-${transaction.status}`}>{transaction.status}</span><strong>{transaction.currency} {(hostView ? transaction.host_payout : transaction.gross_amount).toLocaleString()}</strong></div>)}</div> : <div className="empty-state">No transactions yet.</div>;
}
