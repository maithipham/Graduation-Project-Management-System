import { cn } from '@/shared/utils/cn'
import type { RubricStatus } from '../types'
import { RUBRIC_STATUS_META } from '../utils/rubricHelpers'

/** `label`: nhãn BE trả (displayStatusName); không có thì dùng nhãn mặc định của FE */
export function RubricStatusBadge({ status, label }: { status: RubricStatus; label?: string | null }) {
  const meta = RUBRIC_STATUS_META[status]
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-bold',
        meta.className,
      )}
    >
      {label || meta.label}
    </span>
  )
}
