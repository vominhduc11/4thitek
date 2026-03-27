import { Bell, Gauge, Mail, Save, Shield, Wallet, type LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ErrorState,
  FieldErrorMessage,
  GhostButton,
  LoadingRows,
  PageHeader,
  PagePanel,
  PrimaryButton,
  bodyTextClass,
  fieldHintClass,
  formCardClass,
  inputClass,
  labelClass,
  softCardClass,
} from '../components/ui-kit'
import { useAdminData } from '../context/AdminDataContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'

type RateLimitBucketKey = 'auth' | 'passwordReset' | 'warrantyLookup' | 'upload' | 'webhook'

type ValidationKey =
  | 'sessionTimeoutMinutes'
  | 'emailFrom'
  | 'emailFromName'
  | 'sepayAccountNumber'
  | `${RateLimitBucketKey}-requests`
  | `${RateLimitBucketKey}-windowSeconds`

type ValidationMap = Partial<Record<ValidationKey, string>>

const SESSION_TIMEOUT_RANGE = { min: 5, max: 480 }
const RATE_LIMIT_REQUEST_RANGE = { min: 1, max: 10_000 }
const RATE_LIMIT_WINDOW_RANGE = { min: 1, max: 86_400 }

const rateLimitBuckets: RateLimitBucketKey[] = [
  'auth',
  'passwordReset',
  'warrantyLookup',
  'upload',
  'webhook',
]

const copyByLanguage = {
  vi: {
    title: 'Cài đặt hệ thống',
    description:
      'Quản lý bảo mật đăng nhập, thông báo vận hành, cấu hình SePay, email gửi đi và giới hạn tốc độ theo tác vụ.',
    save: 'Lưu thay đổi',
    saving: 'Đang lưu...',
    reset: 'Hoàn tác thay đổi',
    dirtyNotice: 'Bạn có thay đổi chưa lưu trong cài đặt hệ thống.',
    invalidNotice: 'Một số giá trị chưa hợp lệ. Hãy kiểm tra lại các trường được đánh dấu trước khi lưu.',
    loadTitle: 'Không thể tải cài đặt',
    loadFallback: 'Không tải được cài đặt hệ thống.',
    saveSuccess: 'Đã lưu cài đặt hệ thống.',
    saveFailed: 'Không lưu được cài đặt hệ thống.',
    security: 'Bảo mật',
    securityDescription: 'Thiết lập xác thực và thời lượng phiên đăng nhập cho tài khoản quản trị.',
    notifications: 'Thông báo',
    notificationsDescription: 'Chọn các tín hiệu vận hành cần gửi cho đội ngũ nội bộ.',
    sepay: 'SePay',
    sepayDescription: 'Quản lý thông tin nhận thanh toán và webhook dùng cho đối soát giao dịch.',
    email: 'Email',
    emailDescription: 'Thiết lập địa chỉ người gửi dùng cho email hệ thống.',
    rateLimit: 'Rate limit',
    rateLimitDescription:
      'Các giới hạn này áp dụng ngay sau khi lưu. Chỉ điều chỉnh khi bạn đã có nhu cầu vận hành rõ ràng.',
    emailConfirmation: 'Xác nhận email',
    emailConfirmationHelp: 'Yêu cầu quản trị viên xác nhận email trước khi hoàn tất đăng nhập.',
    sessionTimeout: 'Hết phiên đăng nhập',
    sessionTimeoutHelp:
      'Tự động đăng xuất sau {n} phút không hoạt động. Khuyến nghị từ 15 đến 120 phút.',
    sessionTimeoutPlaceholder: 'Nhập số phút',
    sessionTimeoutError:
      'Thời lượng phiên phải là số nguyên trong khoảng từ 5 đến 480 phút.',
    orderAlerts: 'Cảnh báo đơn hàng',
    orderAlertsHelp: 'Thông báo khi có đơn mới hoặc đơn cần xử lý thêm.',
    inventoryAlerts: 'Cảnh báo tồn kho',
    inventoryAlertsHelp: 'Thông báo khi SKU giảm xuống ngưỡng tồn kho thấp.',
    enabled: 'Bật',
    webhookToken: 'Webhook token',
    webhookTokenHint:
      'Chỉ lưu token webhook đang được SePay cấp cho môi trường vận hành hiện tại.',
    bankName: 'Tên ngân hàng',
    bankNameHint: 'Hiển thị cho thao tác đối soát và kiểm tra thông tin nhận tiền.',
    accountNumber: 'Số tài khoản',
    accountNumberHint: 'Chỉ nhập chữ số. Không dùng khoảng trắng hoặc ký tự đặc biệt.',
    accountNumberError: 'Số tài khoản chỉ được chứa chữ số.',
    accountHolder: 'Chủ tài khoản',
    accountHolderHint: 'Nên khớp với tên pháp lý dùng cho nhận chuyển khoản.',
    fromEmail: 'Email gửi đi',
    fromEmailHint:
      'Địa chỉ này sẽ xuất hiện ở trường người gửi. Dùng email đã được hạ tầng mail xác thực.',
    fromEmailRequired: 'Cần nhập email gửi đi khi bật email hệ thống.',
    fromEmailInvalid: 'Email gửi đi không đúng định dạng.',
    fromName: 'Tên người gửi',
    fromNameHint: 'Tên hiển thị trong hộp thư người nhận.',
    fromNameRequired: 'Cần nhập tên người gửi khi bật email hệ thống.',
    auth: 'Đăng nhập',
    authHint: 'Giới hạn số lần thử đăng nhập để giảm rủi ro dò mật khẩu.',
    passwordReset: 'Quên mật khẩu',
    passwordResetHint: 'Ngăn việc yêu cầu đặt lại mật khẩu quá dày trong thời gian ngắn.',
    warrantyLookup: 'Tra cứu bảo hành',
    warrantyLookupHint: 'Giữ ổn định cho điểm tra cứu công khai và nội bộ.',
    upload: 'Tải tệp',
    uploadHint: 'Áp dụng cho upload ảnh hoặc chứng từ qua giao diện quản trị.',
    webhook: 'Webhook',
    webhookHint: 'Bảo vệ đầu vào webhook trước lưu lượng đột biến.',
    requests: 'Số yêu cầu',
    requestsHint: 'Tổng số yêu cầu được phép trong một cửa sổ thời gian.',
    requestsError:
      'Số yêu cầu phải là số nguyên trong khoảng từ 1 đến 10.000.',
    windowSeconds: 'Cửa sổ thời gian',
    windowSecondsHint: 'Đơn vị giây.',
    windowSecondsError:
      'Cửa sổ thời gian phải là số nguyên trong khoảng từ 1 đến 86.400 giây.',
  },
  en: {
    title: 'System settings',
    description:
      'Manage sign-in security, operational notifications, SePay configuration, outbound email, and task-level rate limits.',
    save: 'Save changes',
    saving: 'Saving...',
    reset: 'Discard changes',
    dirtyNotice: 'You have unsaved changes in system settings.',
    invalidNotice: 'Some values are invalid. Review the highlighted fields before saving.',
    loadTitle: 'Unable to load settings',
    loadFallback: 'Could not load system settings.',
    saveSuccess: 'System settings saved.',
    saveFailed: 'Could not save system settings.',
    security: 'Security',
    securityDescription: 'Set sign-in verification and session duration for admin accounts.',
    notifications: 'Notifications',
    notificationsDescription: 'Choose which operational signals should notify the internal team.',
    sepay: 'SePay',
    sepayDescription: 'Manage receiving-account details and webhook configuration for payment reconciliation.',
    email: 'Email',
    emailDescription: 'Configure the sender identity used by system emails.',
    rateLimit: 'Rate limits',
    rateLimitDescription:
      'These limits take effect immediately after saving. Change them only when there is a clear operational need.',
    emailConfirmation: 'Email confirmation',
    emailConfirmationHelp: 'Require admins to confirm email before sign-in completes.',
    sessionTimeout: 'Session timeout',
    sessionTimeoutHelp:
      'Automatically sign out after {n} minutes of inactivity. Recommended range: 15 to 120 minutes.',
    sessionTimeoutPlaceholder: 'Enter minutes',
    sessionTimeoutError:
      'Session timeout must be an integer between 5 and 480 minutes.',
    orderAlerts: 'Order alerts',
    orderAlertsHelp: 'Notify the team about new orders or orders that need attention.',
    inventoryAlerts: 'Inventory alerts',
    inventoryAlertsHelp: 'Notify when a SKU drops into the low-stock threshold.',
    enabled: 'Enabled',
    webhookToken: 'Webhook token',
    webhookTokenHint:
      'Store only the webhook token currently issued by SePay for this environment.',
    bankName: 'Bank name',
    bankNameHint: 'Used for reconciliation and payment destination checks.',
    accountNumber: 'Account number',
    accountNumberHint: 'Digits only. Avoid spaces or special characters.',
    accountNumberError: 'Account number can contain digits only.',
    accountHolder: 'Account holder',
    accountHolderHint: 'This should match the legal receiving-account name.',
    fromEmail: 'From email',
    fromEmailHint:
      'This address appears as the sender. Use an email that has been verified by your mail infrastructure.',
    fromEmailRequired: 'A sender email is required when system email is enabled.',
    fromEmailInvalid: 'Sender email is not in a valid format.',
    fromName: 'From name',
    fromNameHint: 'This name is shown in the recipient inbox.',
    fromNameRequired: 'A sender name is required when system email is enabled.',
    auth: 'Sign-in',
    authHint: 'Limit sign-in attempts to reduce password guessing risk.',
    passwordReset: 'Password reset',
    passwordResetHint: 'Prevent too many reset requests in a short period.',
    warrantyLookup: 'Warranty lookup',
    warrantyLookupHint: 'Keep the lookup surface stable for public and internal use.',
    upload: 'Uploads',
    uploadHint: 'Applies to image and proof uploads in the admin interface.',
    webhook: 'Webhook',
    webhookHint: 'Protect webhook entry points from burst traffic.',
    requests: 'Requests',
    requestsHint: 'Total allowed requests inside one time window.',
    requestsError: 'Requests must be an integer between 1 and 10,000.',
    windowSeconds: 'Time window',
    windowSecondsHint: 'Measured in seconds.',
    windowSecondsError:
      'Time window must be an integer between 1 and 86,400 seconds.',
  },
} as const

const clampInteger = (value: number, min: number, max: number) => {
  if (!Number.isFinite(value)) return min
  return Math.min(Math.max(Math.round(value), min), max)
}

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const getValidationErrors = (
  copy: (typeof copyByLanguage)[keyof typeof copyByLanguage],
  draft: ReturnType<typeof useAdminData>['settings'],
) => {
  const nextErrors: ValidationMap = {}

  if (
    !Number.isInteger(draft.sessionTimeoutMinutes) ||
    draft.sessionTimeoutMinutes < SESSION_TIMEOUT_RANGE.min ||
    draft.sessionTimeoutMinutes > SESSION_TIMEOUT_RANGE.max
  ) {
    nextErrors.sessionTimeoutMinutes = copy.sessionTimeoutError
  }

  if (draft.emailSettings.enabled || draft.emailSettings.from.trim()) {
    if (!draft.emailSettings.from.trim()) {
      nextErrors.emailFrom = copy.fromEmailRequired
    } else if (!isValidEmail(draft.emailSettings.from.trim())) {
      nextErrors.emailFrom = copy.fromEmailInvalid
    }
  }

  if (draft.emailSettings.enabled && !draft.emailSettings.fromName.trim()) {
    nextErrors.emailFromName = copy.fromNameRequired
  }

  if (draft.sepay.accountNumber.trim() && !/^\d+$/.test(draft.sepay.accountNumber.trim())) {
    nextErrors.sepayAccountNumber = copy.accountNumberError
  }

  rateLimitBuckets.forEach((bucket) => {
    const bucketSettings = draft.rateLimitOverrides[bucket]

    if (
      !Number.isInteger(bucketSettings.requests) ||
      bucketSettings.requests < RATE_LIMIT_REQUEST_RANGE.min ||
      bucketSettings.requests > RATE_LIMIT_REQUEST_RANGE.max
    ) {
      nextErrors[`${bucket}-requests`] = copy.requestsError
    }

    if (
      !Number.isInteger(bucketSettings.windowSeconds) ||
      bucketSettings.windowSeconds < RATE_LIMIT_WINDOW_RANGE.min ||
      bucketSettings.windowSeconds > RATE_LIMIT_WINDOW_RANGE.max
    ) {
      nextErrors[`${bucket}-windowSeconds`] = copy.windowSecondsError
    }
  })

  return nextErrors
}

type SettingsSectionProps = {
  icon: LucideIcon
  title: string
  description: string
  children: ReactNode
}

const SettingsSection = ({
  icon: Icon,
  title,
  description,
  children,
}: SettingsSectionProps) => (
  <section className={`${formCardClass} space-y-4`}>
    <div className="flex items-start gap-3">
      <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <h4 className="text-base font-semibold text-[var(--ink)]">{title}</h4>
        <p className={bodyTextClass}>{description}</p>
      </div>
    </div>
    {children}
  </section>
)

type SettingFieldProps = {
  label: string
  hint?: string
  error?: string
  children: ReactNode
  className?: string
}

const SettingField = ({ label, hint, error, children, className }: SettingFieldProps) => (
  <label className={`block rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 ${className ?? ''}`}>
    <span className={labelClass}>{label}</span>
    <div className="mt-2">{children}</div>
    {hint ? <p className={fieldHintClass}>{hint}</p> : null}
    {error ? <FieldErrorMessage>{error}</FieldErrorMessage> : null}
  </label>
)

type ToggleFieldProps = {
  title: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}

const ToggleField = ({ title, description, checked, onChange }: ToggleFieldProps) => (
  <label className="flex items-start justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
    <div className="min-w-0">
      <p className="text-sm font-semibold text-[var(--ink)]">{title}</p>
      <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
    </div>
    <input
      checked={checked}
      className="mt-1 h-5 w-5 shrink-0 accent-[var(--accent)]"
      onChange={(event) => onChange(event.target.checked)}
      type="checkbox"
    />
  </label>
)

function SettingsPage() {
  const {
    settings,
    settingsState,
    isSettingsLoading,
    isSettingsSaving,
    updateSettings,
    reloadResource,
  } = useAdminData()
  const { language } = useLanguage()
  const { notify } = useToast()
  const copy = copyByLanguage[language]
  const [draft, setDraft] = useState(settings)

  useEffect(() => {
    setDraft(settings)
  }, [settings])

  const validationErrors = useMemo(() => getValidationErrors(copy, draft), [copy, draft])
  const hasValidationErrors = Object.keys(validationErrors).length > 0
  const isDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(settings), [draft, settings])

  const updateBucket = (
    bucket: RateLimitBucketKey,
    field: 'requests' | 'windowSeconds',
    value: number,
  ) => {
    setDraft((previous) => ({
      ...previous,
      rateLimitOverrides: {
        ...previous.rateLimitOverrides,
        [bucket]: {
          ...previous.rateLimitOverrides[bucket],
          [field]: value,
        },
      },
    }))
  }

  const handleSave = async () => {
    if (hasValidationErrors || !isDirty || isSettingsSaving) {
      return
    }

    const normalizedDraft = {
      ...draft,
      sessionTimeoutMinutes: clampInteger(
        draft.sessionTimeoutMinutes,
        SESSION_TIMEOUT_RANGE.min,
        SESSION_TIMEOUT_RANGE.max,
      ),
      sepay: {
        ...draft.sepay,
        webhookToken: draft.sepay.webhookToken.trim(),
        bankName: draft.sepay.bankName.trim(),
        accountNumber: draft.sepay.accountNumber.trim(),
        accountHolder: draft.sepay.accountHolder.trim(),
      },
      emailSettings: {
        ...draft.emailSettings,
        from: draft.emailSettings.from.trim(),
        fromName: draft.emailSettings.fromName.trim(),
      },
    }

    setDraft(normalizedDraft)

    try {
      await updateSettings(normalizedDraft)
      notify(copy.saveSuccess, { title: copy.title, variant: 'success' })
    } catch (error) {
      notify(error instanceof Error ? error.message : copy.saveFailed, {
        title: copy.title,
        variant: 'error',
      })
    }
  }

  if (isSettingsLoading) {
    return (
      <PagePanel>
        <LoadingRows rows={6} />
      </PagePanel>
    )
  }

  if (settingsState.status === 'error') {
    return (
      <PagePanel>
        <ErrorState
          title={copy.loadTitle}
          message={settingsState.error || copy.loadFallback}
          onRetry={() => void reloadResource('settings')}
        />
      </PagePanel>
    )
  }

  return (
    <PagePanel>
      <PageHeader
        title={copy.title}
        description={copy.description}
        actions={
          <>
            <PrimaryButton
              disabled={isSettingsSaving || !isDirty || hasValidationErrors}
              icon={<Save className="h-4 w-4" />}
              onClick={() => void handleSave()}
              type="button"
            >
              {isSettingsSaving ? copy.saving : copy.save}
            </PrimaryButton>
            {isDirty ? (
              <GhostButton onClick={() => setDraft(settings)} type="button">
                {copy.reset}
              </GhostButton>
            ) : null}
          </>
        }
      />

      {hasValidationErrors ? (
        <div
          className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
          role="status"
        >
          {copy.invalidNotice}
        </div>
      ) : null}

      {isDirty ? (
        <div
          className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800"
          role="status"
        >
          {copy.dirtyNotice}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <SettingsSection
          icon={Shield}
          title={copy.security}
          description={copy.securityDescription}
        >
          <ToggleField
            title={copy.emailConfirmation}
            description={copy.emailConfirmationHelp}
            checked={draft.emailConfirmation}
            onChange={(checked) =>
              setDraft((previous) => ({ ...previous, emailConfirmation: checked }))
            }
          />

          <SettingField
            label={copy.sessionTimeout}
            hint={copy.sessionTimeoutHelp.replace('{n}', String(draft.sessionTimeoutMinutes))}
            error={validationErrors.sessionTimeoutMinutes}
          >
            <input
              className={inputClass}
              inputMode="numeric"
              max={SESSION_TIMEOUT_RANGE.max}
              min={SESSION_TIMEOUT_RANGE.min}
              onBlur={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  sessionTimeoutMinutes: clampInteger(
                    Number(event.target.value || previous.sessionTimeoutMinutes),
                    SESSION_TIMEOUT_RANGE.min,
                    SESSION_TIMEOUT_RANGE.max,
                  ),
                }))
              }
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  sessionTimeoutMinutes: Number(event.target.value || 0),
                }))
              }
              placeholder={copy.sessionTimeoutPlaceholder}
              type="number"
              value={draft.sessionTimeoutMinutes}
            />
          </SettingField>
        </SettingsSection>

        <SettingsSection
          icon={Bell}
          title={copy.notifications}
          description={copy.notificationsDescription}
        >
          <ToggleField
            title={copy.orderAlerts}
            description={copy.orderAlertsHelp}
            checked={draft.orderAlerts}
            onChange={(checked) =>
              setDraft((previous) => ({ ...previous, orderAlerts: checked }))
            }
          />
          <ToggleField
            title={copy.inventoryAlerts}
            description={copy.inventoryAlertsHelp}
            checked={draft.inventoryAlerts}
            onChange={(checked) =>
              setDraft((previous) => ({ ...previous, inventoryAlerts: checked }))
            }
          />
        </SettingsSection>

        <SettingsSection
          icon={Wallet}
          title={copy.sepay}
          description={copy.sepayDescription}
        >
          <ToggleField
            title={copy.enabled}
            description={copy.sepayDescription}
            checked={draft.sepay.enabled}
            onChange={(checked) =>
              setDraft((previous) => ({
                ...previous,
                sepay: { ...previous.sepay, enabled: checked },
              }))
            }
          />

          <SettingField label={copy.webhookToken} hint={copy.webhookTokenHint}>
            <input
              autoComplete="off"
              className={inputClass}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  sepay: { ...previous.sepay, webhookToken: event.target.value },
                }))
              }
              value={draft.sepay.webhookToken}
            />
          </SettingField>

          <div className="grid gap-4 md:grid-cols-2">
            <SettingField label={copy.bankName} hint={copy.bankNameHint}>
              <input
                className={inputClass}
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    sepay: { ...previous.sepay, bankName: event.target.value },
                  }))
                }
                value={draft.sepay.bankName}
              />
            </SettingField>

            <SettingField
              label={copy.accountNumber}
              hint={copy.accountNumberHint}
              error={validationErrors.sepayAccountNumber}
            >
              <input
                className={inputClass}
                inputMode="numeric"
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    sepay: { ...previous.sepay, accountNumber: event.target.value },
                  }))
                }
                value={draft.sepay.accountNumber}
              />
            </SettingField>
          </div>

          <SettingField label={copy.accountHolder} hint={copy.accountHolderHint}>
            <input
              className={inputClass}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  sepay: { ...previous.sepay, accountHolder: event.target.value },
                }))
              }
              value={draft.sepay.accountHolder}
            />
          </SettingField>
        </SettingsSection>

        <SettingsSection
          icon={Mail}
          title={copy.email}
          description={copy.emailDescription}
        >
          <ToggleField
            title={copy.enabled}
            description={copy.emailDescription}
            checked={draft.emailSettings.enabled}
            onChange={(checked) =>
              setDraft((previous) => ({
                ...previous,
                emailSettings: { ...previous.emailSettings, enabled: checked },
              }))
            }
          />

          <SettingField
            label={copy.fromEmail}
            hint={copy.fromEmailHint}
            error={validationErrors.emailFrom}
          >
            <input
              autoComplete="email"
              className={inputClass}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  emailSettings: { ...previous.emailSettings, from: event.target.value },
                }))
              }
              type="email"
              value={draft.emailSettings.from}
            />
          </SettingField>

          <SettingField
            label={copy.fromName}
            hint={copy.fromNameHint}
            error={validationErrors.emailFromName}
          >
            <input
              className={inputClass}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  emailSettings: {
                    ...previous.emailSettings,
                    fromName: event.target.value,
                  },
                }))
              }
              value={draft.emailSettings.fromName}
            />
          </SettingField>
        </SettingsSection>
      </div>

      <SettingsSection
        icon={Gauge}
        title={copy.rateLimit}
        description={copy.rateLimitDescription}
      >
        <ToggleField
          title={copy.enabled}
          description={copy.rateLimitDescription}
          checked={draft.rateLimitOverrides.enabled}
          onChange={(checked) =>
            setDraft((previous) => ({
              ...previous,
              rateLimitOverrides: {
                ...previous.rateLimitOverrides,
                enabled: checked,
              },
            }))
          }
        />

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {rateLimitBuckets.map((bucket) => (
            <div key={bucket} className={softCardClass}>
              <p className="text-sm font-semibold text-[var(--ink)]">{copy[bucket]}</p>
              <p className={bodyTextClass}>{copy[`${bucket}Hint`]}</p>

              <div className="mt-4 grid gap-3">
                <SettingField
                  label={copy.requests}
                  hint={copy.requestsHint}
                  error={validationErrors[`${bucket}-requests`]}
                  className="px-0 py-0 border-0 bg-transparent"
                >
                  <input
                    className={inputClass}
                    inputMode="numeric"
                    max={RATE_LIMIT_REQUEST_RANGE.max}
                    min={RATE_LIMIT_REQUEST_RANGE.min}
                    onBlur={(event) =>
                      updateBucket(
                        bucket,
                        'requests',
                        clampInteger(
                          Number(event.target.value || draft.rateLimitOverrides[bucket].requests),
                          RATE_LIMIT_REQUEST_RANGE.min,
                          RATE_LIMIT_REQUEST_RANGE.max,
                        ),
                      )
                    }
                    onChange={(event) =>
                      updateBucket(bucket, 'requests', Number(event.target.value || 0))
                    }
                    type="number"
                    value={draft.rateLimitOverrides[bucket].requests}
                  />
                </SettingField>

                <SettingField
                  label={copy.windowSeconds}
                  hint={copy.windowSecondsHint}
                  error={validationErrors[`${bucket}-windowSeconds`]}
                  className="px-0 py-0 border-0 bg-transparent"
                >
                  <input
                    className={inputClass}
                    inputMode="numeric"
                    max={RATE_LIMIT_WINDOW_RANGE.max}
                    min={RATE_LIMIT_WINDOW_RANGE.min}
                    onBlur={(event) =>
                      updateBucket(
                        bucket,
                        'windowSeconds',
                        clampInteger(
                          Number(
                            event.target.value || draft.rateLimitOverrides[bucket].windowSeconds,
                          ),
                          RATE_LIMIT_WINDOW_RANGE.min,
                          RATE_LIMIT_WINDOW_RANGE.max,
                        ),
                      )
                    }
                    onChange={(event) =>
                      updateBucket(bucket, 'windowSeconds', Number(event.target.value || 0))
                    }
                    type="number"
                    value={draft.rateLimitOverrides[bucket].windowSeconds}
                  />
                </SettingField>
              </div>
            </div>
          ))}
        </div>
      </SettingsSection>
    </PagePanel>
  )
}

export default SettingsPage
