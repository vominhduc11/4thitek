import { ArrowLeft, Phone, UserCircle } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAdminData, type DealerStatus } from '../context/AdminDataContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import {
  dealerStatusDescription,
  dealerStatusLabel,
  dealerStatusTone,
  resolveAllowedDealerStatuses,
} from '../lib/adminLabels'
import { formatCurrency, formatDateTime } from '../lib/formatters'
import {
  EmptyState,
  ErrorState,
  GhostButton,
  LoadingRows,
  PagePanel,
  StatusBadge,
  inputClass,
} from '../components/ui-kit'
import { useConfirmDialog } from '../hooks/useConfirmDialog'

function DealerDetailPage() {
  const { id = '' } = useParams()
  const dealerId = decodeURIComponent(id)
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { notify } = useToast()
  const { dealers, dealersState, updateDealerStatus, reloadResource } = useAdminData()
  const { confirm, prompt, confirmDialog, promptDialog } = useConfirmDialog()
  const dealer = dealers.find((item) => item.id === dealerId)

  if (dealersState.status === 'loading' || dealersState.status === 'idle') {
    return (
      <PagePanel>
        <LoadingRows rows={4} />
      </PagePanel>
    )
  }

  if (dealersState.status === 'error') {
    return (
      <PagePanel>
        <ErrorState
          title={t('KhĂ´ng thá»ƒ táº£i Ä‘áº¡i lĂ½')}
          message={dealersState.error || t('KhĂ´ng táº£i Ä‘Æ°á»£c Ä‘áº¡i lĂ½')}
          onRetry={() => void reloadResource('dealers')}
        />
      </PagePanel>
    )
  }

  if (!dealer) {
    return (
      <PagePanel>
        <EmptyState
          title={t('KhĂ´ng tĂ¬m tháº¥y Ä‘áº¡i lĂ½')}
          message={t('Äáº¡i lĂ½ {id} khĂ´ng tá»“n táº¡i.', { id: dealerId })}
        />
      </PagePanel>
    )
  }

  return (
    <PagePanel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <GhostButton
          icon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate('/dealers')}
          type="button"
        >
          {t('Vá» Ä‘áº¡i lĂ½')}
        </GhostButton>
        <StatusBadge tone={dealerStatusTone[dealer.status]}>{t(dealerStatusLabel[dealer.status])}</StatusBadge>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.95fr)] xl:grid-cols-[1.3fr_1fr]">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-ghost)] p-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
              <UserCircle className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{dealer.id}</p>
              <h3 className="text-xl font-semibold text-[var(--ink)]">{dealer.businessName}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{dealer.contactName}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Email</p>
              <p className="mt-1 font-semibold text-[var(--ink)]">{dealer.email || 'â€”'}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Phone</p>
              <p className="mt-1 font-semibold text-[var(--ink)]">{dealer.phone || 'â€”'}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{t('ÄÆ¡n hĂ ng')}</p>
              <p className="mt-1 font-semibold text-[var(--ink)]">{dealer.orders}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{t('Doanh thu')}</p>
              <p className="mt-1 font-semibold text-[var(--accent)]">{formatCurrency(dealer.revenue)}</p>
            </div>
          </div>

          <p className="mt-3 text-xs text-[var(--muted)]">
            {t('Láº§n mua gáº§n nháº¥t')}: {formatDateTime(dealer.lastOrderAt)}
          </p>
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-ghost)] p-5">
          <p className="text-sm font-semibold text-[var(--ink)]">{t('Cáº­p nháº­t tráº¡ng thĂ¡i há»“ sÆ¡')}</p>
          <select
            aria-label={t('Tráº¡ng thĂ¡i Ä‘áº¡i lĂ½ {id}', { id: dealer.id })}
            className={`${inputClass} mt-3 w-full`}
            onChange={async (event) => {
              const next = event.target.value as DealerStatus
              if (next === dealer.status) {
                return
              }

              let reason: string | undefined
              if (next === 'suspended') {
                const input = await prompt({
                  title: t('XĂ¡c nháº­n Ä‘á»•i tráº¡ng thĂ¡i'),
                  message: t('Chuyá»ƒn Ä‘áº¡i lĂ½ nĂ y sang tráº¡ng thĂ¡i "{status}"?', {
                    status: t(dealerStatusLabel[next]),
                  }),
                  tone: 'danger',
                  confirmLabel: t(dealerStatusLabel[next]),
                  inputLabel: t('LĂ½ do táº¡m khĂ³a'),
                  inputPlaceholder: t('Nháº­p lĂ½ do táº¡m khĂ³a Ä‘áº¡i lĂ½...'),
                })
                if (input === null) {
                  event.currentTarget.value = dealer.status
                  return
                }
                reason = input
              } else {
                const approved = await confirm({
                  title: t('XĂ¡c nháº­n Ä‘á»•i tráº¡ng thĂ¡i'),
                  message: t('Chuyá»ƒn Ä‘áº¡i lĂ½ nĂ y sang tráº¡ng thĂ¡i "{status}"?', {
                    status: t(dealerStatusLabel[next]),
                  }),
                  tone: 'info',
                  confirmLabel: t(dealerStatusLabel[next]),
                })
                if (!approved) {
                  event.currentTarget.value = dealer.status
                  return
                }
              }

              try {
                await updateDealerStatus(dealer.id, next, reason)
                notify(t('Cáº­p nháº­t {id} -> {status}', { id: dealer.id, status: t(dealerStatusLabel[next]) }), {
                  title: t('Äáº¡i lĂ½'),
                  variant: 'info',
                })
              } catch (error) {
                notify(
                  error instanceof Error ? error.message : t('KhĂ´ng cáº­p nháº­t Ä‘Æ°á»£c tráº¡ng thĂ¡i Ä‘áº¡i lĂ½'),
                  {
                    title: t('Äáº¡i lĂ½'),
                    variant: 'error',
                  },
                )
              }
            }}
            value={dealer.status}
          >
            {resolveAllowedDealerStatuses(
              dealer.status,
              dealer.allowedTransitions,
            ).map((status) => (
              <option key={status} value={status}>
                {t(dealerStatusLabel[status])}
              </option>
            ))}
          </select>
          <p className="mt-3 text-xs text-[var(--muted)]">{t(dealerStatusDescription[dealer.status])}</p>

          <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm text-[var(--ink)]">
            <div className="flex items-center gap-2 font-semibold text-[var(--ink)]">
              <Phone className="h-4 w-4" />
              {t('LiĂªn há»‡ nhanh')}
            </div>
            <p className="mt-2 text-xs text-[var(--muted)]">Email: {dealer.email || 'â€”'}</p>
            <p className="text-xs text-[var(--muted)]">{t('Hotline')}: {dealer.phone || 'â€”'}</p>
          </div>
        </div>
      </div>
      {confirmDialog}
      {promptDialog}
    </PagePanel>
  )
}

export default DealerDetailPage
