import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
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

if (typeof window !== 'undefined') {
  Modal.setAppElement('#root')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <AdminDataProvider>
            <BrowserRouter
              future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
            >
              <App />
            </BrowserRouter>
          </AdminDataProvider>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  </StrictMode>,
)
