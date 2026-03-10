import { useCallback, useEffect, useMemo, useState } from 'react'
import Modal from 'react-modal'
import { GhostButton, PrimaryButton, panelClass, type BadgeTone } from '../components/ui-kit'

type ConfirmTone = Extract<BadgeTone, 'warning' | 'danger' | 'info'>

type ConfirmOptions = {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: ConfirmTone
}

type PendingConfirm = ConfirmOptions & {
  resolve: (value: boolean) => void
}

const toneClasses: Record<ConfirmTone, string> = {
  warning: 'bg-amber-500/15 text-amber-700',
  danger: 'bg-rose-500/15 text-rose-700',
  info: 'bg-[var(--accent-cool-soft)] text-[var(--accent-cool)]',
}

const modalStyles = {
  overlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    backdropFilter: 'blur(8px)',
    display: 'grid',
    placeItems: 'center',
    padding: '1rem',
    zIndex: 60,
  },
  content: {
    position: 'relative',
    inset: 'unset',
    border: 'none',
    background: 'transparent',
    padding: 0,
    overflow: 'visible',
    maxWidth: '32rem',
    width: '100%',
  },
} as const

export const useConfirmDialog = () => {
  const [pending, setPending] = useState<PendingConfirm | null>(null)

  useEffect(() => {
    return () => {
      pending?.resolve(false)
    }
  }, [pending])

  const close = useCallback((value: boolean) => {
    setPending((current) => {
      current?.resolve(value)
      return null
    })
  }, [])

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({
        confirmLabel: 'Xác nhận',
        cancelLabel: 'Hủy',
        tone: 'info',
        ...options,
        resolve,
      })
    })
  }, [])

  const dialog = useMemo(
    () => (
      <Modal
        isOpen={Boolean(pending)}
        onRequestClose={() => close(false)}
        style={modalStyles}
        contentLabel={pending?.title ?? 'Confirm action'}
      >
        {pending ? (
          <div className={`${panelClass} w-full space-y-5 p-5 sm:p-6`}>
            <div className="space-y-3">
              <span
                className={[
                  'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]',
                  toneClasses[pending.tone ?? 'info'],
                ].join(' ')}
              >
                {pending.confirmLabel}
              </span>
              <div>
                <h3 className="text-lg font-semibold text-[var(--ink)]">{pending.title}</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">{pending.message}</p>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <GhostButton className="w-full sm:w-auto" onClick={() => close(false)} type="button">
                {pending.cancelLabel}
              </GhostButton>
              <PrimaryButton
                className={[
                  'w-full sm:w-auto',
                  pending.tone === 'danger'
                    ? 'bg-rose-600 shadow-[0_16px_30px_rgba(225,29,72,0.28)] hover:bg-rose-700'
                    : '',
                ].join(' ')}
                onClick={() => close(true)}
                type="button"
              >
                {pending.confirmLabel}
              </PrimaryButton>
            </div>
          </div>
        ) : null}
      </Modal>
    ),
    [close, pending],
  )

  return { confirm, confirmDialog: dialog }
}
