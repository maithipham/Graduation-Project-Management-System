import { AlertTriangle } from 'lucide-react'
import type { RubricListItem } from '../types'
import { formatSemesterRange, formatSemesterShort } from '../utils/rubricHelpers'
import { RubricActionMenu } from './RubricActionMenu'
import { RubricStatusBadge } from './RubricStatusBadge'

interface RubricVersionRowProps {
  index: number
  item: RubricListItem
  onOpen: () => void
  onClone: () => void
  onDelete: () => void
}

/** Một dòng trong kho rubric (A1). Đổi tên / kỳ áp dụng làm trong popup chi tiết */
export function RubricVersionRow({ index, item, onOpen, onClone, onDelete }: RubricVersionRowProps) {
  const invalidReason = `Tổng trọng số (${item.totalWeight}%) chưa đạt 100% hoặc còn nhóm chưa có tiêu chí`

  return (
    <tr className="h-14 border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50/60">
      <td className="px-3 text-center text-[12.5px] font-semibold text-slate-500">{index}</td>

      <td className="px-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onOpen}
            title={item.name}
            className="min-w-0 cursor-pointer truncate text-left text-[13px] font-bold text-slate-800 hover:text-[#1565C0] hover:underline"
          >
            {item.name}
          </button>
          {!item.isValid && (
            <span role="img" title={invalidReason} aria-label={invalidReason} className="shrink-0">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-400">
          {item.criteriaCount} tiêu chí · {item.totalWeight}%
        </p>
      </td>

      <td className="px-3">
        <RubricStatusBadge status={item.status} label={item.statusLabel} />
      </td>

      <td className="px-3 text-center text-[12.5px] text-slate-700">
        {item.fromSemester ? (
          formatSemesterShort(item.fromSemester)
        ) : (
          <span className="italic text-slate-400">{formatSemesterRange(null, null)}</span>
        )}
      </td>

      {/* "Đến kỳ" null = chưa xác định → để trống */}
      <td className="px-3 text-center text-[12.5px] text-slate-700">{formatSemesterShort(item.toSemester)}</td>

      <td className="px-3 text-center">
        {item.semesterCount > 0 ? (
          <span className="text-[12px] font-semibold text-slate-700">
            {item.semesterCount} học kỳ · {item.sheetCount} phiếu chấm
          </span>
        ) : (
          <span className="text-[12px] italic text-slate-400">Chưa áp dụng</span>
        )}
      </td>

      <td className="px-3">
        <p className="truncate text-[11.5px] font-semibold text-slate-700" title={item.updatedByName ?? undefined}>
          {item.updatedByName ?? '–'}
        </p>
        {/* BE để updatedAt = null với rubric vừa tạo / nhân bản (A1 không có createdAt để thay) */}
        <p className="text-[10.5px] text-slate-400">{item.updatedAt ?? '–'}</p>
      </td>

      <td className="px-3">
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={onOpen}
            className="h-8 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 transition-colors hover:border-[#1565C0] hover:text-[#1565C0]"
          >
            Mở
          </button>
          <RubricActionMenu canDelete={item.canDelete} onClone={onClone} onDelete={onDelete} />
        </div>
      </td>
    </tr>
  )
}
