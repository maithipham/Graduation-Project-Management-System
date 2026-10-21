import { Search, X } from 'lucide-react'
import { Button, Input, Select } from '@/shared/components/ui'
import type { MajorOption } from '@/features/department/student_management'
import {
  ORGANIZATION_OPTIONS,
  type OrganizationFilter,
  type TeacherFilters,
} from '../utils/teacherFilters'

interface TeacherToolbarProps {
  filters: TeacherFilters
  onChange: (patch: Partial<TeacherFilters>) => void
  onReset: () => void
  showReset: boolean
  majors: MajorOption[] | undefined
  majorsLoading: boolean
}

export function TeacherToolbar({
  filters,
  onChange,
  onReset,
  showReset,
  majors,
  majorsLoading,
}: TeacherToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          type="search"
          value={filters.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Tìm theo họ tên giáo viên..."
          aria-label="Tìm kiếm giáo viên"
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:items-center">
        {/* Giá trị option gửi thẳng làm organizationType (internal / external) qua toOrganizationParams */}
        <Select
          value={filters.organization}
          onChange={(e) => onChange({ organization: e.target.value as OrganizationFilter })}
          aria-label="Lọc theo đơn vị công tác"
          className="lg:w-44"
        >
          <option value="">Tất cả đơn vị</option>
          {ORGANIZATION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        {/* BE lọc theo tên khoa (majorName) nên gửi tên, không gửi publicId */}
        <Select
          value={filters.majorName}
          onChange={(e) => onChange({ majorName: e.target.value })}
          disabled={majorsLoading}
          aria-label="Lọc theo khoa"
          className="lg:w-56"
        >
          <option value="">{majorsLoading ? 'Đang tải khoa...' : 'Tất cả khoa'}</option>
          {majors?.map((major) => (
            <option key={major.publicId} value={major.name}>
              {major.name}
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
