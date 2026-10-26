import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarRange } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Select } from '@/shared/components/ui/select'
import {
  semesterConfigSchema,
  type SemesterConfigFormValues,
} from '../types/semester.types'
import {
  useSemesterConfig,
  useUpdateSemesterConfig,
} from '../hooks/useSemesters'

interface SemesterConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const defaultConfig: SemesterConfigFormValues = {
  term1StartMonth: 8,
  term1StartDay: 1,
  term1EndMonth: 1,
  term1EndDay: 31,
  term2StartMonth: 2,
  term2StartDay: 1,
  term2EndMonth: 7,
  term2EndDay: 31,
}

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `Tháng ${i + 1}`,
}))

const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
  value: i + 1,
  label: `Ngày ${String(i + 1).padStart(2, '0')}`,
}))

export const SemesterConfigDialog: React.FC<SemesterConfigDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { data: configData, isLoading } = useSemesterConfig()
  const updateConfigMutation = useUpdateSemesterConfig()

  const {
    handleSubmit,
    reset,
    register,
    formState: { isSubmitting },
  } = useForm<SemesterConfigFormValues>({
    resolver: zodResolver(semesterConfigSchema),
    defaultValues: defaultConfig,
  })

  useEffect(() => {
    if (open) {
      if (configData) {
        reset({
          term1StartMonth: configData.term1StartMonth ?? 8,
          term1StartDay: configData.term1StartDay ?? 1,
          term1EndMonth: configData.term1EndMonth ?? 1,
          term1EndDay: configData.term1EndDay ?? 31,
          term2StartMonth: configData.term2StartMonth ?? 2,
          term2StartDay: configData.term2StartDay ?? 1,
          term2EndMonth: configData.term2EndMonth ?? 7,
          term2EndDay: configData.term2EndDay ?? 31,
        })
      } else {
        reset(defaultConfig)
      }
    }
  }, [open, configData, reset])

  const onSubmit = async (values: SemesterConfigFormValues) => {
    try {
      await updateConfigMutation.mutateAsync(values)
      onOpenChange(false)
    } catch {
      // Error handled by mutation
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-blue-600" />
            <DialogTitle>Cấu hình Khung Thời gian Chuẩn</DialogTitle>
          </div>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-slate-500">
              Đang tải thông tin cấu hình...
            </div>
          ) : (
            <div className="space-y-4">
              {/* Học kỳ 1 */}
              <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-3">
                <div className="font-bold text-sm text-slate-900 border-b border-slate-200/80 pb-2">
                  Học kỳ 1
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Bắt đầu từ
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        {...register('term1StartDay', { valueAsNumber: true })}
                        className="text-xs sm:text-sm font-medium"
                      >
                        {DAY_OPTIONS.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </Select>
                      <Select
                        {...register('term1StartMonth', { valueAsNumber: true })}
                        className="text-xs sm:text-sm font-medium"
                      >
                        {MONTH_OPTIONS.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Đến hết ngày
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        {...register('term1EndDay', { valueAsNumber: true })}
                        className="text-xs sm:text-sm font-medium"
                      >
                        {DAY_OPTIONS.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </Select>
                      <Select
                        {...register('term1EndMonth', { valueAsNumber: true })}
                        className="text-xs sm:text-sm font-medium"
                      >
                        {MONTH_OPTIONS.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Học kỳ 2 */}
              <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-3">
                <div className="font-bold text-sm text-slate-900 border-b border-slate-200/80 pb-2">
                  Học kỳ 2
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Bắt đầu từ
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        {...register('term2StartDay', { valueAsNumber: true })}
                        className="text-xs sm:text-sm font-medium"
                      >
                        {DAY_OPTIONS.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </Select>
                      <Select
                        {...register('term2StartMonth', { valueAsNumber: true })}
                        className="text-xs sm:text-sm font-medium"
                      >
                        {MONTH_OPTIONS.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Đến hết ngày
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        {...register('term2EndDay', { valueAsNumber: true })}
                        className="text-xs sm:text-sm font-medium"
                      >
                        {DAY_OPTIONS.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </Select>
                      <Select
                        {...register('term2EndMonth', { valueAsNumber: true })}
                        className="text-xs sm:text-sm font-medium"
                      >
                        {MONTH_OPTIONS.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting || updateConfigMutation.isPending}
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || updateConfigMutation.isPending}
              className="bg-[#1565C0] hover:bg-[#0D47A1] text-white"
            >
              {isSubmitting || updateConfigMutation.isPending
                ? 'Đang lưu cấu hình...'
                : 'Lưu khung thời gian chuẩn'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
