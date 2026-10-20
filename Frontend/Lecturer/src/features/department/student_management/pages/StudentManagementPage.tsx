import { useState } from 'react'
import { Download, Plus, Upload } from 'lucide-react'
import { Button } from '@/shared/components/ui'
import { useDebounce } from '@/shared/hooks'
import { CreateStudentDialog } from '../components/CreateStudentDialog'
import { ExportStudentDialog } from '../components/ExportStudentDialog'
import { ImportStudentDialog } from '../components/ImportStudentDialog'
import { StudentDetailDialog } from '../components/StudentDetailDialog'
import { StudentTable } from '../components/StudentTable'
import { StudentToolbar } from '../components/StudentToolbar'
import { useMajors, useStudents } from '../hooks/useStudents'
import type { StudentSort } from '../types'
import {
  DEFAULT_STUDENT_FILTERS,
  hasActiveFilters,
  type StudentFilters,
} from '../utils/studentFilters'

const PAGE_SIZE = 15
const SEARCH_DEBOUNCE_MS = 400

type OpenDialog = 'import' | 'export' | 'create' | null

export default function StudentManagementPage() {
  const [filters, setFilters] = useState<StudentFilters>(DEFAULT_STUDENT_FILTERS)
  // Trang hiện tại tính từ 0 giống Spring Pageable; hiển thị cho người dùng thì +1
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState<StudentSort | undefined>()
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null)

  // Chờ người dùng ngừng gõ 400ms mới gọi API tìm kiếm
  const keyword = useDebounce(filters.keyword.trim(), SEARCH_DEBOUNCE_MS)

  const { data, isPending, isError, isPlaceholderData } = useStudents({
    keyword: keyword || undefined,
    majorId: filters.majorId || undefined,
    batch: filters.batch || undefined,
    status: filters.status,
    page,
    size: PAGE_SIZE,
    sort,
  })
  const { data: majors, isPending: majorsLoading } = useMajors()

  const filtered = hasActiveFilters(filters)

  // Đổi bất kỳ bộ lọc nào → quay về trang đầu
  const updateFilters = (patch: Partial<StudentFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }))
    setPage(0)
  }

  const resetFilters = () => {
    setFilters(DEFAULT_STUDENT_FILTERS)
    setSort(undefined)
    setPage(0)
  }

  const changeSort = (next: StudentSort | undefined) => {
    setSort(next)
    setPage(0)
  }

  const closeDialog = (open: boolean) => {
    if (!open) setOpenDialog(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý sinh viên</h1>
          <p className="text-sm text-slate-500">Danh sách sinh viên làm đồ án kì này.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setOpenDialog('import')}>
            <Upload /> Import file
          </Button>
          <Button variant="outline" onClick={() => setOpenDialog('export')}>
            <Download /> Export file
          </Button>
          <Button onClick={() => setOpenDialog('create')}>
            <Plus /> Thêm sinh viên
          </Button>
        </div>
      </div>

      <StudentToolbar
        filters={filters}
        onChange={updateFilters}
        onReset={resetFilters}
        showReset={filtered}
        majors={majors}
        majorsLoading={majorsLoading}
      />

      <StudentTable
        data={data}
        isPending={isPending}
        isError={isError}
        isPlaceholderData={isPlaceholderData}
        pageSize={PAGE_SIZE}
        sort={sort}
        onSortChange={changeSort}
        onPageChange={setPage}
        onRowClick={(student) => setSelectedId(student.publicId)}
        hasFilters={filtered}
        onCreate={() => setOpenDialog('create')}
      />

      <StudentDetailDialog publicId={selectedId} onClose={() => setSelectedId(undefined)} />
      <ImportStudentDialog open={openDialog === 'import'} onOpenChange={closeDialog} />
      <ExportStudentDialog
        open={openDialog === 'export'}
        onOpenChange={closeDialog}
        filters={filters}
        majors={majors}
      />
      <CreateStudentDialog
        open={openDialog === 'create'}
        onOpenChange={closeDialog}
        majors={majors}
        majorsLoading={majorsLoading}
      />
    </div>
  )
}
