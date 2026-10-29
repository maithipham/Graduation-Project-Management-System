import { Search } from 'lucide-react'
import { Input, Select } from '@/shared/components/ui'
import { cn } from '@/shared/utils/cn'
import type { MajorOption, StudentThesisStatus } from '../types'
import { STUDENT_STATUS_OPTIONS, type StudentFilters } from '../utils/studentFilters'

// Ô tìm kiếm và các ô lọc theo đặc tả: cao 36px, chữ 13px, viền slate-300, focus viền xanh + quầng sky
const FIELD_CLASS =
  'h-9 rounded-lg border-slate-300 text-[13px] text-slate-800 shadow-none focus-visible:border-[#0288D1] focus-visible:ring-[3px] focus-visible:ring-sky-100'

interface StudentToolbarProps {
  filters: StudentFilters
  onChange: (patch: Partial<StudentFilters>) => void
  batches: string[] | undefined
  batchesLoading: boolean
  majors: MajorOption[] | undefined
  majorsLoading: boolean
}

export function StudentToolbar({
  filters,
  onChange,
  batches,
  batchesLoading,
  majors,
  majorsLoading,
}: StudentToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative min-w-[250px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          type="search"
          value={filters.keyword}
          onChange={(e) => onChange({ keyword: e.target.value })}
          placeholder="Tìm theo MSSV hoặc họ tên..."
          aria-label="Tìm kiếm sinh viên"
          className={cn(FIELD_CLASS, 'pl-9')}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:flex lg:items-center">
        <Select
          value={filters.batch}
          onChange={(e) => onChange({ batch: e.target.value })}
          disabled={batchesLoading}
          aria-label="Lọc theo khóa"
          className={cn(FIELD_CLASS, 'font-medium')}
          containerClassName="lg:w-40 lg:shrink-0"
        >
          <option value="">{batchesLoading ? 'Đang tải khóa...' : 'Tất cả khóa'}</option>
          {batches?.map((batch) => (
            <option key={batch} value={batch}>
              {batch}
            </option>
          ))}
        </Select>

        <Select
          value={filters.majorId}
          onChange={(e) => onChange({ majorId: e.target.value })}
          disabled={majorsLoading}
          aria-label="Lọc theo bộ môn"
          className={cn(FIELD_CLASS, 'font-medium')}
          containerClassName="lg:w-60 lg:shrink-0"
        >
          <option value="">{majorsLoading ? 'Đang tải bộ môn...' : 'Tất cả bộ môn'}</option>
          {majors?.map((major) => (
            <option key={major.publicId} value={major.publicId}>
              {major.name}
            </option>
          ))}
        </Select>

        <Select
          value={filters.status}
          onChange={(e) => onChange({ status: e.target.value as StudentThesisStatus | '' })}
          aria-label="Lọc theo trạng thái"
          className={cn(FIELD_CLASS, 'font-medium')}
          containerClassName="lg:w-64 lg:shrink-0"
        >
          <option value="">Tất cả trạng thái</option>
          {STUDENT_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  )
}
