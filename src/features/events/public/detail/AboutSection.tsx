import type { EventDetail } from '@/lib/api/events';
import { ReadMore } from './ReadMore';

/** The write-up, collapsed when long. */
export function AboutSection({ ev }: { ev: EventDetail }) {
  return (
    <section className="evd-block" id="about">
      <h2 className="evd-h2">About this event</h2>
      <ReadMore text={ev.description} />
    </section>
  );
}
