import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import Modal from 'react-modal'
import './index.css'
import App from './App.tsx'
import { AdminDataProvider } from './context/AdminDataContext'
import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import { ToastProvider } from './context/ToastContext'

const getInitialTheme = () => {
  try {
    const stored = window.localStorage.getItem('theme')
    if (stored === 'dark' || stored === 'light') {
      return stored
    }
  } catch {
    // ignore storage errors
  }

  return window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

document.documentElement.classList.toggle('dark', getInitialTheme() === 'dark')

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

if (typeof window !== 'undefined') {
  Modal.setAppElement('#root')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <LanguageProvider>
          <ToastProvider>
            <AuthProvider>
              <AdminDataProvider>
                <App />
              </AdminDataProvider>
            </AuthProvider>
          </ToastProvider>
        </LanguageProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
