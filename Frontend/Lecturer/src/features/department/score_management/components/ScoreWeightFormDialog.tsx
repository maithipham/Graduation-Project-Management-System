import { useState } from 'react'
import { useIsMutating } from '@tanstack/react-query'
import { useForm, useWatch, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RefreshCw, Scale } from 'lucide-react'
import { Button, Dialog, DialogContent, FormField, Input, Skeleton } from '@/shared/components/ui'
import { cn } from '@/shared/utils/cn'
import {
  scoreWeightKeys,
  useCreateScoreWeight,
  useScoreWeightDetail,
  useUpdateScoreWeight,
} from '../hooks/useScoreWeights'
import type { ScoreWeightConfig } from '../types'
import { getRubricErrorMessage } from '../utils/rubricErrors'
import { SCORE_WEIGHT_ERROR, hasScoreWeightErrorCode } from '../utils/scoreWeightErrors'
import { scoreWeightSchema, sumScoreWeights, type ScoreWeightInput } from '../utils/scoreWeightSchema'

interface ScoreWeightFormDialogProps {
  open: boolean
  /** null = tạo mới (W3); có giá trị = sửa (W4) – chỉ dùng `publicId`, dữ liệu sửa lấy lại từ W2 */
  editing: ScoreWeightConfig | null
  onClose: () => void
}

/** Hộp thoại Tạo / Sửa cấu hình trọng số: tên + 3 ô % + dòng tổng hiện tại */
export function ScoreWeightFormDialog({ open, editing, onClose }: ScoreWeightFormDialogProps) {
  // Đang gọi W3 / W4 → không cho đóng bằng ESC, nút X hay bấm ra ngoài
  const saving = useIsMutating({ mutationKey: scoreWeightKeys.saveMutation() }) > 0
  return (
    <Dialog open={open} onOpenChange={(value) => !value && !saving && onClose()}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
        {/* Chỉ mount form khi mở → mỗi lần mở là form mới, không cần reset bằng tay */}
        {open &&
          (editing ? (
            <EditScoreWeightLoader publicId={editing.publicId} onClose={onClose} />
          ) : (
            <ScoreWeightForm editing={null} onClose={onClose} />
          ))}
      </DialogContent>
    </Dialog>
  )
}

/** Sửa: tải W2 để có dữ liệu + `version` mới nhất (danh sách có thể đã cũ) rồi mới hiện form */
function EditScoreWeightLoader({ publicId, onClose }: { publicId: string; onClose: () => void }) {
  const detailQuery = useScoreWeightDetail(publicId)

  if (detailQuery.isPending) {
    return (
      <div className="space-y-4 px-6 py-6" aria-busy="true">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    )
  }

  if (detailQuery.isError) {
    // Interceptor đã toast lỗi; hook đã tải lại danh sách nếu cấu hình bị xóa (3169)
    return (
      <div className="space-y-4 px-6 py-6">
        <p role="alert" className="text-[13px] font-semibold text-[#DC2626]">
          {getRubricErrorMessage(detailQuery.error, 'Không tải được cấu hình trọng số')}
        </p>
        <div className="flex justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    )
  }

  // key = version: tải lại sau khi người khác sửa → form mount lại với dữ liệu mới
  return (
    <ScoreWeightForm
      key={detailQuery.data.version}
      editing={detailQuery.data}
      onClose={onClose}
      onReload={() => void detailQuery.refetch()}
      isReloading={detailQuery.isFetching}
    />
  )
}

const WEIGHT_FIELDS: { name: 'advisorWeight' | 'examinerWeight' | 'councilWeight'; label: string }[] = [
  { name: 'advisorWeight', label: 'Hướng dẫn (HD)' },
  { name: 'examinerWeight', label: 'Phản biện (PB)' },
  { name: 'councilWeight', label: 'Hội đồng (HĐ)' },
]

interface ScoreWeightFormProps {
  /** null = tạo mới; có giá trị = dữ liệu W2 */
  editing: ScoreWeightConfig | null
  onClose: () => void
  /** Sửa: tải lại W2 khi BE báo 3173 (người khác vừa cập nhật) */
  onReload?: () => void
  isReloading?: boolean
}

function ScoreWeightForm({ editing, onClose, onReload, isReloading = false }: ScoreWeightFormProps) {
  const isEdit = editing !== null
  const createMutation = useCreateScoreWeight()
  const updateMutation = useUpdateScoreWeight()
  const mutation = isEdit ? updateMutation : createMutation
  /** BE báo 3173 → hiện nút tải dữ liệu mới nhất */
  const [conflict, setConflict] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ScoreWeightInput>({
    resolver: zodResolver(scoreWeightSchema),
    defaultValues: editing
      ? {
          name: editing.name,
          advisorWeight: editing.advisorWeight,
          examinerWeight: editing.examinerWeight,
          councilWeight: editing.councilWeight,
        }
      : { name: '' },
  })

  const [advisorWeight, examinerWeight, councilWeight] = useWatch({
    control,
    name: ['advisorWeight', 'examinerWeight', 'councilWeight'],
  })
  const total = sumScoreWeights({ advisorWeight, examinerWeight, councilWeight })
  const totalOk = total === 100
  // Lỗi tổng nằm ở path `total` (refine của schema), không phải field của form → đọc qua kiểu mở rộng
  const totalError = (errors as FieldErrors<ScoreWeightInput & { total: number }>).total?.message
  const isApplied = editing !== null && editing.displayStatus !== 'DRAFT'
  /** W2 mới nhất cho biết không còn sửa được (vừa có phiếu nộp / hết áp dụng) → khóa form */
  const locked = editing !== null && !editing.canEdit
  const disabled = mutation.isPending || locked || isReloading

  function onSubmit(values: ScoreWeightInput) {
    const body = {
      name: values.name.trim(),
      advisorWeight: values.advisorWeight,
      examinerWeight: values.examinerWeight,
      councilWeight: values.councilWeight,
    }
    // Request có skipErrorToast → lỗi BE (3170, 3173, 3179…) hiện trong hộp thoại
    const onError = (error: unknown) => {
      setConflict(hasScoreWeightErrorCode(error, SCORE_WEIGHT_ERROR.VERSION_CONFLICT))
      setError('root.server', { message: getRubricErrorMessage(error, 'Không lưu được cấu hình trọng số') })
    }
    if (editing) {
      updateMutation.mutate(
        { publicId: editing.publicId, body: { ...body, version: editing.version } },
        { onSuccess: onClose, onError },
      )
    } else {
      createMutation.mutate(body, { onSuccess: onClose, onError })
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 pr-12">
        <h2 className="flex items-center gap-2 text-[16px] font-bold text-slate-900!">
          <Scale className="h-4.5 w-4.5 text-[#1565C0]" />
          {isEdit ? 'Sửa cấu hình trọng số' : 'Tạo cấu hình trọng số'}
        </h2>
        <p className="mt-1 text-[12.5px] text-slate-500">
          Tổng 3 trọng số bằng 100%. Trọng số chỉ hiển thị cho sinh viên, điểm tổng kết tính theo QĐ1305.
        </p>
      </div>

      <div className="space-y-4 px-6 py-4 text-[13px] text-slate-700">
        {locked && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[12px] font-semibold text-[#DC2626]">
            Cấu hình này không còn sửa được (khoảng kỳ áp dụng đã có phiếu chấm nộp chính thức hoặc đã hết áp dụng).
          </p>
        )}

        <FormField label="Tên cấu hình" required error={errors.name?.message}>
          <Input placeholder="VD: Trọng số K66" disabled={disabled} {...register('name')} />
        </FormField>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {WEIGHT_FIELDS.map((field) => (
            <FormField key={field.name} label={`${field.label} (%)`} required error={errors[field.name]?.message}>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                max={100}
                disabled={disabled}
                {...register(field.name, { valueAsNumber: true })}
              />
            </FormField>
          ))}
        </div>

        <div
          data-testid="score-weight-total"
          className={cn(
            'flex items-center justify-between rounded-xl border px-4 py-2.5 text-[13px] font-semibold',
            totalOk ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-[#DC2626]',
          )}
        >
          <span>Tổng hiện tại</span>
          <span>{total}% / 100%</span>
        </div>
        {totalError && <p className="text-[12.5px] font-semibold text-[#DC2626]">{totalError}</p>}

        {isApplied && !locked && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-[12px] text-amber-700">
            Cấu hình đang áp dụng: trọng số hiển thị của các học kỳ trong khoảng sẽ được cập nhật.
          </p>
        )}

        {errors.root?.server && (
          <div className="flex items-start justify-between gap-3">
            <p role="alert" className="text-[12.5px] font-semibold text-[#DC2626]">
              {errors.root.server.message}
            </p>
            {conflict && onReload && (
              <Button type="button" variant="outline" size="sm" disabled={isReloading} onClick={onReload}>
                <RefreshCw />
                {isReloading ? 'Đang tải...' : 'Tải dữ liệu mới nhất'}
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
        <Button type="button" variant="ghost" size="sm" disabled={mutation.isPending} onClick={onClose}>
          Hủy
        </Button>
        <Button type="submit" size="sm" disabled={disabled}>
          {mutation.isPending ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo cấu hình'}
        </Button>
      </div>
    </form>
  )
}
