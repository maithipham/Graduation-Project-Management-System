import type { SpringPage } from '@/shared/types'
import type { LecturerTemplateFilters, LecturerTemplatePageResponse } from '../types/templateManagement.types'

/** Giống trang Trưởng bộ môn: mặc định 10 dòng/trang */
export const TEMPLATE_PAGE_SIZE_OPTIONS = [10, 25, 50] as const
export const DEFAULT_TEMPLATE_PAGE_SIZE = 10

/** Chờ ngừng gõ rồi mới lọc (sau này là gọi API tìm kiếm) */
export const TEMPLATE_SEARCH_DEBOUNCE_MS = 400

export const EMPTY_TEMPLATE_FILTERS: LecturerTemplateFilters = { keyword: '', fileType: '' }

/**
 * BE trả `{ content, page, size, totalElements, totalPages }` với `page` là số trang (0-based)
 * → đổi sang `SpringPage` để dùng `TablePagination`. Không dùng `toSpringPage` (nó hiểu `page` là object).
 */
export function fromPageResponse<T>(raw: LecturerTemplatePageResponse<T> | null | undefined): SpringPage<T> {
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
