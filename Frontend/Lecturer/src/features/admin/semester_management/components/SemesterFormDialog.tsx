import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Calendar, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { FormField } from '@/shared/components/ui/form-field'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import {
  semesterSchema,
  type Semester,
  type SemesterFormValues,
} from '../types/semester.types'
import { formatDateForInput } from '@/shared/utils/formatDate'

interface SemesterFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingSemester: Semester | null
  onSubmitSuccess: (values: SemesterFormValues, id?: number) => Promise<void> | void
}

const emptyValues: SemesterFormValues = {
  name: '',
  startDate: '',
  endDate: '',
  applyToFutureSemesters: true,
}

export const SemesterFormDialog: React.FC<SemesterFormDialogProps> = ({
  open,
  onOpenChange,
  editingSemester,
  onSubmitSuccess,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<SemesterFormValues>({
    resolver: zodResolver(semesterSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      clearErrors()
      if (editingSemester) {
        reset({
          name: editingSemester.name,
          startDate: formatDateForInput(editingSemester.startDate),
          endDate: formatDateForInput(editingSemester.endDate),
          applyToFutureSemesters: true,
        })
      } else {
        reset(emptyValues)
      }
    }
  }, [open, editingSemester, reset, clearErrors])

  const onSubmit = async (values: SemesterFormValues) => {
    if (!editingSemester) return
    try {
      clearErrors('root.server')
      await onSubmitSuccess(values, editingSemester.id)
      onOpenChange(false)
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Có lỗi xảy ra khi cập nhật khoảng thời gian học kỳ.'
      setError('root.server', { message: errorMessage })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <DialogTitle>Chỉnh sửa thời gian học kỳ</DialogTitle>
          </div>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="Tên học kỳ"
            hint="Tên học kỳ được hệ thống quản lý tự động"
          >
            <Input
              {...register('name')}
              disabled
              className="bg-slate-100/80 text-slate-700 font-medium cursor-not-allowed"
            />
          </FormField>

          <div className="space-y-4">
            <FormField
              label="Thời gian bắt đầu"
              required
              error={errors.startDate?.message}
            >
              <Input
                type="date"
                placeholder="yyyy-mm-dd"
                {...register('startDate')}
              />
            </FormField>

            <FormField
              label="Thời gian kết thúc"
              required
              error={errors.endDate?.message}
            >
              <Input
                type="date"
                placeholder="yyyy-mm-dd"
                {...register('endDate')}
              />
            </FormField>
          </div>

          {/* Tuỳ chọn áp dụng khung thời gian chuẩn cho các năm sau */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                {...register('applyToFutureSemesters')}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-800">
                  Tự động áp dụng khung thời gian này cho các năm sau
                </span>
                <p className="text-slate-500 mt-0.5 leading-relaxed">
                  Lưu mốc tháng/ngày vào cấu hình chuẩn. Các học kỳ của những năm học tiếp theo sẽ tự động áp dụng mốc thời gian này mà không cần sửa từng năm.
                </p>
              </div>
            </label>
          </div>

          {errors.root?.server && (
            <div
              role="alert"
              className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-700"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errors.root.server.message}</span>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#1565C0] hover:bg-[#0D47A1] text-white"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
