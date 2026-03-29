import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import RouteErrorBoundary from './components/RouteErrorBoundary'
import RouteFallback from './components/RouteFallback'
import { ProtectedRoute, PublicOnlyRoute, SuperAdminRoute } from './components/auth/RouteGuards'
import { AdminDataProvider } from './context/AdminDataContext'
import { ProductsProvider } from './context/ProductsContext'
import AppLayout from './layouts/AppLayout'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ProductsPage = lazy(() => import('./pages/ProductsPage'))
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'))
const CreateProductPage = lazy(() => import('./pages/CreateProductPage'))
const OrdersPage = lazy(() => import('./pages/OrdersPage'))
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'))
const BlogsPage = lazy(() => import('./pages/BlogsPage'))
const BlogDetailPage = lazy(() => import('./pages/BlogDetailPage'))
const WholesaleDiscountsPage = lazy(() => import('./pages/WholesaleDiscountsPage'))
const DealersPage = lazy(() => import('./pages/DealersPage'))
const DealerDetailPage = lazy(() => import('./pages/DealerDetailPage'))
const SupportTicketsPage = lazy(() => import('./pages/SupportTicketsPage'))
const WarrantiesPage = lazy(() => import('./pages/WarrantiesPage'))
const SerialsPage = lazy(() => import('./pages/SerialsPage'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))
const ReportsPage = lazy(() => import('./pages/ReportsPage'))
const UsersPage = lazy(() => import('./pages/UsersPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage'))
const UnmatchedPaymentsPage = lazy(() => import('./pages/UnmatchedPaymentsPage'))
const FinancialSettlementsPage = lazy(() => import('./pages/FinancialSettlementsPage'))
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage'))

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

function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={renderLazyElement(LoginPage)} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/change-password" element={renderLazyElement(ChangePasswordPage)} />
        <Route element={<AdminShell />}>
          <Route index element={renderLazyElement(DashboardPage)} />
          <Route path="/products" element={renderLazyElement(ProductsPage)} />
          <Route path="/products/new" element={renderLazyElement(CreateProductPage)} />
          <Route
            path="/products/:sku"
            element={renderLazyElement(ProductDetailPage)}
          />
          <Route path="/orders" element={renderLazyElement(OrdersPage)} />
          <Route path="/orders/:id" element={renderLazyElement(OrderDetailPage)} />
          <Route path="/blogs" element={renderLazyElement(BlogsPage)} />
          <Route path="/blogs/:id" element={renderLazyElement(BlogDetailPage)} />
          <Route
            path="/discounts"
            element={renderLazyElement(WholesaleDiscountsPage)}
          />
          <Route path="/dealers" element={renderLazyElement(DealersPage)} />
          <Route
            path="/dealers/:id"
            element={renderLazyElement(DealerDetailPage)}
          />
          <Route
            path="/support-tickets"
            element={renderLazyElement(SupportTicketsPage)}
          />
          <Route
            path="/warranties"
            element={renderLazyElement(WarrantiesPage)}
          />
          <Route path="/serials" element={renderLazyElement(SerialsPage)} />
          <Route
            path="/notifications"
            element={renderLazyElement(NotificationsPage)}
          />
          <Route path="/reports" element={renderLazyElement(ReportsPage)} />
          <Route
            path="/unmatched-payments"
            element={renderLazyElement(UnmatchedPaymentsPage)}
          />
          <Route
            path="/financial-settlements"
            element={renderLazyElement(FinancialSettlementsPage)}
          />
          <Route element={<SuperAdminRoute />}>
            <Route path="/users" element={renderLazyElement(UsersPage)} />
            <Route path="/audit-logs" element={renderLazyElement(AuditLogsPage)} />
            <Route path="/settings" element={renderLazyElement(SettingsPage)} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
