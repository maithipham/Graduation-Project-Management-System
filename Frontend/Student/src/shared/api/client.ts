import axios from 'axios'
import { setupInterceptors } from './interceptors'

// Export để chỗ không đi qua axios (EventSource của SSE) dùng chung địa chỉ backend
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  // Gửi kèm cookie HttpOnly (access/refresh token) khi gọi sang BE khác origin
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

setupInterceptors(apiClient)

/**
 * Tiện ích hỗ trợ hủy yêu cầu (AbortController) theo Kỹ thuật #19
 */
export function createCancellableRequest<T>(
  requestFn: (signal: AbortSignal) => Promise<T>,
): { promise: Promise<T>; cancel: () => void } {
  const controller = new AbortController()
  const promise = requestFn(controller.signal)
  return {
    promise,
    cancel: () => controller.abort(),
  }
}

export default apiClient
