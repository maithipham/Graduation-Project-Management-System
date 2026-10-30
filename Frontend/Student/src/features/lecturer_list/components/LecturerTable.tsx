import React from 'react'
import { UserX } from 'lucide-react'
import type { Lecturer } from '../types/lecturer.types'
import {
  cleanDepartmentName,
  getAvatarBgClass,
  getLecturerInitials,
} from '../services/lecturer.service'

interface LecturerTableProps {
  lecturers: Lecturer[]
  startIndex: number
  endIndex: number
  totalItems: number
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export const LecturerTable: React.FC<LecturerTableProps> = ({
  lecturers,
  startIndex,
  endIndex,
  totalItems,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
      {/* Table Scroll Container: chỉ cuộn duy nhất danh sách các dòng giảng viên */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600 border-collapse table-fixed min-w-[760px]">
          <thead className="sticky top-0 z-10 bg-slate-100 text-[11px] font-bold text-slate-700 border-b border-slate-200 uppercase tracking-wider shadow-2xs">
            <tr>
              <th className="w-[8%] min-w-[64px] px-4 py-3 text-center bg-slate-100">STT</th>
              <th className="w-[50%] min-w-[280px] px-6 py-3 text-left bg-slate-100">
                Họ và tên
              </th>
              <th className="w-[42%] min-w-[260px] px-6 py-3 text-left bg-slate-100">
                Đơn vị / Bộ môn
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {lecturers.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-12 text-center text-slate-400">
                  <UserX className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <div className="text-xs font-semibold text-slate-600">
                    Không tìm thấy giảng viên phù hợp
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Vui lòng thử tìm kiếm lại với từ khóa khác
                  </div>
                </td>
              </tr>
            ) : (
              lecturers.map((lec, idx) => {
                const isExternal = lec.origin === 'external'
                const unitOrDept = isExternal
                  ? lec.unit || 'ĐH Bách Khoa Hà Nội'
                  : cleanDepartmentName(lec.department || 'Kỹ thuật phần mềm')

                return (
                  <tr
                    key={lec.id}
                    className="hover:bg-slate-50/70 transition border-b border-slate-100"
                  >
                    {/* 1. STT */}
                    <td className="py-4 px-4 text-center text-xs font-bold text-slate-400">
                      {startIndex + idx + 1}
                    </td>

                    {/* 2. HỌ VÀ TÊN */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-8 h-8 rounded-full ${getAvatarBgClass(
                            lec.name,
                          )} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}
                        >
                          {getLecturerInitials(lec.name)}
                        </span>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800 text-[13.5px] truncate">
                            {lec.name}
                          </div>
                          <div className="text-[11.5px] text-slate-400 font-mono mt-0.5 truncate">
                            {lec.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 3. ĐƠN VỊ / BỘ MÔN */}
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-800 text-[13px]">{unitOrDept}</div>
                      {isExternal ? (
                        <div className="text-[11.5px] text-amber-600 font-medium mt-0.5">
                          Ngoài trường
                        </div>
                      ) : (
                        <div className="text-[11.5px] text-blue-600 font-medium mt-0.5">
                          Trong trường
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls: cố định ở chân bảng, 15 phần tử / trang */}
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
          <span className="px-2 text-xs font-bold text-slate-700">
            Trang {currentPage} / {totalPages}
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
    </div>
  )
}

