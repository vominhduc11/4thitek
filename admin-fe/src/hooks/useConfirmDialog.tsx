import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

type PromptOptions = ConfirmOptions & {
  inputLabel: string
  inputPlaceholder?: string
  required?: boolean
}

type PendingConfirm = ConfirmOptions & {
  resolve: (value: boolean) => void
}

type PendingPrompt = PromptOptions & {
  resolve: (value: string | null) => void
}

const toneClasses: Record<ConfirmTone, string> = {
  warning: 'bg-[var(--tone-warning-bg)] text-[var(--tone-warning-text)]',
  danger: 'bg-[var(--tone-danger-bg)] text-[var(--tone-danger-text)]',
  info: 'bg-[var(--accent-cool-soft)] text-[var(--accent-cool)]',
}

const modalStyles = {
  overlay: {
    backgroundColor: 'rgba(1, 8, 15, 0.62)',
    backdropFilter: 'blur(14px)',
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
  const [pendingPrompt, setPendingPrompt] = useState<PendingPrompt | null>(null)
  const [promptValue, setPromptValue] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    return () => {
      pending?.resolve(false)
      pendingPrompt?.resolve(null)
    }
  }, [pending, pendingPrompt])

  const close = useCallback((value: boolean) => {
    setPending((current) => {
      current?.resolve(value)
      return null
    })
  }, [])

  const closePrompt = useCallback((confirmed: boolean) => {
    setPendingPrompt((current) => {
      if (!current) return null
      if (!confirmed) {
        current.resolve(null)
      } else {
        current.resolve(promptValue)
      }
      return null
    })
    setPromptValue('')
  }, [promptValue])

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

  const prompt = useCallback((options: PromptOptions) => {
    setPromptValue('')
    return new Promise<string | null>((resolve) => {
      setPendingPrompt({
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
          <div className={`${panelClass} w-full space-y-5 overflow-hidden p-5 sm:p-6`}>
            <div className="space-y-3">
              <span
                className={[
                  'inline-flex items-center rounded-full border border-[var(--brand-border)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]',
                  toneClasses[pending.tone ?? 'info'],
                ].join(' ')}
              >
                {pending.confirmLabel}
              </span>
              <div>
                <h3 className="text-base font-semibold tracking-[-0.01em] text-[var(--ink)]">{pending.title}</h3>
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
                    ? 'bg-[var(--destructive)] shadow-[0_16px_30px_rgba(225,29,72,0.28)] hover:opacity-90'
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

  const promptDialog = useMemo(
    () => (
      <Modal
        isOpen={Boolean(pendingPrompt)}
        onRequestClose={() => closePrompt(false)}
        style={modalStyles}
        contentLabel={pendingPrompt?.title ?? 'Input required'}
        onAfterOpen={() => inputRef.current?.focus()}
      >
        {pendingPrompt ? (
          <div className={`${panelClass} w-full space-y-5 overflow-hidden p-5 sm:p-6`}>
            <div className="space-y-3">
              <span
                className={[
                  'inline-flex items-center rounded-full border border-[var(--brand-border)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]',
                  toneClasses[pendingPrompt.tone ?? 'info'],
                ].join(' ')}
              >
                {pendingPrompt.confirmLabel}
              </span>
              <div>
                <h3 className="text-base font-semibold tracking-[-0.01em] text-[var(--ink)]">{pendingPrompt.title}</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">{pendingPrompt.message}</p>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                {pendingPrompt.inputLabel}
              </label>
              <textarea
                ref={inputRef}
                className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)]"
                placeholder={pendingPrompt.inputPlaceholder ?? ''}
                rows={3}
                value={promptValue}
                onChange={(e) => setPromptValue(e.target.value)}
              />
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <GhostButton className="w-full sm:w-auto" onClick={() => closePrompt(false)} type="button">
                {pendingPrompt.cancelLabel}
              </GhostButton>
              <PrimaryButton
                className={[
                  'w-full sm:w-auto',
                  pendingPrompt.tone === 'danger'
                    ? 'bg-[var(--destructive)] shadow-[0_16px_30px_rgba(225,29,72,0.28)] hover:opacity-90'
                    : '',
                ].join(' ')}
                disabled={pendingPrompt.required !== false && !promptValue.trim()}
                onClick={() => closePrompt(true)}
                type="button"
              >
                {pendingPrompt.confirmLabel}
              </PrimaryButton>
            </div>
          </div>
        ) : null}
      </Modal>
    ),
    [closePrompt, pendingPrompt, promptValue],
  )

  return { confirm, prompt, confirmDialog: dialog, promptDialog }
}
