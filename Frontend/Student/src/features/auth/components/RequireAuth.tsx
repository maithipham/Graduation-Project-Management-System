import { Navigate, Outlet } from 'react-router-dom'
import { ShieldAlert, WifiOff } from 'lucide-react'
import { Button } from '@/shared/components/ui'
import { LoadingFallback } from '@/shared/components/feedback/LoadingFallback'
import { isApiError } from '@/shared/types'
import { useLogout, useMyInfo } from '../hooks/useAuth'
import { getHomePath } from '../utils/homePath'

/**
 * Cổng đăng nhập bọc mọi trang cần đăng nhập (giống filter xác thực của Spring Security).
 * Đã có thông tin người dùng (vừa login xong hoặc đã gọi /my-info) → hiện trang; chưa có → gọi GET /my-info.
 * 401 thì interceptor đã tự refresh token; refresh hỏng → về /login.
 */
export function RequireAuth() {
  const { data: user, error, isPending, refetch, isRefetching } = useMyInfo()

  if (user) {
    if (getHomePath(user.roles) === null) return <NoPortalAccess />
    return <Outlet />
  }

  if (isPending) return <LoadingFallback />

  if (isApiError(error) && error.status === 401) return <Navigate to="/login" replace />

  // Mất mạng, server lỗi 5xx...: không đá về /login vì phiên có thể vẫn còn hạn
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <WifiOff className="h-8 w-8 text-slate-400" />
      <p className="text-sm text-slate-600">
        {isApiError(error) ? error.message : 'Không thể tải thông tin tài khoản.'}
      </p>
      <Button size="sm" onClick={() => void refetch()} disabled={isRefetching}>
        {isRefetching ? 'Đang thử lại...' : 'Thử lại'}
      </Button>
    </div>
  )
}

// Tài khoản đăng nhập được nhưng không có role nào của portal sinh viên
function NoPortalAccess() {
  const { mutate: logout, isPending } = useLogout()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <ShieldAlert className="h-8 w-8 text-red-500" />
      <p className="text-sm text-slate-600">Tài khoản của bạn không có quyền truy cập cổng sinh viên.</p>
      <Button size="sm" variant="outline" onClick={() => logout()} disabled={isPending}>
        {isPending ? 'Đang đăng xuất...' : 'Đăng xuất'}
      </Button>
    </div>
  )
}
