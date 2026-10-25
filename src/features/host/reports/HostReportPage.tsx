import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Seo } from '@/lib/seo/seo';
import { reportsApi, type HostReport } from '@/lib/api/reports';
import { FieldDialog } from '@/components/modals';
import { PanelCard } from '@/components/cards';
import { ErrorState, LoadingState, Notice, PageHeader, Pill, StatusPill } from '@/components/ui';
import { statusMeta } from '@/lib/status';
import { fmtDateTime } from '@/lib/dates';
import { reportSubject } from './HostReportsPage';

/** One report on its own page: what was said, who said it, and your reply. */
export function HostReportPage() {
  const { id = '' } = useParams();
  const [report, setReport] = useState<HostReport | null | undefined>(undefined);
  const [error, setError] = useState('');
  const [replying, setReplying] = useState(false);
  const load = useCallback(() => {
    reportsApi
      .forHost()
      .then((all) => setReport(all.find((r) => r.id === id) ?? null))
      .catch((e) => setError(e.message));
  }, [id]);
  useEffect(load, [load]);
  if (error) return <ErrorState>{error}</ErrorState>;
  if (report === undefined) return <LoadingState />;
  if (report === null)
    return (
      <div className="host-page">
        <Link className="back-link" to="/host/reports">
          ← Reports
        </Link>
        <ErrorState>That report isn't available.</ErrorState>
      </div>
    );
  const closed = report.status === 'resolved' || report.status === 'dismissed';
  return (
    <div className="host-page">
      <Seo title="Report" description="A report about your listing or event." noindex />
      <Link className="back-link" to="/host/reports">
        ← Reports
      </Link>
      <PageHeader eyebrow={`About ${report.target_type.replace('_', ' ')}`} title={reportSubject(report)}>
        <Pill tone={statusMeta(report.severity).tone}>{statusMeta(report.severity).label}</Pill>{' '}
        <StatusPill status={report.status} />
      </PageHeader>
      <PanelCard title={report.category.replace(/_/g, ' ')}>
        <p>{report.description}</p>
        <small className="muted-inline">
          Reported {fmtDateTime(report.created_at)} by {report.reporter_name ?? 'a guest'}
        </small>
        {report.evidence_urls?.length ? (
          <div className="photo-strip">
            {report.evidence_urls.map((u) => (
              <a key={u} href={u} target="_blank" rel="noreferrer">
                <img src={u} alt="Evidence" />
              </a>
            ))}
          </div>
        ) : null}
      </PanelCard>
      <PanelCard title="Your reply">
        {report.host_response ? (
          <>
            <p>{report.host_response}</p>
            <small className="muted-inline">
              Sent {report.host_responded_at ? fmtDateTime(report.host_responded_at) : ''}
            </small>
          </>
        ) : (
          <p className="muted-inline">You haven't replied yet. Lotnis reads your side before deciding.</p>
        )}
        {!closed && (
          <button className="button button-primary" onClick={() => setReplying(true)}>
            {report.host_response ? 'Update reply' : 'Reply'}
          </button>
        )}
        {closed && <Notice tone="info">This report is closed.</Notice>}
      </PanelCard>
      {replying && (
        <FieldDialog
          title="Reply to this report"
          submitLabel="Send reply"
          onClose={() => setReplying(false)}
          fields={[
            {
              name: 'response',
              type: 'textarea',
              label: 'Your side of the story',
              required: true,
              rows: 5,
              maxLength: 2000,
            },
          ]}
          initial={{ response: report.host_response ?? '' }}
          onSubmit={async (v) => {
            await reportsApi.respond(report.id, String(v.response));
            setReplying(false);
            load();
          }}
        />
      )}
    </div>
  );
}
