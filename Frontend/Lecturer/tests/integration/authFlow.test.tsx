import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import {
  HomeRedirect,
  ProtectedRoute,
  RequireAuth,
  authKeys,
  type UserInfo,
} from '@/features/auth'
import AuthenticatePage from '@/features/auth/pages/AuthenticatePage'
import { authService } from '@/features/auth/services/auth.service'
import { ApiError, NETWORK_ERROR_CODE } from '@/shared/types'

// Trang /login giả: hiện lỗi được chuyển sang qua location.state để kiểm tra
function LoginProbe() {
  const location = useLocation()
  const error = (location.state as { error?: string } | null)?.error
  return <p>Trang đăng nhập{error ? `: ${error}` : ''}</p>
}

function renderApp(path: string, user?: UserInfo) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  if (user) queryClient.setQueryData(authKeys.myInfo, user)

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<LoginProbe />} />
          <Route path="/authenticate" element={<AuthenticatePage />} />
          <Route element={<RequireAuth />}>
            <Route index element={<HomeRedirect />} />
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin" element={<p>Trang admin</p>} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={['HEAD_OF_MAJOR']} />}>
              <Route path="/department" element={<p>Trang bộ môn</p>} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={['SUPERVISOR']} />}>
              <Route path="/lecturer" element={<p>Trang giảng viên</p>} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

afterEach(() => {
  vi.restoreAllMocks()
  sessionStorage.clear()
})

describe('RequireAuth + ProtectedRoute', () => {
  it('"/" → chuyển tới dashboard theo role ưu tiên', async () => {
    renderApp('/', { name: 'An', roles: ['SUPERVISOR', 'HEAD_OF_MAJOR'] })
    expect(await screen.findByText('Trang bộ môn')).toBeInTheDocument()
  })

  it('giảng viên mở /admin → bị đưa về /lecturer', async () => {
    renderApp('/admin', { name: 'An', roles: ['SUPERVISOR'] })
    expect(await screen.findByText('Trang giảng viên')).toBeInTheDocument()
  })

  it('trưởng bộ môn vẫn vào được /lecturer (URL quyết định portal)', async () => {
    renderApp('/lecturer', { name: 'An', roles: ['HEAD_OF_MAJOR', 'SUPERVISOR'] })
    expect(await screen.findByText('Trang giảng viên')).toBeInTheDocument()
  })

  it('giảng viên mở /department → bị đưa về /lecturer', async () => {
    renderApp('/department', { name: 'An', roles: ['SUPERVISOR'] })
    expect(await screen.findByText('Trang giảng viên')).toBeInTheDocument()
  })

  it('chưa có cache → gọi /my-info; thành công thì vào trang', async () => {
    vi.spyOn(authService, 'getMyInfo').mockResolvedValue({ name: 'An', roles: ['ADMIN'] })
    renderApp('/admin')
    expect(await screen.findByText('Trang admin')).toBeInTheDocument()
  })

  it('/my-info trả 401 (refresh cũng hỏng) → về /login', async () => {
    vi.spyOn(authService, 'getMyInfo').mockRejectedValue(
      new ApiError('Phiên đăng nhập của bạn đã hết hạn', 2000, undefined, 401),
    )
    renderApp('/lecturer')
    expect(await screen.findByText('Trang đăng nhập')).toBeInTheDocument()
  })

  it('/my-info lỗi mạng → không đá về /login, hiện nút "Thử lại"', async () => {
    vi.spyOn(authService, 'getMyInfo').mockRejectedValue(
      new ApiError('Không thể kết nối tới máy chủ', NETWORK_ERROR_CODE),
    )
    renderApp('/lecturer')
    expect(await screen.findByRole('button', { name: 'Thử lại' })).toBeInTheDocument()
    expect(screen.queryByText(/Trang đăng nhập/)).not.toBeInTheDocument()
  })

  it('đăng nhập được nhưng không có role của portal cán bộ → màn hình không có quyền', async () => {
    renderApp('/', { name: 'An', roles: [] })
    expect(
      await screen.findByText('Tài khoản của bạn không có quyền truy cập cổng cán bộ.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Đăng xuất' })).toBeInTheDocument()
  })
})

describe('AuthenticatePage (Google chuyển về /authenticate)', () => {
  beforeEach(() => {
    sessionStorage.setItem('google_oauth_state', 'state-123')
  })

  it('state khớp → gửi code cho BE rồi vào dashboard theo role', async () => {
    const login = vi.spyOn(authService, 'login').mockResolvedValue({ name: 'An', roles: ['SUPERVISOR'] })
    renderApp('/authenticate?code=abc&state=state-123')

    expect(await screen.findByText('Trang giảng viên')).toBeInTheDocument()
    expect(login).toHaveBeenCalledTimes(1)
    expect(login).toHaveBeenCalledWith('abc')
    expect(sessionStorage.getItem('google_oauth_state')).toBeNull()
  })

  it('trưởng bộ môn (BE trả ["SUPERVISOR", "HEAD_OF_MAJOR"]) → vào /department', async () => {
    vi.spyOn(authService, 'login').mockResolvedValue({
      name: 'An',
      roles: ['SUPERVISOR', 'HEAD_OF_MAJOR'],
    })
    renderApp('/authenticate?code=abc&state=state-123')
    expect(await screen.findByText('Trang bộ môn')).toBeInTheDocument()
  })

  it('state không khớp → không gọi BE, về /login kèm lỗi', async () => {
    const login = vi.spyOn(authService, 'login')
    renderApp('/authenticate?code=abc&state=khac')

    expect(
      await screen.findByText('Trang đăng nhập: Phiên đăng nhập không hợp lệ. Vui lòng thử lại.'),
    ).toBeInTheDocument()
    expect(login).not.toHaveBeenCalled()
  })

  it('người dùng bấm Hủy ở Google → về /login, không báo lỗi', async () => {
    renderApp('/authenticate?error=access_denied&state=state-123')
    expect(await screen.findByText('Trang đăng nhập')).toBeInTheDocument()
  })

  it('BE từ chối (ví dụ tài khoản bị khóa) → hiện đúng message của BE', async () => {
    vi.spyOn(authService, 'login').mockRejectedValue(
      new ApiError('Tài khoản không hợp lệ', 4000, undefined, 403),
    )
    renderApp('/authenticate?code=abc&state=state-123')
    expect(await screen.findByText('Trang đăng nhập: Tài khoản không hợp lệ')).toBeInTheDocument()
  })
})
