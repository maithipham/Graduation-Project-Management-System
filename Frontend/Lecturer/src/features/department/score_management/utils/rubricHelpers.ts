import type { RubricRole, RubricSemesterOption, RubricStatus, SemesterRef } from '../types'
import { beDateSortKey } from './rubricMapper'

export const RUBRIC_ROLE_TABS: { role: RubricRole; label: string }[] = [
  { role: 'supervisor', label: 'Hướng dẫn' },
  { role: 'reviewer', label: 'Phản biện' },
  { role: 'council', label: 'Hội đồng' },
]

export function getRoleLabel(role: RubricRole): string {
  return RUBRIC_ROLE_TABS.find((tab) => tab.role === role)?.label ?? ''
}

export const RUBRIC_PAGE_SIZE_OPTIONS = [15, 25, 50] as const
export const DEFAULT_RUBRIC_PAGE_SIZE = 15

/** Nhãn mặc định + màu trạng thái (khi BE không trả nhãn thì dùng nhãn này) */
export const RUBRIC_STATUS_META: Record<RubricStatus, { label: string; className: string }> = {
  draft: { label: 'Nháp', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  upcoming: { label: 'Sắp áp dụng', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  active: { label: 'Đang áp dụng', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  archived: { label: 'Hết áp dụng', className: 'bg-slate-100 text-slate-600 border-slate-200' },
}

/**
 * Cột "Thời gian áp dụng" / header chi tiết: "HK1 2026-2027 → HK2 2027-2028".
 * Chưa có "Từ kỳ" = Nháp → "Chưa áp dụng"; chưa có "Đến kỳ" → "Chưa xác định" (đặc tả mục 5)
 */
export function formatSemesterRange(from: SemesterRef | null, to: SemesterRef | null): string {
  if (!from) return 'Chưa áp dụng'
  return `${from.name} → ${to?.name ?? 'Chưa xác định'}`
}

/**
 * Hiển thị một học kỳ dạng "năm học - học kỳ" cho cột Bắt đầu / Kết thúc.
 * BE chỉ trả tên ("Học kỳ 1 năm học 2026-2027") → tách bằng regex; tên khác mẫu thì giữ nguyên.
 */
export function formatSemesterShort(semester: SemesterRef | null): string {
  if (!semester) return ''
  const match = /^(.*?)\s+năm học\s+(\S+)$/i.exec(semester.name.trim())
  return match ? `${match[2]} - ${match[1]}` : semester.name
}

// ---------------------------------------------------------------------------
// Lọc ô chọn "Từ kỳ" / "Đến kỳ" (đặc tả mục 6.1). Chỉ để chặn sớm, BE vẫn kiểm tra lại (3123, 3124)
// ---------------------------------------------------------------------------

/**
 * "Từ kỳ": bỏ kỳ đã kết thúc (R1). Khi Sửa kỳ mà "Từ kỳ" hiện tại đã kết thúc vẫn giữ lại kỳ đó
 * (`currentFromId`) để ô chọn hiện được giá trị đang có.
 */
export function getFromSemesterOptions(
  semesters: RubricSemesterOption[],
  currentFromId: string | null = null,
): RubricSemesterOption[] {
  return semesters.filter((semester) => semester.statusCode !== 'COMPLETED' || semester.publicId === currentFromId)
}

/** "Đến kỳ": kỳ bắt đầu không sớm hơn "Từ kỳ" đã chọn (R2). Chưa chọn "Từ kỳ" → rỗng */
export function getToSemesterOptions(
  semesters: RubricSemesterOption[],
  fromSemesterId: string | null,
): RubricSemesterOption[] {
  const from = semesters.find((semester) => semester.publicId === fromSemesterId)
  if (!from) return []
  const fromKey = beDateSortKey(from.startDate)
  return semesters.filter((semester) => beDateSortKey(semester.startDate) >= fromKey)
}

/** Đổi "Từ kỳ" làm "Đến kỳ" đang chọn không còn trong danh sách → về null ("Chưa xác định") */
export function keepValidToSemester(
  semesters: RubricSemesterOption[],
  fromSemesterId: string | null,
  toSemesterId: string | null,
): string | null {
  if (toSemesterId === null) return null
  return getToSemesterOptions(semesters, fromSemesterId).some((semester) => semester.publicId === toSemesterId)
    ? toSemesterId
    : null
}

