import { ErrorBoundary } from 'react-error-boundary'
import { Navigate, Outlet } from 'react-router-dom'
import { ErrorFallback } from '@/shared/components/feedback/ErrorFallback'
import type { UserRole } from '../types'
import { useMyInfo } from '../hooks/useAuth'
import { getHomePath } from '../utils/homePath'

type ProtectedRouteProps = {
  // Có ít nhất 1 role trong danh sách là được vào (giống @PreAuthorize("hasAnyRole(...)"))
  allowedRoles: UserRole[]
}

/**
 * Chặn route theo role. Đặt bên trong <RequireAuth /> nên lúc này đã có thông tin người dùng.
 * URL quyết định portal đang dùng: trưởng bộ môn có cả SUPERVISOR nên vào thẳng /lecturer/... vẫn được.
 */
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { data: user } = useMyInfo()

  if (!user) return <Navigate to="/login" replace />

  if (!user.roles.some((role) => allowedRoles.includes(role))) {
    return <Navigate to={getHomePath(user.roles) ?? '/login'} replace />
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Outlet />
    </ErrorBoundary>
  )
}

/** Vào "/" → chuyển tới dashboard theo role */
export function HomeRedirect() {
  const { data: user } = useMyInfo()
  return <Navigate to={(user && getHomePath(user.roles)) || '/login'} replace />
}
