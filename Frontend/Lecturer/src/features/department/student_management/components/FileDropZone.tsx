import { useState, type DragEvent } from 'react'
import { FileSpreadsheet, UploadCloud, X } from 'lucide-react'
import { Button } from '@/shared/components/ui'
import { cn } from '@/shared/utils/cn'
import { formatBytes } from '@/shared/utils'

interface FileDropZoneProps {
  file: File | undefined
  onSelect: (file: File) => void
  onClear: () => void
  accept?: string
  hint?: string
  // Do FormField tự gắn vào (nối nhãn, báo lỗi)
  id?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

/** Khung kéo-thả / bấm để chọn 1 file. Đặt trong FormField để có nhãn và dòng lỗi đỏ bên dưới */
export function FileDropZone({
  file,
  onSelect,
  onClear,
  accept,
  hint,
  id,
  'aria-invalid': invalid,
  'aria-describedby': describedBy,
}: FileDropZoneProps) {
  const [dragging, setDragging] = useState(false)

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) onSelect(dropped)
  }

  if (file) {
    return (
      <div
        id={id}
        className={cn(
          'flex items-center gap-3 rounded-lg border bg-slate-50 p-3',
          invalid ? 'border-[#DC2626]' : 'border-slate-200',
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-emerald-100">
          <FileSpreadsheet className="h-5 w-5 text-emerald-700" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">{file.name}</p>
          <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClear}
          aria-label="Bỏ chọn file"
          aria-describedby={describedBy}
        >
          <X />
        </Button>
      </div>
    )
  }

  return (
    <label
      htmlFor={id}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors',
        dragging
          ? 'border-blue-500 bg-blue-50'
          : invalid
            ? 'border-[#DC2626] bg-red-50/40'
            : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50',
      )}
    >
      <UploadCloud className={cn('h-9 w-9', dragging ? 'text-blue-600' : 'text-slate-400')} />
      <p className="text-sm text-slate-700">
        <span className="font-semibold text-blue-600">Bấm để chọn file</span> hoặc kéo thả vào đây
      </p>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      <input
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        aria-invalid={invalid}
        aria-describedby={describedBy}
        onChange={(e) => {
          const selected = e.target.files?.[0]
          // Xóa giá trị để chọn lại đúng file cũ vẫn kích hoạt onChange
          e.target.value = ''
          if (selected) onSelect(selected)
        }}
      />
    </label>
  )
}
