import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './layout/AppLayout'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import OrdersPage from './pages/OrdersPage'
import ProductsPage from './pages/ProductsPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import SupportPage from './pages/SupportPage'
import { LanguageProvider } from './context/LanguageContext'
import { ShopProvider } from './store/shopContext'

function App() {
  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initial =
      stored === 'light' || stored === 'dark'
        ? stored
        : prefersDark
          ? 'dark'
          : 'light'

    document.documentElement.classList.toggle('dark', initial === 'dark')
  }, [])

  return (
    <BrowserRouter>
      <LanguageProvider>
        <ShopProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="support" element={<SupportPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </ShopProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}

export default App
