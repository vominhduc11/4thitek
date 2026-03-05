import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import RouteFallback from './components/RouteFallback'
import { ProtectedRoute, PublicOnlyRoute } from './components/auth/RouteGuards'
import { ProductsProvider } from './context/ProductsContext'
import AppLayout from './layouts/AppLayout'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ProductsPage = lazy(() => import('./pages/ProductsPage'))
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'))
const OrdersPage = lazy(() => import('./pages/OrdersPage'))
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'))
const BlogsPage = lazy(() => import('./pages/BlogsPage'))
const BlogDetailPage = lazy(() => import('./pages/BlogDetailPage'))
const WholesaleDiscountsPage = lazy(() => import('./pages/WholesaleDiscountsPage'))
const CustomersPage = lazy(() => import('./pages/CustomersPage'))
const CustomerDetailPage = lazy(() => import('./pages/CustomerDetailPage'))
const UsersPage = lazy(() => import('./pages/UsersPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))

const renderLazyElement = (Component: LazyExoticComponent<ComponentType>) => (
  <Suspense fallback={<RouteFallback />}>
    <Component />
  </Suspense>
)

function App() {
  return (
    <ProductsProvider>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={renderLazyElement(LoginPage)} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={renderLazyElement(DashboardPage)} />
            <Route path="/products" element={renderLazyElement(ProductsPage)} />
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
            <Route path="/customers" element={renderLazyElement(CustomersPage)} />
            <Route
              path="/customers/:id"
              element={renderLazyElement(CustomerDetailPage)}
            />
            <Route path="/users" element={renderLazyElement(UsersPage)} />
            <Route path="/settings" element={renderLazyElement(SettingsPage)} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ProductsProvider>
  )
}

export default App
