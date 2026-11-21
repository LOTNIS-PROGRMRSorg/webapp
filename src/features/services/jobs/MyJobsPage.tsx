import { Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RowCard, RowList, Thumb } from '@/components/cards';
import { PillTabs } from '@/components/tabs';
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@/components/ui';
import { marketApi, type JobRow } from '@/lib/api/market';
import { money } from '@/lib/format';
import { Seo } from '@/lib/seo/seo';
import { fmtWhen, JobPill } from './jobUi';
import './jobs.css';

const TABS = [
  { key: 'active', label: 'Active' },
  { key: 'done', label: 'Done' },
  { key: 'closed', label: 'Closed' },
];

/** The jobs you asked for (customer) or the requests you received (provider inbox). */
export default function MyJobsPage({ as }: { as: 'customer' | 'host' }) {
  const [tab, setTab] = useState('active');
  const [rows, setRows] = useState<JobRow[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    setRows(null);
    marketApi
      .jobs(as, tab)
      .then(setRows)
      .catch((e) => setError(e.message));
  }, [as, tab]);
  const host = as === 'host';
  const to = (id: string) => (host ? `/host/jobs/${id}` : `/jobs/${id}`);
  const needsYou = (r: JobRow) =>
    host
      ? ['requested', 'negotiating'].includes(r.status) && r.offer_by === 'customer'
      : r.status === 'accepted' || (r.status === 'negotiating' && r.offer_by === 'host');
  return (
    <section className={host ? 'host-page' : 'page'}>
      <Seo title={host ? 'Service jobs' : 'My jobs'} description="Your service jobs." noindex />
      <PageHeader eyebrow="Services" title={host ? 'Service jobs' : 'My service jobs'}>
        {host ? (
          <Link className="button button-secondary" to="/host/services">
            My services
          </Link>
        ) : (
          <Link className="button button-primary" to="/services">
            Find someone
          </Link>
        )}
      </PageHeader>
      <PillTabs label="Jobs" value={tab} onChange={setTab} tabs={TABS} />
      {error ? (
        <ErrorState>{error}</ErrorState>
      ) : !rows ? (
        <LoadingState />
      ) : rows.length ? (
        <RowList>
          {rows.map((r) => (
            <RowCard
              key={r.id}
              to={to(r.id)}
              thumb={<Thumb src={r.service.photos?.[0]} fallback={<Wrench size={18} />} />}
              title={r.service.title}
              subtitle={`${fmtWhen(r.starts_at)}${host && r.customer_name ? ` · ${r.customer_name}` : ''}`}
              meta={needsYou(r) ? 'Needs your answer' : undefined}
              figure={money(r.currency, r.agreed_total ?? r.current_offer)}
              status={<JobPill status={r.status} />}
            />
          ))}
        </RowList>
      ) : (
        <EmptyState icon={<Wrench size={26} />}>{host ? 'No requests here yet.' : 'No jobs here yet.'}</EmptyState>
      )}
    </section>
  );
}
