import React, { useState, useMemo } from 'react'
import { Search, Plus, ChevronRight, ChevronLeft, X } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { Input } from '@/shared/components/ui/input'
import { Select } from '@/shared/components/ui/select'
import { Button } from '@/shared/components/ui/button'
import type { Faculty } from '../types/faculty.types'

const PAGE_SIZE = 10

interface FacultyListViewProps {
  faculties: Faculty[]
  onSelectFaculty: (faculty: Faculty) => void
  onOpenAddModal: () => void
}

export const FacultyListView: React.FC<FacultyListViewProps> = ({
  faculties,
  onSelectFaculty,
  onOpenAddModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const filteredFaculties = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return faculties.filter((f) => {
      const matchSearch =
        !term ||
        f.code.toLowerCase().includes(term) ||
        f.name.toLowerCase().includes(term) ||
        f.dean.toLowerCase().includes(term)

      const matchStatus = !selectedStatus || f.status === selectedStatus
      return matchSearch && matchStatus
    })
  }, [faculties, searchTerm, selectedStatus])

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredFaculties.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE
  const paginatedFaculties = filteredFaculties.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  )

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 p-4 bg-white border-b border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2.5 min-w-[280px]">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Tìm theo mã khoa, tên khoa hoặc trưởng khoa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-8 h-10 w-full bg-slate-50/70 border-slate-200 focus:bg-white"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                  aria-label="Xóa tìm kiếm"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-auto min-w-[130px] h-10 bg-white border-slate-200 text-sm font-medium shrink-0"
              aria-label="Lọc theo trạng thái khoa"
            >
              <option value="">Trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={onOpenAddModal}
              className="h-10 bg-[#1565C0] hover:bg-[#0D47A1] text-white text-sm font-semibold gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm khoa</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <div>
            Tổng kết quả:{' '}
            <span className="font-semibold text-slate-800">{filteredFaculties.length}</span> khoa
          </div>
          {(searchTerm || selectedStatus) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('')
                setSelectedStatus('')
              }}
              className="text-blue-600 hover:underline cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/80">
            <TableHead className="w-14 text-center font-bold text-slate-600 text-xs uppercase">
              No.
            </TableHead>
            <TableHead className="w-28 font-bold text-slate-600 text-xs uppercase">
              Mã khoa
            </TableHead>
            <TableHead className="font-bold text-slate-600 text-xs uppercase">
              Tên khoa
            </TableHead>
            <TableHead className="font-bold text-slate-600 text-xs uppercase">
              Trưởng khoa
            </TableHead>
            <TableHead className="font-bold text-slate-600 text-xs uppercase">
              Số chuyên ngành
            </TableHead>
            <TableHead className="font-bold text-slate-600 text-xs uppercase">
              Trạng thái
            </TableHead>
            <TableHead className="w-12 text-center" />
          </TableRow>
        </TableHeader>

        <TableBody>
          {filteredFaculties.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-32 text-center text-slate-400 text-sm">
                Không tìm thấy khoa đào tạo phù hợp.
              </TableCell>
            </TableRow>
          ) : (
            paginatedFaculties.map((faculty, idx) => (
              <TableRow
                key={faculty.id}
                onClick={() => onSelectFaculty(faculty)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelectFaculty(faculty)
                  }
                }}
                tabIndex={0}
                className="cursor-pointer hover:bg-blue-50/50 transition-colors group"
                title="Nhấp để xem chi tiết khoa và danh sách chuyên ngành"
              >
                <TableCell className="text-center font-medium text-slate-500 text-xs">
                  {startIndex + idx + 1}
                </TableCell>

                <TableCell>
                  <span className="font-bold font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs border border-blue-200">
                    {faculty.code}
                  </span>
                </TableCell>

                <TableCell>
                  <span className="font-bold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">
                    {faculty.name}
                  </span>
                </TableCell>

                <TableCell className="text-slate-600 text-sm font-medium">
                  {faculty.dean}
                </TableCell>

                <TableCell>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                    {faculty.majors.length} chuyên ngành
                  </span>
                </TableCell>

                <TableCell>
                  {faculty.status === 'active' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Hoạt động
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                      Không hoạt động
                    </span>
                  )}
                </TableCell>

                <TableCell className="text-right pr-4">
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination Footer */}
      <div className="flex items-center justify-center px-4 py-3 bg-white border-t border-slate-200">
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            disabled={safeCurrentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="h-8 px-2 text-xs"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline ml-1">Trước</span>
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  page === safeCurrentPage
                    ? 'bg-[#1565C0] text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={safeCurrentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="h-8 px-2 text-xs"
          >
            <span className="hidden sm:inline mr-1">Sau</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
