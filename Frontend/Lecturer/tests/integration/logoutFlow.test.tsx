import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RequireAuth, authKeys, useLogout, useMyInfo } from '@/features/auth'
import LoginPage from '@/features/auth/pages/LoginPage'
import { authService } from '@/features/auth/services/auth.service'

// Layout giả: giống header thật — đọc useMyInfo và có nút "Đăng xuất"
function FakeLayout() {
  const { data: user } = useMyInfo()
  const logout = useLogout()
  return (
    <div>
      <p>Xin chào {user?.name}</p>
      <button type="button" onClick={() => logout.mutate()}>
        Đăng xuất
      </button>
    </div>
  )
}

function renderLoggedIn() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  queryClient.setQueryData(authKeys.myInfo, { name: 'An', roles: ['ADMIN'] })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route path="/admin" element={<FakeLayout />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return queryClient
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Đăng xuất', () => {
  it('gọi POST /log-out, về trang đăng nhập, không gọi lại /my-info, xóa sạch cache', async () => {
    const logout = vi.spyOn(authService, 'logout').mockResolvedValue()
    // Cookie vẫn còn hạn (ví dụ BE chưa xóa) → nếu FE gọi lại /my-info sẽ bị đưa ngược vào dashboard
    const getMyInfo = vi.spyOn(authService, 'getMyInfo').mockResolvedValue({ name: 'An', roles: ['ADMIN'] })
    const queryClient = renderLoggedIn()

    await userEvent.click(await screen.findByRole('button', { name: 'Đăng xuất' }))

    expect(await screen.findByRole('button', { name: 'Đăng nhập với Google' })).toBeInTheDocument()
    expect(logout).toHaveBeenCalledTimes(1)
    expect(getMyInfo).not.toHaveBeenCalled()
    expect(queryClient.getQueryData(authKeys.myInfo)).toBeUndefined()
  })

  it('BE lỗi khi đăng xuất → vẫn về trang đăng nhập, không bị đưa ngược vào dashboard', async () => {
    vi.spyOn(authService, 'logout').mockRejectedValue(new Error('302'))
    // Cookie vẫn còn hạn (ví dụ BE chưa xóa) → nếu FE gọi lại /my-info sẽ bị đưa ngược vào dashboard
    const getMyInfo = vi.spyOn(authService, 'getMyInfo').mockResolvedValue({ name: 'An', roles: ['ADMIN'] })
    renderLoggedIn()

    await userEvent.click(await screen.findByRole('button', { name: 'Đăng xuất' }))

    expect(await screen.findByRole('button', { name: 'Đăng nhập với Google' })).toBeInTheDocument()
    expect(screen.queryByText(/Xin chào/)).not.toBeInTheDocument()
    expect(getMyInfo).not.toHaveBeenCalled()
  })
})
