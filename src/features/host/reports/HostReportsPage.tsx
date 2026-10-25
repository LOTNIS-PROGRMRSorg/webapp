import { Flag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Seo } from '@/lib/seo/seo';
import { reportsApi, type HostReport } from '@/lib/api/reports';
import { RowCard, RowList } from '@/components/cards';
import { EmptyState, ErrorState, LoadingState, PageHeader, Pill, StatusPill } from '@/components/ui';
import { statusMeta } from '@/lib/status';
import { fmtDate } from '@/lib/dates';

export const reportSubject = (r: HostReport) => r.property?.name ?? r.event?.title ?? 'Your account';

/** Problems raised by people who booked or bought from you. Reports from the general public never appear here. */
export function HostReportsPage() {
  const [rows, setRows] = useState<HostReport[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    reportsApi
      .forHost()
      .then(setRows)
      .catch((e) => setError(e.message));
  }, []);
  if (error) return <ErrorState>{error}</ErrorState>;
  if (!rows) return <LoadingState />;
  return (
    <div className="host-page">
      <Seo title="Reports" description="Problems guests and buyers have raised." noindex />
      <PageHeader eyebrow="Guests and buyers" title="Reports" />
      <p className="lead">
        When someone who stayed with you or bought a ticket reports a problem, you see it here and can reply. Lotnis
        reviews every report and may pause a payout while it looks into it.
      </p>
      {rows.length ? (
        <RowList>
          {rows.map((r) => (
            <RowCard
              key={r.id}
              to={`/host/reports/${r.id}`}
              title={reportSubject(r)}
              subtitle={statusMeta(r.category).label === r.category ? r.category.replace(/_/g, ' ') : r.category}
              meta={`${fmtDate(r.created_at)} · from ${r.reporter_name ?? 'a guest'}${r.host_response ? ' · you replied' : ''}`}
              status={
                <>
                  <Pill tone={statusMeta(r.severity).tone}>{statusMeta(r.severity).label}</Pill>{' '}
                  <StatusPill status={r.status} />
                </>
              }
            />
          ))}
        </RowList>
      ) : (
        <EmptyState icon={<Flag size={26} />}>Nothing reported. Good work.</EmptyState>
      )}
      <p className="muted-inline">
        <Link to="/host">Back to overview</Link>
      </p>
    </div>
  );
}
