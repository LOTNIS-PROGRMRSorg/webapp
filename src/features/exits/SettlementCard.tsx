import { money } from '@/lib/format';
import type { ExitSettlement } from '@/types';
import { nights, when } from './exitShared';

export function SettlementCard({ s, title = 'How it adds up', host = false }: { s: ExitSettlement; title?: string; host?: boolean }) {
  const c = s.currency;
  return (
    <div className="settle-card">
      <h3>{title}</h3>
      <div className="settle-rows">
        <div><span>You stay for</span><strong>{nights(s.nights_stayed)}</strong></div>
        {s.notice_nights_charged > 0 && <div><span>Notice not given in advance</span><strong>+ {nights(s.notice_nights_charged)}</strong></div>}
        {s.relet_credit_nights > 0 && <div><span>Re-let by the host (credited back)</span><strong className="pos">− {nights(s.relet_credit_nights)}</strong></div>}
        <div className="settle-sep"><span>Booked</span><strong>{nights(s.nights_total)}</strong></div>
        <div><span>Unused nights refunded</span><strong>{nights(s.nights_refunded)}</strong></div>
        <div><span>Unused rent</span><strong>{money(c, s.rent_refund)}</strong></div>
        {s.fee_refund > 0 && <div><span>Service fee refunded</span><strong>{money(c, s.fee_refund)}</strong></div>}
        {s.deposit_held > 0 && <div><span>Deposit{s.deductions_total ? ` (less ${money(c, s.deductions_total)} deductions)` : ' (returned after move-out)'}</span><strong>{money(c, s.deposit_returned ?? s.deposit_held)}</strong></div>}
        <div className="settle-total"><span>{host ? 'Refund to guest' : 'You get back'}</span><strong>{money(c, s.total_refund ?? s.rent_refund + s.fee_refund + (s.deposit_returned ?? s.deposit_held))}</strong></div>
        {host && <div><span>You keep (after commission)</span><strong>{money(c, s.host_receives)}</strong></div>}
      </div>
      <small>The Lotnis service fee is not refunded unless the host is found at fault. Refunds are sent by Lotnis, who notify you when it's on its way.</small>
    </div>
  );
}
