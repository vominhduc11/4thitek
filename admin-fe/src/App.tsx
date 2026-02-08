import { Navigate, Route, Routes } from 'react-router-dom'
import { ProductsProvider } from './context/ProductsContext'
import AppLayout from './layouts/AppLayout'
import DashboardPage from './pages/DashboardPage'
import CustomersPage from './pages/CustomersPage'
import BlogsPage from './pages/BlogsPage'
import LoginPage from './pages/LoginPage'
import OrdersPage from './pages/OrdersPage'
import ProductDetailPage from './pages/ProductDetailPage'
import ProductsPage from './pages/ProductsPage'
import SettingsPage from './pages/SettingsPage'
import UsersPage from './pages/UsersPage'
import WholesaleDiscountsPage from './pages/WholesaleDiscountsPage'

function App() {
  return (
    <ProductsProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:sku" element={<ProductDetailPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/blogs" element={<BlogsPage />} />
          <Route path="/discounts" element={<WholesaleDiscountsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ProductsProvider>
  )
}

export default App
