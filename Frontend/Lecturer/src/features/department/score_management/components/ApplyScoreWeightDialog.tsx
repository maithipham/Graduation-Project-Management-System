import { useState } from 'react'
import { useIsMutating } from '@tanstack/react-query'
import { CalendarCheck, Info } from 'lucide-react'
import { Button, Dialog, DialogContent, FormField, Select, Skeleton } from '@/shared/components/ui'
import {
  scoreWeightKeys,
  useApplyScoreWeight,
  useChangeScoreWeightRange,
  useScoreWeightApplyPreview,
} from '../hooks/useScoreWeights'
import { useSemesterOptions } from '../hooks/useSemesterRubrics'
import type { ApplyPreview, RubricSemesterOption, ScoreWeightConfig, SemesterRef } from '../types'
import { getFromSemesterOptions, getToSemesterOptions, keepValidToSemester } from '../utils/rubricHelpers'
import { getRubricErrorMessage } from '../utils/rubricErrors'
import { semesterRangeSchema } from '../utils/rubricSchema'

export type ApplyScoreWeightMode = 'apply' | 'change'

interface ApplyScoreWeightDialogProps {
  /** null = đóng. 'apply' = W7 (Nháp → áp dụng), 'change' = W8 (sửa kỳ áp dụng) */
  mode: ApplyScoreWeightMode | null
  config: ScoreWeightConfig | null
  onClose: () => void
}

/** Popup chọn "Từ kỳ" / "Đến kỳ" + xem trước học kỳ bị ảnh hưởng (W6) rồi xác nhận (W7 / W8) */
export function ApplyScoreWeightDialog({ mode, config, onClose }: ApplyScoreWeightDialogProps) {
  // Đang gọi W7 / W8 → không cho đóng bằng ESC, nút X hay bấm ra ngoài
  const saving = useIsMutating({ mutationKey: scoreWeightKeys.rangeMutation() }) > 0
  return (
    <Dialog open={mode !== null && config !== null} onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
        {mode && config && <ApplyScoreWeightBody mode={mode} config={config} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function ApplyScoreWeightBody({
  mode,
  config,
  onClose,
}: {
  mode: ApplyScoreWeightMode
  config: ScoreWeightConfig
  onClose: () => void
}) {
  const isChange = mode === 'change'
  // Áp dụng (Nháp) luôn được chọn "Từ kỳ"; Sửa kỳ thì theo cờ BE (đã có phiếu nộp → khóa)
  const fromLocked = isChange && !config.canChangeFromSemester
  const initialFromId = isChange ? (config.fromSemester?.publicId ?? null) : null
  const initialToId = isChange ? (config.toSemester?.publicId ?? null) : null

  const [fromId, setFromId] = useState<string | null>(initialFromId)
  const [toId, setToId] = useState<string | null>(initialToId)
  const [fromError, setFromError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const semestersQuery = useSemesterOptions()
  const semesters = semestersQuery.data ?? []
  const fromOptions = withCurrent(getFromSemesterOptions(semesters, initialFromId), config.fromSemester, isChange)
  const toOptions = withCurrent(
    getToSemesterOptions(semesters, fromId),
    config.toSemester,
    isChange && toId === initialToId,
  )

  const previewQuery = useScoreWeightApplyPreview(config.publicId, fromId, toId)
  const applyMutation = useApplyScoreWeight()
  const changeMutation = useChangeScoreWeightRange()
  const mutation = isChange ? changeMutation : applyMutation

  const unchanged = isChange && fromId === initialFromId && toId === initialToId
  const waitingPreview = fromId !== null && (previewQuery.isPending || previewQuery.isError)
  const canConfirm = !mutation.isPending && !unchanged && !waitingPreview
  // Lỗi khoảng kỳ (3171, 3174–3177, 4041…) của xem trước và của lúc lưu cùng hiện ngay dưới 2 ô chọn
  const rangeError =
    submitError ??
    (previewQuery.isError ? getRubricErrorMessage(previewQuery.error, 'Không xem trước được kỳ áp dụng') : null)

  function changeFrom(value: string) {
    const nextFrom = value === '' ? null : value
    setFromId(nextFrom)
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
      { publicId: config.publicId, body: parsed.data, name: config.name },
      {
        onSuccess: onClose,
        // Request có skipErrorToast → lỗi hiện trong popup (message 3176 / 3177 do BE ghép, hiện nguyên văn)
        onError: (error) => setSubmitError(getRubricErrorMessage(error, 'Không lưu được kỳ áp dụng')),
      },
    )
  }

  return (
    <>
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 pr-12">
        <h2 className="flex items-center gap-2 text-[16px] font-bold text-slate-900!">
          <CalendarCheck className="h-4.5 w-4.5 text-[#1565C0]" />
          {isChange ? 'Sửa kỳ áp dụng' : 'Áp dụng cấu hình trọng số'}
        </h2>
        <p className="mt-1 truncate text-[12.5px] text-slate-500" title={config.name}>
          {config.name} · HD {config.advisorWeight}% · PB {config.examinerWeight}% · HĐ {config.councilWeight}%
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
                hint={fromLocked ? 'Đã có phiếu chấm nộp nên không đổi được' : undefined}
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

        <p className="text-[12px] text-slate-500">
          Trọng số này hiển thị cho sinh viên các học kỳ thuộc khoảng (điểm tổng kết tính theo QĐ1305, không theo trọng số).
          Khi đã có phiếu chấm nộp chính thức, trọng số và "Từ kỳ" sẽ không sửa được nữa.
        </p>
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

/** Kết quả W6: khoảng đang xem + học kỳ sẽ dùng / không còn dùng cấu hình này */
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
            Các học kỳ sẽ dùng cấu hình này: <b>{joinNames(preview.assignedSemesters)}</b>
          </span>
        </li>
      )}
      {preview.releasedSemesters.length > 0 && (
        <li className="flex gap-2">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
          <span>
            Các học kỳ sẽ không còn cấu hình trọng số: <b>{joinNames(preview.releasedSemesters)}</b>
          </span>
        </li>
      )}
      {nothingChanges && (
        <li className="flex gap-2">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span>Không có học kỳ nào thay đổi cấu hình trọng số.</span>
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

/** Khi Sửa kỳ, kỳ đang lưu có thể không nằm trong danh sách lọc → thêm vào để ô chọn hiện đúng giá trị */
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
