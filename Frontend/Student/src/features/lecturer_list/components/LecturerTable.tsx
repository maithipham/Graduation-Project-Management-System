import React, { useState } from 'react'
import { Eye, Loader2, UserX } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import type { Lecturer } from '../types/lecturer.types'
import {
  cleanDepartmentName,
  getAvatarBgClass,
  getLecturerInitials,
} from '../services/lecturer.service'
import { LecturerDetailModal } from './LecturerDetailModal'

interface LecturerTableProps {
  lecturers: Lecturer[]
  startIndex: number
  endIndex: number
  totalItems: number
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  isLoading?: boolean
}

export const LecturerTable: React.FC<LecturerTableProps> = ({
  lecturers,
  startIndex,
  endIndex,
  totalItems,
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
}) => {
  const [selectedLecturer, setSelectedLecturer] = useState<Lecturer | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const handleOpenDetail = (lec: Lecturer) => {
    setSelectedLecturer(lec)
    setDetailOpen(true)
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex-1 min-h-0 flex flex-col">
      {/* Table Scroll Container */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[840px]">
          <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b border-slate-200 uppercase tracking-wider sticky top-0 z-10 shadow-2xs">
            <tr>
              <th className="py-3 px-3 w-12 text-center bg-slate-50">STT</th>
              <th className="py-3 px-2 w-24 text-center bg-slate-50">Học hàm / Học vị</th>
              <th className="py-3 px-4 min-w-[240px] bg-slate-50">Giảng viên hướng dẫn</th>
              <th className="py-3 px-4 min-w-[200px] bg-slate-50">Đơn vị / Bộ môn</th>
              <th className="py-3 px-4 w-28 text-center bg-slate-50">Hạn mức</th>
              <th className="py-3 px-4 w-36 text-left bg-slate-50">Đang nhận</th>
              <th className="py-3 px-3 w-24 text-center bg-slate-50">Thao tác</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white text-[13px]">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-slate-500">
                  <Loader2 className="w-8 h-8 text-[#0288D1] animate-spin mx-auto mb-2.5" />
                  <div className="text-xs font-semibold text-slate-700">
                    Đang tải danh sách giảng viên hướng dẫn...
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Hệ thống đang đồng bộ danh sách GVHD trong học kỳ được chọn
                  </div>
                </td>
              </tr>
            ) : lecturers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-slate-400">
                  <UserX className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <div className="text-xs font-semibold text-slate-600">
                    Không tìm thấy giảng viên hướng dẫn phù hợp
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Vui lòng thử thay đổi từ khóa, ngành hoặc phạm vi học kỳ
                  </div>
                </td>
              </tr>
            ) : (
              lecturers.map((lec, idx) => {
                const isExternal = lec.origin === 'external'
                const cleanDept = cleanDepartmentName(lec.department || '')
                const unitOrDept = isExternal
                  ? lec.unit || 'Đơn vị ngoài trường'
                  : cleanDept && cleanDept.toLowerCase() !== 'bộ môn' && cleanDept.toLowerCase() !== 'bo mon'
                    ? `Bộ môn ${cleanDept}`
                    : 'Bộ môn Kỹ thuật phần mềm'

                const max = lec.maxStudents || 20
                const count = lec.assignedCount ?? 0
                const pct = Math.min(100, Math.round((count / max) * 100))
                const progressColor =
                  count >= max
                    ? 'bg-amber-500'
                    : count > 0
                      ? 'bg-emerald-500'
                      : 'bg-slate-300'

                const displayTitle = lec.degree?.trim() || '—'

                return (
                  <tr
                    key={lec.id}
                    onClick={() => handleOpenDetail(lec)}
                    className="hover:bg-sky-50/40 transition cursor-pointer group border-b border-slate-100"
                    title="Nhấn để xem thông tin chi tiết giảng viên"
                  >
                    {/* 1. STT */}
                    <td className="py-3.5 px-3 text-center text-xs font-bold text-slate-400">
                      {startIndex + idx + 1}
                    </td>

                    {/* 2. Học hàm / Học vị */}
                    <td className="py-3.5 px-2 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold text-slate-700 bg-slate-100/90 border border-slate-200/80">
                        {displayTitle}
                      </span>
                    </td>

                    {/* 3. Giảng viên hướng dẫn (Avatar + Tên + Email) */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs',
                            getAvatarBgClass(lec.name),
                          )}
                        >
                          {getLecturerInitials(lec.name)}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 group-hover:text-[#0288D1] transition truncate">
                            {lec.name}
                          </div>
                          <div className="text-[11.5px] text-slate-400 font-mono mt-0.5 truncate">
                            {lec.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 4. Đơn vị / Bộ môn (kèm badge Trong trường / Ngoài trường) */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 text-xs">
                        {unitOrDept}
                      </div>
                      <div className="mt-1">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold',
                            isExternal
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200',
                          )}
                        >
                          {isExternal ? 'Ngoài trường' : 'Trong trường'}
                        </span>
                      </div>
                    </td>

                    {/* 5. Hạn mức */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="font-semibold text-slate-700 text-xs">
                        {max} SV
                      </span>
                    </td>

                    {/* 6. Đang nhận (kèm thanh tiến độ) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="w-28">
                        <div className="text-xs font-bold text-slate-700 mb-1">
                          {count}/{max} SV
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full transition-all duration-300', progressColor)}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* 7. Thao tác */}
                    <td
                      className="py-3.5 px-3 text-center whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(lec)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition shadow-2xs cursor-pointer"
                        title="Xem chi tiết giảng viên"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Chi tiết</span>
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="shrink-0 px-5 py-3.5 bg-slate-50/50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          Hiển thị{' '}
          <span className="font-bold text-slate-700">
            {totalItems > 0 ? `${startIndex + 1} - ${endIndex} / ${totalItems}` : '0 / 0'}
          </span>{' '}
          giảng viên
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-xs transition cursor-pointer"
          >
            ‹ Trước
          </button>

          <span className="px-2 text-xs font-medium text-slate-600">
            Trang <span className="font-bold text-slate-800">{currentPage}</span> / {totalPages}
          </span>

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-xs transition cursor-pointer"
          >
            Sau ›
          </button>
        </div>
      </div>

      {/* Modal chi tiết giảng viên */}
      <LecturerDetailModal
        lecturer={selectedLecturer}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  )
}
