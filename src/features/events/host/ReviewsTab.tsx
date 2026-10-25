import { ReactNode, useCallback, useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { fmtDate } from '@/features/events/eventUi';
import { eventApi } from '@/lib/api/events';
import { FieldDialog } from '@/components/modals';

export function ReviewsTab({ id }: { id: string }) {
  const [rows, setRows] = useState<any[] | null>(null);
  const load = useCallback(
    () =>
      eventApi.host
        .reviews(id)
        .then(setRows)
        .catch(() => setRows([])),
    [id],
  );
  useEffect(() => {
    load();
  }, [load]);
  const [dialog, setDialog] = useState<ReactNode>(null);
  const reply = (r: any) =>
    setDialog(
      <FieldDialog
        title="Reply to this review"
        intro="Your reply is public, under the review."
        fields={[{ name: 'reply', label: 'Your reply', type: 'textarea', required: true, rows: 4, maxLength: 1000 }]}
        initial={{ reply: r.host_reply || '' }}
        submitLabel="Post reply"
        onSubmit={async (v) => {
          await eventApi.host.reply(r.id, String(v.reply));
          setDialog(null);
          load();
        }}
        onClose={() => setDialog(null)}
      />,
    );
  if (!rows) return <div className="empty-state">Loading…</div>;
  return (
    <>
      {rows.length ? (
        <div className="booking-list">
          {rows.map((r) => (
            <div className="booking-row" key={r.id}>
              <div>
                <strong>
                  {'★'.repeat(r.rating)}
                  {'☆'.repeat(5 - r.rating)} {r.reviewer_name || 'Attendee'}
                </strong>
                <p>
                  {r.comment || 'No comment'} · {fmtDate(r.created_at)}
                </p>
                {r.host_reply && <small>Your reply: {r.host_reply}</small>}
              </div>
              <span />
              <button className="button button-quiet" onClick={() => reply(r)}>
                {r.host_reply ? 'Edit reply' : 'Reply'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Star size={26} />
          <p>No reviews yet. Attendees whose ticket was scanned can review after the event.</p>
        </div>
      )}
      {dialog}
    </>
  );
}
