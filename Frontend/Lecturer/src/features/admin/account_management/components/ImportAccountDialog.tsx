import { useState, useId, type DragEvent } from 'react'
import { FileSpreadsheet, Info, UploadCloud, X } from 'lucide-react'
import { toast } from '@/shared/components/feedback/toast.store'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
} from '@/shared/components/ui'
import { cn } from '@/shared/utils/cn'
import { formatBytes } from '@/shared/utils'

export type ImportAccountTarget = 'student' | 'lecturer'

const STUDENT_IMPORT_COLUMNS = [
  'Mã sinh viên',
  'Họ và tên đệm',
  'Tên',
  'Email',
  'Số điện thoại',
  'Khóa',
  'Lớp',
  'Ngành',
]

const LECTURER_IMPORT_COLUMNS = [
  'Họ và tên',
  'Email',
  'Số điện thoại',
  'Loại giảng viên (Trong trường / Ngoài trường)',
  'Chuyên ngành (nếu trong trường)',
  'Đơn vị công tác (nếu ngoài trường)',
]

interface ImportAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Loại tài khoản cần import (theo trang Giảng viên / Sinh viên đang mở) */
  target: ImportAccountTarget
}

const TARGET_LABEL: Record<ImportAccountTarget, string> = {
  student: 'sinh viên',
  lecturer: 'giảng viên',
}

export function ImportAccountDialog({ open, onOpenChange, target }: ImportAccountDialogProps) {
  const formId = useId()
  const targetLabel = TARGET_LABEL[target]
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setSelectedFile(null)
      setErrorMsg(null)
    }
    onOpenChange(value)
  }

  const handleSelectFile = (file: File) => {
    setErrorMsg(null)
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
      setErrorMsg('File import phải có định dạng .xlsx, .xls hoặc .csv')
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg('File import vượt quá dung lượng cho phép (50MB)')
      return
    }
    setSelectedFile(file)
  }

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleSelectFile(file)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      setErrorMsg('Vui lòng chọn file trước khi import')
      return
    }
    toast.success(`Đã nhận file danh sách ${targetLabel}: ${selectedFile.name}`)
    handleOpenChange(false)
  }

  const activeColumns = target === 'student' ? STUDENT_IMPORT_COLUMNS : LECTURER_IMPORT_COLUMNS

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import danh sách {targetLabel}</DialogTitle>
        </DialogHeader>

        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
          {/* Kéo thả file */}
          <FormField label={`Tải lên file danh sách ${targetLabel}`} required error={errorMsg ?? undefined}>
            {selectedFile ? (
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-emerald-100">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500">{formatBytes(selectedFile.size)}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedFile(null)}
                  aria-label="Bỏ chọn file"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={cn(
                  'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer',
                  dragging
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/50',
                )}
              >
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleSelectFile(f)
                  }}
                  className="sr-only"
                />
                <div className="rounded-full bg-blue-100 p-2.5 text-blue-600">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Kéo thả file vào đây hoặc <span className="text-blue-600 underline">chọn từ máy tính</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hỗ trợ file .xlsx, .xls, .csv (tối đa 50MB) cho danh sách{' '}
                    <span className="font-semibold text-blue-700">
                      {targetLabel}
                    </span>
                  </p>
                </div>
              </label>
            )}
          </FormField>

          {/* Hướng dẫn các cột theo từng role */}
          <div className="flex gap-3 rounded-lg border border-blue-100 bg-blue-50/60 p-4 text-sm text-slate-700">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <div className="space-y-2">
              <p>
                Cấu trúc file mẫu cho{' '}
                <span className="font-semibold text-blue-900">
                  {targetLabel}
                </span>{' '}
                gồm <span className="font-semibold">{activeColumns.length} cột</span> theo thứ tự:
              </p>
              <ol className="flex flex-wrap gap-1.5">
                {activeColumns.map((column, index) => (
                  <li
                    key={column}
                    className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-800"
                  >
                    {index + 1}. {column}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={!selectedFile} className="bg-[#1565C0] hover:bg-[#0D47A1] text-white">
              Import {targetLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

