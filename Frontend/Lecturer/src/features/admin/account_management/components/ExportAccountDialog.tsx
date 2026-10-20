import { useState, type ReactNode } from 'react'
import { FileSpreadsheet } from 'lucide-react'
import { toast } from '@/shared/components/feedback/toast.store'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui'
import { cn } from '@/shared/utils/cn'

type ExportScope = 'filtered' | 'all'

interface ExportAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  totalFiltered: number
  totalAll: number
  onExport: (scope: ExportScope) => void
}

export function ExportAccountDialog({
  open,
  onOpenChange,
  totalFiltered,
  totalAll,
  onExport,
}: ExportAccountDialogProps) {
  const [scope, setScope] = useState<ExportScope>('filtered')

  const handleOpenChange = (value: boolean) => {
    if (!value) setScope('filtered')
    onOpenChange(value)
  }

  const handleExport = () => {
    onExport(scope)
    toast.success('Xuất file thành công')
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export danh sách tài khoản</DialogTitle>
        </DialogHeader>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium text-slate-700">Phạm vi</legend>
          <ScopeOption
            checked={scope === 'filtered'}
            onSelect={() => setScope('filtered')}
            title="Theo bộ lọc hiện tại"
          >
            <p className="mt-1 text-xs text-slate-500">
              Xuất {totalFiltered} tài khoản khớp với kết quả tìm kiếm và bộ lọc hiện tại.
            </p>
          </ScopeOption>
          <ScopeOption
            checked={scope === 'all'}
            onSelect={() => setScope('all')}
            title="Tất cả tài khoản"
          >
            <p className="mt-1 text-xs text-slate-500">
              Bỏ qua bộ lọc, xuất toàn bộ {totalAll} tài khoản trong hệ thống.
            </p>
          </ScopeOption>
        </fieldset>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Định dạng</p>
          <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50/60 p-3">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-medium text-slate-800">CSV / Excel (.csv)</span>
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
        name="export-scope-account"
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
