import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Route,
} from 'react-router-dom'
import RouteErrorBoundary from './components/RouteErrorBoundary'
import { NavigationGuardRoot } from './context/NavigationGuardContext'
import RouteFallback from './components/RouteFallback'
import {
  PermissionRoute,
  ProtectedRoute,
  PublicOnlyRoute,
  SuperAdminRoute,
} from './components/auth/RouteGuards'
import { AdminDataProvider } from './context/AdminDataContext'
import { ProductsProvider } from './context/ProductsContext'
import AppLayout from './layouts/AppLayout'

const DashboardPage = lazy(() => import('./pages/DashboardPageRevamp'))
const ProductsPage = lazy(() => import('./pages/ProductsPage'))
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'))
const CreateProductPage = lazy(() => import('./pages/CreateProductPage'))
const OrdersPage = lazy(() => import('./pages/OrdersPageRevamp'))
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'))
const BlogsPage = lazy(() => import('./pages/BlogsPageRevamp'))
const BlogDetailPage = lazy(() => import('./pages/BlogDetailPageRevamp'))
const WholesaleDiscountsPage = lazy(() => import('./pages/WholesaleDiscountsPageRevamp'))
const DealersPage = lazy(() => import('./pages/DealersPageRevamp'))
const DealerDetailPage = lazy(() => import('./pages/DealerDetailPage'))
const SupportTicketsPage = lazy(() => import('./pages/SupportTicketsPageRevamp'))
const MediaLibraryPage = lazy(() => import('./pages/MediaLibraryPage'))
const ReturnsPage = lazy(() => import('./pages/ReturnsPageRevamp'))
const ReturnDetailPage = lazy(() => import('./pages/ReturnDetailPage'))
const WarrantiesPage = lazy(() => import('./pages/WarrantiesPageRevamp'))
const SerialsPage = lazy(() => import('./pages/SerialsPageRevamp'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPageRevamp'))
const ReportsPage = lazy(() => import('./pages/ReportsPageRevamp'))
const UsersPage = lazy(() => import('./pages/UsersPageRevamp'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const PublicContentPage = lazy(() => import('./pages/PublicContentPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'))
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage'))
const UnmatchedPaymentsPage = lazy(() => import('./pages/UnmatchedPaymentsPageRevamp'))
const FinancialSettlementsPage = lazy(() => import('./pages/FinancialSettlementsPageRevamp'))
const RecentPaymentsPage = lazy(() => import('./pages/RecentPaymentsPageRevamp'))
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))

const renderLazyElement = (Component: LazyExoticComponent<ComponentType>) => (
  <RouteErrorBoundary>
    <Suspense fallback={<RouteFallback />}>
      <Component />
    </Suspense>
  </RouteErrorBoundary>
)

const AdminShell = () => (
  <AdminDataProvider>
    <ProductsProvider>
      <AppLayout />
    </ProductsProvider>
  </AdminDataProvider>
)

// Data router (createBrowserRouter) thay cho <BrowserRouter>+<Routes> để
// NavigationGuardRoot dùng được useBlocker — guard trung tâm chặn điều hướng
// khi form còn thay đổi chưa lưu (Link/sidebar, navigate(), browser back).
const appRouter = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<NavigationGuardRoot />}>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={renderLazyElement(LoginPage)} />
        <Route path="/forgot-password" element={renderLazyElement(ForgotPasswordPage)} />
      </Route>

      <Route path="/reset-password" element={renderLazyElement(ResetPasswordPage)} />
      <Route path="/reset" element={renderLazyElement(ResetPasswordPage)} />
      <Route path="/verify-email" element={renderLazyElement(VerifyEmailPage)} />

      <Route element={<ProtectedRoute />}>
        <Route path="/change-password" element={renderLazyElement(ChangePasswordPage)} />
        <Route element={<AdminShell />}>
          {/* Personal — any authenticated internal user */}
          <Route path="/profile" element={renderLazyElement(ProfilePage)} />

          {/* Dashboard (index): redirect to first accessible module when dashboard.read is absent */}
          <Route element={<PermissionRoute required="dashboard.read" redirectOnDeny />}>
            <Route index element={renderLazyElement(DashboardPage)} />
          </Route>

          <Route element={<PermissionRoute required="reports.read" />}>
            <Route path="/reports" element={renderLazyElement(ReportsPage)} />
          </Route>

          <Route element={<PermissionRoute required="products.write" />}>
            <Route path="/products" element={renderLazyElement(ProductsPage)} />
            <Route path="/products/new" element={renderLazyElement(CreateProductPage)} />
            <Route
              path="/products/:sku"
              element={renderLazyElement(ProductDetailPage)}
            />
          </Route>

          <Route element={<PermissionRoute required="orders.read" />}>
            <Route path="/orders" element={renderLazyElement(OrdersPage)} />
            <Route path="/orders/:id" element={renderLazyElement(OrderDetailPage)} />
          </Route>

          <Route element={<PermissionRoute required="dealers.read" />}>
            <Route path="/dealers" element={renderLazyElement(DealersPage)} />
            <Route
              path="/dealers/:id"
              element={renderLazyElement(DealerDetailPage)}
            />
          </Route>

          <Route element={<PermissionRoute required="discounts.write" />}>
            <Route
              path="/discounts"
              element={renderLazyElement(WholesaleDiscountsPage)}
            />
          </Route>

          <Route element={<PermissionRoute required="blogs.write" />}>
            <Route path="/blogs" element={renderLazyElement(BlogsPage)} />
            <Route path="/blogs/:id" element={renderLazyElement(BlogDetailPage)} />
          </Route>

          <Route element={<PermissionRoute required="warranties.read" />}>
            <Route
              path="/warranties"
              element={renderLazyElement(WarrantiesPage)}
            />
          </Route>

          <Route element={<PermissionRoute required="serials.read" />}>
            <Route path="/serials" element={renderLazyElement(SerialsPage)} />
          </Route>

          <Route element={<PermissionRoute required="notifications.read" />}>
            <Route
              path="/notifications"
              element={renderLazyElement(NotificationsPage)}
            />
          </Route>

          <Route element={<PermissionRoute required="support.read" />}>
            <Route
              path="/support-tickets"
              element={renderLazyElement(SupportTicketsPage)}
            />
          </Route>

          <Route element={<PermissionRoute required="media.write" />}>
            <Route path="/media" element={renderLazyElement(MediaLibraryPage)} />
          </Route>

          <Route element={<PermissionRoute required="returns.read" />}>
            <Route path="/returns" element={renderLazyElement(ReturnsPage)} />
            <Route path="/returns/:id" element={renderLazyElement(ReturnDetailPage)} />
          </Route>

          <Route element={<PermissionRoute required="orders.payment.confirm" />}>
            <Route
              path="/unmatched-payments"
              element={renderLazyElement(UnmatchedPaymentsPage)}
            />
            <Route
              path="/payments/recent"
              element={renderLazyElement(RecentPaymentsPage)}
            />
            <Route
              path="/financial-settlements"
              element={renderLazyElement(FinancialSettlementsPage)}
            />
          </Route>

          <Route element={<SuperAdminRoute />}>
            <Route path="/users" element={renderLazyElement(UsersPage)} />
            <Route path="/audit-logs" element={renderLazyElement(AuditLogsPage)} />
            <Route path="/settings" element={renderLazyElement(SettingsPage)} />
            <Route path="/settings/content" element={renderLazyElement(PublicContentPage)} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>,
  ),
  { future: { v7_relativeSplatPath: true } },
)

export default appRouter
