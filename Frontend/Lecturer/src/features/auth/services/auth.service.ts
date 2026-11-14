import { apiClient, API_ENDPOINTS } from '@/shared/api'
import { ApiError, type ApiResponse } from '@/shared/types'
import type { LoginResponse, UserInfo } from '../types'

// Giống một @Service: chỉ gọi API và bóc wrapper ApiResponse, không xử lý giao diện
export const authService = {
  // POST /login { code, redirectUri } → BE đổi code với Google, set cookie access_token
  // redirectUri phải trùng URL đã gửi Google lúc mở trang chọn tài khoản (Google so khớp từng ký tự)
  async login(code: string): Promise<UserInfo> {
    const res = await apiClient.post<ApiResponse<LoginResponse>>(
      API_ENDPOINTS.auth.login,
      { code, redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI },
      // Trang /authenticate tự hiện lỗi; 401 ở đây không phải "token hết hạn" nên không refresh
      { skipErrorToast: true, skipAuthRefresh: true },
    )
    const { authenticated, name, roles } = res.data.data
    if (!authenticated) {
      throw new ApiError('Đăng nhập không thành công. Vui lòng thử lại.', res.data.code)
    }
    return { name, roles }
  },

  // GET /my-info → dùng khi mở app / F5 để biết đã đăng nhập chưa và có role nào
  async getMyInfo(): Promise<UserInfo> {
    const res = await apiClient.get<ApiResponse<UserInfo>>(API_ENDPOINTS.auth.myInfo, {
      // Trang chặn đăng nhập tự hiện lỗi (mất mạng, 5xx)
      skipErrorToast: true,
    })
    return res.data.data
  },

  // POST /log-out → BE xóa cookie. Lỗi cũng không sao: frontend vẫn đăng xuất
  async logout(): Promise<void> {
    await apiClient.post(API_ENDPOINTS.auth.logout, undefined, {
      skipErrorToast: true,
      skipAuthRefresh: true,
    })
  },
}
