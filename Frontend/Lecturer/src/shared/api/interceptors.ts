import type { AxiosInstance } from 'axios'

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

  // Response Interceptor: Xử lý 401 Silent Token Refresh
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true
        // Xử lý logic làm mới token ngầm khi backend có hỗ trợ refresh token
        try {
          const refreshToken = localStorage.getItem('refresh_token')
          if (refreshToken) {
            // Placeholder: gọi endpoint làm mới token
            // const res = await axiosInstance.post('/auth/refresh', { refreshToken })
            // localStorage.setItem('access_token', res.data.accessToken)
            // return axiosInstance(originalRequest)
          }
        } catch (refreshError) {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      }
      return Promise.reject(error)
    },
  )
}
