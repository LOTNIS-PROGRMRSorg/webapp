import type { CSSProperties } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cedis, fmtDate, fmtDateTime } from '@/features/events/eventUi';
import type { EventDetail, TicketTypeView } from '@/lib/api/events';

export type Tier = 'free' | 'standard' | 'plus' | 'premium';

const TIER_LABEL: Record<Tier, string> = { free: 'Free entry', standard: 'General', plus: 'Plus', premium: 'Premium' };

/** Cheapest paid ticket reads as general admission, the dearest (or anything named VIP) as premium, the rest in between. */
export function ticketTier(t: TicketTypeView, all: TicketTypeView[]): Tier {
  if (t.is_free) return 'free';
  if (/vip|premium|platinum|backstage|table|gold/i.test(t.name)) return 'premium';
  const prices = all.filter((x) => !x.is_free).map((x) => x.price);
  const [min, max] = [Math.min(...prices), Math.max(...prices)];
  if (prices.length < 2 || t.price === min) return 'standard';
  return t.price === max ? 'premium' : 'plus';
}

const statusLine = (t: TicketTypeView, perOrderCap: number) =>
  t.status === 'sold_out'
    ? 'Sold out'
    : t.status === 'not_started'
      ? `Sales open ${t.sales_start ? fmtDateTime(t.sales_start) : 'soon'}`
      : t.status === 'ended'
        ? 'Sales closed'
        : t.remaining != null
          ? `Only ${t.remaining} left`
          : t.max_per_order < perOrderCap
            ? `Up to ${t.max_per_order} per order`
            : '';

/**
 * A ticket as an object: the event's own cover blurred into the background, a look per tier so the
 * options read differently at a glance, and a perforated stub carrying the price and quantity.
 */
export function TicketCard({
  ticket,
  ev,
  qty,
  live,
  onChange,
}: {
  ticket: TicketTypeView;
  ev: EventDetail;
  qty: number;
  live: boolean;
  onChange: (delta: number, max: number) => void;
}) {
  const max = Math.min(ticket.max_per_order, ev.max_tickets_per_order, ticket.remaining ?? 50);
  const note = statusLine(ticket, ev.max_tickets_per_order);
  const tier = ticketTier(ticket, ev.ticket_types);
  const style = ev.cover_image_url ? ({ '--tk-img': `url("${ev.cover_image_url}")` } as CSSProperties) : undefined;
  return (
    <div className={`evd-ticket-wrap ${live ? '' : 'is-off'}`} style={style}>
      <article className={`evd-ticket evd-tier-${tier} ${qty > 0 ? 'is-on' : ''}`}>
        <div className="evd-ticket-main">
          <div className="evd-ticket-top">
            <span className="evd-ticket-kind">{TIER_LABEL[tier]}</span>
            <span className="evd-ticket-event">
              {ev.title} · {fmtDate(ev.starts_at, { day: 'numeric', month: 'short' })}
            </span>
          </div>
          <h3>{ticket.name}</h3>
          {ticket.description && <p>{ticket.description}</p>}
          {note && <small className={ticket.status === 'on_sale' ? 'is-hot' : ''}>{note}</small>}
        </div>
        <div className="evd-ticket-stub">
          <strong>{ticket.is_free ? 'Free' : cedis(ticket.price, ev.currency)}</strong>
          <div className="evd-stepper" aria-label={`${ticket.name} quantity`}>
            <button type="button" onClick={() => onChange(-1, max)} disabled={!live || qty === 0} aria-label="Fewer">
              <Minus size={16} />
            </button>
            <output>{qty}</output>
            <button type="button" onClick={() => onChange(1, max)} disabled={!live || qty >= max} aria-label="More">
              <Plus size={16} />
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}
