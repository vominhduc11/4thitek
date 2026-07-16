import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export type PermissionGateDisabledProps =
  | { disabled: true; 'aria-disabled': true; title: string }
  | Record<string, never>

/**
 * Gate một action theo permission code (PERMISSION_MATRIX §3). Khi thiếu quyền,
 * spread `disabledProps` vào button để DISABLE kèm tooltip — không ẩn, để user
 * hiểu vì sao thao tác không khả dụng thay vì nhận 403 bất ngờ.
 */
export function usePermissionGate(code: string): {
  allowed: boolean
  disabledProps: PermissionGateDisabledProps
} {
  const { hasPermission } = useAuth()
  const { t } = useLanguage()
  const allowed = hasPermission(code)
  const disabledProps: PermissionGateDisabledProps = allowed
    ? {}
    : {
        disabled: true,
        'aria-disabled': true,
        title: t('Bạn không có quyền thực hiện thao tác này'),
      }
  return { allowed, disabledProps }
}
