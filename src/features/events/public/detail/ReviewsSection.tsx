import { Star } from 'lucide-react';
import { fmtDate } from '@/features/events/eventUi';
import type { EventDetail, eventApi } from '@/lib/api/events';

type Reviews = Awaited<ReturnType<typeof eventApi.reviews>>;

export function ReviewsSection({ ev, reviews }: { ev: EventDetail; reviews: Reviews }) {
  return (
    <section className="evd-block" id="reviews">
      <h2 className="evd-h2">Reviews</h2>
      {ev.rating && (
        <div className="ev-rating">
          <Star size={20} fill="currentColor" /> <b>{ev.rating.average}</b>{' '}
          <span>
            from {ev.rating.count} verified attendee{ev.rating.count === 1 ? '' : 's'}
          </span>
        </div>
      )}
      {reviews.length ? (
        reviews.map((r) => (
          <article className="ev-review" key={r.id}>
            <div className="ev-stars">
              {'★'.repeat(r.rating)}
              <span>{'★'.repeat(5 - r.rating)}</span>
            </div>
            <p>{r.comment || 'No comment.'}</p>
            <small>
              {r.reviewer_name || 'Attendee'} · {fmtDate(r.created_at)}
            </small>
            {r.host_reply && (
              <blockquote>
                <b>Organiser:</b> {r.host_reply}
              </blockquote>
            )}
          </article>
        ))
      ) : (
        <div className="empty-state">No reviews yet. Reviews come from people whose ticket was scanned at the gate.</div>
      )}
    </section>
  );
}
