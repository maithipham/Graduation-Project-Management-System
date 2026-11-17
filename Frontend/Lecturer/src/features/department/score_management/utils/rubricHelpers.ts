import type { RubricRole, RubricStatus } from '../types'

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

/** Nhãn trạng thái ở header popup chi tiết (theo mockup khác chút với bảng) */
export const RUBRIC_DETAIL_STATUS_LABEL: Record<RubricStatus, string> = {
  draft: 'Bản nháp',
  upcoming: 'Sắp áp dụng',
  active: 'Đang sử dụng',
  archived: 'Đã lưu trữ',
}

/**
 * Khoảng áp dụng ở header chi tiết. Chưa có ngày kết thúc: đang áp dụng → "A – nay";
 * sắp áp dụng → "Từ A" (chưa tới ngày nên không ghi "nay")
 */
export function formatEffectiveRange(from: string | null, to: string | null, status: RubricStatus): string {
  if (!from) return 'Chưa áp dụng'
  if (to) return `${from} – ${to}`
  return status === 'upcoming' ? `Từ ${from}` : `${from} – nay`
}

/** Thang 10 điểm: 100% ứng với 10 điểm */
export function formatScore(weight: number): string {
  return `${(weight / 10).toFixed(1)} điểm`
}
