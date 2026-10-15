import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth'
import { onUnauthorized } from '@/shared/api/session'
import { queryClient } from '@/shared/api/queryClient'

/**
 * Khi BE trả 401 và refresh token cũng thất bại: xóa trạng thái đăng nhập + cache, chuyển về /login (không hiện thông báo).
 * Đặt bên trong <BrowserRouter> để dùng được navigate.
 */
export function SessionExpiredListener() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isOnLoginPage = pathname.startsWith('/login')

  useEffect(
    () =>
      onUnauthorized(() => {
        // Đang ở trang đăng nhập thì 401 là bình thường (chưa đăng nhập)
        if (isOnLoginPage) return
        useAuthStore.getState().clearAuth()
        queryClient.clear()
        navigate('/login', { replace: true })
      }),
    [navigate, isOnLoginPage],
  )

  return null
}
