import { Check } from 'lucide-react';
import { NotificationsPage } from '@/features/account/notifications';
import { PageHeader } from '@/components/ui';

export function HostNotifications() {
  return <NotificationsPage embedded defaultTab="host" />;
}

export function HostComingSoon({ title, text }: { title: string; text: string }) {
  return (
    <section className="host-page">
      <PageHeader eyebrow="Coming soon" title={title} />
      <p className="lead">{text}</p>
      <div className="placeholder-columns">
        <div><Check size={18} /><strong>Same host account</strong><p>No new application — your verified account carries over.</p></div>
        <div><Check size={18} /><strong>Same bookings and payouts</strong><p>Orders will appear in your Bookings and Transactions, tagged by service.</p></div>
      </div>
    </section>
  );
}
