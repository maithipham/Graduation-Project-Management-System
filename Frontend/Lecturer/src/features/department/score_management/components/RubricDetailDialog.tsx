import { useEffect, useRef, useState, type MutableRefObject } from 'react'
import { CalendarClock, CalendarX, ClipboardPlus, Lock, Save, Send } from 'lucide-react'
import { Button, Dialog, DialogContent, Skeleton } from '@/shared/components/ui'
import { cn } from '@/shared/utils/cn'
import { useCancelApplyPreview, useCancelApplyRubric, useRubricDetail, useSaveRubric } from '../hooks/useRubrics'
import type { ApplyPreview, RubricDetail, RubricTreeCriterion, RubricTreeGroup } from '../types'
import { getRoleLabel } from '../utils/rubricHelpers'
import { RUBRIC_ERROR, getRubricErrorMessage, hasRubricErrorCode } from '../utils/rubricErrors'
import { createTreeKey, renumberTree, sumTreeWeight, toSaveRubricBody } from '../utils/rubricMapper'
import { getScheduledSaveBlockReason, saveRubricSchema } from '../utils/rubricSchema'
import { ApplyRubricDialog, type ApplyRubricMode } from './ApplyRubricDialog'
import { ConfirmDialog } from './ConfirmDialog'
import { RubricCriteriaTable } from './RubricCriteriaTable'
import { RubricDetailHeader } from './RubricDetailHeader'

interface RubricDetailDialogProps {
  /** publicId rubric cần mở, null = đóng */
  publicId: string | null
  onClose: () => void
}

/** Popup chi tiết rubric (A2): sửa tên + cây tiêu chí trên bản sao cục bộ, chỉ gửi BE khi bấm "Lưu" (A5) */
export function RubricDetailDialog({ publicId, onClose }: RubricDetailDialogProps) {
  // Đang mở popup con (xác nhận / áp dụng) → Esc/backdrop chỉ đóng popup con, không đóng popup chi tiết
  const childOpenRef = useRef(false)
  const detailQuery = useRubricDetail(publicId ?? undefined)
  const detail = detailQuery.data

  return (
    <Dialog open={publicId !== null} onOpenChange={(open) => !open && !childOpenRef.current && onClose()}>
      <DialogContent className="flex max-h-[92vh] max-w-5xl flex-col gap-0 overflow-hidden p-0">
        {publicId !== null &&
          (detailQuery.isPending ? (
            <div className="space-y-3 px-6 py-6">
              <Skeleton className="h-7 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : detailQuery.isError || !detail ? (
            // Toast lỗi interceptor đã hiện
            <div className="space-y-3 px-6 py-10 text-center">
              <p className="text-[13.5px] font-semibold text-slate-600">Không tải được chi tiết rubric.</p>
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Đóng
              </Button>
            </div>
          ) : (
            // key theo version: lưu xong / tải lại → BE trả version mới → khởi tạo lại bản sao cục bộ
            <RubricDetailBody
              key={`${detail.publicId}-${detail.version}`}
              detail={detail}
              childOpenRef={childOpenRef}
              onReload={() => void detailQuery.refetch()}
              onClose={onClose}
            />
          ))}
      </DialogContent>
    </Dialog>
  )
}

type PendingDelete =
  | { kind: 'group'; group: RubricTreeGroup }
  | { kind: 'criterion'; group: RubricTreeGroup; criterion: RubricTreeCriterion }

interface RubricDetailBodyProps {
  detail: RubricDetail
  childOpenRef: MutableRefObject<boolean>
  onReload: () => void
  onClose: () => void
}

function RubricDetailBody({ detail, childOpenRef, onReload, onClose }: RubricDetailBodyProps) {
  const readOnly = !detail.canEdit
  const [name, setName] = useState(detail.name)
  const [groups, setGroups] = useState<RubricTreeGroup[]>(detail.groups)
  const [focusKey, setFocusKey] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  /** 3109: người khác vừa sửa → hỏi trước khi tải lại (mất thay đổi chưa lưu) */
  const [confirmReload, setConfirmReload] = useState(false)
  const [confirmCancelApply, setConfirmCancelApply] = useState(false)
  const [applyMode, setApplyMode] = useState<ApplyRubricMode | null>(null)

  const saveMutation = useSaveRubric()
  const cancelApplyMutation = useCancelApplyRubric()
  // A7b: chỉ gọi khi hộp xác nhận Hủy áp dụng đang mở
  const cancelPreviewQuery = useCancelApplyPreview(confirmCancelApply ? detail.publicId : undefined)

  const total = sumTreeWeight(groups)
  const isDirty = name !== detail.name || JSON.stringify(groups) !== JSON.stringify(detail.groups)
  const dirtyTitle = isDirty ? 'Hãy lưu thay đổi trước' : undefined

  useEffect(() => {
    childOpenRef.current =
      pendingDelete !== null || confirmReload || confirmCancelApply || applyMode !== null
  }, [childOpenRef, pendingDelete, confirmReload, confirmCancelApply, applyMode])

  function updateGroups(updater: (list: RubricTreeGroup[]) => RubricTreeGroup[]) {
    setGroups((list) => renumberTree(updater(list)))
    setSaveError(null)
  }

  function addGroup() {
    const key = createTreeKey('group')
    updateGroups((list) => [...list, { key, publicId: null, code: '', name: '', criteria: [] }])
    setFocusKey(key)
  }

  function addCriterion(groupKey: string) {
    const key = createTreeKey('criterion')
    updateGroups((list) =>
      list.map((group) =>
        group.key === groupKey
          ? {
              ...group,
              criteria: [...group.criteria, { key, publicId: null, code: '', name: '', weight: 0, maxScore: null }],
            }
          : group,
      ),
    )
    setFocusKey(key)
  }

  function confirmDelete() {
    if (!pendingDelete) return
    if (pendingDelete.kind === 'group') {
      const groupKey = pendingDelete.group.key
      updateGroups((list) => list.filter((group) => group.key !== groupKey))
    } else {
      const { group, criterion } = pendingDelete
      updateGroups((list) =>
        list.map((item) =>
          item.key === group.key ? { ...item, criteria: item.criteria.filter((c) => c.key !== criterion.key) } : item,
        ),
      )
    }
    setPendingDelete(null)
  }

  function save() {
    const parsed = saveRubricSchema.safeParse(toSaveRubricBody(name, detail.version, groups))
    if (!parsed.success) {
      setSaveError(parsed.error.issues[0]?.message ?? 'Dữ liệu rubric không hợp lệ')
      return
    }
    // Rubric đã áp dụng (Sắp / Đang áp dụng) phải luôn hợp lệ (không thì BE trả 3103) → chặn sớm
    if (detail.status === 'upcoming' || detail.status === 'active') {
      const reason = getScheduledSaveBlockReason(groups)
      if (reason) {
        setSaveError(reason)
        return
      }
    }
    setSaveError(null)
    saveMutation.mutate(
      { publicId: detail.publicId, name, version: detail.version, groups },
      {
        // Thành công: hook tải lại A2 → version mới → body tự khởi tạo lại theo key
        onError: (error) => {
          if (hasRubricErrorCode(error, RUBRIC_ERROR.VERSION_CONFLICT)) {
            setConfirmReload(true)
          } else if (hasRubricErrorCode(error, RUBRIC_ERROR.NOT_FOUND)) {
            onClose()
          } else {
            setSaveError(getRubricErrorMessage(error, 'Không lưu được rubric'))
          }
        },
      },
    )
  }

  function cancelApply() {
    cancelApplyMutation.mutate(
      { publicId: detail.publicId, name: detail.name },
      { onSettled: () => setConfirmCancelApply(false) },
    )
  }

  const deleteDescription =
    pendingDelete?.kind === 'group'
      ? `Bạn có chắc chắn muốn xóa nhóm "${pendingDelete.group.name.trim() || pendingDelete.group.code}" và toàn bộ tiêu chí con bên trong?`
      : pendingDelete?.kind === 'criterion'
        ? `Bạn có chắc chắn muốn xóa tiêu chí "${pendingDelete.criterion.name.trim() || pendingDelete.criterion.code}"?`
        : ''

  return (
    <>
      <RubricDetailHeader
        detail={detail}
        name={name}
        readOnly={readOnly}
        onNameChange={(value) => {
          setName(value)
          setSaveError(null)
        }}
      />

      <div className="flex-1 space-y-3 overflow-y-auto px-6 py-4">
        {readOnly && (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[12.5px] text-slate-600">
            <Lock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            Mẫu rubric đã có phiếu chấm hoặc đã hết áp dụng nên chỉ xem, không thể sửa. Hãy nhân bản để tạo phiên bản mới.
          </div>
        )}

        <RubricCriteriaTable
          groups={groups}
          readOnly={readOnly}
          focusKey={focusKey}
          onGroupNameChange={(groupKey, value) =>
            updateGroups((list) => list.map((group) => (group.key === groupKey ? { ...group, name: value } : group)))
          }
          onCriterionChange={(groupKey, criterionKey, patch) =>
            updateGroups((list) =>
              list.map((group) =>
                group.key === groupKey
                  ? {
                      ...group,
                      criteria: group.criteria.map((criterion) =>
                        criterion.key === criterionKey ? { ...criterion, ...patch } : criterion,
                      ),
                    }
                  : group,
              ),
            )
          }
          onAddCriterion={addCriterion}
          onDeleteGroup={(group) => setPendingDelete({ kind: 'group', group })}
          onDeleteCriterion={(group, criterion) => setPendingDelete({ kind: 'criterion', group, criterion })}
        />

        {!readOnly && (
          <button
            type="button"
            onClick={addGroup}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-blue-400 bg-blue-50/20 py-3 text-[13px] font-semibold text-blue-700 transition-colors hover:bg-blue-50"
          >
            <ClipboardPlus className="h-4 w-4" />
            Thêm nhóm tiêu chí đánh giá mới
          </button>
        )}
      </div>

      <div className="space-y-2 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
        {saveError && <p className="text-[12.5px] font-semibold text-[#DC2626]">{saveError}</p>}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span
            className={cn(
              'rounded-full border px-3 py-1 text-[12px] font-bold',
              total === 100
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-600',
            )}
          >
            Tổng trọng số: {total}%
          </span>

          <div className="flex flex-wrap items-center gap-2">
            {detail.canCancelApply && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isDirty}
                title={dirtyTitle}
                onClick={() => setConfirmCancelApply(true)}
              >
                <CalendarX className="h-4 w-4" />
                Hủy áp dụng
              </Button>
            )}
            {detail.canChangeToSemester && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isDirty}
                title={dirtyTitle}
                onClick={() => setApplyMode('change')}
              >
                <CalendarClock className="h-4 w-4" />
                Sửa kỳ áp dụng
              </Button>
            )}
            {detail.status === 'draft' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isDirty || !detail.canApply}
                title={dirtyTitle ?? detail.applyBlockedReason ?? undefined}
                onClick={() => setApplyMode('apply')}
              >
                <Send className="h-4 w-4" />
                Áp dụng
              </Button>
            )}

            {readOnly ? (
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Đóng
              </Button>
            ) : (
              <>
                <Button type="button" variant="ghost" size="sm" disabled={saveMutation.isPending} onClick={onClose}>
                  {isDirty ? 'Hủy bỏ thay đổi' : 'Đóng'}
                </Button>
                <Button type="button" size="sm" disabled={!isDirty || saveMutation.isPending} onClick={save}>
                  <Save className="h-4 w-4" />
                  {saveMutation.isPending ? 'Đang lưu...' : 'Lưu'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={pendingDelete?.kind === 'group' ? 'Xóa nhóm tiêu chí' : 'Xóa tiêu chí con'}
        description={deleteDescription}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <ConfirmDialog
        open={confirmReload}
        title="Rubric vừa được người khác cập nhật"
        description="Dữ liệu bạn đang sửa đã cũ. Tải lại trang? Các thay đổi chưa lưu sẽ bị mất."
        confirmLabel="Tải lại"
        confirmVariant="default"
        onConfirm={() => {
          setConfirmReload(false)
          onReload()
        }}
        onCancel={() => setConfirmReload(false)}
      />

      <ConfirmDialog
        open={confirmCancelApply}
        title="Hủy áp dụng rubric"
        description={getCancelApplyDescription(detail, cancelPreviewQuery)}
        confirmLabel="Hủy áp dụng"
        isPending={cancelApplyMutation.isPending || cancelPreviewQuery.isFetching}
        onConfirm={cancelApply}
        onCancel={() => setConfirmCancelApply(false)}
      />

      <ApplyRubricDialog
        mode={applyMode}
        publicId={detail.publicId}
        rubricName={detail.name}
        currentFromSemester={detail.fromSemester}
        currentToSemester={detail.toSemester}
        canChangeFromSemester={detail.canChangeFromSemester}
        onClose={() => setApplyMode(null)}
      />
    </>
  )
}

/** Nội dung hộp xác nhận Hủy áp dụng theo kết quả A7b (các học kỳ sẽ mất rubric) */
function getCancelApplyDescription(
  detail: RubricDetail,
  preview: { data?: ApplyPreview; isPending: boolean; isError: boolean; error: unknown },
): string {
  const intro = `Rubric "${detail.name}" sẽ trở về Nháp.`
  if (preview.isError) {
    return `${intro} ${getRubricErrorMessage(preview.error, 'Không kiểm tra được các học kỳ bị ảnh hưởng.')}`
  }
  if (preview.isPending || !preview.data) return `${intro} Đang kiểm tra các học kỳ bị ảnh hưởng...`
  const released = preview.data.releasedSemesters
  if (released.length === 0) return `${intro} Không có học kỳ nào bị ảnh hưởng. Bạn có chắc chắn?`
  const names = released.map((semester) => semester.name).join(', ')
  return `${intro} Các học kỳ sau sẽ không còn rubric ${getRoleLabel(detail.role)}: ${names}. Bạn có chắc chắn?`
}
