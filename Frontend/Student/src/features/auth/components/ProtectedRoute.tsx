import { ErrorBoundary } from 'react-error-boundary'
import { Navigate, Outlet } from 'react-router-dom'
import { roleHomePaths, type UserRole } from '../types'
import { useAuthStore } from '../store/authStore'
import { ErrorFallback } from '@/shared/components/feedback/ErrorFallback'

type ProtectedRouteProps = {
  allowedRoles: UserRole[]
}

/**
 * Route Guard bảo vệ theo quyền người dùng (Kỹ thuật #14)
 */
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const activeRole = useAuthStore((state) => state.activeRole)

  if (!activeRole) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(activeRole)) {
    return <Navigate to={roleHomePaths[activeRole] || '/login'} replace />
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Outlet />
    </ErrorBoundary>
  )
}
