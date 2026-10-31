import { useState, type ReactNode } from 'react'
import { Download, FileSpreadsheet, Filter, Users } from 'lucide-react'
import { Button, Dialog, DialogContent } from '@/shared/components/ui'
import { cn } from '@/shared/utils/cn'
import type { MajorOption } from '@/features/department'
import { useExportStudentAccounts } from '../hooks/useAccounts'
import {
  ACCOUNT_STATUS_FILTER_OPTIONS,
  type StudentAccountExportParams,
} from '../types/account.types'

type ExportScope = 'filtered' | 'all'

interface ExportStudentAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Bộ lọc đang áp dụng cho bảng (đã bỏ ô trống), đúng tham số gửi GET /student/account */
  filters: StudentAccountExportParams
  majors: MajorOption[] | undefined
  /** Số sinh viên khớp bộ lọc (totalElements của bảng), chưa tải xong thì undefined */
  filteredCount: number | undefined
}

function hasActiveFilters(filters: StudentAccountExportParams): boolean {
  return Boolean(
    filters.keyword || filters.batch || filters.majorId || filters.status !== undefined,
  )
}

/** Mô tả bộ lọc bằng chữ, ví dụ ["Bộ môn: Kỹ thuật phần mềm", "Khóa: K64", "Trạng thái: Hoạt động"] */
function describeFilters(filters: StudentAccountExportParams, majors: MajorOption[] = []): string[] {
  const majorName = majors.find((m) => m.publicId === filters.majorId)?.name
  const statusLabel =
    filters.status === undefined
      ? 'Tất cả'
      : ACCOUNT_STATUS_FILTER_OPTIONS.find((s) => s.value === String(filters.status))?.label
  return [
    filters.keyword && `Từ khóa: "${filters.keyword}"`,
    `Bộ môn: ${filters.majorId ? (majorName ?? 'Đã chọn') : 'Tất cả bộ môn'}`,
    `Khóa: ${filters.batch || 'Tất cả khóa'}`,
    `Trạng thái: ${statusLabel}`,
  ].filter((item): item is string => Boolean(item))
}

/**
 * Popup Export tài khoản sinh viên (GET /student/account/export): chọn xuất theo bộ lọc đang áp dụng
 * hoặc toàn bộ danh sách (không gửi tham số lọc nào). Giao diện giống popup Export của Trưởng bộ môn
 */
export function ExportStudentAccountDialog({
  open,
  onOpenChange,
  filters,
  majors,
  filteredCount,
}: ExportStudentAccountDialogProps) {
  const filtered = hasActiveFilters(filters)
  // undefined = người dùng chưa chọn → mặc định theo bộ lọc nếu đang lọc, không thì toàn bộ
  const [pickedScope, setPickedScope] = useState<ExportScope>()
  const scope = pickedScope ?? (filtered ? 'filtered' : 'all')
  // Bộ lọc không khớp sinh viên nào → file rỗng, không cho export (chưa biết số thì vẫn cho bấm)
  const emptyFiltered = scope === 'filtered' && filteredCount === 0

  const exportAccounts = useExportStudentAccounts()
  const exporting = exportAccounts.isPending

  const handleOpenChange = (value: boolean) => {
    if (!value && exporting) return
    if (!value) setPickedScope(undefined)
    onOpenChange(value)
  }

  const handleExport = () => {
    // "Toàn bộ" = không gửi tham số lọc nào → BE xuất tất cả sinh viên
    exportAccounts.mutate(scope === 'filtered' ? filters : {}, {
      onSuccess: () => handleOpenChange(false),
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* gap-0: bỏ khoảng cách 16px mặc định giữa header / nội dung / footer của DialogContent */}
      <DialogContent className="max-h-[92vh] max-w-xl gap-0 overflow-y-auto rounded-2xl bg-white p-0 shadow-2xl">
        <div className="sticky top-0 z-20 flex items-start gap-3.5 border-b border-slate-200 bg-white px-5 py-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E3F2FD] text-[#1565C0]">
            <Download className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[16px] font-bold tracking-tight text-slate-800">
              Export danh sách sinh viên
            </h3>
            <p className="mt-0.5 text-[12.5px] text-slate-500">
              Xuất tài khoản sinh viên ra file Excel (.xlsx)
            </p>
          </div>
        </div>

        <div className="space-y-4 bg-white px-5 py-4">
          <fieldset disabled={exporting} className="space-y-2.5">
            <legend className="mb-2 text-[13px] font-semibold text-slate-700">Phạm vi export</legend>

            <ScopeOption
              value="filtered"
              checked={scope === 'filtered'}
              onSelect={setPickedScope}
              icon={<Filter className="h-4 w-4" />}
              title="Export theo bộ lọc"
              badge={filteredCount !== undefined ? `${filteredCount} sinh viên` : undefined}
              badgeDanger={filteredCount === 0}
            >
              {filtered ? (
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {describeFilters(filters, majors).map((item) => (
                    <li
                      key={item}
                      className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11.5px] font-medium text-slate-600"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-[12.5px] text-slate-500">
                  Chưa áp dụng bộ lọc nào — kết quả sẽ giống export toàn bộ.
                </p>
              )}
              {emptyFiltered && (
                <p className="mt-1.5 text-xs font-semibold text-[#DC2626]">
                  Không có sinh viên nào khớp bộ lọc, không thể export file rỗng.
                </p>
              )}
            </ScopeOption>

            <ScopeOption
              value="all"
              checked={scope === 'all'}
              onSelect={setPickedScope}
              icon={<Users className="h-4 w-4" />}
              title="Export toàn bộ danh sách"
            >
              <p className="mt-1 text-[12.5px] text-slate-500">
                Bỏ qua bộ lọc, xuất tất cả tài khoản sinh viên trong hệ thống.
              </p>
            </ScopeOption>
          </fieldset>

          <div className="flex items-center gap-2.5 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-[12.5px] text-slate-600">
            <FileSpreadsheet className="h-4 w-4 shrink-0 text-emerald-600" />
            Định dạng file: <span className="font-semibold text-slate-800">Excel (.xlsx)</span>
          </div>
        </div>

        <div className="sticky bottom-0 z-20 flex justify-end gap-2.5 border-t border-slate-200 bg-slate-50/70 px-5 py-3">
          <Button
            type="button"
            variant="outline"
            disabled={exporting}
            onClick={() => handleOpenChange(false)}
            className="h-9 rounded-lg border border-slate-300 bg-white px-4 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={emptyFiltered || exporting}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#1565C0] px-4 text-[13px] font-semibold text-white shadow-sm shadow-[#1565C0]/25 hover:bg-[#0D47A1] disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            {exporting ? 'Đang xuất file...' : 'Export'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface ScopeOptionProps {
  value: ExportScope
  checked: boolean
  onSelect: (value: ExportScope) => void
  icon: ReactNode
  title: string
  /** Chữ nhỏ bên phải tiêu đề, ví dụ "12 sinh viên" */
  badge?: string
  /** Tô đỏ badge (ví dụ "0 sinh viên") */
  badgeDanger?: boolean
  children: ReactNode
}

function ScopeOption({ value, checked, onSelect, icon, title, badge, badgeDanger, children }: ScopeOptionProps) {
  return (
    <label
      className={cn(
        'flex cursor-pointer gap-3 rounded-xl border p-3.5 transition-colors',
        checked
          ? 'border-[#1565C0] bg-blue-50/60 ring-1 ring-[#1565C0]/20'
          : 'border-slate-200 hover:bg-slate-50',
      )}
    >
      <input
        type="radio"
        name="account-export-scope"
        value={value}
        checked={checked}
        onChange={() => onSelect(value)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[#1565C0]"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={checked ? 'text-[#1565C0]' : 'text-slate-500'}>{icon}</span>
          <span className="text-[13.5px] font-semibold text-slate-800">{title}</span>
          {badge && (
            <span
              className={cn(
                'ml-auto rounded-full px-2 py-0.5 text-[11.5px] font-semibold tabular-nums',
                badgeDanger ? 'bg-red-50 text-[#DC2626]' : 'bg-[#E3F2FD] text-[#1565C0]',
              )}
            >
              {badge}
            </span>
          )}
        </div>
        {children}
      </div>
    </label>
  )
}
