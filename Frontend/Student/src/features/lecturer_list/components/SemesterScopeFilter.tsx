import React from 'react'
import { Calendar, ChevronDown, Clock } from 'lucide-react'
import type { Semester } from '@/features/registration_management/types/semester.types'

export interface SemesterScopeFilterProps {
  selectedYear: string
  selectedSemesterId: string
  academicYears: string[]
  termsOfYear: Semester[]
  isLoading?: boolean
  allowAll?: boolean
  onYearChange: (year: string) => void
  onSemesterChange: (semesterId: string) => void
}

export const SemesterScopeFilter: React.FC<SemesterScopeFilterProps> = ({
  selectedYear,
  selectedSemesterId,
  academicYears,
  termsOfYear,
  isLoading = false,
  allowAll = true,
  onYearChange,
  onSemesterChange,
}) => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* 1. Chọn Năm học */}
      <div className="relative inline-flex items-center">
        <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
        <select
          value={selectedYear}
          onChange={(e) => onYearChange(e.target.value)}
          aria-label="Chọn năm học"
          className="h-9 pl-8 pr-7 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-[#0288D1] focus:ring-2 focus:ring-sky-100 transition shadow-2xs cursor-pointer appearance-none"
        >
          {allowAll && (
            <option value="all">
              {isLoading ? 'Đang tải...' : 'Tất cả năm học'}
            </option>
          )}
          {academicYears.map((year) => (
            <option key={year} value={year}>
              Năm {year.replace('-', '–')}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
      </div>

      {/* 2. Chọn Học kỳ */}
      <div className="relative inline-flex items-center">
        <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
        <select
          value={selectedSemesterId}
          onChange={(e) => onSemesterChange(e.target.value)}
          aria-label="Chọn học kỳ"
          className="h-9 pl-8 pr-7 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-[#0288D1] focus:ring-2 focus:ring-sky-100 transition shadow-2xs cursor-pointer appearance-none"
        >
          {allowAll && (
            <option value="all">
              {isLoading ? 'Đang tải...' : 'Tất cả học kỳ'}
            </option>
          )}
          {termsOfYear.map((s) => (
            <option key={s.publicId} value={s.publicId}>
              {s.term || s.name}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
      </div>
    </div>
  )
}

