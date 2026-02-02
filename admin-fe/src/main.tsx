import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
