import { Search, X } from 'lucide-react'
import { Button, Input, Select } from '@/shared/components/ui'
import type { MajorOption, StudentStatusFilter } from '../types'
import { BATCH_OPTIONS, STATUS_OPTIONS, type StudentFilters } from '../utils/studentFilters'

interface StudentToolbarProps {
  filters: StudentFilters
  onChange: (patch: Partial<StudentFilters>) => void
  onReset: () => void
  showReset: boolean
  majors: MajorOption[] | undefined
  majorsLoading: boolean
}

export function StudentToolbar({
  filters,
  onChange,
  onReset,
  showReset,
  majors,
  majorsLoading,
}: StudentToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          type="search"
          value={filters.keyword}
          onChange={(e) => onChange({ keyword: e.target.value })}
          placeholder="Tìm theo mã SV, họ tên hoặc email..."
          aria-label="Tìm kiếm sinh viên"
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:flex lg:items-center">
        <Select
          value={filters.majorId}
          onChange={(e) => onChange({ majorId: e.target.value })}
          disabled={majorsLoading}
          aria-label="Lọc theo ngành"
          className="lg:w-52"
        >
          <option value="">{majorsLoading ? 'Đang tải ngành...' : 'Tất cả ngành'}</option>
          {majors?.map((major) => (
            <option key={major.publicId} value={major.publicId}>
              {major.name}
            </option>
          ))}
        </Select>

        <Select
          value={filters.batch}
          onChange={(e) => onChange({ batch: e.target.value })}
          aria-label="Lọc theo khóa"
          className="lg:w-36"
        >
          <option value="">Tất cả khóa</option>
          {BATCH_OPTIONS.map((batch) => (
            <option key={batch} value={batch}>
              {batch}
            </option>
          ))}
        </Select>

        <Select
          value={filters.status}
          onChange={(e) => onChange({ status: e.target.value as StudentStatusFilter })}
          aria-label="Lọc theo trạng thái"
          className="lg:w-44"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {showReset && (
        <Button variant="ghost" onClick={onReset} className="text-slate-600 lg:shrink-0">
          <X /> Xóa lọc
        </Button>
      )}
    </div>
  )
}
