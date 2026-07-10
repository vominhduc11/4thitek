import { Lock } from 'lucide-react'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { firstAccessiblePath } from '../../config/navPermissions'
import { EmptyState } from '../ui-kit'
import RouteFallback from '../RouteFallback'

export const ProtectedRoute = () => {
  const { isAuthenticated, isInitializing, requiresPasswordChange } = useAuth()
  const location = useLocation()

  if (isInitializing) {
    return <RouteFallback />
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    )
  }

  if (requiresPasswordChange && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }

  return <Outlet />
}

export const PublicOnlyRoute = () => {
  const { isAuthenticated, isInitializing, requiresPasswordChange } = useAuth()

  if (isInitializing) {
    return <RouteFallback />
  }

  if (isAuthenticated) {
    return <Navigate to={requiresPasswordChange ? '/change-password' : '/'} replace />
  }

  return <Outlet />
}

export const SuperAdminRoute = () => {
  const { hasRole } = useAuth()

  if (!hasRole('SUPER_ADMIN')) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

const AccessDenied = ({ landingPath }: { landingPath: string | null }) => (
  <EmptyState
    icon={Lock}
    title="Không đủ quyền truy cập"
    message="Bạn không có quyền truy cập mục này. Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là nhầm lẫn."
    action={
      landingPath ? (
        <Link
          to={landingPath}
          replace
          className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
        >
          Về khu vực được phép
        </Link>
      ) : undefined
    }
  />
)

/**
 * Gates a route on a granular permission code. When denied, either redirects to the first module
 * the user can access (`redirectOnDeny`, used for the index landing to avoid a dead dashboard) or
 * renders the "thiếu quyền" panel with a link to that module.
 */
export const PermissionRoute = ({
  required,
  redirectOnDeny = false,
}: {
  required: string
  redirectOnDeny?: boolean
}) => {
  const { hasPermission, hasRole } = useAuth()

  if (hasPermission(required)) {
    return <Outlet />
  }

  const landingPath = firstAccessiblePath(hasPermission, hasRole)

  if (redirectOnDeny && landingPath) {
    return <Navigate to={landingPath} replace />
  }

  return <AccessDenied landingPath={landingPath} />
}
