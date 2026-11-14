import { Search, X } from 'lucide-react'
import { Button, Input, Select } from '@/shared/components/ui'
import type { MajorOption } from '@/features/department/student_management'
import {
  UNIT_TYPE_OPTIONS,
  type TeacherFilters,
} from '../utils/teacherFilters'
import type { UnitTypeFilter } from '../types'

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
  const keywordValue = filters.keyword ?? filters.name ?? ''

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      {/* Ô tìm kiếm: Tìm theo họ tên, email, SĐT, mã GV */}
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          type="search"
          value={keywordValue}
          onChange={(e) => {
            const val = e.target.value
            onChange({ keyword: val, name: val })
          }}
          placeholder="Tìm theo tên, email..."
          aria-label="Tìm kiếm giáo viên"
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:items-center">
        {/* Dropdown Ngành (Bộ môn) */}
        <Select
          value={filters.majorId || ''}
          onChange={(e) => {
            const val = e.target.value
            const selectedMajor = majors?.find((m) => m.publicId === val)
            onChange({
              majorId: val,
              majorName: selectedMajor ? selectedMajor.name : '',
            })
          }}
          disabled={majorsLoading}
          aria-label="Lọc theo ngành"
          containerClassName="lg:w-60 lg:shrink-0"
        >
          <option value="">
            {majorsLoading ? 'Đang tải ngành...' : 'Tất cả ngành'}
          </option>
          {majors?.map((major) => (
            <option key={major.publicId} value={major.publicId}>
              {major.name}
            </option>
          ))}
        </Select>

        {/* Dropdown Đơn vị: Trong trường / Ngoài trường */}
        <Select
          value={filters.unitType || ''}
          onChange={(e) => {
            const val = e.target.value as UnitTypeFilter
            const org = val === 'INTERNAL' ? 'internal' : val === 'EXTERNAL' ? 'external' : ''
            onChange({ unitType: val, organization: org })
          }}
          aria-label="Lọc theo đơn vị công tác"
          containerClassName="lg:w-44 lg:shrink-0"
        >
          {UNIT_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        {/* Dropdown Trạng thái phân công: Tất cả / Chưa phân công / Đã phân công */}
        <Select
          value={
            filters.isAssigned === undefined
              ? ''
              : filters.isAssigned
                ? 'assigned'
                : 'unassigned'
          }
          onChange={(e) => {
            const val = e.target.value
            const isAssigned =
              val === 'assigned' ? true : val === 'unassigned' ? false : undefined
            onChange({ isAssigned })
          }}
          aria-label="Lọc theo trạng thái phân công"
          containerClassName="lg:w-44 lg:shrink-0"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="unassigned">Chưa phân công</option>
          <option value="assigned">Đã phân công</option>
        </Select>
      </div>

      {showReset && (
        <Button
          variant="ghost"
          onClick={onReset}
          className="text-slate-600 lg:shrink-0"
        >
          <X className="w-4 h-4 mr-1" /> Xóa lọc
        </Button>
      )}
    </div>
  )
}
