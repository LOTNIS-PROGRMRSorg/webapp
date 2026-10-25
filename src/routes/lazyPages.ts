import { lazyNamed } from '@/lib/lazy';

export const HowItWorksPage = lazyNamed(() => import('@/features/info/HowItWorksPage'), 'HowItWorksPage');
export const HostApplicationPage = lazyNamed(
  () => import('@/features/host/application/HostApplicationPage'),
  'HostApplicationPage',
);
export const HostWorkspace = lazyNamed(() => import('@/features/host'), 'HostWorkspace');
export const HostOverview = lazyNamed(() => import('@/features/host'), 'HostOverview');
export const HostAccommodation = lazyNamed(() => import('@/features/host'), 'HostAccommodation');
export const HostBookings = lazyNamed(() => import('@/features/host'), 'HostBookings');
export const HostTransactions = lazyNamed(() => import('@/features/host'), 'HostTransactions');
export const HostPayoutSettings = lazyNamed(() => import('@/features/host'), 'HostPayoutSettings');
export const HostNotifications = lazyNamed(() => import('@/features/host'), 'HostNotifications');
export const HostComingSoon = lazyNamed(() => import('@/features/host'), 'HostComingSoon');
export const EventPage = lazyNamed(() => import('@/features/events/public'), 'EventPage');
export const EventsPage = lazyNamed(() => import('@/features/events/public'), 'EventsPage');
export const MyTicketsPage = lazyNamed(() => import('@/features/events/public'), 'MyTicketsPage');
export const OrderPage = lazyNamed(() => import('@/features/events/public'), 'OrderPage');
export const TicketPage = lazyNamed(() => import('@/features/events/public'), 'TicketPage');
export const CategoryPage = lazyNamed(() => import('@/features/voting'), 'CategoryPage');
export const NomineePage = lazyNamed(() => import('@/features/voting'), 'NomineePage');
export const ScanPage = lazyNamed(() => import('@/features/events/scan/ScanPage'), 'ScanPage');
export const HostEvents = lazyNamed(() => import('@/features/events/host'), 'HostEvents');
export const HostEventForm = lazyNamed(() => import('@/features/events/host'), 'HostEventForm');
export const HostEventManage = lazyNamed(() => import('@/features/events/host'), 'HostEventManage');
export const HostEarnings = lazyNamed(() => import('@/features/events/host'), 'HostEarnings');
export const NewPropertyPage = lazyNamed(() => import('@/features/stays/host/NewPropertyPage'), 'NewPropertyPage');
export const HostMoveOuts = lazyNamed(() => import('@/features/exits'), 'HostMoveOuts');
export const ExitCasePage = lazyNamed(() => import('@/features/exits'), 'ExitCasePage');
export const LeaveEarlyPage = lazyNamed(() => import('@/features/exits'), 'LeaveEarlyPage');
export const TermsPage = lazyNamed(() => import('@/features/legal'), 'TermsPage');
export const PrivacyPage = lazyNamed(() => import('@/features/legal'), 'PrivacyPage');
export const RefundPolicyPage = lazyNamed(() => import('@/features/legal'), 'RefundPolicyPage');
export const TicketTermsPage = lazyNamed(() => import('@/features/legal'), 'TicketTermsPage');
export const HostAgreementPage = lazyNamed(() => import('@/features/legal'), 'HostAgreementPage');
export const HostServicesPage = lazyNamed(() => import('@/features/host/services'), 'HostServicesPage');
export const ServiceStatsPage = lazyNamed(() => import('@/features/host/services'), 'ServiceStatsPage');
export const HostReportsPage = lazyNamed(() => import('@/features/host/reports'), 'HostReportsPage');
export const HostReportPage = lazyNamed(() => import('@/features/host/reports'), 'HostReportPage');
export const PublicHostPage = lazyNamed(() => import('@/features/hosts/PublicHostPage'), 'PublicHostPage');
