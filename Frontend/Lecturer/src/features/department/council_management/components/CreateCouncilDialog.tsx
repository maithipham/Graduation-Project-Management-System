import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Award, ArrowRight, Save } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { FormField } from '@/shared/components/ui/form-field'
import { Dialog, DialogContent, DialogTitle } from '@/shared/components/ui/dialog'
import { cn } from '@/shared/utils/cn'
import { useCreateCouncilBatch } from '../hooks/useDefenseCouncils'
import { generateCouncilCodes } from '../utils/councilFormatters'
import { createCouncilFormSchema, type CreateCouncilFormValues } from '../types'

interface CreateCouncilDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  semesterId: number | string
  majorId: number | string
  majorCode?: string
  academicYear?: string
  existingCouncilCount?: number
  onSuccessAndGoToAssign?: (firstCouncilId?: string) => void
}

/** Giờ mặc định gửi kèm ngày bảo vệ (BE nhận LocalDateTime) */
const DEFAULT_START_TIME = '08:00'
const DEFAULT_END_TIME = '17:00'

const inputClass =
  'w-full h-10 px-3 border border-slate-300 rounded-lg text-[13.5px] outline-none focus:border-[#1565C0] focus:ring-[3px] focus:ring-blue-100 transition aria-[invalid=true]:border-[#DC2626]'

function toIsoDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function buildDefaultValues(): CreateCouncilFormValues {
  const now = new Date()
  return {
    quantity: 3,
    startDate: toIsoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7)),
    endDate: toIsoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 9)),
  }
}

export function CreateCouncilDialog({
  open,
  onOpenChange,
  semesterId,
  majorId,
  majorCode = 'KTPM',
  academicYear,
  existingCouncilCount = 0,
  onSuccessAndGoToAssign,
}: CreateCouncilDialogProps) {
  const createBatchMutation = useCreateCouncilBatch()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateCouncilFormValues>({
    resolver: zodResolver(createCouncilFormSchema),
    defaultValues: buildDefaultValues(),
  })

  useEffect(() => {
    if (open) reset(buildDefaultValues())
  }, [open, reset])

  const quantity = watch('quantity')
  const previewCount = Number.isFinite(quantity) ? Math.max(0, Math.min(20, quantity)) : 0
  const previewCodes = generateCouncilCodes(majorCode, previewCount, existingCouncilCount, academicYear)

  const submit = (andAssign: boolean) =>
    handleSubmit((values) => {
      createBatchMutation.mutate(
        {
          semesterId,
          majorId,
          quantity: values.quantity,
          defenseStartTime: `${values.startDate}T${DEFAULT_START_TIME}`,
          defenseEndTime: `${values.endDate}T${DEFAULT_END_TIME}`,
        },
        {
          onSuccess: (data) => {
            onOpenChange(false)
            if (andAssign && onSuccessAndGoToAssign) {
              onSuccessAndGoToAssign(Array.isArray(data) ? data[0]?.publicId : undefined)
            }
          },
        },
      )
    })

  const isPending = createBatchMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[580px] p-0 gap-0 overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xl max-h-[calc(100vh-48px)] flex flex-col">
        <div className="px-6 pt-5 pb-4 border-b border-slate-200 flex items-start gap-3 pr-12">
          <div className="w-10 h-10 rounded-xl bg-[#E3F2FD] text-[#1565C0] flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <DialogTitle className="text-[16px] font-bold tracking-tight text-slate-800">
              Tạo hội đồng bảo vệ
            </DialogTitle>
            <p className="text-[12.5px] text-slate-500 mt-0.5">
              Nhập số lượng hội đồng và ngày bảo vệ chung cho bộ môn
            </p>
          </div>
        </div>

        <form
          noValidate
          onSubmit={submit(false)}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-left"
        >
          <div>
            <FormField label="Số lượng hội đồng" required error={errors.quantity?.message}>
              <input
                type="number"
                min={1}
                max={20}
                placeholder="VD: 3"
                className={cn(inputClass, 'font-semibold')}
                {...register('quantity', { valueAsNumber: true })}
              />
            </FormField>
            <div className="mt-2.5">
              <div className="text-[11.5px] font-medium text-slate-500 mb-1.5">
                Mã hội đồng tự sinh theo mã bộ môn (
                <span className="font-bold text-[#1565C0]">{majorCode}</span>):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {previewCodes.length > 0 ? (
                  previewCodes.map((code) => (
                    <span
                      key={code}
                      className="px-2.5 py-1 rounded-lg text-[12px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200"
                    >
                      {code}
                    </span>
                  ))
                ) : (
                  <span className="text-[12px] text-rose-500">
                    Vui lòng nhập số lượng từ 1 đến 20
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <FormField
              label="Từ ngày (Ngày bảo vệ chung)"
              required
              error={errors.startDate?.message}
            >
              <input type="date" className={inputClass} {...register('startDate')} />
            </FormField>
            <FormField label="Đến ngày" required error={errors.endDate?.message}>
              <input type="date" className={inputClass} {...register('endDate')} />
            </FormField>
          </div>
        </form>

        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/70 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 px-4 rounded-lg bg-white border border-slate-300 text-slate-700 text-[13px] font-semibold hover:bg-slate-50"
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={submit(false)}
            disabled={isPending}
            className="h-9 px-4 rounded-lg bg-[#1565C0] text-white text-[13px] font-semibold hover:bg-[#0D47A1] shadow-sm inline-flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{isPending ? 'Đang lưu...' : 'Lưu'}</span>
          </Button>
          <Button
            type="button"
            onClick={submit(true)}
            disabled={isPending}
            className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-[13px] font-semibold hover:bg-emerald-700 shadow-sm inline-flex items-center gap-1.5"
          >
            <span>Lưu &amp; Gán giảng viên</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
