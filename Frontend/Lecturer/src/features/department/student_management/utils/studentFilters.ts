import type { MajorOption, StudentStatusFilter } from '../types'

/** Giá trị bộ lọc trên giao diện. Chuỗi rỗng = không lọc (không gửi lên BE) */
export interface StudentFilters {
  keyword: string
  majorId: string
  batch: string
  status: StudentStatusFilter
}

export const DEFAULT_STUDENT_FILTERS: StudentFilters = {
  keyword: '',
  majorId: '',
  batch: '',
  status: 'ACTIVE',
}

// BE chưa có API danh sách khóa → dùng danh sách tĩnh
export const BATCH_OPTIONS = ['K62', 'K63', 'K64', 'K65', 'K66'] as const

export const STATUS_OPTIONS: { value: StudentStatusFilter; label: string }[] = [
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'INACTIVE', label: 'Đã tắt' },
  { value: 'ALL', label: 'Tất cả trạng thái' },
]

export function hasActiveFilters(filters: StudentFilters): boolean {
  return (
    filters.keyword.trim() !== '' ||
    filters.majorId !== DEFAULT_STUDENT_FILTERS.majorId ||
    filters.batch !== DEFAULT_STUDENT_FILTERS.batch ||
    filters.status !== DEFAULT_STUDENT_FILTERS.status
  )
}

/** Mô tả bộ lọc đang chọn bằng chữ, ví dụ ["Ngành: Kỹ thuật phần mềm", "Khóa: K63", ...] */
export function describeFilters(filters: StudentFilters, majors: MajorOption[] = []): string[] {
  const majorName = majors.find((m) => m.publicId === filters.majorId)?.name
  const statusLabel =
    filters.status === 'ALL' ? 'Tất cả' : STATUS_OPTIONS.find((s) => s.value === filters.status)?.label

  return [
    filters.keyword.trim() && `Từ khóa: "${filters.keyword.trim()}"`,
    `Ngành: ${filters.majorId ? (majorName ?? 'Đã chọn') : 'Tất cả ngành'}`,
    `Khóa: ${filters.batch || 'Tất cả khóa'}`,
    `Trạng thái: ${statusLabel}`,
  ].filter((item): item is string => Boolean(item))
}
