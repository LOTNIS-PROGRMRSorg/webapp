import { fmtDateTime } from '@/features/events/eventUi';
import { VotingState } from '@/lib/api/events';
import { SITE_URL } from '@/lib/seo/seo';

export const errText = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);
export const origin = () => (typeof window !== 'undefined' ? window.location.origin : SITE_URL);
export const categoryPath = (slug: string, categoryId: string) => `/events/${slug}/vote/${categoryId}`;
export const nomineePath = (slug: string, categoryId: string, nomineeId: string) =>
  `/events/${slug}/vote/${categoryId}/${nomineeId}`;
export const shareText = (name: string, category: string, event: string, price: string, url: string) =>
  `Vote for ${name} as ${category} at ${event}! A vote costs ${price}. ${url}`;

/** Plain-words reason voting isn't available (or when it closes). Never calls an unpublished event "closed". */
export function votingMessage(
  state: VotingState,
  opens?: string | null,
  closes?: string | null,
  isOwner = false,
): { title: string; body: string; ok: boolean } {
  switch (state) {
    case 'open':
      return { ok: true, title: 'Voting is open', body: closes ? `Closes ${fmtDateTime(closes)}.` : '' };
    case 'not_published':
      return {
        ok: false,
        title: 'Voting opens once the event is published',
        body: isOwner
          ? 'Submit your event for review — voting starts as soon as it is live (and after your voting start time).'
          : 'This event is not on sale yet.',
      };
    case 'not_started':
      return {
        ok: false,
        title: `Voting opens ${opens ? fmtDateTime(opens) : 'soon'}`,
        body: closes ? `It closes ${fmtDateTime(closes)}.` : '',
      };
    case 'closed':
      return { ok: false, title: 'Voting has closed', body: closes ? `It ended ${fmtDateTime(closes)}.` : '' };
    case 'category_closed':
      return { ok: false, title: 'Voting in this category is closed', body: 'The organiser has closed this category.' };
    case 'cancelled':
      return { ok: false, title: 'This event was cancelled', body: 'Votes are refunded in full.' };
    default:
      return { ok: false, title: 'Voting is not available right now', body: '' };
  }
}

/** Same rule as the server's votingState, for screens that already hold the event row (host dashboard). */
export function clientVotingState(ev: {
  status: string;
  voting_opens_at?: string | null;
  voting_closes_at?: string | null;
}): VotingState {
  const now = Date.now();
  if (ev.status === 'cancelled') return 'cancelled';
  if (ev.status !== 'published') return 'not_published';
  if (ev.voting_opens_at && now < new Date(ev.voting_opens_at).getTime()) return 'not_started';
  if (ev.voting_closes_at && now > new Date(ev.voting_closes_at).getTime()) return 'closed';
  return 'open';
}
