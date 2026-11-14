import { Search, Upload } from 'lucide-react'
import { Button, Input, Select } from '@/shared/components/ui'
import type { FileType, TemplateFilters } from '../types'
import { FILE_TYPE_OPTIONS } from '../utils/templateCategory'

// Ô tìm kiếm / ô lọc theo bản thiết kế: cao 40px, bo 12px, chữ 13px, focus viền xanh + quầng blue-100
const FIELD_CLASS =
  'h-10 rounded-xl border-slate-200/90 bg-white text-[13px] text-slate-800 shadow-2xs focus-visible:border-[#1565C0] focus-visible:ring-2 focus-visible:ring-blue-100'

interface TemplateToolbarProps {
  filters: TemplateFilters
  onChange: (patch: Partial<TemplateFilters>) => void
  onUploadClick: () => void
}

/** Thanh tìm kiếm + lọc loại + nút "Tải lên tài liệu" */
export function TemplateToolbar({ filters, onChange, onUploadClick }: TemplateToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
      <div className="relative min-w-[280px] flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          type="search"
          value={filters.keyword}
          onChange={(e) => onChange({ keyword: e.target.value })}
          placeholder="Tìm theo tên tài liệu..."
          aria-label="Tìm theo tên tài liệu"
          className={`${FIELD_CLASS} pl-10 pr-4 placeholder:text-slate-400`}
        />
      </div>

      <Select
        value={filters.fileType}
        onChange={(e) => onChange({ fileType: e.target.value as FileType | '' })}
        aria-label="Lọc theo loại tài liệu"
        className={`${FIELD_CLASS} pl-3.5 pr-8 font-medium text-slate-700`}
        containerClassName="w-auto shrink-0"
      >
        <option value="">Tất cả loại</option>
        {FILE_TYPE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      <Button
        type="button"
        onClick={onUploadClick}
        className="h-10 shrink-0 rounded-xl bg-[#1565C0] px-4 text-[13px] font-bold text-white shadow-xs hover:bg-[#0D47A1]"
      >
        <Upload />
        Tải lên tài liệu
      </Button>
    </div>
  )
}
