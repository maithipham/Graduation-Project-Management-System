import { useState, type ReactNode } from 'react'
import { AlertTriangle, Plus } from 'lucide-react'
import {
  useCancelApplyScoreWeight,
  useDeleteScoreWeight,
  useScoreWeightCancelPreview,
  useScoreWeightList,
} from '../hooks/useScoreWeights'
import type { ScoreWeightConfig } from '../types'
import { getRubricErrorMessage } from '../utils/rubricErrors'
import { ApplyScoreWeightDialog, type ApplyScoreWeightMode } from './ApplyScoreWeightDialog'
import { ConfirmDialog } from './ConfirmDialog'
import { ScoreWeightFormDialog } from './ScoreWeightFormDialog'
import { ScoreWeightTable } from './ScoreWeightTable'

/** Nội dung mục "Trọng số": cảnh báo + nút Tạo mới + bảng + các hộp thoại */
export function ScoreWeightPanel({ tabs }: { tabs?: ReactNode }) {
  const listQuery = useScoreWeightList()
  const items = listQuery.data ?? []

  /** undefined = đóng form, null = tạo mới, có giá trị = sửa */
  const [formTarget, setFormTarget] = useState<ScoreWeightConfig | null | undefined>(undefined)
  const [applyState, setApplyState] = useState<{ mode: ApplyScoreWeightMode; config: ScoreWeightConfig } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ScoreWeightConfig | null>(null)
  const [cancelTarget, setCancelTarget] = useState<ScoreWeightConfig | null>(null)

  const deleteMutation = useDeleteScoreWeight()
  const cancelMutation = useCancelApplyScoreWeight()
  const cancelPreview = useScoreWeightCancelPreview(cancelTarget?.publicId)

  const hasActive = items.some((item) => item.displayStatus === 'ACTIVE')

  function confirmDelete() {
    if (!deleteTarget) return
    deleteMutation.mutate(
      { publicId: deleteTarget.publicId, name: deleteTarget.name },
      // Lỗi: interceptor đã toast, hook đã tải lại danh sách → chỉ đóng hộp xác nhận
      { onSettled: () => setDeleteTarget(null) },
    )
  }

  function confirmCancelApply() {
    if (!cancelTarget) return
    cancelMutation.mutate(
      { publicId: cancelTarget.publicId, name: cancelTarget.name },
      { onSettled: () => setCancelTarget(null) },
    )
  }

  /** Câu mô tả hộp Hủy áp dụng: kèm các học kỳ sẽ mất cấu hình (W6b) */
  function cancelDescription(): string {
    const base = `Hủy áp dụng "${cancelTarget?.name ?? ''}", cấu hình sẽ trở về bản nháp.`
    if (cancelPreview.isPending) return `${base} Đang kiểm tra các học kỳ bị ảnh hưởng...`
    if (cancelPreview.isError) return `${base} ${getRubricErrorMessage(cancelPreview.error, '')}`.trim()
    const released = cancelPreview.data.releasedSemesters
    if (released.length === 0) return base
    return `${base} Các học kỳ sẽ không còn cấu hình trọng số: ${released
      .map((semester) => semester.name)
      .join(', ')}.`
  }

  return (
    <div className="space-y-3">
      {/* Cùng hàng với thanh tab của trang → nút "Tạo mới" đứng đúng chỗ như ở các tab rubric */}
      <div className="flex items-center justify-between gap-4">
        {tabs}
        <button
          type="button"
          onClick={() => setFormTarget(null)}
          className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-[#1565C0] px-4 text-[13px] font-semibold text-white shadow-xs transition-colors hover:bg-[#0D47A1]"
        >
          <Plus className="h-4 w-4" />
          Tạo mới
        </button>
      </div>

      <p className="text-[12.5px] text-slate-500">
        Trọng số 3 đầu điểm hiển thị cho sinh viên (tổng 3 trọng số = 100%). Điểm tổng kết tính theo QĐ1305, không theo trọng số.
      </p>

      {listQuery.isSuccess && !hasActive && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Chưa có cấu hình trọng số nào đang áp dụng: sinh viên học kỳ hiện tại chưa thấy trọng số 3 đầu điểm cho tới
            khi bạn áp dụng một cấu hình.
          </span>
        </div>
      )}

      <ScoreWeightTable
        items={items}
        isPending={listQuery.isPending}
        isError={listQuery.isError}
        onEdit={setFormTarget}
        onApply={(config) => setApplyState({ mode: 'apply', config })}
        onChangeRange={(config) => setApplyState({ mode: 'change', config })}
        onCancelApply={setCancelTarget}
        onDelete={setDeleteTarget}
      />

      <ScoreWeightFormDialog
        open={formTarget !== undefined}
        editing={formTarget ?? null}
        onClose={() => setFormTarget(undefined)}
      />

      <ApplyScoreWeightDialog
        mode={applyState?.mode ?? null}
        config={applyState?.config ?? null}
        onClose={() => setApplyState(null)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Xóa cấu hình trọng số"
        description={`Bạn có chắc chắn muốn xóa bản nháp "${deleteTarget?.name ?? ''}"? Thao tác này không thể hoàn tác.`}
        isPending={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={cancelTarget !== null}
        title="Hủy áp dụng cấu hình trọng số"
        description={cancelDescription()}
        confirmLabel="Hủy áp dụng"
        isPending={cancelMutation.isPending}
        // Chưa biết / không lấy được các học kỳ bị ảnh hưởng (W6b) → chưa cho xác nhận
        confirmDisabled={cancelPreview.isPending || cancelPreview.isError}
        onConfirm={confirmCancelApply}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  )
}
