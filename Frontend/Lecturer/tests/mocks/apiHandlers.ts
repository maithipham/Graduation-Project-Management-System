import type { ApiResponse, PaginatedResponse } from '@/shared/types'
import { mockTopics } from './fixtures/mockTopics'
import { mockStudents } from './fixtures/mockStudents'
import { mockScores } from './fixtures/mockScores'

/**
 * Trình giả lập phản hồi API thành công với thời gian chờ trễ tùy chọn (delayMs)
 */
export async function mockSuccessResponse<T>(
  data: T,
  delayMs: number = 0,
): Promise<ApiResponse<T>> {
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }
  return {
    code: 1000,
    data,
    message: 'Thao tác thành công',
  }
}

/**
 * Trình giả lập phản hồi API bị lỗi (400, 401, 403, 500)
 */
export async function mockErrorResponse(
  status: number = 500,
  message: string = 'Đã có lỗi xảy ra từ máy chủ',
): Promise<never> {
  const error = new Error(message) as Error & { status: number; response?: { status: number; data: unknown } }
  error.status = status
  error.response = {
    status,
    data: {
      code: status,
      message,
      data: null,
    },
  }
  throw error
}

/**
 * Trình giả lập phân trang (Pagination)
 */
export function mockPaginatedResponse<T>(
  items: T[],
  page: number = 1,
  pageSize: number = 10,
): PaginatedResponse<T> {
  const total = items.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const paginatedItems = items.slice(start, start + pageSize)

  return {
    items: paginatedItems,
    total,
    page,
    pageSize,
    totalPages,
  }
}

/**
 * Các hàm handler giả lập API cho các phân hệ
 */
export const mockApiHandlers = {
  getStudentOverview: () =>
    mockSuccessResponse({
      student: mockStudents[0],
      currentTopic: mockTopics[0],
      latestScore: mockScores[0],
    }),

  getTopicsList: (page: number = 1, pageSize: number = 10) =>
    mockSuccessResponse(mockPaginatedResponse(mockTopics, page, pageSize)),

  getStudentsByLecturer: () =>
    mockSuccessResponse(mockStudents),

  getScoreReports: () =>
    mockSuccessResponse(mockScores),
}
