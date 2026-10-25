import { useEffect, useState } from 'react';
import { ArrowRight, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { money, periodLabel, primaryImage } from '@/lib/format';
import type { Property } from '@/types';
import { PageHeader } from '@/components/ui';

// ── Pages ─────────────────────────────────────────────────────────────────────

export const APPROVAL_LABEL: Record<string, string> = {
  pending: 'Awaiting approval', under_review: 'Under review', approved: 'Live', rejected: 'Needs changes', suspended: 'Suspended',
};
export const MODE_LABEL: Record<string, string> = { entire: 'Whole property', rooms: 'Room by room', both: 'Whole or by room' };

export function HostAccommodation() {
  const [properties, setProperties] = useState<Property[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { api.getMyProperties().then((p) => setProperties(p || [])).catch((e) => setError(e.message)); }, []);
  return (
    <section className="host-page">
      <PageHeader eyebrow="Accommodation" title="Your spaces">
        <Link className="button button-primary" to="/host/accommodation/new">Add a space <ArrowRight size={16} /></Link>
      </PageHeader>
      {error ? <div className="error-state">{error}</div> : !properties ? <div className="empty-state">Loading…</div> : properties.length ? (
        <div className="space-list">
          {properties.map((p) => {
            const mode = p.booking_mode ?? (p.allows_individual_bookings ? 'both' : 'entire');
            const rooms = (p.rooms || []).filter((r) => !r.deleted_at);
            return (
              <div className="space-row" key={p.id}>
                <div className="host-rowmain">
                  {primaryImage(p) ? <img className="host-thumb" src={primaryImage(p)} alt={p.name} loading="lazy" /> : <span className="host-thumb host-thumb-ph"><Building2 size={22} /></span>}
                  <div>
                    <strong>{p.name}</strong>
                    <p>{[p.sub_type, p.city].filter(Boolean).join(' · ')}</p>
                    <small>{MODE_LABEL[mode]}{rooms.length ? ` · ${rooms.length} room${rooms.length === 1 ? '' : 's'}` : ''}{p.price != null ? ` · ${money(p.currency, p.price)} / ${periodLabel(p.pricing_period)}` : ''}</small>
                  </div>
                </div>
                <span className={`status status-${p.approval_status === 'approved' ? 'confirmed' : p.approval_status === 'rejected' || p.approval_status === 'suspended' ? 'cancelled' : 'pending'}`}>
                  {APPROVAL_LABEL[p.approval_status || 'pending'] || p.approval_status}
                </span>
                {p.approval_status === 'approved' ? <Link className="button button-secondary" to={`/stays/${p.id}`}>View listing</Link> : <span />}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state"><Building2 size={28} /><p>You have no listings yet.</p><Link className="button button-secondary" to="/host/accommodation/new">Create your first listing</Link></div>
      )}
    </section>
  );
}
