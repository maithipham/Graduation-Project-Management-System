import React from 'react'
import { ChevronDown, Search } from 'lucide-react'
import type { Semester } from '@/features/registration_management/types/semester.types'
import {
  MAJOR_DEFAULT_OPTIONS,
  ORIGIN_OPTIONS,
  type LecturerOriginFilter,
} from '../types/lecturer.types'
import { SemesterScopeFilter } from './SemesterScopeFilter'

interface LecturerFilterBarProps {
  // Bộ lọc Năm học & Học kỳ
  selectedYear: string
  selectedSemesterId: string
  academicYears: string[]
  termsOfYear: Semester[]
  isSemestersLoading?: boolean
  onYearChange: (year: string) => void
  onSemesterChange: (semesterId: string) => void

  // Bộ lọc Tìm kiếm & Ngành & Đơn vị
  search: string
  department: string
  origin: LecturerOriginFilter
  onSearchChange: (value: string) => void
  onDepartmentChange: (value: string) => void
  onOriginChange: (value: LecturerOriginFilter) => void
  departmentOptions?: ReadonlyArray<{ value: string; label: string }>
}

export const LecturerFilterBar: React.FC<LecturerFilterBarProps> = ({
  selectedYear,
  selectedSemesterId,
  academicYears,
  termsOfYear,
  isSemestersLoading = false,
  onYearChange,
  onSemesterChange,
  search,
  department,
  origin,
  onSearchChange,
  onDepartmentChange,
  onOriginChange,
  departmentOptions = MAJOR_DEFAULT_OPTIONS,
}) => {
  return (
    <div className="space-y-2.5 mb-3 shrink-0">
      {/* Hàng 1: Bộ lọc Năm học & Học kỳ (filter theo kì năm học như màn của Trưởng bộ môn) */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Phạm vi học kỳ:
          </span>
          <SemesterScopeFilter
            selectedYear={selectedYear}
            selectedSemesterId={selectedSemesterId}
            academicYears={academicYears}
            termsOfYear={termsOfYear}
            isLoading={isSemestersLoading}
            onYearChange={onYearChange}
            onSemesterChange={onSemesterChange}
          />
        </div>
      </div>

      {/* Hàng 2: Ô tìm kiếm, Dropdown Ngành (lấy từ BE), Dropdown Đơn vị (Trong trường/Ngoài trường) */}
      <div className="flex flex-wrap gap-2.5 items-center justify-between">
        {/* Ô tìm kiếm */}
        <div className="flex items-center gap-2 h-9 flex-1 min-w-[240px] px-3 bg-white border border-slate-300 rounded-lg focus-within:border-[#0288D1] focus-within:ring-[3px] focus-within:ring-sky-100 transition shadow-2xs">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="search"
            autoComplete="off"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo tên giảng viên, học hàm, email, bộ môn..."
            aria-label="Tìm kiếm giảng viên theo tên, học hàm, email, bộ môn"
            className="flex-1 bg-transparent outline-none text-xs text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* 2 Bộ lọc: Ngành (lấy từ BE) & Phạm vi (Trong trường / Ngoài trường) */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {/* 1. Dropdown Ngành */}
          <div className="relative inline-flex items-center">
            <select
              value={department}
              onChange={(e) => onDepartmentChange(e.target.value)}
              aria-label="Lọc theo ngành"
              className="h-9 px-3 pr-8 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 outline-none appearance-none cursor-pointer shadow-2xs hover:border-slate-400 focus:border-[#0288D1] focus:ring-2 focus:ring-sky-100 transition"
            >
              {departmentOptions.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* 2. Dropdown Phạm vi (Trong trường / Ngoài trường) */}
          <div className="relative inline-flex items-center">
            <select
              value={origin}
              onChange={(e) => onOriginChange(e.target.value as LecturerOriginFilter)}
              aria-label="Lọc theo phạm vi đơn vị"
              className="h-9 px-3 pr-8 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 outline-none appearance-none cursor-pointer shadow-2xs hover:border-slate-400 focus:border-[#0288D1] focus:ring-2 focus:ring-sky-100 transition"
            >
              {ORIGIN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  )
}
