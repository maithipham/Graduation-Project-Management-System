import type { SpringPage } from '@/shared/types'
import type { PageResponse, TemplateFilters } from '../types'

/** BE mặc định size = 10 */
export const TEMPLATE_PAGE_SIZE_OPTIONS = [10, 25, 50] as const
export const DEFAULT_TEMPLATE_PAGE_SIZE = 10

/** Chờ ngừng gõ rồi mới gọi API tìm kiếm */
export const TEMPLATE_SEARCH_DEBOUNCE_MS = 400

export const EMPTY_TEMPLATE_FILTERS: TemplateFilters = { keyword: '', fileType: '' }

/**
 * Đổi `PageResponse` của BE (`page` là số trang) sang `SpringPage`.
 * KHÔNG dùng `toSpringPage`: hàm đó coi `page` là object metadata → tính sai tổng số bản ghi / số trang.
 */
export function fromPageResponse<T>(raw: PageResponse<T> | null | undefined): SpringPage<T> {
  const content = raw?.content ?? []
  const number = raw?.page ?? 0
  const totalPages = raw?.totalPages ?? 0
  return {
    content,
    number,
    size: raw?.size ?? content.length,
    totalElements: raw?.totalElements ?? content.length,
    totalPages,
    numberOfElements: content.length,
    first: number === 0,
    last: number >= totalPages - 1,
    empty: content.length === 0,
  }
}
