import { useState } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { Button, Dialog, DialogContent } from '@/shared/components/ui'
import { cn } from '@/shared/utils/cn'
import { useChangeSemesterRubric } from '../hooks/useSemesterRubrics'
import type { RubricListItem, RubricRole, SemesterRubricAssignment } from '../types'
import { RUBRIC_ERROR, getRubricErrorMessage, hasRubricErrorCode } from '../utils/rubricErrors'
import { RubricStatusBadge } from './RubricStatusBadge'

export interface ChangeRubricTarget {
  semesterPublicId: string
  semesterName: string
  assignment: SemesterRubricAssignment | null
}

interface ChangeRubricDialogProps {
  /** null = đóng */
  target: ChangeRubricTarget | null
  role: RubricRole
  roleLabel: string
  /** Kho rubric cùng loại phiếu (A1), dialog tự lọc: bỏ Nháp và rubric đang gán */
  candidates: RubricListItem[]
  onClose: () => void
  /** BE trả 3111 (học kỳ vừa có phiếu chấm) → đóng popup này, mở popup "Không thể đổi rubric" */
  onLocked: (target: ChangeRubricTarget) => void
}

/** Popup B2: đổi rubric một loại phiếu cho học kỳ đang chọn */
export function ChangeRubricDialog({ target, role, roleLabel, candidates, onClose, onLocked }: ChangeRubricDialogProps) {
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden p-0">
        {target && (
          <ChangeRubricBody
            key={`${target.semesterPublicId}-${target.assignment?.templatePublicId ?? 'none'}`}
            target={target}
            role={role}
            roleLabel={roleLabel}
            candidates={candidates}
            onClose={onClose}
            onLocked={onLocked}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

type ChangeRubricBodyProps = Omit<ChangeRubricDialogProps, 'target'> & { target: ChangeRubricTarget }

function ChangeRubricBody({ target, role, roleLabel, candidates, onClose, onLocked }: ChangeRubricBodyProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const changeMutation = useChangeSemesterRubric()

  const currentId = target.assignment?.templatePublicId ?? null
  // Chỉ rubric đã áp dụng (không phải Nháp) mới gán được cho học kỳ
  const options = candidates.filter((item) => item.status !== 'draft' && item.publicId !== currentId)
  const selected = options.find((item) => item.publicId === selectedId) ?? null

  function confirm() {
    if (!selected) return
    setSubmitError(null)
    changeMutation.mutate(
      {
        semesterPublicId: target.semesterPublicId,
        role,
        templatePublicId: selected.publicId,
        semesterName: target.semesterName,
        roleLabel,
        templateName: selected.name,
      },
      {
        onSuccess: onClose,
        onError: (error) => {
          if (hasRubricErrorCode(error, RUBRIC_ERROR.SEMESTER_LOCKED)) {
            onLocked(target)
            return
          }
          // Toast lỗi interceptor đã hiện; giữ thêm dòng lỗi trong popup cho rõ
          setSubmitError(getRubricErrorMessage(error, 'Không đổi được rubric'))
          if (hasRubricErrorCode(error, RUBRIC_ERROR.NOT_FOUND, RUBRIC_ERROR.NOT_APPLIED)) setSelectedId(null)
        },
      },
    )
  }

  return (
    <>
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 pr-12">
        <h2 className="flex items-center gap-2 text-[16px] font-bold text-slate-900!">
          <ArrowLeftRight className="h-4.5 w-4.5 text-[#1565C0]" />
          {currentId ? 'Đổi rubric áp dụng' : 'Chọn rubric áp dụng'}
        </h2>
        <p className="mt-1 text-[12.5px] text-slate-500">
          {target.semesterName} · Loại phiếu: {roleLabel}
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
        <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[13px]">
          <span className="text-slate-500">Hiện tại:</span>
          <span className="font-semibold text-slate-800">{target.assignment?.templateName ?? 'Chưa có rubric'}</span>
        </div>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-[13px] font-bold text-slate-800">Chọn rubric mới</legend>
          {options.length === 0 && (
            <p className="py-4 text-center text-[12.5px] italic text-slate-400">
              Chưa có rubric {roleLabel} nào khác đã áp dụng. Hãy áp dụng một bản nháp trước.
            </p>
          )}
          {options.map((item) => {
            const checked = selectedId === item.publicId
            return (
              <label
                key={item.publicId}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13px] transition-colors hover:border-blue-300 hover:bg-blue-50/30',
                  checked && 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500',
                )}
              >
                <input
                  type="radio"
                  name="new-rubric"
                  value={item.publicId}
                  checked={checked}
                  disabled={changeMutation.isPending}
                  onChange={() => {
                    setSelectedId(item.publicId)
                    setSubmitError(null)
                  }}
                  className="h-4 w-4 accent-[#1565C0]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-slate-800">{item.name}</span>
                  <span className="block text-[11.5px] text-slate-500">
                    Áp dụng: {item.effectiveFrom ?? '–'}
                    {item.effectiveTo ? ` – ${item.effectiveTo}` : ''}
                  </span>
                </span>
                <RubricStatusBadge status={item.status} label={item.statusLabel} />
                <span className="w-12 text-right text-[12px] font-bold text-slate-500">{item.totalWeight}%</span>
              </label>
            )
          })}
        </fieldset>

        {submitError && <p className="text-[12.5px] font-semibold text-[#DC2626]">{submitError}</p>}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
        <Button type="button" variant="ghost" size="sm" disabled={changeMutation.isPending} onClick={onClose}>
          Hủy
        </Button>
        <Button type="button" size="sm" disabled={!selected || changeMutation.isPending} onClick={confirm}>
          {changeMutation.isPending ? 'Đang lưu...' : 'Xác nhận đổi'}
        </Button>
      </div>
    </>
  )
}
