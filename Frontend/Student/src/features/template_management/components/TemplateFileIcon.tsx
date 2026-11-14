import { File, FileArchive, FileSpreadsheet, FileText, Presentation } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { getFileExtension } from '../utils/templateCategory'

const WORD = { Icon: FileText, className: 'bg-blue-50 text-blue-600 border-blue-100' }
const EXCEL = { Icon: FileSpreadsheet, className: 'bg-emerald-50 text-emerald-600 border-emerald-100' }
const POWERPOINT = { Icon: Presentation, className: 'bg-orange-50 text-orange-600 border-orange-100' }
const ARCHIVE = { Icon: FileArchive, className: 'bg-amber-50 text-amber-600 border-amber-100' }

// Màu ô icon theo đuôi file: Word xanh dương, PDF đỏ, Excel xanh lá, PowerPoint cam, file nén vàng
const ICON_STYLES: Record<string, { Icon: typeof File; className: string }> = {
  doc: WORD,
  docx: WORD,
  pdf: { Icon: FileText, className: 'bg-rose-50 text-rose-600 border-rose-100' },
  xls: EXCEL,
  xlsx: EXCEL,
  ppt: POWERPOINT,
  pptx: POWERPOINT,
  zip: ARCHIVE,
  rar: ARCHIVE,
}
const DEFAULT_STYLE = { Icon: File, className: 'bg-slate-50 text-slate-500 border-slate-200' }

/** Ô icon nhỏ cạnh tên tài liệu, đổi màu theo đuôi file (lấy từ tên file hoặc link) */
export function TemplateFileIcon({ fileName, className }: { fileName: string; className?: string }) {
  const { Icon, className: colorClass } = ICON_STYLES[getFileExtension(fileName)] ?? DEFAULT_STYLE
  return (
    <div
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
        colorClass,
        className,
      )}
    >
      <Icon className="h-[18px] w-[18px]" />
    </div>
  )
}
