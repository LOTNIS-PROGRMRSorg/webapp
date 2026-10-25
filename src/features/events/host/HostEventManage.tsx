import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { EventStatusPill, fmtDateTime } from '@/features/events/eventUi';
import { eventApi, HostEventOverview } from '@/lib/api/events';
import { Seo } from '@/lib/seo/seo';
import { PageHeader, errText } from './hostShared';
import { Overview, StatusBanner } from './OverviewTab';
import { TicketsTab } from './TicketsTab';
import { GatesTab } from './GatesTab';
import { AttendeesTab } from './AttendeesTab';
import { OrdersTab } from './OrdersTab';
import { VotingTab } from './VotingTab';
import { ReviewsTab } from './ReviewsTab';
import { RefundsTab } from './RefundsTab';
import { PayoutTab } from './PayoutTab';

export const TABS = [
  'overview',
  'tickets',
  'gates',
  'attendees',
  'orders',
  'voting',
  'reviews',
  'refunds',
  'payout',
] as const;
export type TabKey = (typeof TABS)[number];
export const TAB_LABEL: Record<TabKey, string> = {
  overview: 'Overview',
  tickets: 'Tickets',
  gates: 'Gates',
  attendees: 'Attendees',
  orders: 'Orders',
  voting: 'Voting',
  reviews: 'Reviews',
  refunds: 'Refunds',
  payout: 'Payout',
};

export function HostEventManage() {
  const { id = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = (TABS.includes(params.get('tab') as TabKey) ? params.get('tab') : 'overview') as TabKey;
  const [data, setData] = useState<HostEventOverview | null>(null);
  const [error, setError] = useState('');
  const reload = useCallback(
    () =>
      eventApi.host
        .overview(id)
        .then((d) => {
          setData(d);
          setError('');
        })
        .catch((e) => setError(errText(e))),
    [id],
  );
  useEffect(() => {
    reload();
  }, [reload]);
  if (error)
    return (
      <section className="host-page">
        <Link className="back-link" to="/host/events">
          ← Your events
        </Link>
        <div className="error-state">{error}</div>
      </section>
    );
  if (!data)
    return (
      <section className="host-page">
        <div className="empty-state">Loading…</div>
      </section>
    );
  const ev = data.event;
  const tabs = TABS.filter((t) => t !== 'voting' || ev.voting_enabled);
  return (
    <section className="host-page ev-manage">
      <Seo title={ev.title} description="Manage event" noindex />
      <Link className="back-link" to="/host/events">
        ← Your events
      </Link>
      <PageHeader eyebrow="Event" title={ev.title}>
        <div className="form-actions">
          <EventStatusPill status={ev.status} />
          {ev.status === 'published' && (
            <Link className="button button-secondary" to={`/events/${ev.slug}`}>
              View public page
            </Link>
          )}
          {['draft', 'rejected', 'pending_review', 'published'].includes(ev.status) && (
            <Link className="button button-quiet" to={`/host/events/${ev.id}/edit`}>
              Edit
            </Link>
          )}
        </div>
      </PageHeader>
      <p className="muted-inline">
        {fmtDateTime(ev.starts_at)} → {fmtDateTime(ev.ends_at)} · {ev.venue_name}, {ev.city}
      </p>
      <StatusBanner data={data} reload={reload} />
      <div className="tabs tabs-host" role="tablist">
        {tabs.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={`tab ${tab === t ? 'tab-on' : ''}`}
            onClick={() => setParams({ tab: t }, { replace: true })}
          >
            {TAB_LABEL[t]}
            {t === 'refunds' && data.stats.refund_requests_pending ? (
              <em className="host-link-badge">{data.stats.refund_requests_pending}</em>
            ) : null}
          </button>
        ))}
      </div>
      {tab === 'overview' && <Overview data={data} reload={reload} />}
      {tab === 'tickets' && <TicketsTab data={data} reload={reload} />}
      {tab === 'gates' && <GatesTab data={data} />}
      {tab === 'attendees' && <AttendeesTab id={id} />}
      {tab === 'orders' && <OrdersTab id={id} currency={ev.currency} />}
      {tab === 'voting' && <VotingTab data={data} reload={reload} />}
      {tab === 'reviews' && <ReviewsTab id={id} />}
      {tab === 'refunds' && <RefundsTab id={id} currency={ev.currency} />}
      {tab === 'payout' && <PayoutTab data={data} />}
    </section>
  );
}
