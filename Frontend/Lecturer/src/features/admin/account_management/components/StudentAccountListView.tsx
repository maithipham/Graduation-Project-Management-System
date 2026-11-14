import { useCallback, useState } from 'react'
import { Download, Plus, Upload } from 'lucide-react'
import { Button, Card, TablePagination } from '@/shared/components/ui'
import { useDebounce } from '@/shared/hooks'
import {
  CreateStudentDialog,
  ImportStudentDialog,
  useMajors,
  type RowImportStatus,
} from '@/features/department'
import {
  useAllStudentBatches,
  useCreateStudentAccount,
  useImportStudentAccounts,
  useStudentAccounts,
} from '../hooks/useAccounts'
import { StudentAccountFilterToolbar } from './StudentAccountFilterToolbar'
import { StudentAccountTable } from './StudentAccountTable'
import { StudentAccountDetailDialog } from './StudentAccountDetailDialog'
import { DeleteStudentAccountDialog } from './DeleteStudentAccountDialog'
import { EditStudentAccountDialog } from './EditStudentAccountDialog'
import { ExportStudentAccountDialog } from './ExportStudentAccountDialog'
import type {
  AccountStatusFilter,
  StudentAccountExportParams,
  StudentAccountItem,
} from '../types/account.types'

const PAGE_SIZE = 10
// Import của Admin chỉ tạo tài khoản → không có dòng Cảnh báo
const IMPORT_RESULT_STATUSES: RowImportStatus[] = ['ERROR', 'SUCCESS']

/**
 * Giao diện trang /admin/accounts-students: lọc + phân trang phía server qua GET /student/account.
 * Sửa / thêm / import / xuất Excel gọi API tài khoản riêng của Admin (/student/account...).
 * (Trang Giảng viên vẫn dùng AccountListView với dữ liệu mock.)
 */
export function StudentAccountListView() {
  // Bộ lọc (state giao diện). page bắt đầu từ 0 giống Spring Pageable
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBatch, setSelectedBatch] = useState('')
  const [selectedMajor, setSelectedMajor] = useState('') // publicId ngành
  const [selectedStatus, setSelectedStatus] = useState<AccountStatusFilter>('')
  const [page, setPage] = useState(0)
  const debouncedSearch = useDebounce(searchTerm, 300)

  // Dữ liệu cho thanh lọc, gọi ngay khi vào trang
  const { data: majors, isLoading: isLoadingMajors } = useMajors()
  const { data: batches, isLoading: isLoadingBatches } = useAllStudentBatches()

  // Bộ lọc gửi BE — Export "theo bộ lọc" dùng đúng bộ lọc này, chỉ bỏ phân trang
  const filters: StudentAccountExportParams = {
    keyword: debouncedSearch.trim() || undefined,
    batch: selectedBatch || undefined,
    majorId: selectedMajor || undefined,
    status: selectedStatus === '' ? undefined : selectedStatus === 'true',
  }
  const { data, isPending, isError, isPlaceholderData } = useStudentAccounts({
    ...filters,
    page,
    size: PAGE_SIZE,
  })

  // Dialog
  const [detailStudent, setDetailStudent] = useState<StudentAccountItem | null>(null)
  const [editStudent, setEditStudent] = useState<StudentAccountItem | null>(null)
  const [deleteStudent, setDeleteStudent] = useState<StudentAccountItem | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const closeDetail = useCallback(() => setDetailStudent(null), [])

  // Đổi bất kỳ ô lọc nào → về trang đầu
  const withFirstPage =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value)
      setPage(0)
    }

  const hasActiveFilters = Boolean(searchTerm || selectedBatch || selectedMajor || selectedStatus)
  const resetFilters = () => {
    setSearchTerm('')
    setSelectedBatch('')
    setSelectedMajor('')
    setSelectedStatus('')
    setPage(0)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsImportOpen(true)}
          className="h-10 text-xs font-medium gap-1.5 bg-white shadow-xs"
        >
          <Upload className="h-4 w-4" />
          <span>Import sinh viên</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => setIsExportOpen(true)}
          className="h-10 text-xs font-medium gap-1.5 bg-white shadow-xs"
        >
          <Download className="h-4 w-4" />
          <span>Export sinh viên</span>
        </Button>

        <Button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="h-10 bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-semibold gap-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm sinh viên</span>
        </Button>
      </div>

      <Card className="overflow-hidden rounded-lg border-slate-200 shadow-xs">
        <StudentAccountFilterToolbar
          searchTerm={searchTerm}
          onSearchChange={withFirstPage(setSearchTerm)}
          batches={batches ?? []}
          batchesLoading={isLoadingBatches}
          selectedBatch={selectedBatch}
          onBatchChange={withFirstPage(setSelectedBatch)}
          majors={(majors ?? []).map((major) => ({ value: major.publicId, label: major.name }))}
          majorsLoading={isLoadingMajors}
          selectedMajor={selectedMajor}
          onMajorChange={withFirstPage(setSelectedMajor)}
          selectedStatus={selectedStatus}
          onStatusChange={withFirstPage(setSelectedStatus)}
          totalCount={data?.totalElements}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={resetFilters}
        />

        <StudentAccountTable
          data={data}
          isPending={isPending}
          isError={isError}
          isPlaceholderData={isPlaceholderData}
          onRowClick={setDetailStudent}
          onEdit={setEditStudent}
          onDelete={setDeleteStudent}
        />

        {data && !data.empty && (
          <TablePagination
            data={data}
            disabled={isPlaceholderData}
            onPageChange={setPage}
            itemLabel="sinh viên"
          />
        )}
      </Card>

      <StudentAccountDetailDialog student={detailStudent} onClose={closeDetail} />

      <DeleteStudentAccountDialog student={deleteStudent} onClose={() => setDeleteStudent(null)} />

      <EditStudentAccountDialog student={editStudent} onClose={() => setEditStudent(null)} />

      <ExportStudentAccountDialog
        open={isExportOpen}
        onOpenChange={setIsExportOpen}
        filters={filters}
        majors={majors}
        filteredCount={isPlaceholderData ? undefined : data?.totalElements}
      />

      <CreateStudentDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        majors={majors}
        majorsLoading={isLoadingMajors}
        useCreate={useCreateStudentAccount}
        description="Tạo tài khoản đăng nhập cho sinh viên (không gắn vào học kỳ)"
      />

      <ImportStudentDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        useImport={useImportStudentAccounts}
        useCreate={useCreateStudentAccount}
        resultStatuses={IMPORT_RESULT_STATUSES}
      />
    </div>
  )
}
