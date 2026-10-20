import React, { useState, useRef, useEffect } from 'react'
import { MoreVertical, Edit2, PlayCircle } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { formatDate } from '@/shared/utils/formatDate'
import type { Semester } from '../types/semester.types'

interface SemesterTableProps {
  semesters: Semester[]
  onEditSemester: (semester: Semester) => void
  onActivateSemester: (semester: Semester) => void
}

export const SemesterTable: React.FC<SemesterTableProps> = ({
  semesters,
  onEditSemester,
  onActivateSemester,
}) => {
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdownId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getStatusBadge = (status: Semester['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Đang diễn ra
          </span>
        )
      case 'upcoming':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
            Chưa bắt đầu
          </span>
        )
      case 'ended':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            Đã kết thúc
          </span>
        )
    }
  }

  return (
    <div className="relative overflow-visible" ref={dropdownRef}>
      <Table containerClassName="overflow-visible">
        <TableHeader>
          <TableRow className="bg-slate-50/80">
            <TableHead className="w-14 text-center font-bold text-slate-600 text-xs uppercase">
              No.
            </TableHead>
            <TableHead className="font-bold text-slate-600 text-xs uppercase">
              Tên học kỳ
            </TableHead>
            <TableHead className="font-bold text-slate-600 text-xs uppercase">
              Thời gian bắt đầu
            </TableHead>
            <TableHead className="font-bold text-slate-600 text-xs uppercase">
              Thời gian kết thúc
            </TableHead>
            <TableHead className="font-bold text-slate-600 text-xs uppercase">
              Trạng thái
            </TableHead>
            <TableHead className="w-20 text-center font-bold text-slate-600 text-xs uppercase whitespace-nowrap">
              Hành động
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {semesters.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center text-slate-400 text-sm">
                Không tìm thấy học kỳ nào phù hợp với bộ lọc.
              </TableCell>
            </TableRow>
          ) : (
            semesters.map((semester, idx) => {
              const isMenuOpen = openDropdownId === semester.id
              const isUpcoming = semester.status === 'upcoming'

              return (
                <TableRow
                  key={semester.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <TableCell className="text-center font-medium text-slate-500 text-xs">
                    {idx + 1}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                      <span>{semester.name}</span>
                      {semester.status === 'active' && (
                        <span className="text-[10px] font-semibold bg-blue-600 text-white px-2 py-0.5 rounded-full ml-1">
                          Hiện tại
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-slate-600 text-sm">
                    {formatDate(semester.startDate)}
                  </TableCell>

                  <TableCell className="text-slate-600 text-sm">
                    {formatDate(semester.endDate)}
                  </TableCell>

                  <TableCell>{getStatusBadge(semester.status)}</TableCell>

                  <TableCell className="text-center relative">
                    {isUpcoming ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenDropdownId(isMenuOpen ? null : semester.id)
                          }
                          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                          aria-label="Thao tác học kỳ"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {isMenuOpen && (
                          <div
                            className={`absolute right-4 z-50 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-xl animate-in fade-in-0 zoom-in-95 text-left ${
                              idx >= Math.max(0, semesters.length - 2)
                                ? 'bottom-8 origin-bottom-right'
                                : 'top-10 origin-top-right'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdownId(null)
                                onEditSemester(semester)
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-700 cursor-pointer whitespace-nowrap"
                            >
                              <Edit2 className="h-3.5 w-3.5 text-blue-600" />
                              <span>Sửa thông tin</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdownId(null)
                                onActivateSemester(semester)
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 cursor-pointer whitespace-nowrap"
                            >
                              <PlayCircle className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Kích hoạt học kỳ</span>
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="p-1.5 text-slate-300 cursor-not-allowed"
                        title="Học kỳ đã bắt đầu hoặc đã kết thúc không thể chỉnh sửa"
                      >
                        <MoreVertical className="h-4 w-4 opacity-40" />
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
