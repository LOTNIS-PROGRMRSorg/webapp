import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from '@/features/home/HomePage';
import { NotificationsPage } from '@/features/account/notifications';
import { PayPage, BookedPage } from '@/features/stays/pay';
import { ReservePage } from '@/features/stays/ReservePage';
import { ExplorePage } from '@/features/stays/explore/ExplorePage';
import { LineLanding } from '@/features/info/LineLanding';
import { PhotosPage, StayPage } from '@/features/stays/StayPage';
import type { Booking } from '@/types';
import { CategoryPage, EventPage, EventsPage, ExitCasePage, HostAccommodation, HostAgreementPage, HostApplicationPage, HostBookings, HostComingSoon, HostEarnings, HostEventForm, HostEventManage, HostEvents, HostMoveOuts, HostNotifications, HostOverview, HostPayoutSettings, HostTransactions, HostWorkspace, HowItWorksPage, LeaveEarlyPage, MyTicketsPage, NewPropertyPage, NomineePage, OrderPage, PrivacyPage, RefundPolicyPage, ScanPage, TermsPage, TicketPage, TicketTermsPage, HostReportPage, HostReportsPage, HostServicesPage, PublicHostPage, ServiceStatsPage } from '@/routes/lazyPages';
import { AppShell } from '@/layouts/AppShell';
import { AuthPage } from '@/features/auth/AuthPage';
import { AuthCallbackPage } from '@/features/auth/AuthCallbackPage';
import { TripsPage } from '@/features/account/TripsPage';
import { TransactionsPage } from '@/features/account/TransactionsPage';
import { Protected } from '@/routes/Protected';
import { NotFoundPage } from '@/features/info/NotFoundPage';
import { forwardAuthHash } from '@/lib/authHash';

export default function App() {
  if (forwardAuthHash()) return null;
  return <AppShell><ErrorBoundary><Suspense fallback={<div className="page"><div className="skeleton-hero" /></div>}><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/explore" element={<ExplorePage />} />
    <Route path="/rent/:type" element={<ExplorePage />} />
    <Route path="/in/:city" element={<ExplorePage />} />
    <Route path="/stays/:id" element={<StayPage />} />
    <Route path="/stays/:id/photos" element={<PhotosPage />} />
    <Route path="/events/:slug/vote/:categoryId/:nomineeId" element={<NomineePage />} />
    <Route path="/events/:slug/vote/:categoryId" element={<CategoryPage />} />
    <Route path="/events/:slug" element={<EventPage />} />
    <Route path="/orders/:id" element={<OrderPage />} />
    <Route path="/tickets/:code" element={<TicketPage />} />
    <Route path="/my-tickets" element={<Protected title="My tickets"><MyTicketsPage /></Protected>} />
    <Route path="/scan/:token" element={<ScanPage />} />
    <Route path="/auth" element={<AuthPage />} />
    <Route path="/auth/callback" element={<AuthCallbackPage />} />
    <Route path="/trips" element={<Protected title="My trips"><TripsPage /></Protected>} />
    <Route path="/notifications" element={<Protected title="Notifications"><NotificationsPage /></Protected>} />
    <Route path="/trips/:bookingId/leave" element={<Protected title="Give notice"><LeaveEarlyPage /></Protected>} />
    <Route path="/moveouts/:id" element={<Protected title="Move-out"><ExitCasePage /></Protected>} />
    <Route path="/transactions" element={<Protected title="Transactions"><TransactionsPage /></Protected>} />
    <Route path="/reserve/:id" element={<Protected title="Choose your dates"><ReservePage /></Protected>} />
    <Route path="/pay/:id" element={<Protected title="Pay for your stay"><PayPage /></Protected>} />
    <Route path="/booked/:id" element={<Protected title="Booking confirmed"><BookedPage /></Protected>} />
    {/* The application flow is open to anyone signed in; everything else under /host is verified-hosts-only. */}
    <Route path="/host/apply" element={<Protected title="Host application"><HostApplicationPage /></Protected>} />
    <Route path="/host" element={<Protected title="Host workspace"><HostWorkspace /></Protected>}>
      <Route index element={<HostOverview />} />
      <Route path="accommodation" element={<HostAccommodation />} />
      <Route path="accommodation/new" element={<NewPropertyPage />} />
      <Route path="properties/new" element={<Navigate to="/host/accommodation/new" replace />} />
      <Route path="bookings" element={<HostBookings />} />
      <Route path="move-outs" element={<HostMoveOuts />} />
      <Route path="transactions" element={<HostTransactions />} />
      <Route path="notifications" element={<HostNotifications />} />
      <Route path="events" element={<HostEvents />} />
      <Route path="events/new" element={<HostEventForm />} />
      <Route path="events/:id" element={<HostEventManage />} />
      <Route path="events/:id/edit" element={<HostEventForm />} />
      <Route path="listings" element={<HostServicesPage />} />
      <Route path="listings/:kind/:id" element={<ServiceStatsPage />} />
      <Route path="reports" element={<HostReportsPage />} />
      <Route path="reports/:id" element={<HostReportPage />} />
      <Route path="earnings" element={<HostEarnings />} />
      <Route path="payout-settings" element={<HostPayoutSettings />} />
      <Route path="food" element={<HostComingSoon title="Food" text="Sell meals and food experiences to Lotnis guests." />} />
      <Route path="services" element={<HostComingSoon title="Services" text="Offer your skills — cleaning, transport, tours and more." />} />
    </Route>
    <Route path="/hosts/:id" element={<PublicHostPage />} />
    <Route path="/how-it-works" element={<HowItWorksPage />} />
    <Route path="/terms" element={<TermsPage />} />
    <Route path="/privacy" element={<PrivacyPage />} />
    <Route path="/refund-policy" element={<RefundPolicyPage />} />
    <Route path="/ticket-terms" element={<TicketTermsPage />} />
    <Route path="/host-agreement" element={<HostAgreementPage />} />
    <Route path="/food" element={<LineLanding lineKey="food" />} />
    <Route path="/events" element={<EventsPage />} />
    <Route path="/services" element={<LineLanding lineKey="services" />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes></Suspense></ErrorBoundary></AppShell>;
}
