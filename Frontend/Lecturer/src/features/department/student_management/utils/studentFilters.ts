import type { MajorOption, StudentThesisStatus } from '../types'

/**
 * Giá trị bộ lọc trên giao diện (không gồm học kì — học kì chọn riêng ở đầu trang).
 * Chuỗi rỗng = không lọc (không gửi lên BE)
 */
export interface StudentFilters {
  keyword: string
  majorId: string
  batch: string
  status: StudentThesisStatus | ''
}

export const DEFAULT_STUDENT_FILTERS: StudentFilters = {
  keyword: '',
  majorId: '',
  batch: '',
  status: '',
}

// Thứ tự theo tiến độ đồ án. Nhãn khớp statusLabel BE trả về
export const STUDENT_STATUS_OPTIONS: { value: StudentThesisStatus; label: string }[] = [
  { value: 'STAGE_1_REGISTERING_ADVISOR', label: 'Đang đăng ký GVHD' },
  { value: 'STAGE_1_ADVISOR_ASSIGNED', label: 'Đã phân công GVHD' },
  { value: 'STAGE_2_TOPIC_CONFIRMED', label: 'Đã chốt tên đề tài' },
  { value: 'STAGE_3_OUTLINE_APPROVED', label: 'Đã duyệt đề cương' },
  { value: 'STAGE_4_REPORT_APPROVED', label: 'Đã duyệt báo cáo' },
  { value: 'STAGE_5_REVIEW_PASSED', label: 'Đạt phản biện' },
  { value: 'STAGE_6_DEFENSE_COMPLETED', label: 'Đã bảo vệ hội đồng' },
  { value: 'DISQUALIFIED', label: 'Bị đình chỉ / Không đủ điều kiện đi tiếp' },
  { value: 'CANCELLED', label: 'Đã hủy' },
]

export function hasActiveFilters(filters: StudentFilters): boolean {
  return (
    filters.keyword.trim() !== '' ||
    filters.majorId !== DEFAULT_STUDENT_FILTERS.majorId ||
    filters.batch !== DEFAULT_STUDENT_FILTERS.batch ||
    filters.status !== DEFAULT_STUDENT_FILTERS.status
  )
}

/** Mô tả bộ lọc đang chọn bằng chữ, ví dụ ["Bộ môn: Kỹ thuật phần mềm", "Khóa: K63", ...] */
export function describeFilters(filters: StudentFilters, majors: MajorOption[] = []): string[] {
  const majorName = majors.find((m) => m.publicId === filters.majorId)?.name
  const statusLabel = filters.status
    ? (STUDENT_STATUS_OPTIONS.find((s) => s.value === filters.status)?.label ?? filters.status)
    : 'Tất cả'

  return [
    filters.keyword.trim() && `Từ khóa: "${filters.keyword.trim()}"`,
    `Bộ môn: ${filters.majorId ? (majorName ?? 'Đã chọn') : 'Tất cả bộ môn'}`,
    `Khóa: ${filters.batch || 'Tất cả khóa'}`,
    `Trạng thái: ${statusLabel}`,
  ].filter((item): item is string => Boolean(item))
}
