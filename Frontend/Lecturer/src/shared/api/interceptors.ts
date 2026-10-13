import type { AxiosInstance } from 'axios'
import { API_SUCCESS_CODE, ApiError, type ApiResponse } from '@/shared/types'
import { toast } from '@/shared/components/feedback/toast.store'

export function setupInterceptors(axiosInstance: AxiosInstance): void {
  // Request Interceptor: Gắn Bearer Token nếu có
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('access_token')
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error),
  )

  // Response Interceptor: Chuẩn hóa phản hồi APIResponse (code 1000 = thành công, khác 1000 = thất bại)
  axiosInstance.interceptors.response.use(
    (response) => {
      // Bắt trường hợp BE trả về HTTP 200 nhưng code khác 1000 (Lỗi nghiệp vụ)
      if (
        response.data &&
        typeof response.data === 'object' &&
        'code' in response.data
      ) {
        const apiRes = response.data as ApiResponse
        if (apiRes.code !== API_SUCCESS_CODE) {
          const errorMessage = apiRes.message || 'Thao tác không thành công'
          // Tự động hiển thị thông báo lỗi trong 3 giây
          toast.error(errorMessage, 3000)
          return Promise.reject(new ApiError(errorMessage, apiRes.code, apiRes.data))
        }
      }
      return response
    },
    async (error) => {
      const originalRequest = error.config

      // Xử lý 401 Silent Token Refresh
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true
        try {
          const refreshToken = localStorage.getItem('refresh_token')
          if (refreshToken) {
            // Placeholder: gọi endpoint làm mới token
          }
        } catch (refreshError) {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 3000)
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      }

      // Xử lý message lỗi khi HTTP Status khác 2xx (400, 403, 404, 500...)
      const errorData = error.response?.data
      if (errorData && typeof errorData === 'object' && 'message' in errorData) {
        const errorMessage = (errorData as ApiResponse).message || 'Có lỗi xảy ra từ máy chủ'
        toast.error(errorMessage, 3000)
      } else if (error.message && !error.response) {
        toast.error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền.', 3000)
      }

      return Promise.reject(error)
    },
  )
}

