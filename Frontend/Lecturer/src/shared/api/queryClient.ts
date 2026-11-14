import { QueryClient } from '@tanstack/react-query'
import { isApiError, NETWORK_ERROR_CODE } from '@/shared/types'

const MAX_QUERY_RETRIES = 1

/**
 * Chỉ thử lại khi lỗi có khả năng tự hết: mất mạng/timeout hoặc server lỗi 5xx.
 * Không thử lại lỗi 4xx (sai dữ liệu, thiếu quyền, không tìm thấy) và lỗi nghiệp vụ (HTTP 200, code khác 1000)
 * vì gọi lại cũng cho kết quả y hệt.
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_QUERY_RETRIES) return false
  if (!isApiError(error)) return false

  if (error.status === undefined) return error.code === NETWORK_ERROR_CODE
  return error.status >= 500
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: shouldRetryQuery,
      // Dữ liệu được coi là "mới" trong 30 giây: chuyển trang qua lại không gọi lại API liên tục
      staleTime: 30 * 1000,
    },
    mutations: {
      retry: false,
    },
  },
})

export const referenceDataQueryOptions = {
  staleTime: 30 * 60 * 1000, // 30 phút cache cho dữ liệu ít biến động
  refetchOnWindowFocus: false,
} as const
