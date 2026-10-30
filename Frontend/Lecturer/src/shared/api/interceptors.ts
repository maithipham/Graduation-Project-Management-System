import axios, { type AxiosError, type AxiosInstance } from 'axios'
import {
  API_SUCCESS_CODE,
  ApiError,
  isApiWarningCode,
  NETWORK_ERROR_CODE,
  type ApiResponse,
} from '@/shared/types'
import { toast } from '@/shared/components/feedback/toast.store'
import { API_ENDPOINTS } from './endpoints'
import { notifyUnauthorized } from './session'

declare module 'axios' {
  interface AxiosRequestConfig {
    /**
     * true: interceptor không tự hiện toast lỗi (component tự hiển thị lỗi, ví dụ lỗi validate ngay trên form).
     * Dùng: apiClient.post(url, body, { skipErrorToast: true })
     */
    skipErrorToast?: boolean
    /**
     * true: interceptor không tự hiện toast vàng cho mã cảnh báo 11xx (component tự hiển thị kết quả).
     * Dùng: apiClient.post(url, body, { skipWarningToast: true })
     */
    skipWarningToast?: boolean
    /**
     * true: gặp 401 thì trả lỗi luôn, không gọi refresh token và không chuyển về /login.
     * Dùng cho chính các API đăng nhập / đăng xuất (401 ở đây không phải "token hết hạn").
     */
    skipAuthRefresh?: boolean
    /** Đánh dấu nội bộ: request đã được gửi lại 1 lần sau khi refresh token */
    _retry?: boolean
    /** Đánh dấu nội bộ: đây là chính request gọi refresh token */
    _isRefreshRequest?: boolean
  }
}

/**
 * Chuyển lỗi axios (HTTP khác 2xx, mất mạng, timeout) thành ApiError thống nhất.
 */
export function toApiError(error: AxiosError): ApiError {
  const status = error.response?.status
  const body = error.response?.data

  // BE trả body có message: APIResponse { code, message, data } hoặc body lỗi mặc định của Spring
  if (body && typeof body === 'object' && 'message' in body) {
    const apiRes = body as Partial<ApiResponse>
    const code = typeof apiRes.code === 'number' ? apiRes.code : (status ?? NETWORK_ERROR_CODE)
    return new ApiError(apiRes.message || 'Có lỗi xảy ra từ máy chủ', code, apiRes.data, status)
  }

  if (status) {
    return new ApiError(`Có lỗi xảy ra từ máy chủ (HTTP ${status})`, status, body, status)
  }

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new ApiError('Máy chủ phản hồi quá lâu. Vui lòng thử lại.', NETWORK_ERROR_CODE)
  }

  return new ApiError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền.', NETWORK_ERROR_CODE)
}

/**
 * Request tải file (`responseType: 'blob'`) thì body luôn là Blob, kể cả khi BE trả APIResponse JSON báo lỗi.
 * Body là JSON → đọc ra object để xử lý lỗi giống mọi API khác; file thật thì giữ nguyên.
 */
async function parseJsonBlob(data: unknown): Promise<unknown> {
  if (!(data instanceof Blob) || !data.type.includes('json')) return data
  try {
    return JSON.parse(await data.text())
  } catch {
    return data
  }
}

// Nhiều request cùng bị 401 thì chỉ gọi refresh 1 lần, các request còn lại chờ chung kết quả
let refreshPromise: Promise<void> | null = null

/**
 * Gọi BE cấp token mới. Token nằm trong cookie HttpOnly nên frontend không cần đọc/lưu gì:
 * BE trả Set-Cookie, trình duyệt tự gửi cookie mới ở các request sau.
 */
function refreshSession(axiosInstance: AxiosInstance): Promise<void> {
  refreshPromise ??= axiosInstance
    .post(API_ENDPOINTS.auth.refreshToken, undefined, { _isRefreshRequest: true })
    .then(() => undefined)
    .finally(() => {
      refreshPromise = null
    })
  return refreshPromise
}

export function setupInterceptors(axiosInstance: AxiosInstance): void {
  // Response Interceptor: Chuẩn hóa phản hồi APIResponse
  // (code 1000 = thành công, 11xx = thành công kèm cảnh báo, còn lại = thất bại)
  axiosInstance.interceptors.response.use(
    async (response) => {
      response.data = await parseJsonBlob(response.data)
      // Bắt trường hợp BE trả về HTTP 200 nhưng code khác 1000
      if (
        response.data &&
        typeof response.data === 'object' &&
        'code' in response.data
      ) {
        const apiRes = response.data as ApiResponse
        // Cảnh báo (VD 1101): thao tác vẫn xong → trả response bình thường, chỉ hiện toast vàng
        if (isApiWarningCode(apiRes.code)) {
          if (!response.config.skipWarningToast) {
            toast.warning(apiRes.message, 3000)
          }
          return response
        }
        // Còn lại: lỗi nghiệp vụ
        if (apiRes.code !== API_SUCCESS_CODE) {
          const apiError = new ApiError(
            apiRes.message || 'Thao tác không thành công',
            apiRes.code,
            apiRes.data,
            response.status,
          )
          const { skipErrorToast, _isRefreshRequest } = response.config
          if (!skipErrorToast && !_isRefreshRequest) {
            toast.error(apiError.message, 3000)
          }
          return Promise.reject(apiError)
        }
      }
      return response
    },
    async (error: unknown) => {
      // Request bị hủy (rời trang, TanStack Query hủy query cũ) không phải lỗi → không toast
      if (axios.isCancel(error) || !axios.isAxiosError(error)) {
        return Promise.reject(error)
      }

      const config = error.config
      if (error.response) error.response.data = await parseJsonBlob(error.response.data)
      const apiError = toApiError(error)

      // Lỗi của chính request refresh: không toast, để refreshSession() báo thất bại cho request gốc
      if (config?._isRefreshRequest) {
        return Promise.reject(apiError)
      }

      // 401 (chưa đăng nhập / token hết hạn): thử refresh 1 lần rồi gửi lại request.
      // Refresh thất bại, hoặc gửi lại vẫn 401 → về trang đăng nhập. Không hiện thông báo.
      if (apiError.status === 401 && !config?.skipAuthRefresh) {
        if (config && !config._retry) {
          config._retry = true
          try {
            await refreshSession(axiosInstance)
          } catch {
            notifyUnauthorized()
            return Promise.reject(apiError)
          }
          return axiosInstance(config)
        }
        notifyUnauthorized()
        return Promise.reject(apiError)
      }

      // 400, 403, 404, 500, mất mạng, timeout → toast
      if (!config?.skipErrorToast) {
        toast.error(apiError.message, 3000)
      }
      return Promise.reject(apiError)
    },
  )
}
