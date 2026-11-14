import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { SIGNED_OUT_STATE } from '@/features/auth'
import { onUnauthorized } from '@/shared/api/session'

/**
 * Khi BE trả 401 và refresh token cũng thất bại: chuyển về /login, không hiện thông báo (trang /login xóa trạng thái đăng nhập + cache).
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
        // Cache (kể cả thông tin đăng nhập ['auth', 'me']) được xóa ở trang /login, sau khi layout cũ đã gỡ
        navigate('/login', { replace: true, state: SIGNED_OUT_STATE })
      }),
    [navigate, isOnLoginPage],
  )

  return null
}
