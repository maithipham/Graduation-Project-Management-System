import { useState } from 'react'
import { CalendarCheck, Info } from 'lucide-react'
import { Button, Dialog, DialogContent, Skeleton } from '@/shared/components/ui'
import { useApplyPreview, useApplyRubric, useChangeEffectiveFrom } from '../hooks/useRubrics'
import type { ApiDate } from '../types'
import { getRubricErrorMessage } from '../utils/rubricErrors'
import { formatBeDate } from '../utils/rubricMapper'
import { createEffectiveFromSchema, todayApiDate } from '../utils/rubricSchema'

export type ApplyRubricMode = 'apply' | 'change'

interface ApplyRubricDialogProps {
  /** null = đóng. 'apply' = A8 (Nháp → áp dụng), 'change' = A9 (đổi ngày rubric Sắp áp dụng) */
  mode: ApplyRubricMode | null
  publicId: string
  rubricName: string
  /** Ngày áp dụng hiện tại (yyyy-MM-dd) để điền sẵn khi đổi ngày */
  currentEffectiveFrom: ApiDate | null
  onClose: () => void
}

/** Popup chọn ngày áp dụng + xem trước ảnh hưởng (A7) rồi xác nhận (A8 / A9) */
export function ApplyRubricDialog({ mode, publicId, rubricName, currentEffectiveFrom, onClose }: ApplyRubricDialogProps) {
  return (
    <Dialog open={mode !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
        {mode && (
          <ApplyRubricBody
            mode={mode}
            publicId={publicId}
            rubricName={rubricName}
            currentEffectiveFrom={currentEffectiveFrom}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

type ApplyRubricBodyProps = Omit<ApplyRubricDialogProps, 'mode'> & { mode: ApplyRubricMode }

function ApplyRubricBody({ mode, publicId, rubricName, currentEffectiveFrom, onClose }: ApplyRubricBodyProps) {
  const today = todayApiDate()
  const [date, setDate] = useState<string>(
    mode === 'change' && currentEffectiveFrom && currentEffectiveFrom >= today ? currentEffectiveFrom : '',
  )
  const [submitError, setSubmitError] = useState<string | null>(null)

  const parsed = createEffectiveFromSchema(today).safeParse({ effectiveFrom: date })
  // Chỉ gọi xem trước khi ngày hợp lệ; ngày sai thì báo lỗi ngay dưới ô (khi đã chọn)
  const dateError = date !== '' && !parsed.success ? (parsed.error.issues[0]?.message ?? null) : null
  const previewQuery = useApplyPreview(publicId, parsed.success ? date : null)
  const preview = previewQuery.data

  const applyMutation = useApplyRubric()
  const changeMutation = useChangeEffectiveFrom()
  const mutation = mode === 'apply' ? applyMutation : changeMutation
  const canConfirm = parsed.success && preview !== undefined && !mutation.isPending

  function confirm() {
    if (!parsed.success) return
    setSubmitError(null)
    mutation.mutate(
      { publicId, effectiveFrom: parsed.data.effectiveFrom, name: rubricName },
      {
        onSuccess: onClose,
        // Request có skipErrorToast → lỗi hiện trong popup
        onError: (error) => setSubmitError(getRubricErrorMessage(error, 'Không lưu được ngày áp dụng')),
      },
    )
  }

  return (
    <>
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 pr-12">
        <h2 className="flex items-center gap-2 text-[16px] font-bold text-slate-900!">
          <CalendarCheck className="h-4.5 w-4.5 text-[#1565C0]" />
          {mode === 'apply' ? 'Áp dụng rubric' : 'Đổi ngày áp dụng'}
        </h2>
        <p className="mt-1 truncate text-[12.5px] text-slate-500" title={rubricName}>
          {rubricName}
        </p>
      </div>

      <div className="space-y-4 px-6 py-4 text-[13px] text-slate-700">
        <div className="space-y-1.5">
          <label htmlFor="rubric-effective-from" className="text-[13px] font-bold text-slate-800">
            Áp dụng từ ngày
          </label>
          <input
            id="rubric-effective-from"
            type="date"
            min={today}
            value={date}
            aria-invalid={dateError !== null}
            onChange={(event) => {
              setDate(event.target.value)
              setSubmitError(null)
            }}
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-800 outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100 aria-invalid:border-[#DC2626]"
          />
          {dateError && <p className="text-[12px] font-semibold text-[#DC2626]">{dateError}</p>}
        </div>

        {parsed.success && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
            {previewQuery.isPending ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : previewQuery.isError ? (
              <p className="text-[12.5px] font-semibold text-[#DC2626]">
                {getRubricErrorMessage(previewQuery.error, 'Không xem trước được ngày áp dụng')}
              </p>
            ) : preview ? (
              <ul className="space-y-1.5 text-[12.5px]">
                {preview.closingTemplateName && (
                  <li className="flex gap-2">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span>
                      Rubric <b>{preview.closingTemplateName}</b> (áp dụng từ{' '}
                      {formatBeDate(preview.closingTemplateEffectiveFrom) ?? '–'}) sẽ kết thúc ngày{' '}
                      <b>{formatBeDate(preview.closingTemplateEffectiveTo) ?? '–'}</b>
                    </span>
                  </li>
                )}
                <li className="flex gap-2">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span>
                    <b>{preview.assignedSemesterCount}</b> học kỳ bắt đầu từ ngày này sẽ dùng rubric mới
                  </span>
                </li>
                {preview.keptSemesterCount > 0 && (
                  <li className="flex gap-2">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                    <span>
                      <b>{preview.keptSemesterCount}</b> học kỳ đã có phiếu chấm, giữ rubric cũ
                    </span>
                  </li>
                )}
              </ul>
            ) : null}
          </div>
        )}

        {mode === 'apply' && (
          <p className="text-[12px] text-slate-500">
            Sau khi áp dụng, rubric chuyển sang "Sắp áp dụng". Khi đã có phiếu chấm, tiêu chí sẽ không sửa được nữa.
          </p>
        )}

        {submitError && <p className="text-[12.5px] font-semibold text-[#DC2626]">{submitError}</p>}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
        <Button type="button" variant="ghost" size="sm" disabled={mutation.isPending} onClick={onClose}>
          Hủy
        </Button>
        <Button type="button" size="sm" disabled={!canConfirm} onClick={confirm}>
          {mutation.isPending ? 'Đang lưu...' : mode === 'apply' ? 'Xác nhận áp dụng' : 'Xác nhận đổi ngày'}
        </Button>
      </div>
    </>
  )
}
