import { BarChart3, Building2, Pause, Play, Ticket } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Seo } from '@/lib/seo/seo';
import { engagementApi, type HostEngagementOverview } from '@/lib/api/engagement';
import { servicesApi, type HostService, type HostServices } from '@/lib/api/services';
import { fmtDate } from '@/lib/dates';
import { FieldDialog } from '@/components/modals';
import { RowCard, RowList, Thumb } from '@/components/cards';
import { EmptyState, ErrorState, LoadingState, Notice, PageHeader, SectionHeading, StatusPill } from '@/components/ui';
import { StatCard, StatGrid } from '@/components/cards';

/** Every service a host runs, with a pause switch and a glance at how many people looked and clicked. */
export function HostServicesPage() {
  const [data, setData] = useState<HostServices | null>(null);
  const [stats, setStats] = useState<HostEngagementOverview | null>(null);
  const [error, setError] = useState('');
  const [pausing, setPausing] = useState<HostService | null>(null);
  const [busy, setBusy] = useState('');

  const load = useCallback(() => {
    servicesApi.list().then(setData).catch((e) => setError(e.message));
    engagementApi.hostOverview(30).then(setStats).catch(() => {});
  }, []);
  useEffect(load, [load]);

  const resume = async (s: HostService) => { setBusy(s.id); try { await servicesApi.resume(s.kind, s.id); load(); } catch (e) { setError(e instanceof Error ? e.message : 'Could not resume'); } finally { setBusy(''); } };
  const numbers = (id: string) => stats?.per_target[id] ?? { views: 0, clicks: 0 };

  if (error && !data) return <ErrorState>{error}</ErrorState>;
  if (!data) return <LoadingState />;

  const row = (s: HostService, to: string, sub: string) => (
    <RowCard key={s.id} to={to} thumb={<Thumb src={s.image} fallback={s.kind === 'event' ? <Ticket size={18} /> : <Building2 size={18} />} />}
      title={s.name} subtitle={sub}
      meta={`${numbers(s.id).views} views · ${numbers(s.id).clicks} clicks (30 days)${s.is_paused && s.pause_reason ? ` · “${s.pause_reason}”` : ''}`}
      status={s.is_paused ? <StatusPill status="paused" /> : <StatusPill status={s.kind === 'event' ? s.status : s.approval_status === 'approved' ? 'live' : s.approval_status} />}
      actions={<>
        <Link className="button button-quiet" to={`/host/listings/${s.kind}/${s.id}`}><BarChart3 size={15} /> Statistics</Link>
        {s.is_paused
          ? <button className="button button-secondary" disabled={busy === s.id} onClick={() => resume(s)}><Play size={15} /> Resume</button>
          : <button className="button button-quiet" onClick={() => setPausing(s)}><Pause size={15} /> Pause</button>}
      </>} />
  );

  const totals = (stats?.properties.totals.views ?? 0) + (stats?.events.totals.views ?? 0);
  const clicks = (stats?.properties.totals.clicks ?? 0) + (stats?.events.totals.clicks ?? 0);
  return (
    <div className="host-page">
      <Seo title="Services" description="Pause or resume your listings and events." noindex />
      <PageHeader eyebrow="Your listings and events" title="Pause & statistics" />
      <p className="lead">Pause anything you can't take bookings or sales for right now. A paused listing or event stays visible with a notice, but nobody can book or buy until you resume it. Guests who already paid are not affected.</p>
      {!data.pause_available && <Notice tone="warn">Pausing needs the latest database update. Ask the Lotnis team to apply migration 13.</Notice>}
      {error && <Notice tone="danger">{error}</Notice>}
      <StatGrid cols={3}>
        <StatCard label="People who looked (30 days)" value={totals.toLocaleString()} />
        <StatCard label="Clicked book / tickets" value={clicks.toLocaleString()} />
        <StatCard label="Paused right now" value={[...data.properties, ...data.events].filter((s) => s.is_paused).length} tone={[...data.properties, ...data.events].some((s) => s.is_paused) ? 'warn' : undefined} />
      </StatGrid>

      <SectionHeading title="Accommodation" />
      {data.properties.length ? <RowList>{data.properties.map((p) => row(p, `/host/listings/property/${p.id}`, [p.sub_type, p.city].filter(Boolean).join(' · ')))}</RowList>
        : <EmptyState icon={<Building2 size={26} />} action={<Link className="button button-secondary" to="/host/accommodation/new">Add a space</Link>}>No listings yet.</EmptyState>}

      <SectionHeading title="Events" />
      {data.events.length ? <RowList>{data.events.map((e) => row(e, `/host/listings/event/${e.id}`, `${e.starts_at ? fmtDate(e.starts_at) : ''} · ${e.venue_name ?? ''}`))}</RowList>
        : <EmptyState icon={<Ticket size={26} />} action={<Link className="button button-secondary" to="/host/events/new">Create an event</Link>}>No events yet.</EmptyState>}

      {pausing && <FieldDialog title={`Pause ${pausing.name}?`} danger submitLabel="Pause" onClose={() => setPausing(null)}
        intro={pausing.kind === 'event' ? 'Ticket and vote sales stop straight away. Existing tickets stay valid.' : 'The listing stops taking bookings and disappears from search. Current guests are not affected.'}
        fields={[{ name: 'reason', type: 'text', label: 'Reason shown to visitors', hint: 'optional', maxLength: 300, placeholder: 'e.g. Renovation until 1 March' }]}
        onSubmit={async (v) => { await servicesApi.pause(pausing.kind, pausing.id, String(v.reason || '')); setPausing(null); load(); }} />}
    </div>
  );
}
