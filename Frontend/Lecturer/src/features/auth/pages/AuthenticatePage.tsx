import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { isApiError } from '@/shared/types'
import { useLogin } from '../hooks/useAuth'
import { consumeOAuthState } from '../utils/googleOAuth'
import { getHomePath } from '../utils/homePath'

const INVALID_CALLBACK_MESSAGE = 'Phiên đăng nhập không hợp lệ. Vui lòng thử lại.'

/**
 * Trang Google chuyển về sau khi chọn tài khoản: /authenticate?code=...&state=...
 * Kiểm tra state → gửi code cho BE (POST /login) → về dashboard theo role.
 */
export default function AuthenticatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { mutate: login } = useLogin()
  // StrictMode (môi trường dev) chạy effect 2 lần; code của Google chỉ dùng được 1 lần nên chặn lần thứ 2
  const hasStarted = useRef(false)

  useEffect(() => {
    if (hasStarted.current) return
    hasStarted.current = true

    // replace: true → URL chứa code không nằm lại trong lịch sử trình duyệt
    const backToLogin = (error?: string) =>
      navigate('/login', { replace: true, state: error ? { error } : null })

    const expectedState = consumeOAuthState()
    const googleError = searchParams.get('error')
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (googleError) {
      // Người dùng bấm "Hủy" ở Google: quay về im lặng
      backToLogin(googleError === 'access_denied' ? undefined : 'Đăng nhập Google không thành công.')
      return
    }

    if (!code || !state || state !== expectedState) {
      backToLogin(INVALID_CALLBACK_MESSAGE)
      return
    }

    login(code, {
      onSuccess: (user) => {
        const homePath = getHomePath(user.roles)
        if (homePath) navigate(homePath, { replace: true })
        else backToLogin('Tài khoản của bạn không có quyền truy cập cổng cán bộ.')
      },
      // Ví dụ ACCOUNT_INVALID (4000): hiện đúng message của BE dưới nút đăng nhập
      onError: (error) =>
        backToLogin(isApiError(error) ? error.message : 'Đăng nhập không thành công. Vui lòng thử lại.'),
    })
  }, [login, navigate, searchParams])

  return (
    <div
      role="status"
      className="flex min-h-screen items-center justify-center gap-3 text-slate-600"
    >
      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      <span className="text-sm font-medium">Đang đăng nhập...</span>
    </div>
  )
}
