import './myservices.css';
import { Eye, Pause, Pencil, Play, Plus, Send, Trash2, Wrench } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RowCard, RowList, Thumb } from '@/components/cards';
import { emojiFor } from '@/components/maps/categoryIcons';
import { ConfirmDialog, FieldDialog } from '@/components/modals';
import { EmptyState, ErrorState, LoadingState, Notice, PageHeader, StatusPill } from '@/components/ui';
import { marketApi, UNIT_NOUN, type MyService } from '@/lib/api/market';
import { servicesApi } from '@/lib/api/services';
import { money } from '@/lib/format';
import { Seo } from '@/lib/seo/seo';

/** Everything you offer, with what each one needs next. */
export default function MyServices() {
  const [list, setList] = useState<MyService[] | null>(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [pausing, setPausing] = useState<MyService | null>(null);
  const [removing, setRemoving] = useState<MyService | null>(null);
  const load = useCallback(
    () =>
      marketApi.host
        .list()
        .then(setList)
        .catch((e) => setError(e.message)),
    [],
  );
  useEffect(() => {
    load();
  }, [load]);

  const act = async (work: () => Promise<unknown>, ok: string) => {
    setMsg('');
    setError('');
    try {
      await work();
      setMsg(ok);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  };

  if (!list && !error) return <LoadingState />;
  return (
    <section className="host-page">
      <Seo title="My services" description="Services you offer on Lotnis." noindex />
      <PageHeader eyebrow="Services" title="What you offer">
        <Link className="button button-secondary" to="/host/jobs">
          Service jobs
        </Link>
        <Link className="button button-primary" to="/host/services/new">
          <Plus size={16} /> Add a service
        </Link>
      </PageHeader>
      <p className="lead">
        List anything you can do — photography, plumbing, cleaning, DJing. Set your rate and hours, and people nearby
        can ask you for a time.
      </p>
      {msg && <Notice tone="ok">{msg}</Notice>}
      {error && <ErrorState>{error}</ErrorState>}
      {list && list.length === 0 && (
        <EmptyState
          icon={<Wrench size={28} />}
          action={
            <Link className="button button-primary" to="/host/services/new">
              Add your first service
            </Link>
          }
        >
          You have not added a service yet.
        </EmptyState>
      )}
      {list && list.length > 0 && (
        <RowList>
          {list.map((s) => (
            <RowCard
              key={s.id}
              to={`/host/services/${s.id}/edit`}
              thumb={<Thumb src={s.photos[0]} fallback={<span>{emojiFor(s.category?.icon)}</span>} />}
              title={s.title}
              subtitle={`${s.category?.name ?? 'Service'} · ${money(s.currency, s.rate)} per ${UNIT_NOUN[s.pricing_unit]}`}
              meta={
                [
                  s.open_requests ? `${s.open_requests} request${s.open_requests === 1 ? '' : 's'} waiting` : '',
                  s.active_jobs ? `${s.active_jobs} active job${s.active_jobs === 1 ? '' : 's'}` : '',
                  s.jobs_completed ? `${s.jobs_completed} done` : '',
                  s.status === 'rejected' && s.rejection_reason ? `Needs changes: ${s.rejection_reason}` : '',
                ]
                  .filter(Boolean)
                  .join(' · ') || undefined
              }
              status={
                s.is_paused ? (
                  <StatusPill status="paused" />
                ) : (
                  <StatusPill status={s.status === 'published' ? 'live' : s.status} />
                )
              }
              actions={
                <>
                  {['draft', 'rejected'].includes(s.status) && (
                    <button
                      className="button button-primary"
                      onClick={() => act(() => marketApi.host.submit(s.id), 'Sent for review.')}
                    >
                      <Send size={15} /> Submit
                    </button>
                  )}
                  {s.status === 'published' &&
                    (s.is_paused ? (
                      <button
                        className="button button-secondary"
                        onClick={() =>
                          act(() => servicesApi.resume('service', s.id), 'Resumed — customers can ask for you again.')
                        }
                      >
                        <Play size={15} /> Resume
                      </button>
                    ) : (
                      <button className="button button-quiet" onClick={() => setPausing(s)}>
                        <Pause size={15} /> Pause
                      </button>
                    ))}
                  {s.status === 'published' && (
                    <Link className="button button-quiet" to={`/services/${s.id}`}>
                      <Eye size={15} /> View
                    </Link>
                  )}
                  <Link className="button button-quiet" to={`/host/services/${s.id}/edit`}>
                    <Pencil size={15} /> Edit
                  </Link>
                  <button className="button button-quiet" onClick={() => setRemoving(s)} aria-label="Delete">
                    <Trash2 size={15} />
                  </button>
                </>
              }
            />
          ))}
        </RowList>
      )}
      {pausing && (
        <FieldDialog
          title={`Pause ${pausing.title}?`}
          danger
          submitLabel="Pause"
          onClose={() => setPausing(null)}
          intro="Nobody can ask for it until you resume. Jobs already agreed are not affected."
          fields={[{ name: 'reason', type: 'text', label: 'Reason shown to visitors', maxLength: 200 }]}
          onSubmit={async (v) => {
            await servicesApi.pause('service', pausing.id, String(v.reason || ''));
            setPausing(null);
            setMsg('Paused.');
            await load();
          }}
        />
      )}
      {removing && (
        <ConfirmDialog
          title="Delete this service?"
          danger
          confirmLabel="Delete"
          onClose={() => setRemoving(null)}
          body="If it has job history it is archived instead, so customers keep their records."
          onConfirm={async () => {
            await marketApi.host.remove(removing.id);
            setRemoving(null);
            setMsg('Removed.');
            await load();
          }}
        />
      )}
    </section>
  );
}
