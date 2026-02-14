import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppLayout, GInvoiceLayout } from '@/components/layout'
import { PortalLayout } from '@/components/layout'
import {
  LoginPage,
  RegisterPage,
  PendingApprovalPage,
  AuthCallbackPage,
  ProtectedRoute,
  PortalRoute,
  GInvoiceRoute,
  useAuth,
} from '@/features/auth'
import { ErrorBoundary } from '@/components/error-boundary'
import { SuspenseLoader } from '@/components/suspense-loader'

// Lazy-loaded internal route pages (code splitting)
const DashboardPage = lazy(() =>
  import('@/features/dashboard/components/dashboard-page').then((m) => ({
    default: m.DashboardPage,
  })),
)
const CorrespondentsPage = lazy(() =>
  import('@/features/correspondents/components/correspondents-page').then((m) => ({
    default: m.CorrespondentsPage,
  })),
)
const CorrespondentDetailPage = lazy(() =>
  import('@/features/correspondents/components/correspondent-detail-page').then((m) => ({
    default: m.CorrespondentDetailPage,
  })),
)
const CertificatesPage = lazy(() =>
  import('@/features/certificates/components/certificates-page').then((m) => ({
    default: m.CertificatesPage,
  })),
)
const LiquidationsPage = lazy(() =>
  import('@/features/liquidations/components/liquidations-page').then((m) => ({
    default: m.LiquidationsPage,
  })),
)
const LiquidationDetailPage = lazy(() =>
  import('@/features/liquidations/components/liquidation-detail-page').then((m) => ({
    default: m.LiquidationDetailPage,
  })),
)
const PaymentsPage = lazy(() =>
  import('@/features/payments/components/payments-page').then((m) => ({
    default: m.PaymentsPage,
  })),
)
const PaymentDetailPage = lazy(() =>
  import('@/features/payments/components/payment-detail-page').then((m) => ({
    default: m.PaymentDetailPage,
  })),
)
const NotificationsPage = lazy(() =>
  import('@/features/notifications/components/notifications-page').then((m) => ({
    default: m.NotificationsPage,
  })),
)
const MessagesPage = lazy(() =>
  import('@/features/messaging/components/messages-page').then((m) => ({
    default: m.MessagesPage,
  })),
)
const SettingsPage = lazy(() =>
  import('@/features/settings/components/settings-page').then((m) => ({
    default: m.SettingsPage,
  })),
)
const SecurityManifestPage = lazy(() =>
  import('@/features/settings/components/security-manifest-page').then((m) => ({
    default: m.SecurityManifestPage,
  })),
)
const VerificationGuidePage = lazy(() =>
  import('@/features/certificates/components/verification-guide-page').then((m) => ({
    default: m.VerificationGuidePage,
  })),
)

// Lazy-loaded portal route pages (code splitting)
const PortalDashboardPage = lazy(() =>
  import('@/features/portal/components/portal-dashboard-page').then((m) => ({
    default: m.PortalDashboardPage,
  })),
)
const PortalInvoicesPage = lazy(() =>
  import('@/features/portal/components/portal-invoices-page').then((m) => ({
    default: m.PortalInvoicesPage,
  })),
)
const PortalInvoiceDetailPage = lazy(() =>
  import('@/features/portal/components/portal-invoice-detail-page').then((m) => ({
    default: m.PortalInvoiceDetailPage,
  })),
)
const PortalCertificatesPage = lazy(() =>
  import('@/features/portal/components/portal-certificates-page').then((m) => ({
    default: m.PortalCertificatesPage,
  })),
)
const PortalProfilePage = lazy(() =>
  import('@/features/portal/components/portal-profile-page').then((m) => ({
    default: m.PortalProfilePage,
  })),
)
const PortalNotificationsPage = lazy(() =>
  import('@/features/portal/components/portal-notifications-page').then((m) => ({
    default: m.PortalNotificationsPage,
  })),
)
const PortalMessagesPage = lazy(() =>
  import('@/features/portal/components/portal-messages-page').then((m) => ({
    default: m.PortalMessagesPage,
  })),
)

// Lazy-loaded G-Invoice route pages (code splitting)
const GInvoiceDashboardPage = lazy(() =>
  import('@/features/ginvoice/components/ginvoice-dashboard-page').then((m) => ({
    default: m.GInvoiceDashboardPage,
  })),
)
const GInvJobsPage = lazy(() =>
  import('@/features/ginvoice/components/jobs-page').then((m) => ({
    default: m.JobsPage,
  })),
)
const GInvVendorsPage = lazy(() =>
  import('@/features/ginvoice/components/vendors-page').then((m) => ({
    default: m.VendorsPage,
  })),
)
const GInvVendorCompliancePage = lazy(() =>
  import('@/features/ginvoice/components/vendor-compliance-page').then((m) => ({
    default: m.VendorCompliancePage,
  })),
)
const GInvIntakePage = lazy(() =>
  import('@/features/ginvoice/components/intake-page').then((m) => ({
    default: m.IntakePage,
  })),
)
const GInvUttaiPage = lazy(() =>
  import('@/features/ginvoice/components/uttai-page').then((m) => ({
    default: m.UttaiPage,
  })),
)
const GInvAccountingPage = lazy(() =>
  import('@/features/ginvoice/components/accounting-page').then((m) => ({
    default: m.AccountingPage,
  })),
)
const GInvBillingPage = lazy(() =>
  import('@/features/ginvoice/components/billing-page').then((m) => ({
    default: m.BillingPage,
  })),
)
const GInvInvoicesPage = lazy(() =>
  import('@/features/ginvoice/components/invoices-page').then((m) => ({
    default: m.InvoicesPage,
  })),
)
const GInvDeliveryPage = lazy(() =>
  import('@/features/ginvoice/components/delivery-page').then((m) => ({
    default: m.DeliveryPage,
  })),
)
const GInvCollectionsPage = lazy(() =>
  import('@/features/ginvoice/components/collections-page').then((m) => ({
    default: m.CollectionsPage,
  })),
)
const GInvPlatformsPage = lazy(() =>
  import('@/features/ginvoice/components/platforms-page').then((m) => ({
    default: m.PlatformsPage,
  })),
)
const GInvSettingsPage = lazy(() =>
  import('@/features/ginvoice/components/settings-page').then((m) => ({
    default: m.GInvoiceSettingsPage,
  })),
)

function App() {
  const initialize = useAuth((s) => s.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<SuspenseLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/pending" element={<PendingApprovalPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/security" element={<SecurityManifestPage />} />

            {/* Portal routes (corresponsal only) */}
            <Route
              path="/portal"
              element={
                <PortalRoute>
                  <PortalLayout />
                </PortalRoute>
              }
            >
              <Route index element={<PortalDashboardPage />} />
              <Route path="invoices" element={<PortalInvoicesPage />} />
              <Route path="invoices/:id" element={<PortalInvoiceDetailPage />} />
              <Route path="certificates" element={<PortalCertificatesPage />} />
              <Route path="profile" element={<PortalProfilePage />} />
              <Route path="notifications" element={<PortalNotificationsPage />} />
              <Route path="messages" element={<PortalMessagesPage />} />
            </Route>

            {/* G-Invoice routes (ginv_* roles) */}
            <Route
              path="/g-invoice"
              element={
                <GInvoiceRoute>
                  <GInvoiceLayout />
                </GInvoiceRoute>
              }
            >
              <Route index element={<GInvoiceDashboardPage />} />
              <Route path="jobs" element={<GInvJobsPage />} />
              <Route path="vendors" element={<GInvVendorsPage />} />
              <Route path="vendors/:id" element={<GInvVendorCompliancePage />} />
              <Route path="intake" element={<GInvIntakePage />} />
              <Route path="uttai" element={<GInvUttaiPage />} />
              <Route path="accounting" element={<GInvAccountingPage />} />
              <Route path="billing" element={<GInvBillingPage />} />
              <Route path="invoices" element={<GInvInvoicesPage />} />
              <Route path="delivery" element={<GInvDeliveryPage />} />
              <Route path="collections" element={<GInvCollectionsPage />} />
              <Route path="platforms" element={<GInvPlatformsPage />} />
              <Route
                path="settings"
                element={
                  <GInvoiceRoute allowedRoles={['ginv_admin']}>
                    <GInvSettingsPage />
                  </GInvoiceRoute>
                }
              />
            </Route>

            {/* Internal routes (pagador, supervisor, financiero, admin) */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="correspondents" element={<CorrespondentsPage />} />
              <Route path="correspondents/:id" element={<CorrespondentDetailPage />} />
              <Route path="certificates" element={<CertificatesPage />} />
              <Route path="certificates/verification-guide" element={<VerificationGuidePage />} />
              <Route path="liquidations" element={<LiquidationsPage />} />
              <Route path="liquidations/:id" element={<LiquidationDetailPage />} />
              <Route
                path="payments"
                element={
                  <ProtectedRoute allowedRoles={['financiero', 'admin']}>
                    <PaymentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="payments/:id"
                element={
                  <ProtectedRoute allowedRoles={['financiero', 'admin']}>
                    <PaymentDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route
                path="settings"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'var(--g-font-family)',
            borderRadius: 'var(--g-radius-md)',
          },
        }}
      />
    </BrowserRouter>
  )
}

export default App
