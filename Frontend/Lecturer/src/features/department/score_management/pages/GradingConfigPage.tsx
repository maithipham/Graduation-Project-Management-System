import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { toSpringPage } from '@/shared/utils/springPage'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { CurrentRubricCard } from '../components/CurrentRubricCard'
import { RubricDetailDialog } from '../components/RubricDetailDialog'
import { RubricPendingRow } from '../components/RubricPendingRow'
import { RubricRoleTabs } from '../components/RubricRoleTabs'
import { RubricVersionTable } from '../components/RubricVersionTable'
import { useCloneRubric, useCreateRubric, useDeleteRubric, useRubricList } from '../hooks/useRubrics'
import type { RubricListItem, RubricRole } from '../types'
import { getRubricErrorMessage } from '../utils/rubricErrors'
import { DEFAULT_RUBRIC_PAGE_SIZE, getRoleLabel } from '../utils/rubricHelpers'
import { createRubricSchema } from '../utils/rubricSchema'

interface PendingRow {
  name: string
  error: string | null
}

/** Trang "Cấu hình điểm" (Trưởng bộ môn): kho rubric theo 3 loại phiếu chấm */
export default function GradingConfigPage() {
  const [role, setRole] = useState<RubricRole>('supervisor')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_RUBRIC_PAGE_SIZE)
  const [pendingRow, setPendingRow] = useState<PendingRow | null>(null)
  /** publicId rubric đang mở popup chi tiết */
  const [detailId, setDetailId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RubricListItem | null>(null)

  const roleLabel = getRoleLabel(role)
  const listQuery = useRubricList(role)
  const createMutation = useCreateRubric()
  const cloneMutation = useCloneRubric()
  const deleteMutation = useDeleteRubric()

  // A1 trả cả danh sách (không phân trang) → chia trang phía client, đưa về SpringPage để dùng TablePagination
  const page = useMemo(() => {
    const items = listQuery.data ?? []
    const lastPage = Math.max(0, Math.ceil(items.length / pageSize) - 1)
    const number = Math.min(pageIndex, lastPage)
    return toSpringPage(
      {
        content: items.slice(number * pageSize, (number + 1) * pageSize),
        number,
        size: pageSize,
        totalElements: items.length,
      },
      { page: number, size: pageSize },
    )
  }, [listQuery.data, pageIndex, pageSize])

  function changeRole(next: RubricRole) {
    setRole(next)
    setPageIndex(0)
    setPendingRow(null)
  }

  function startCreate() {
    setPendingRow({ name: '', error: null })
    setPageIndex(0)
  }

  function savePending() {
    if (!pendingRow) return
    const parsed = createRubricSchema.shape.name.safeParse(pendingRow.name)
    if (!parsed.success) {
      setPendingRow({ ...pendingRow, error: parsed.error.issues[0]?.message ?? 'Tên rubric không hợp lệ' })
      return
    }
    createMutation.mutate(
      { role, name: parsed.data },
      {
        onSuccess: (publicId) => {
          setPendingRow(null)
          // Mở luôn popup chi tiết để thiết lập tiêu chí
          setDetailId(publicId)
        },
        // Request tạo có skipErrorToast → lỗi hiện ngay dưới ô tên
        onError: (error) =>
          setPendingRow((row) => (row ? { ...row, error: getRubricErrorMessage(error, 'Không tạo được rubric') } : row)),
      },
    )
  }

  /** A4: BE tự đặt tên bản sao → mở chi tiết bản sao để người dùng đổi tên / sửa tiêu chí */
  function cloneRubric(publicId: string, name: string) {
    cloneMutation.mutate({ publicId, name }, { onSuccess: (newPublicId) => setDetailId(newPublicId) })
  }

  function confirmDelete() {
    if (!deleteTarget) return
    deleteMutation.mutate(
      { publicId: deleteTarget.publicId, name: deleteTarget.name },
      // Lỗi: interceptor đã toast, hook đã tải lại danh sách → chỉ đóng hộp xác nhận
      { onSettled: () => setDeleteTarget(null) },
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <RubricRoleTabs value={role} onChange={changeRole} />
        <button
          type="button"
          onClick={startCreate}
          disabled={pendingRow !== null}
          className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-[#1565C0] px-4 text-[13px] font-semibold text-white shadow-xs transition-colors hover:bg-[#0D47A1] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          Tạo mới
        </button>
      </div>

      <CurrentRubricCard role={role} roleLabel={roleLabel} onOpenRubric={setDetailId} />

      <RubricVersionTable
        page={page}
        isPending={listQuery.isPending}
        isError={listQuery.isError}
        itemLabel={`mẫu rubric ${roleLabel}`}
        pendingRow={
          pendingRow && (
            <RubricPendingRow
              name={pendingRow.name}
              error={pendingRow.error}
              isPending={createMutation.isPending}
              onChange={(name) => setPendingRow({ name, error: null })}
              onSave={savePending}
              onCancel={() => setPendingRow(null)}
            />
          )
        }
        onPageChange={setPageIndex}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPageIndex(0)
        }}
        onOpen={(item) => setDetailId(item.publicId)}
        onClone={(item) => cloneRubric(item.publicId, item.name)}
        onDelete={setDeleteTarget}
      />

      <RubricDetailDialog publicId={detailId} onClose={() => setDetailId(null)} />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Xóa bản nháp rubric"
        description={`Bạn có chắc chắn muốn xóa bản nháp "${deleteTarget?.name ?? ''}"? Thao tác này không thể hoàn tác.`}
        isPending={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
