import React from 'react'
import { ChevronDown, Search } from 'lucide-react'
import {
  DEPARTMENT_OPTIONS,
  ORIGIN_OPTIONS,
  type LecturerOriginFilter,
} from '../types/lecturer.types'

interface LecturerFilterBarProps {
  search: string
  department: string
  origin: LecturerOriginFilter
  onSearchChange: (value: string) => void
  onDepartmentChange: (value: string) => void
  onOriginChange: (value: LecturerOriginFilter) => void
}

export const LecturerFilterBar: React.FC<LecturerFilterBarProps> = ({
  search,
  department,
  origin,
  onSearchChange,
  onDepartmentChange,
  onOriginChange,
}) => {
  return (
    <div className="flex flex-wrap gap-2.5 items-center justify-between mb-2 shrink-0">
      {/* Ô tìm kiếm */}
      <div className="flex items-center gap-2 h-9 flex-1 min-w-[240px] px-3 bg-white border border-slate-300 rounded-lg focus-within:border-[#0288D1] focus-within:ring-[3px] focus-within:ring-sky-100 transition shadow-xs">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="search"
          autoComplete="off"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm theo tên, email..."
          aria-label="Tìm kiếm giảng viên theo tên hoặc email"
          className="flex-1 bg-transparent outline-hidden text-[13px] text-slate-800 placeholder-slate-400"
        />
      </div>

      {/* 2 Bộ lọc: Bộ môn & Phạm vi (Trong trường / Ngoài trường) */}
      <div className="flex items-center gap-2.5 flex-wrap shrink-0">
        {/* 1. Dropdown Bộ môn / Ngành */}
        <div className="relative inline-flex items-center">
          <select
            value={department}
            onChange={(e) => onDepartmentChange(e.target.value)}
            aria-label="Lọc theo bộ môn"
            className="h-9 px-3 pr-8 bg-white border border-slate-300 rounded-lg text-[13px] font-medium text-slate-800 outline-hidden appearance-none cursor-pointer shadow-xs hover:border-slate-400 focus:border-[#0288D1] focus:ring-[3px] focus:ring-sky-100 transition"
          >
            {DEPARTMENT_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* 2. Dropdown Phạm vi (Trong trường / Ngoài trường) */}
        <div className="relative inline-flex items-center">
          <select
            value={origin}
            onChange={(e) => onOriginChange(e.target.value as LecturerOriginFilter)}
            aria-label="Lọc theo phạm vi đơn vị"
            className="h-9 px-3 pr-8 bg-white border border-slate-300 rounded-lg text-[13px] font-medium text-slate-800 outline-hidden appearance-none cursor-pointer shadow-xs hover:border-slate-400 focus:border-[#0288D1] focus:ring-[3px] focus:ring-sky-100 transition"
          >
            {ORIGIN_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>
    </div>
  )
}

