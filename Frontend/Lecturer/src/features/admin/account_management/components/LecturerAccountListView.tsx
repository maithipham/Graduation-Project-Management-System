import { useState, useMemo } from 'react'
import { Eye, Plus, Search, Upload, X } from 'lucide-react'
import {
  Button,
  Card,
  Input,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TablePagination,
} from '@/shared/components/ui'
import { useDebounce } from '@/shared/hooks'
import { cn } from '@/shared/utils/cn'
import { useMajors } from '@/features/department/student_management'
import { useTeachers } from '@/features/department/lecturer_management/hooks/useTeachers'
import { CreateTeacherDialog } from '@/features/department/lecturer_management/components/CreateTeacherDialog'
import { ImportTeacherDialog } from '@/features/department/lecturer_management/components/ImportTeacherDialog'
import { TeacherDetailDialog } from '@/features/department/lecturer_management/components/TeacherDetailDialog'
import {
  getAvatarColor,
  getAvatarInitials,
  getTeacherPlainName,
} from '@/features/department/lecturer_management/utils/teacherDisplay'
import type { TeacherListItem, UnitTypeFilter } from '@/features/department/lecturer_management/types'

const PAGE_SIZE = 10
const HEAD_CLASS = 'font-bold text-slate-600 text-xs uppercase'

export function LecturerAccountListView() {
  // Bộ lọc
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMajor, setSelectedMajor] = useState('')
  const [selectedUnit, setSelectedUnit] = useState<UnitTypeFilter>('')
  const [selectedStatus, setSelectedStatus] = useState<'' | 'active' | 'inactive'>('')
  const [page, setPage] = useState(0)

  const debouncedSearch = useDebounce(searchTerm, 300)

  // Danh sách ngành từ API
  const { data: majors, isPending: majorsLoading } = useMajors()

  // Lấy tất cả giáo viên từ API qua GET /teacher (không filter semesterId)
  const { data, isPending, isError, isPlaceholderData } = useTeachers({
    keyword: debouncedSearch.trim() || undefined,
    majorId: selectedMajor || undefined,
    unitType: selectedUnit || undefined,
    page,
    size: PAGE_SIZE,
  })

  // Dialogs
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [detailTeacherId, setDetailTeacherId] = useState<string | undefined>()

  // Lọc client trạng thái nếu cần
  const teachersContent = data?.content
  const displayTeachers = useMemo(() => {
    if (!teachersContent) return []
    if (!selectedStatus) return teachersContent
    return teachersContent.filter((t) => (selectedStatus === 'active' ? t.status : !t.status))
  }, [teachersContent, selectedStatus])

  const hasActiveFilters = Boolean(searchTerm || selectedMajor || selectedUnit || selectedStatus)

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedMajor('')
    setSelectedUnit('')
    setSelectedStatus('')
    setPage(0)
  }

  const withFirstPage =
    <T,>(setter: (val: T) => void) =>
    (val: T) => {
      setter(val)
      setPage(0)
    }

  return (
    <div className="space-y-4">
      {/* Nút hành động trên cùng: Import file & Thêm giảng viên */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsImportOpen(true)}
          className="h-10 text-xs font-medium gap-1.5 bg-white shadow-xs"
        >
          <Upload className="h-4 w-4" />
          <span>Import giảng viên</span>
        </Button>

        <Button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="h-10 bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-semibold gap-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm giảng viên</span>
        </Button>
      </div>

      <Card className="overflow-hidden rounded-lg border-slate-200 shadow-xs">
        {/* Thanh tìm kiếm & lọc */}
        <div className="flex flex-col gap-3 p-4 bg-white border-b border-slate-200 rounded-t-lg">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Search */}
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm theo họ tên, email, SĐT, mã GV..."
                value={searchTerm}
                onChange={(e) => withFirstPage(setSearchTerm)(e.target.value)}
                className="pl-9 h-10 text-sm bg-slate-50/50 border-slate-200 focus:bg-white"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => withFirstPage(setSearchTerm)('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Bộ lọc ngành, đơn vị, trạng thái */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Lọc Bộ môn (Ngành) */}
              <Select
                value={selectedMajor}
                onChange={(e) => withFirstPage(setSelectedMajor)(e.target.value)}
                className="w-auto min-w-[150px] h-10 bg-white border-slate-200 text-sm font-medium"
              >
                <option value="">{majorsLoading ? 'Đang tải ngành...' : '-- Tất cả bộ môn --'}</option>
                {majors?.map((major) => (
                  <option key={major.publicId} value={major.publicId}>
                    {major.name}
                  </option>
                ))}
              </Select>

              {/* Lọc Đơn vị */}
              <Select
                value={selectedUnit}
                onChange={(e) => withFirstPage(setSelectedUnit)(e.target.value as UnitTypeFilter)}
                className="w-auto min-w-[130px] h-10 bg-white border-slate-200 text-sm font-medium"
              >
                <option value="">-- Tất cả đơn vị --</option>
                <option value="INTERNAL">Trong trường</option>
                <option value="EXTERNAL">Ngoài trường</option>
              </Select>

              {/* Lọc Trạng thái */}
              <Select
                value={selectedStatus}
                onChange={(e) => withFirstPage(setSelectedStatus)(e.target.value as '' | 'active' | 'inactive')}
                className="w-auto min-w-[130px] h-10 bg-white border-slate-200 text-sm font-medium"
              >
                <option value="">-- Tất cả trạng thái --</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </Select>

              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetFilters}
                  className="h-10 text-xs font-semibold text-slate-600 gap-1"
                >
                  <X className="h-3.5 w-3.5" />
                  Xóa lọc
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Bảng danh sách giáo viên */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80 border-b border-slate-200">
              <TableRow>
                <TableHead className={cn(HEAD_CLASS, 'w-12 text-center')}>STT</TableHead>
                <TableHead
                  className={cn(HEAD_CLASS, 'w-20 text-center')}
                  aria-label="Học hàm / Học vị"
                  title="Học hàm / Học vị"
                />
                <TableHead className={HEAD_CLASS}>Họ và tên</TableHead>
                <TableHead className={HEAD_CLASS}>Số điện thoại</TableHead>
                <TableHead className={HEAD_CLASS}>Bộ môn / Đơn vị</TableHead>
                <TableHead className={HEAD_CLASS}>Trạng thái</TableHead>
                <TableHead className={cn(HEAD_CLASS, 'w-20 text-center')}>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                Array.from({ length: 5 }, (_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7} className="py-4">
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : isError || !data ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-slate-400 text-sm">
                    Không tải được danh sách giảng viên từ hệ thống.
                  </TableCell>
                </TableRow>
              ) : displayTeachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-slate-400 text-sm">
                    Không tìm thấy giảng viên nào phù hợp.
                  </TableCell>
                </TableRow>
              ) : (
                displayTeachers.map((teacher: TeacherListItem, index: number) => {
                  const avatarColor = getAvatarColor(teacher.name)
                  const initials = getAvatarInitials(teacher)

                  return (
                    <tr
                      key={teacher.publicId || teacher.id || index}
                      onClick={() => setDetailTeacherId(teacher.publicId)}
                      className="border-b border-slate-100 hover:bg-slate-50/70 transition cursor-pointer"
                    >
                      {/* STT */}
                      <TableCell className="w-12 text-center text-slate-400 font-medium text-xs">
                        {page * PAGE_SIZE + index + 1}
                      </TableCell>

                      {/* Học hàm / Học vị (đặt trước tên, không cần tên cột) */}
                      <TableCell className="w-20 text-center">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold text-slate-700 bg-slate-100/90 border border-slate-200/80">
                          {teacher.academicTitle || '—'}
                        </span>
                      </TableCell>

                      {/* Họ và tên */}
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-2xs',
                              avatarColor,
                            )}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-sm hover:text-[#1565C0] transition">
                              {getTeacherPlainName(teacher)}
                            </div>
                            <div className="text-xs text-slate-400 truncate">{teacher.email}</div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Số điện thoại */}
                      <TableCell className="text-sm text-slate-600 font-medium">
                        {teacher.phone || '—'}
                      </TableCell>

                      {/* Bộ môn / Đơn vị */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-xs font-semibold text-slate-800">
                            {teacher.majorName || teacher.organization || '—'}
                          </div>
                          <div>
                            <span
                              className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium',
                                teacher.isInternal
                                  ? 'text-sky-700 bg-sky-50 border border-sky-200'
                                  : 'text-amber-800 bg-amber-50 border border-amber-200',
                              )}
                            >
                              {teacher.isInternal ? 'Trong trường' : 'Ngoài trường'}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Trạng thái */}
                      <TableCell>
                        {teacher.status ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                            Không hoạt động
                          </span>
                        )}
                      </TableCell>

                      {/* Thao tác */}
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailTeacherId(teacher.publicId)}
                          className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </tr>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Phân trang */}
        {data && !data.empty && (
          <TablePagination
            data={data}
            disabled={isPlaceholderData}
            onPageChange={setPage}
            itemLabel="giảng viên"
          />
        )}
      </Card>

      {/* Dialog Thêm giảng viên thủ công (Admin không truyền lockedMajor -> Bắt buộc chọn ngành từ danh sách) */}
      <CreateTeacherDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        majors={majors}
        majorsLoading={majorsLoading}
        lockedMajor={undefined}
      />

      {/* Dialog Import giảng viên (Admin có quyền ACCESS_ALL_MAJORS nên import được tất cả các ngành) */}
      <ImportTeacherDialog open={isImportOpen} onOpenChange={setIsImportOpen} />

      {/* Dialog Chi tiết giảng viên */}
      <TeacherDetailDialog
        publicId={detailTeacherId}
        onClose={() => setDetailTeacherId(undefined)}
      />
    </div>
  )
}
