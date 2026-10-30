import { Search } from 'lucide-react'
import { Input, Select } from '@/shared/components/ui'
import { cn } from '@/shared/utils/cn'
import type { MajorOption, StudentThesisStatus } from '../types'
import { STUDENT_STATUS_OPTIONS, type StudentFilters } from '../utils/studentFilters'

// Ô tìm kiếm và các ô lọc theo đặc tả: cao 36px, chữ 13px, viền slate-300, focus viền xanh + quầng sky
const FIELD_CLASS =
  'h-9 rounded-lg border-slate-300 bg-white text-[13px] font-semibold text-slate-800 shadow-none focus-visible:border-[#0288D1] focus-visible:ring-[3px] focus-visible:ring-sky-100 pr-8 pl-3'

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
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      {/* Ô tìm kiếm MSSV / Họ tên */}
      <div className="relative min-w-[250px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          type="search"
          value={filters.keyword}
          onChange={(e) => onChange({ keyword: e.target.value })}
          placeholder="Tìm theo MSSV hoặc họ tên..."
          aria-label="Tìm kiếm sinh viên"
          className={cn(FIELD_CLASS, 'pl-9 font-normal')}
        />
      </div>

      {/* Bộ 3 dropdown: Khóa, Bộ môn, Trạng thái (rộng vừa lựa chọn dài nhất) */}
      <div className="flex flex-wrap items-center gap-2.5">
        <Select
          value={filters.batch}
          onChange={(e) => onChange({ batch: e.target.value })}
          disabled={batchesLoading}
          aria-label="Lọc theo khóa"
          className={FIELD_CLASS}
          containerClassName="w-auto"
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
          className={FIELD_CLASS}
          containerClassName="w-auto"
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
          className={FIELD_CLASS}
          containerClassName="w-auto"
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
