import { Calculator, Calendar, UserRound } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import type { RubricDetail } from '../types'
import { RUBRIC_STATUS_META, formatSemesterRange } from '../utils/rubricHelpers'

interface RubricDetailHeaderProps {
  detail: RubricDetail
  /** Tên đang sửa (lưu cùng cây tiêu chí qua A5) */
  name: string
  readOnly: boolean
  onNameChange: (name: string) => void
}

/** Header popup chi tiết: tên (sửa được khi canEdit), trạng thái, khoảng kỳ áp dụng, người tạo / sửa */
export function RubricDetailHeader({ detail, name, readOnly, onNameChange }: RubricDetailHeaderProps) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-200 bg-slate-50/80 px-6 py-4 pr-14">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Calculator className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        {readOnly ? (
          <h2 className="truncate text-[17px] font-bold text-slate-900!" title={detail.name}>
            {detail.name}
          </h2>
        ) : (
          <input
            type="text"
            value={name}
            maxLength={255}
            aria-label="Tên mẫu rubric"
            placeholder="Nhập tên mẫu rubric..."
            onChange={(event) => onNameChange(event.target.value)}
            className="h-9 w-full max-w-lg rounded-lg border border-slate-200 bg-white px-2.5 text-[15px] font-bold text-slate-900 outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100"
          />
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-bold',
              RUBRIC_STATUS_META[detail.status].className,
            )}
          >
            {detail.statusLabel || RUBRIC_STATUS_META[detail.status].label}
          </span>

          <span className="flex items-center gap-1.5 rounded-lg bg-slate-100/90 px-2.5 py-1 text-[12px] text-slate-600">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            Áp dụng:{' '}
            <span className="font-semibold text-slate-700">
              {formatSemesterRange(detail.fromSemester, detail.toSemester)}
            </span>
          </span>

          {detail.semesterCount > 0 && (
            <span className="text-[12px] text-slate-500">
              {detail.semesterCount} học kỳ · {detail.sheetCount} phiếu chấm
            </span>
          )}
        </div>

        <p className="flex flex-wrap items-center gap-1 text-[11.5px] text-slate-400">
          <UserRound className="h-3 w-3" />
          Tạo bởi {detail.createdByName ?? '–'}
          {detail.createdAt ? ` lúc ${detail.createdAt}` : ''}
          {detail.updatedByName ? ` · Sửa gần nhất: ${detail.updatedByName}` : ''}
          {detail.updatedAt ? ` lúc ${detail.updatedAt}` : ''}
        </p>
      </div>
    </div>
  )
}
