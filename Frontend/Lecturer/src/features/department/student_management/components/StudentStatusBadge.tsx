import { cn } from '@/shared/utils/cn'
import type { StudentThesisStatus } from '../types'

// Màu theo tiến độ: vàng = chưa có GVHD, xanh dương = đang làm, tím = qua các mốc duyệt,
// xanh lá = đã bảo vệ, đỏ = bị đình chỉ. Chữ hiển thị luôn là statusLabel của BE
const STATUS_STYLES: Record<StudentThesisStatus, string> = {
  STAGE_1_REGISTERING_ADVISOR: 'border-amber-200 bg-amber-50 text-amber-700',
  STAGE_1_ADVISOR_ASSIGNED: 'border-sky-200 bg-sky-50 text-sky-700',
  STAGE_2_TOPIC_CONFIRMED: 'border-blue-200 bg-blue-50 text-blue-700',
  STAGE_3_OUTLINE_APPROVED: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  STAGE_4_REPORT_APPROVED: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  STAGE_5_REVIEW_PASSED: 'border-violet-200 bg-violet-50 text-violet-700',
  STAGE_6_DEFENSE_COMPLETED: 'border-green-200 bg-green-50 text-green-700',
  DISQUALIFIED: 'border-red-200 bg-red-50 text-red-700',
  CANCELLED: 'border-slate-200 bg-slate-50 text-slate-500 line-through',
}

const UNKNOWN_STYLE = 'border-slate-200 bg-slate-50 text-slate-600'

interface StudentStatusBadgeProps {
  status: StudentThesisStatus | string
  label: string
}

export function StudentStatusBadge({ status, label }: StudentStatusBadgeProps) {
  // BE có thể thêm trạng thái mới → không có trong bảng màu thì dùng màu xám
  const style = STATUS_STYLES[status as StudentThesisStatus] ?? UNKNOWN_STYLE
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap',
        style,
      )}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden />
      {label}
    </span>
  )
}
