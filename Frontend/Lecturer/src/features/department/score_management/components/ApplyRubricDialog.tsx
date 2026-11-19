import { useState } from 'react'
import { CalendarCheck, Info } from 'lucide-react'
import { Button, Dialog, DialogContent, FormField, Select, Skeleton } from '@/shared/components/ui'
import { useApplyPreview, useApplyRubric, useChangeSemesterRange } from '../hooks/useRubrics'
import { useSemesterOptions } from '../hooks/useSemesterRubrics'
import type { ApplyPreview, RubricSemesterOption, SemesterRef } from '../types'
import { getFromSemesterOptions, getToSemesterOptions, keepValidToSemester } from '../utils/rubricHelpers'
import { getRubricErrorMessage } from '../utils/rubricErrors'
import { semesterRangeSchema } from '../utils/rubricSchema'

export type ApplyRubricMode = 'apply' | 'change'

interface ApplyRubricDialogProps {
  /** null = đóng. 'apply' = A8 (Nháp → áp dụng), 'change' = A9 (sửa kỳ áp dụng của rubric Sắp / Đang áp dụng) */
  mode: ApplyRubricMode | null
  publicId: string
  rubricName: string
  /** Khoảng kỳ hiện tại, điền sẵn khi Sửa kỳ (Nháp thì cả hai null) */
  currentFromSemester: SemesterRef | null
  currentToSemester: SemesterRef | null
  /** false = rubric đã có phiếu chấm: khóa ô "Từ kỳ", chỉ sửa "Đến kỳ" */
  canChangeFromSemester: boolean
  onClose: () => void
}

/** Popup chọn "Từ kỳ" / "Đến kỳ" + xem trước học kỳ bị ảnh hưởng (A7) rồi xác nhận (A8 / A9) */
export function ApplyRubricDialog({ mode, ...props }: ApplyRubricDialogProps) {
  return (
    <Dialog open={mode !== null} onOpenChange={(open) => !open && props.onClose()}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
        {mode && <ApplyRubricBody mode={mode} {...props} />}
      </DialogContent>
    </Dialog>
  )
}

type ApplyRubricBodyProps = Omit<ApplyRubricDialogProps, 'mode'> & { mode: ApplyRubricMode }

function ApplyRubricBody({
  mode,
  publicId,
  rubricName,
  currentFromSemester,
  currentToSemester,
  canChangeFromSemester,
  onClose,
}: ApplyRubricBodyProps) {
  const isChange = mode === 'change'
  // Áp dụng (Nháp) luôn được chọn "Từ kỳ"; Sửa kỳ thì theo cờ BE
  const fromLocked = isChange && !canChangeFromSemester
  const initialFromId = isChange ? (currentFromSemester?.publicId ?? null) : null
  const initialToId = isChange ? (currentToSemester?.publicId ?? null) : null

  const [fromId, setFromId] = useState<string | null>(initialFromId)
  const [toId, setToId] = useState<string | null>(initialToId)
  const [fromError, setFromError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const semestersQuery = useSemesterOptions()
  const semesters = semestersQuery.data ?? []
  const fromOptions = withCurrent(getFromSemesterOptions(semesters, initialFromId), currentFromSemester, isChange)
  const toOptions = withCurrent(getToSemesterOptions(semesters, fromId), currentToSemester, isChange && toId === initialToId)

  const previewQuery = useApplyPreview(publicId, fromId, toId)
  const applyMutation = useApplyRubric()
  const changeMutation = useChangeSemesterRange()
  const mutation = isChange ? changeMutation : applyMutation

  const unchanged = isChange && fromId === initialFromId && toId === initialToId
  // Đã chọn "Từ kỳ" thì phải chờ xem trước thành công; chưa chọn thì vẫn bấm được để hiện lỗi dưới ô
  const waitingPreview = fromId !== null && (previewQuery.isPending || previewQuery.isError)
  const canConfirm = !mutation.isPending && !unchanged && !waitingPreview
  // Lỗi khoảng kỳ (3106, 3123–3126, 4041…) của xem trước và của lúc lưu cùng hiện ngay dưới 2 ô chọn
  const rangeError =
    submitError ??
    (previewQuery.isError ? getRubricErrorMessage(previewQuery.error, 'Không xem trước được kỳ áp dụng') : null)

  function changeFrom(value: string) {
    const nextFrom = value === '' ? null : value
    setFromId(nextFrom)
    // "Đến kỳ" đang chọn bắt đầu trước "Từ kỳ" mới → về "Chưa xác định"
    setToId((current) => keepValidToSemester(semesters, nextFrom, current))
    setFromError(null)
    setSubmitError(null)
  }

  function changeTo(value: string) {
    setToId(value === '' ? null : value)
    setSubmitError(null)
  }

  function confirm() {
    const parsed = semesterRangeSchema.safeParse({ fromSemesterId: fromId ?? '', toSemesterId: toId })
    if (!parsed.success) {
      setFromError(parsed.error.issues[0]?.message ?? null)
      return
    }
    setSubmitError(null)
    mutation.mutate(
      { publicId, body: parsed.data, name: rubricName },
      {
        onSuccess: onClose,
        // Request có skipErrorToast → lỗi hiện trong popup (message 3125 / 3126 do BE ghép, hiện nguyên văn)
        onError: (error) => setSubmitError(getRubricErrorMessage(error, 'Không lưu được kỳ áp dụng')),
      },
    )
  }

  return (
    <>
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 pr-12">
        <h2 className="flex items-center gap-2 text-[16px] font-bold text-slate-900!">
          <CalendarCheck className="h-4.5 w-4.5 text-[#1565C0]" />
          {isChange ? 'Sửa kỳ áp dụng' : 'Áp dụng rubric'}
        </h2>
        <p className="mt-1 truncate text-[12.5px] text-slate-500" title={rubricName}>
          {rubricName}
        </p>
      </div>

      <div className="space-y-4 px-6 py-4 text-[13px] text-slate-700">
        {semestersQuery.isPending ? (
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : semestersQuery.isError ? (
          <p className="text-[12.5px] font-semibold text-[#DC2626]">Không tải được danh sách học kỳ.</p>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                label="Từ kỳ"
                required
                error={fromError ?? undefined}
                hint={fromLocked ? 'Đã có phiếu chấm nên không đổi được' : undefined}
              >
                <Select
                  value={fromId ?? ''}
                  disabled={fromLocked || mutation.isPending}
                  onChange={(event) => changeFrom(event.target.value)}
                >
                  <option value="">-- Chọn học kỳ --</option>
                  {fromOptions.map((semester) => (
                    <option key={semester.publicId} value={semester.publicId}>
                      {formatOption(semester)}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Đến kỳ">
                <Select
                  value={toId ?? ''}
                  disabled={fromId === null || mutation.isPending}
                  onChange={(event) => changeTo(event.target.value)}
                >
                  <option value="">Chưa xác định</option>
                  {toOptions.map((semester) => (
                    <option key={semester.publicId} value={semester.publicId}>
                      {formatOption(semester)}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
            {rangeError && <p className="text-[12.5px] font-semibold text-[#DC2626]">{rangeError}</p>}
          </div>
        )}

        {fromId !== null && !previewQuery.isError && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
            {previewQuery.isPending ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <PreviewSummary preview={previewQuery.data} />
            )}
          </div>
        )}

        {!isChange && (
          <p className="text-[12px] text-slate-500">
            Sau khi áp dụng, rubric chuyển sang "Sắp áp dụng" (hoặc "Đang áp dụng" nếu Từ kỳ đang diễn ra). Khi đã có
            phiếu chấm, tiêu chí và "Từ kỳ" sẽ không sửa được nữa.
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
        <Button type="button" variant="ghost" size="sm" disabled={mutation.isPending} onClick={onClose}>
          Hủy
        </Button>
        <Button type="button" size="sm" disabled={!canConfirm} onClick={confirm}>
          {mutation.isPending ? 'Đang lưu...' : isChange ? 'Lưu kỳ áp dụng' : 'Xác nhận áp dụng'}
        </Button>
      </div>
    </>
  )
}

/** Kết quả A7: khoảng đang xem + học kỳ sẽ dùng / không còn dùng rubric này (danh sách rỗng thì ẩn) */
function PreviewSummary({ preview }: { preview: ApplyPreview }) {
  const nothingChanges = preview.assignedSemesters.length === 0 && preview.releasedSemesters.length === 0
  return (
    <ul className="space-y-1.5 text-[12.5px]">
      {preview.fromSemester && (
        <li className="flex gap-2">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span>
            Áp dụng từ <b>{preview.fromSemester.name}</b> đến <b>{preview.toSemester?.name ?? 'chưa xác định'}</b>
          </span>
        </li>
      )}
      {preview.assignedSemesters.length > 0 && (
        <li className="flex gap-2">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
          <span>
            Các học kỳ sẽ dùng rubric này: <b>{joinNames(preview.assignedSemesters)}</b>
          </span>
        </li>
      )}
      {preview.releasedSemesters.length > 0 && (
        <li className="flex gap-2">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
          <span>
            Các học kỳ sẽ không còn rubric: <b>{joinNames(preview.releasedSemesters)}</b>
          </span>
        </li>
      )}
      {nothingChanges && (
        <li className="flex gap-2">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span>Không có học kỳ nào thay đổi rubric.</span>
        </li>
      )}
    </ul>
  )
}

function joinNames(semesters: SemesterRef[]): string {
  return semesters.map((semester) => semester.name).join(', ')
}

function formatOption(semester: RubricSemesterOption): string {
  return semester.status ? `${semester.name} (${semester.status})` : semester.name
}

/**
 * Khi Sửa kỳ, kỳ đang lưu có thể không nằm trong danh sách lọc (VD ngoài 100 kỳ đã tải) → thêm vào
 * để ô chọn vẫn hiện đúng giá trị hiện tại thay vì trống
 */
function withCurrent(
  options: RubricSemesterOption[],
  current: SemesterRef | null,
  keep: boolean,
): RubricSemesterOption[] {
  if (!keep || !current || options.some((semester) => semester.publicId === current.publicId)) return options
  return [
    { publicId: current.publicId, name: current.name, startDate: '', endDate: '', status: '', statusCode: 'COMPLETED' },
    ...options,
  ]
}
