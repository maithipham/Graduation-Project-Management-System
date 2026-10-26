import React, { useState, useMemo } from 'react'
import {
  Edit,
  Plus,
  Search,
  X,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Select } from '@/shared/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { useFacultyMajors } from '../hooks/useFaculties'
import type { Faculty, Major } from '../types/faculty.types'

const PAGE_SIZE = 10

interface FacultyDetailViewProps {
  faculty: Faculty
  onBack?: () => void
  onEditFaculty: (faculty: Faculty) => void
  onOpenAddMajor: () => void
  onEditMajor: (major: Major) => void
}

export const FacultyDetailView: React.FC<FacultyDetailViewProps> = ({
  faculty,
  onEditFaculty,
  onOpenAddMajor,
  onEditMajor,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Gọi API lấy danh sách chuyên ngành thực tế từ DB của khoa này
  const facultyApiId = faculty.backendId || String(faculty.id)
  const { data: apiMajorsData, isLoading: isLoadingMajors } = useFacultyMajors(facultyApiId)

  // Kết hợp: Ưu tiên dữ liệu từ backend DB
  const majors: Major[] = useMemo(() => {
    if (apiMajorsData?.content && apiMajorsData.content.length > 0) {
      return apiMajorsData.content.map((m, idx) => ({
        id: idx + 1,
        backendId: m.id,
        name: m.name,
        description: m.description || '',
        status: m.statusCode === 'ACTIVE' ? 'active' : 'inactive',
      }))
    }
    // Nếu khoa chưa có trên API, lấy từ local store của khoa
    return faculty.majors || []
  }, [apiMajorsData, faculty.majors])

  const filteredMajors = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return majors.filter((m) => {
      const matchSearch =
        !term ||
        m.name.toLowerCase().includes(term) ||
        m.description.toLowerCase().includes(term)

      const matchStatus = !selectedStatus || m.status === selectedStatus
      return matchSearch && matchStatus
    })
  }, [majors, searchTerm, selectedStatus])

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredMajors.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE
  const paginatedMajors = filteredMajors.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  )

  return (
    <div className="space-y-6">

      {/* Faculty Summary Card */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <CardTitle className="text-xl text-slate-900 font-bold">
              {faculty.name}
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Khoa chuyên môn trực thuộc Trường Đại học Thủy Lợi
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onEditFaculty(faculty)}
            className="text-xs font-semibold text-slate-700 border-slate-200 hover:bg-slate-50 gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <Edit className="h-3.5 w-3.5 text-blue-600" />
            <span>Cập nhật thông tin khoa</span>
          </Button>
        </CardHeader>

        <CardContent className="pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
              <span className="block text-xs font-medium text-slate-400 mb-1">
                Trưởng khoa
              </span>
              <span className="text-sm font-bold text-slate-800">
                {faculty.dean}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
              <span className="block text-xs font-medium text-slate-400 mb-1">
                Trạng thái hoạt động
              </span>
              {faculty.status === 'active' ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                  Đang hoạt động
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-slate-300" />
                  Không hoạt động
                </span>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
              <span className="block text-xs font-medium text-slate-400 mb-1">
                Quy mô đào tạo
              </span>
              <span className="text-sm font-bold text-blue-700">
                {isLoadingMajors ? '...' : `${majors.length} chuyên ngành`}
              </span>
            </div>

            <div className="sm:col-span-2 lg:col-span-3 p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
              <span className="block text-xs font-medium text-slate-400 mb-1">
                Giới thiệu chi tiết về khoa
              </span>
              <p className="text-sm text-slate-700 leading-relaxed">
                {faculty.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Majors Card */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <div className="flex flex-col gap-3 p-4 bg-white border-b border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-2.5 min-w-[280px]">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="search"
                  placeholder="Tìm theo tên hoặc mô tả ngành..."
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
                aria-label="Lọc theo trạng thái ngành"
              >
                <option value="">Trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </Select>
            </div>

            <Button
              type="button"
              onClick={onOpenAddMajor}
              className="h-10 bg-[#1565C0] hover:bg-[#0D47A1] text-white text-sm font-semibold gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm ngành</span>
            </Button>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <div>
              Danh sách chuyên ngành:{' '}
              <span className="font-semibold text-slate-800">
                {filteredMajors.length}
              </span>{' '}
              ngành
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead className="w-14 text-center font-bold text-slate-600 text-xs uppercase">
                No.
              </TableHead>
              <TableHead className="w-56 font-bold text-slate-600 text-xs uppercase">
                Tên ngành
              </TableHead>
              <TableHead className="font-bold text-slate-600 text-xs uppercase">
                Chi tiết về ngành
              </TableHead>
              <TableHead className="w-32 font-bold text-slate-600 text-xs uppercase">
                Trạng thái
              </TableHead>
              <TableHead className="w-24 text-center font-bold text-slate-600 text-xs uppercase whitespace-nowrap">
                Hành động
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoadingMajors ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-500 text-sm">
                  Đang tải danh sách chuyên ngành từ cơ sở dữ liệu...
                </TableCell>
              </TableRow>
            ) : filteredMajors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-400 text-sm">
                  Chưa có chuyên ngành nào trong cơ sở dữ liệu.
                </TableCell>
              </TableRow>
            ) : (
              paginatedMajors.map((major, idx) => (
                <TableRow key={major.id} className="hover:bg-slate-50/80 transition-colors">
                  <TableCell className="text-center font-medium text-slate-500 text-xs">
                    {startIndex + idx + 1}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                      <BookOpen className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>{major.name}</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-slate-600 text-xs leading-relaxed max-w-md">
                    {major.description}
                  </TableCell>

                  <TableCell>
                    {major.status === 'active' ? (
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

                  <TableCell className="text-center whitespace-nowrap">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onEditMajor(major)}
                      className="h-8 text-xs font-semibold text-slate-700 border-slate-200 hover:bg-slate-100 whitespace-nowrap"
                    >
                      Cập nhật
                    </Button>
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
      </Card>
    </div>
  )
}
