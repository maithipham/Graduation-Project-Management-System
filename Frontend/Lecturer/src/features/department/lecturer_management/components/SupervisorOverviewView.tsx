import { useState, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Download,
  Minus,
  Search,
  SlidersHorizontal,
  Upload,
  UserCheck,
} from 'lucide-react'
import { Button } from '@/shared/components/ui'
import { toast } from '@/shared/components/feedback'
import { cn } from '@/shared/utils/cn'
import { getAvatarInitials, getAvatarColor, getTeacherPlainName } from '../utils/teacherDisplay'
import type { MajorOption, SemesterOption } from '@/features/department/student_management'
import type { SupervisorLecturer, SupervisorStudent } from '../types'
import { QuotaConfigModal } from './QuotaConfigModal'
import { AssignedStudentsModal } from './AssignedStudentsModal'
import { SemesterScopeFilter } from './SemesterScopeFilter'
import { ImportAdvisorsDialog } from './ImportAdvisorsDialog'

interface SupervisorOverviewViewProps {
  lecturers: SupervisorLecturer[]
  students: SupervisorStudent[]
  majors?: MajorOption[]
  selectedYear: string
  selectedSemesterId: string
  academicYears: string[]
  termsOfYear: SemesterOption[]
  isLoading?: boolean
  onYearChange: (year: string) => void
  onSemesterChange: (semesterId: string) => void
  onUpdateQuota: (id: string, quota: number) => void
  onRemoveLecturer: (id: string) => void
  onOpenWorkspace: () => void
}

const PAGE_SIZE_OPTIONS = [15, 25, 50]

export function SupervisorOverviewView({
  lecturers,
  students,
  majors,
  selectedYear,
  selectedSemesterId,
  academicYears,
  termsOfYear,
  isLoading,
  onYearChange,
  onSemesterChange,
  onUpdateQuota,
  onRemoveLecturer,
  onOpenWorkspace,
}: SupervisorOverviewViewProps) {
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [unitFilter, setUnitFilter] = useState<'all' | 'internal' | 'external'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'unassigned'>('all')

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(15)

  const queryClient = useQueryClient()
  const [configOpen, setConfigOpen] = useState(false)
  const [importAdvisorOpen, setImportAdvisorOpen] = useState(false)
  const [viewLecturer, setViewLecturer] = useState<SupervisorLecturer | null>(null)

  const currentSemesterName = useMemo(() => {
    const currentTerm = termsOfYear.find((t) => t.id === selectedSemesterId)
    if (currentTerm) {
      return `${currentTerm.name} (${selectedYear})`
    }
    return selectedSemesterId === 'all' ? 'Tất cả học kỳ' : 'Kỳ hiện tại'
  }, [termsOfYear, selectedSemesterId, selectedYear])

  // Lọc danh sách
  const filteredLecturers = useMemo(() => {
    return lecturers.filter((l) => {
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const mName = l.name.toLowerCase().includes(q)
        const mEmail = (l.email || '').toLowerCase().includes(q)
        const mDept = (l.department || '').toLowerCase().includes(q)
        if (!mName && !mEmail && !mDept) return false
      }

      if (unitFilter === 'internal') {
        if (l.category === 'univ_ext') return false
      } else if (unitFilter === 'external') {
        if (l.category !== 'univ_ext') return false
      }

      if (deptFilter !== 'all' && l.category !== 'univ_ext') {
        if (!l.department.toLowerCase().includes(deptFilter.toLowerCase())) return false
      }

      if (statusFilter === 'active' && (l.assigned || 0) === 0) return false
      if (statusFilter === 'unassigned' && (l.assigned || 0) > 0) return false

      return true
    })
  }, [lecturers, search, deptFilter, unitFilter, statusFilter])

  // Phân trang
  const totalElements = filteredLecturers.length
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize))
  const currentPage = Math.min(page, totalPages - 1)
  const pagedLecturers = filteredLecturers.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize,
  )

  const handleRemove = (e: React.MouseEvent, l: SupervisorLecturer) => {
    e.stopPropagation()
    if (l.assigned > 0) {
      toast.warning('Không thể loại bỏ giảng viên đang có sinh viên hướng dẫn!')
      return
    }
    if (window.confirm(`Bạn có chắc muốn loại bỏ giảng viên "${l.name}" khỏi danh sách GVHD của kỳ này?`)) {
      onRemoveLecturer(l.id)
      toast.success(`Đã loại bỏ giảng viên ${l.name} khỏi danh sách GVHD của kỳ`)
    }
  }

  const handleExport = () => {
    toast.success('Đã xuất danh sách giảng viên hướng dẫn.')
  }

  return (
    <div className="space-y-4">
      {/* 1. Thanh phía trên: Bộ lọc Năm học & Học kỳ (trái), Nút thao tác (phải) - Không có tiêu đề h1 */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <SemesterScopeFilter
          selectedYear={selectedYear}
          selectedSemesterId={selectedSemesterId}
          academicYears={academicYears}
          termsOfYear={termsOfYear}
          isLoading={isLoading}
          onYearChange={(y) => {
            onYearChange(y)
            setPage(0)
          }}
          onSemesterChange={(s) => {
            onSemesterChange(s)
            setPage(0)
          }}
        />

        {/* Nút hành động */}
        <div className="flex items-center gap-2.5 flex-wrap ml-auto">
          <Button
            type="button"
            onClick={() => setImportAdvisorOpen(true)}
            className="h-9 px-3.5 rounded-lg bg-sky-100 border border-sky-200 text-sky-800 text-xs font-semibold hover:bg-sky-200 transition inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Upload className="w-4 h-4 text-sky-700" />
            <span>Import File</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleExport}
            className="h-9 px-3.5 text-xs font-semibold text-slate-700 shadow-2xs"
          >
            <Download className="w-4 h-4 text-slate-500 mr-1" />
            Export File
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => setConfigOpen(true)}
            className="h-9 px-3.5 text-xs font-semibold text-slate-700 shadow-2xs"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-500 mr-1" />
            Thiết lập mặc định
          </Button>

          <Button
            type="button"
            onClick={onOpenWorkspace}
            className="h-9 px-4 bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-semibold shadow-xs"
          >
            <UserCheck className="w-4 h-4 mr-1.5" />
            Phân công GVHD
          </Button>
        </div>
      </div>

      {/* 2. Thanh tìm kiếm & bộ lọc */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2 h-9 flex-1 min-w-[240px] px-3 bg-white border border-slate-300 rounded-lg focus-within:border-[#1565C0] focus-within:ring-2 focus-within:ring-blue-100 transition shadow-2xs">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Tìm theo tên giảng viên, email, bộ môn..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            className="flex-1 bg-transparent outline-none text-xs text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value)
              setPage(0)
            }}
            aria-label="Lọc theo bộ môn"
            className="h-9 px-3 pr-8 bg-white border border-slate-300 rounded-lg text-xs font-medium outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100 transition text-slate-800 shadow-2xs cursor-pointer"
          >
            <option value="all">Tất cả bộ môn</option>
            {majors && majors.length > 0
              ? majors.map((m) => (
                  <option key={m.publicId} value={m.name}>
                    {m.name}
                  </option>
                ))
              : (
                <>
                  <option value="Kỹ thuật phần mềm">Kỹ thuật phần mềm</option>
                  <option value="Hệ thống thông tin">Hệ thống thông tin</option>
                  <option value="Khoa học máy tính">Khoa học máy tính</option>
                  <option value="Mạng & An toàn thông tin">Mạng & An toàn thông tin</option>
                </>
              )}
          </select>

          <select
            value={unitFilter}
            onChange={(e) => {
              setUnitFilter(e.target.value as 'all' | 'internal' | 'external')
              setPage(0)
            }}
            aria-label="Lọc theo đơn vị"
            className="h-9 px-3 pr-8 bg-white border border-slate-300 rounded-lg text-xs font-medium outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100 transition text-slate-800 shadow-2xs cursor-pointer"
          >
            <option value="all">Tất cả đơn vị</option>
            <option value="internal">Trong trường</option>
            <option value="external">Ngoài trường</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'all' | 'active' | 'unassigned')
              setPage(0)
            }}
            aria-label="Lọc theo trạng thái phân công"
            className="h-9 px-3 pr-8 bg-white border border-slate-300 rounded-lg text-xs font-medium outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100 transition text-slate-800 shadow-2xs cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hướng dẫn</option>
            <option value="unassigned">Chưa phân công</option>
          </select>
        </div>
      </div>

      {/* 3. Bảng danh sách GVHD 6 cột chuẩn */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px] sticky top-0">
              <tr>
                <th className="py-3 px-3 w-12 text-center">STT</th>
                <th
                  className="py-3 px-2 w-20 text-center"
                  aria-label="Học hàm / Học vị"
                  title="Học hàm / Học vị"
                />
                <th className="py-3 px-4 min-w-[240px]">Giảng viên hướng dẫn</th>
                <th className="py-3 px-4 min-w-[200px]">Đơn vị / Bộ môn</th>
                <th className="py-3 px-4 w-32 text-center">Hạn mức</th>
                <th className="py-3 px-4 w-40 text-left">Đang nhận</th>
                <th className="py-3 px-3 w-20 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Đang tải dữ liệu giảng viên hướng dẫn...
                  </td>
                </tr>
              ) : pagedLecturers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Chưa có giảng viên hướng dẫn nào trong học kỳ này.
                  </td>
                </tr>
              ) : (
                pagedLecturers.map((l, idx) => {
                  const assignedCount = l.assigned || 0
                  const pct = Math.min(100, Math.round((assignedCount / l.quota) * 100))
                  const progressColor =
                    assignedCount >= l.quota
                      ? 'bg-amber-500'
                      : assignedCount > 0
                        ? 'bg-emerald-500'
                        : 'bg-slate-300'

                  const initials = getAvatarInitials(l.name)
                  const avatarColor = getAvatarColor(l.name)
                  const isExternal = l.category === 'univ_ext'

                  return (
                    <tr
                      key={l.id}
                      onClick={() => setViewLecturer(l)}
                      className="hover:bg-blue-50/40 transition cursor-pointer group"
                      title="Nhấn vào hàng để xem danh sách sinh viên được phân công"
                    >
                      <td className="py-3.5 px-3 text-center font-bold text-slate-400 text-xs">
                        {currentPage * pageSize + idx + 1}
                      </td>

                      <td className="py-3.5 px-2 text-center">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold text-slate-700 bg-slate-100/90 border border-slate-200/80">
                          {l.title || '—'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={cn(
                              'w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs',
                              avatarColor,
                            )}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 group-hover:text-[#1565C0] transition truncate">
                              {getTeacherPlainName(l.name)}
                            </div>
                            <div className="text-[11.5px] text-slate-400 truncate">{l.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 text-xs">
                          {l.department || 'Đơn vị ngoài trường'}
                        </div>
                        <div
                          className={cn(
                            'text-[11px] font-medium',
                            isExternal ? 'text-amber-600' : 'text-blue-600',
                          )}
                        >
                          {isExternal ? 'Ngoài trường' : 'Trong trường'}
                        </div>
                      </td>

                      <td
                        className="py-3.5 px-4 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center justify-center gap-1.5">
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={l.quota}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1
                              onUpdateQuota(l.id, val)
                            }}
                            className="w-12 h-7 text-center font-bold text-slate-700 text-xs bg-white border border-slate-300 focus:border-[#1565C0] focus:ring-1 focus:ring-blue-100 rounded-md outline-none transition shadow-2xs"
                            title="Sửa hạn mức sinh viên"
                          />
                          <span className="text-xs text-slate-400 font-medium">SV</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="w-28">
                          <div className="text-xs font-bold text-slate-700 mb-1">
                            {assignedCount}/{l.quota} SV
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full transition-all duration-300', progressColor)}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td
                        className="py-3.5 px-3 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {assignedCount === 0 && (
                          <button
                            type="button"
                            onClick={(e) => handleRemove(e, l)}
                            title="Loại bỏ khỏi danh sách GVHD kỳ này (chỉ khi 0 SV)"
                            className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition mx-auto cursor-pointer"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Footer phân trang */}
        <div className="p-3.5 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap bg-slate-50/50 text-xs">
          <div className="text-slate-500 font-medium">
            Hiển thị{' '}
            <strong className="text-slate-800">
              {totalElements > 0 ? currentPage * pageSize + 1 : 0}–
              {Math.min((currentPage + 1) * pageSize, totalElements)}
            </strong>{' '}
            trên <strong className="text-slate-800">{totalElements}</strong> giảng viên
          </div>

          <div className="flex items-center gap-3">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPage(0)
              }}
              aria-label="Số dòng trên mỗi trang"
              className="h-8 px-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 outline-none cursor-pointer"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}/trang
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="h-8 px-2.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-white disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
              >
                Trước
              </button>

              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPage(i)}
                  className={cn(
                    'h-8 min-w-8 px-2 rounded-lg text-xs font-semibold transition cursor-pointer',
                    i === currentPage
                      ? 'bg-[#1565C0] text-white font-bold'
                      : 'border border-slate-200 text-slate-600 hover:bg-white',
                  )}
                >
                  {i + 1}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className="h-8 px-2.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-white disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ImportAdvisorsDialog
        open={importAdvisorOpen}
        onOpenChange={setImportAdvisorOpen}
        semesterId={selectedSemesterId}
        semesterName={currentSemesterName}
        lecturers={lecturers}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['supervisors'] })
        }}
      />
      <QuotaConfigModal
        open={configOpen}
        onOpenChange={setConfigOpen}
        semesterId={selectedSemesterId}
      />
      <AssignedStudentsModal
        lecturer={viewLecturer}
        students={students}
        open={Boolean(viewLecturer)}
        onOpenChange={(open) => !open && setViewLecturer(null)}
      />
    </div>
  )
}

