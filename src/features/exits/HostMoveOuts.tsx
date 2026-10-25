import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import type { ExitCaseSummary } from '@/types';
import { STATUS_LABEL } from '@/features/exits/labels';
import { when } from './exitShared';

// ── Host: list ───────────────────────────────────────────────────────────────

export function HostMoveOuts() {
  const [cases, setCases] = useState<ExitCaseSummary[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { api.getHostExits().then(setCases).catch((e) => setError(e.message)); }, []);
  const needs = (c: ExitCaseSummary) => ['notice_given', 'in_dispute'].includes(c.status) || c.status === 'moved_out';
  return (
    <section className="host-page">
      <div className="page-header"><div><span className="eyebrow">Move-outs</span><h1>Notices &amp; deposits</h1></div></div>
      <p className="lead">When a guest gives notice or checks out, the case appears here with Lotnis looking on. Respond, confirm the move-out, and list deposit deductions with evidence.</p>
      {error ? <div className="error-state">{error}</div> : !cases ? <div className="empty-state">Loading…</div> : cases.length ? (
        <div className="booking-list">{cases.map((c) => (
          <Link key={c.id} to={`/moveouts/${c.id}`} className="booking-row case-row">
            <div><strong>{c.booking.property?.name}</strong><p>{c.kind === 'early_departure' ? `Leaving ${c.actual_checkout ?? c.planned_checkout} (booked to ${c.booking.end_date})` : 'End-of-stay checkout'}</p>
              {c.reason && <small>“{c.reason}”</small>}</div>
            <span className={`pill pill-${c.status}`}>{STATUS_LABEL[c.status]}</span>
            {needs(c) && c.status !== 'settled' ? <span className="needs">Needs you</span> : <span />}
          </Link>))}</div>
      ) : <div className="empty-state"><LogOut size={28} /><p>No move-outs yet. They'll show up here when a guest gives notice.</p></div>}
    </section>
  );
}
