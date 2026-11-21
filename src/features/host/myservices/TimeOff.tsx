import './myservices.css';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { FieldDialog } from '@/components/modals';
import { marketApi } from '@/lib/api/market';

type Off = { id: string; starts_at: string; ends_at: string; reason?: string | null };
const fmt = (iso: string) =>
  new Date(iso).toLocaleString('en-GH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Accra' });

/** Days or hours when you can't work (holiday, other job). Customers can't ask for those times. */
export function TimeOff({ serviceId, initial }: { serviceId: string; initial: Off[] }) {
  const [list, setList] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const remove = async (id: string) => {
    setError('');
    try {
      await marketApi.host.removeTimeOff(serviceId, id);
      setList((l) => l.filter((x) => x.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove');
    }
  };
  return (
    <div className="sv-off">
      <h3>Time off</h3>
      {list.length === 0 && <p className="muted-inline">None planned.</p>}
      <ul>
        {list.map((o) => (
          <li key={o.id}>
            <span>
              {fmt(o.starts_at)} → {fmt(o.ends_at)}
              {o.reason ? ` · ${o.reason}` : ''}
            </span>
            <button type="button" className="icon-btn" onClick={() => remove(o.id)} aria-label="Remove">
              <Trash2 size={15} />
            </button>
          </li>
        ))}
      </ul>
      {error && <div className="form-error">{error}</div>}
      <button type="button" className="button button-secondary" onClick={() => setAdding(true)}>
        <Plus size={15} /> Add time off
      </button>
      {adding && (
        <FieldDialog
          title="Block out some time"
          submitLabel="Add"
          onClose={() => setAdding(false)}
          fields={[
            {
              name: 'from',
              type: 'text',
              label: 'From (YYYY-MM-DD HH:MM, Ghana time)',
              required: true,
              placeholder: '2026-12-24 08:00',
            },
            {
              name: 'to',
              type: 'text',
              label: 'Until (YYYY-MM-DD HH:MM)',
              required: true,
              placeholder: '2026-12-27 18:00',
            },
            { name: 'reason', type: 'text', label: 'Note (optional)', maxLength: 100 },
          ]}
          onSubmit={async (v) => {
            const parse = (s: string) => new Date(`${String(s).trim().replace(' ', 'T')}:00.000Z`);
            const a = parse(String(v.from));
            const b = parse(String(v.to));
            if (isNaN(+a) || isNaN(+b)) throw new Error('Use the format 2026-12-24 08:00');
            const row = await marketApi.host.addTimeOff(serviceId, {
              starts_at: a.toISOString(),
              ends_at: b.toISOString(),
              reason: String(v.reason || ''),
            });
            setList((l) => [
              ...l,
              { id: row.id, starts_at: a.toISOString(), ends_at: b.toISOString(), reason: String(v.reason || '') },
            ]);
            setAdding(false);
          }}
        />
      )}
    </div>
  );
}
