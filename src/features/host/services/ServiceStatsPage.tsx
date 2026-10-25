import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Seo } from '@/lib/seo/seo';
import { engagementApi, type EventEngagement, type PropertyEngagement } from '@/lib/api/engagement';
import { cedis } from '@/lib/dates';
import { StatCard, StatGrid, PanelCard } from '@/components/cards';
import { ChipGroup, ErrorState, LoadingState, PageHeader } from '@/components/ui';
import { EngagementChart, Funnel } from '@/components/stats/EngagementChart';

const ACTION_LABEL: Record<string, string> = { view: 'Page views', click_book: 'Clicked "Reserve"', click_tickets: 'Opened tickets', click_vote: 'Opened voting', click_share: 'Shared', click_contact: 'Contacted host', click_host: 'Opened host page' };

/** One listing or event: who looked, who clicked, who went on to book or buy. */
export function ServiceStatsPage() {
  const { kind = 'property', id = '' } = useParams();
  const [days, setDays] = useState<'7' | '30' | '90'>('30');
  const [data, setData] = useState<PropertyEngagement | EventEngagement | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    setData(null); setError('');
    (kind === 'event' ? engagementApi.event(id, Number(days)) : engagementApi.property(id, Number(days))).then(setData).catch((e) => setError(e.message));
  }, [kind, id, days]);

  if (error) return <ErrorState>{error}</ErrorState>;
  if (!data) return <LoadingState />;
  const isEvent = kind === 'event';
  const conv = data.conversions as Record<string, number>;
  const steps = isEvent
    ? [{ label: 'Viewed the page', value: data.totals.views }, { label: 'Clicked tickets or vote', value: data.totals.clicks }, { label: 'Started checkout', value: conv.checkouts_started ?? 0 }, { label: 'Paid for tickets', value: conv.ticket_orders_paid ?? 0 }]
    : [{ label: 'Viewed the page', value: data.totals.views }, { label: 'Clicked Reserve', value: data.totals.clicks }, { label: 'Requested a booking', value: conv.requests ?? 0 }, { label: 'Booked & paid', value: conv.booked ?? 0 }];
  const name = !isEvent ? (data as PropertyEngagement).listing?.name : 'this event';
  return (
    <div className="host-page">
      <Seo title="Statistics" description="Views, clicks and bookings." noindex />
      <Link className="back-link" to="/host/listings">← Services</Link>
      <PageHeader eyebrow={isEvent ? 'Event statistics' : 'Listing statistics'} title={name ?? 'Statistics'}>
        <ChipGroup label="Period" value={days} onChange={setDays} options={[{ key: '7', label: '7 days' }, { key: '30', label: '30 days' }, { key: '90', label: '90 days' }]} />
      </PageHeader>
      {data.not_ready && <p className="notice notice-warn">Statistics need the latest database update (migration 13).</p>}
      <StatGrid cols={4}>
        <StatCard label="Page views" value={data.totals.views.toLocaleString()} />
        <StatCard label="Different visitors" value={data.totals.visitors.toLocaleString()} />
        <StatCard label="Clicks" value={data.totals.clicks.toLocaleString()} />
        {!isEvent ? <StatCard label="Booking revenue" value={cedis((data as PropertyEngagement).conversions.revenue, 'GHS')} /> : <StatCard label="Paid orders" value={(conv.ticket_orders_paid ?? 0) + (conv.vote_orders_paid ?? 0)} />}
      </StatGrid>
      <PanelCard title="Visits per day"><EngagementChart days={data.days} /></PanelCard>
      <div className="two-col">
        <PanelCard title="From looking to booking"><Funnel steps={steps} /></PanelCard>
        <PanelCard title="What people did">
          <ul className="plain-list">{Object.entries(data.by_action).length ? Object.entries(data.by_action).map(([a, n]) => <li key={a}><span>{ACTION_LABEL[a] ?? a}</span><b>{n.toLocaleString()}</b></li>) : <li className="muted-inline">Nothing yet.</li>}</ul>
        </PanelCard>
      </div>
    </div>
  );
}
