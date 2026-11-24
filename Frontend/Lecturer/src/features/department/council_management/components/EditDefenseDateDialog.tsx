import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarDays, Save } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { FormField } from '@/shared/components/ui/form-field'
import { Dialog, DialogContent, DialogTitle } from '@/shared/components/ui/dialog'
import { cn } from '@/shared/utils/cn'
import { useUpdateCommonDefenseDate } from '../hooks/useDefenseCouncils'
import { toDateInputValue } from '../utils/councilFormatters'
import { editDefenseDateFormSchema, type EditDefenseDateFormValues } from '../types'

interface EditDefenseDateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  semesterId: number | string
  majorId: number | string
  /** Ngày hiện tại của hội đồng đầu tiên, dùng làm giá trị mặc định */
  currentStart?: string | null
  currentEnd?: string | null
}

/** Giờ mặc định gửi kèm ngày bảo vệ (BE nhận LocalDateTime) */
const DEFAULT_START_TIME = '08:00'
const DEFAULT_END_TIME = '17:00'

const inputClass =
  'w-full h-10 px-3 border border-slate-300 rounded-lg text-[13.5px] outline-none focus:border-[#1565C0] focus:ring-[3px] focus:ring-blue-100 transition aria-[invalid=true]:border-[#DC2626]'

/** Sửa ngày bảo vệ chung: áp dụng cho mọi hội đồng của bộ môn trong học kỳ */
export function EditDefenseDateDialog({
  open,
  onOpenChange,
  semesterId,
  majorId,
  currentStart,
  currentEnd,
}: EditDefenseDateDialogProps) {
  const mutation = useUpdateCommonDefenseDate()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditDefenseDateFormValues>({
    resolver: zodResolver(editDefenseDateFormSchema),
    defaultValues: { startDate: '', endDate: '' },
  })

  useEffect(() => {
    if (open) {
      reset({ startDate: toDateInputValue(currentStart), endDate: toDateInputValue(currentEnd) })
    }
  }, [open, currentStart, currentEnd, reset])

  const onSubmit = handleSubmit((values) => {
    mutation.mutate(
      {
        semesterId,
        majorId,
        defenseStartTime: `${values.startDate}T${DEFAULT_START_TIME}`,
        defenseEndTime: `${values.endDate}T${DEFAULT_END_TIME}`,
      },
      { onSuccess: () => onOpenChange(false) },
    )
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px] p-0 gap-0 overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xl">
        <div className="px-6 pt-5 pb-4 border-b border-slate-200 flex items-start gap-3 pr-12">
          <div className="w-10 h-10 rounded-xl bg-[#E3F2FD] text-[#1565C0] flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <DialogTitle className="text-[16px] font-bold tracking-tight text-slate-800">
              Sửa ngày bảo vệ chung
            </DialogTitle>
            <p className="text-[12.5px] text-slate-500 mt-0.5">
              Áp dụng cho tất cả hội đồng của bộ môn trong học kỳ (trừ hội đồng đã kết thúc hoặc đã hủy)
            </p>
          </div>
        </div>

        <form noValidate onSubmit={onSubmit} className="px-6 py-5 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <FormField label="Từ ngày" required error={errors.startDate?.message}>
              <input type="date" className={cn(inputClass)} {...register('startDate')} />
            </FormField>
            <FormField label="Đến ngày" required error={errors.endDate?.message}>
              <input type="date" className={cn(inputClass)} {...register('endDate')} />
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
            onClick={onSubmit}
            disabled={mutation.isPending}
            className="h-9 px-4 rounded-lg bg-[#1565C0] text-white text-[13px] font-semibold hover:bg-[#0D47A1] shadow-sm inline-flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{mutation.isPending ? 'Đang lưu...' : 'Lưu'}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
