import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export const ProtectedRoute = () => {
  const { isAuthenticated, requiresPasswordChange } = useAuth()
  const location = useLocation()

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
  const { isAuthenticated, requiresPasswordChange } = useAuth()

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
