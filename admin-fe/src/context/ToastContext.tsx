/* eslint-disable react-refresh/only-export-components */
import { CheckCircle2, Info, OctagonAlert, X } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type ToastVariant = 'success' | 'error' | 'info'

type ToastItem = {
  id: number
  message: string
  title?: string
  variant: ToastVariant
}

type ToastContextValue = {
  notify: (
    message: string,
    options?: { title?: string; variant?: ToastVariant; durationMs?: number },
  ) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const iconByVariant = {
  success: CheckCircle2,
  error: OctagonAlert,
  info: Info,
} as const

const cardByVariant = {
  success: 'border-emerald-200 bg-emerald-50/95 text-emerald-900',
  error: 'border-rose-200 bg-rose-50/95 text-rose-900',
  info: 'border-blue-200 bg-blue-50/95 text-blue-900',
} as const

let toastSeed = 0

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const notify = useCallback<ToastContextValue['notify']>((message, options) => {
    const nextId = ++toastSeed
    const item: ToastItem = {
      id: nextId,
      message,
      title: options?.title,
      variant: options?.variant ?? 'success',
    }
    setToasts((prev) => [...prev, item])

    const duration = options?.durationMs ?? 2800
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== nextId))
    }, duration)
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const value = useMemo<ToastContextValue>(() => ({ notify }), [notify])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed right-4 top-4 z-[120] flex w-[min(92vw,360px)] flex-col gap-2"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => {
          const Icon = iconByVariant[toast.variant]
          return (
            <div
              className={`pointer-events-auto rounded-2xl border p-3 shadow-[0_16px_32px_rgba(15,23,42,0.18)] backdrop-blur ${cardByVariant[toast.variant]}`}
              key={toast.id}
              role="status"
            >
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  {toast.title ? (
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                      {toast.title}
                    </p>
                  ) : null}
                  <p className="text-sm font-medium">{toast.message}</p>
                </div>
                <button
                  aria-label="Dismiss"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/60 text-slate-600 transition hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                  onClick={() => dismiss(toast.id)}
                  type="button"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
