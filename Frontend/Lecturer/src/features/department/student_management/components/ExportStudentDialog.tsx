import { useState, type ReactNode } from 'react'
import { FileSpreadsheet } from 'lucide-react'
import { toast } from '@/shared/components/feedback/toast.store'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui'
import { cn } from '@/shared/utils/cn'
import type { MajorOption } from '../types'
import { describeFilters, type StudentFilters } from '../utils/studentFilters'

type ExportScope = 'filtered' | 'all'

interface ExportStudentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Bộ lọc đang chọn trên trang danh sách */
  filters: StudentFilters
  majors: MajorOption[] | undefined
}

export function ExportStudentDialog({ open, onOpenChange, filters, majors }: ExportStudentDialogProps) {
  const [scope, setScope] = useState<ExportScope>('filtered')

  const handleOpenChange = (value: boolean) => {
    if (!value) setScope('filtered')
    onOpenChange(value)
  }

  const handleExport = () => {
    // BE chưa có API export (dự kiến GET /student/export nhận cùng bộ lọc với GET /student)
    toast.info('Chức năng export sẽ được hỗ trợ sau')
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export danh sách sinh viên</DialogTitle>
          <DialogDescription>Xuất danh sách sinh viên ra file Excel.</DialogDescription>
        </DialogHeader>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium text-slate-700">Phạm vi</legend>
          <ScopeOption
            checked={scope === 'filtered'}
            onSelect={() => setScope('filtered')}
            title="Theo bộ lọc hiện tại"
          >
            <ul className="mt-1.5 space-y-0.5 text-xs text-slate-500">
              {describeFilters(filters, majors).map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </ScopeOption>
          <ScopeOption checked={scope === 'all'} onSelect={() => setScope('all')} title="Tất cả sinh viên">
            <p className="mt-1 text-xs text-slate-500">Bỏ qua bộ lọc, xuất toàn bộ sinh viên.</p>
          </ScopeOption>
        </fieldset>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Định dạng</p>
          <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50/60 p-3">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-medium text-slate-800">Excel (.xlsx)</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleExport}>Export</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface ScopeOptionProps {
  checked: boolean
  onSelect: () => void
  title: string
  children: ReactNode
}

function ScopeOption({ checked, onSelect, title, children }: ScopeOptionProps) {
  return (
    <label
      className={cn(
        'flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors',
        checked ? 'border-blue-500 bg-blue-50/60' : 'border-slate-200 hover:bg-slate-50',
      )}
    >
      <input
        type="radio"
        name="export-scope"
        checked={checked}
        onChange={onSelect}
        className="mt-0.5 h-4 w-4 accent-blue-600"
      />
      <div>
        <p className="text-sm font-medium text-slate-900">{title}</p>
        {children}
      </div>
    </label>
  )
}
