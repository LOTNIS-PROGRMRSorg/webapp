import { cedis } from '@/features/events/eventUi';
import type { Quote } from '@/lib/api/events';

/** The itemised price for the tickets picked, like the bottom of a receipt. */
export function QuoteSummary({ quote }: { quote: Quote }) {
  return (
    <div className="evd-receipt">
      {quote.lines.map((l) => (
        <div key={l.ticket_type_id}>
          <span>
            {l.quantity} × {l.name}
          </span>
          <b>{(l.unit_price ?? 0) === 0 ? 'Free' : cedis((l.quantity ?? 0) * (l.unit_price ?? 0), quote.currency)}</b>
        </div>
      ))}
      {quote.service_fee > 0 && (
        <div>
          <span>Lotnis service fee</span>
          <b>{cedis(quote.service_fee, quote.currency)}</b>
        </div>
      )}
      {quote.processing_fee > 0 && (
        <div>
          <span>Payment processing</span>
          <b>{cedis(quote.processing_fee, quote.currency)}</b>
        </div>
      )}
      <div className="evd-receipt-total">
        <span>Total</span>
        <b>{quote.total === 0 ? 'Free' : cedis(quote.total, quote.currency)}</b>
      </div>
    </div>
  );
}
