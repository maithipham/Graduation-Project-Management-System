import type { SemesterOption } from '@/features/department/student_management'

interface SemesterScopeFilterProps {
  selectedYear: string
  selectedSemesterId: string
  academicYears: string[]
  termsOfYear: SemesterOption[]
  isLoading?: boolean
  allowAll?: boolean
  onYearChange: (year: string) => void
  onSemesterChange: (semesterId: string) => void
}

export function SemesterScopeFilter({
  selectedYear,
  selectedSemesterId,
  academicYears,
  termsOfYear,
  isLoading,
  allowAll = true,
  onYearChange,
  onSemesterChange,
}: SemesterScopeFilterProps) {
  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      <select
        value={selectedYear}
        onChange={(e) => onYearChange(e.target.value)}
        aria-label="Chọn năm học"
        className="h-9 px-3 pr-8 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100 transition shadow-2xs cursor-pointer"
      >
        {allowAll && (
          <option value="all">
            {isLoading ? 'Đang tải năm học...' : 'Tất cả năm học'}
          </option>
        )}
        {academicYears.map((year) => (
          <option key={year} value={year}>
            {year.replace('-', '–')}
          </option>
        ))}
      </select>

      <select
        value={selectedSemesterId}
        onChange={(e) => onSemesterChange(e.target.value)}
        aria-label="Chọn học kỳ"
        className="h-9 px-3 pr-8 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100 transition shadow-2xs cursor-pointer"
      >
        {allowAll && (
          <option value="all">
            {isLoading ? 'Đang tải học kỳ...' : 'Tất cả học kỳ'}
          </option>
        )}
        {termsOfYear.map((s) => (
          <option key={s.publicId} value={s.publicId}>
            {s.term}
          </option>
        ))}
      </select>
    </div>
  )
}

