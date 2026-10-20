import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { toast } from '@/shared/components/feedback/toast.store'
import {
  semesterSchema,
  type Semester,
  type SemesterFormValues,
} from '../types/semester.types'

interface SemesterFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingSemester: Semester | null
  onSubmitSuccess: (values: SemesterFormValues, id?: number) => void
}

const emptyValues: SemesterFormValues = {
  name: '',
  startDate: '',
  endDate: '',
}

export const SemesterFormDialog: React.FC<SemesterFormDialogProps> = ({
  open,
  onOpenChange,
  editingSemester,
  onSubmitSuccess,
}) => {
  const isEdit = Boolean(editingSemester)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SemesterFormValues>({
    resolver: zodResolver(semesterSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      if (editingSemester) {
        reset({
          name: editingSemester.name,
          startDate: editingSemester.startDate,
          endDate: editingSemester.endDate,
        })
      } else {
        reset(emptyValues)
      }
    }
  }, [open, editingSemester, reset])

  const onSubmit = (values: SemesterFormValues) => {
    try {
      onSubmitSuccess(values, editingSemester?.id)
      toast.success(
        isEdit
          ? 'Cập nhật học kỳ thành công!'
          : 'Tạo học kỳ mới thành công!',
      )
      onOpenChange(false)
    } catch {
      setError('root.server', {
        message: 'Có lỗi xảy ra khi lưu thông tin học kỳ.',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Sửa thông tin học kỳ' : 'Thêm học kỳ'}
          </DialogTitle>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="Tên học kỳ"
            required
            error={errors.name?.message}
          >
            <Input
              placeholder="Ví dụ: Học kỳ 1 - 2026"
              {...register('name')}
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
                placeholder="mm/dd/yyyy"
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
                placeholder="mm/dd/yyyy"
                {...register('endDate')}
              />
            </FormField>
          </div>

          {errors.root?.server && (
            <p role="alert" className="text-xs font-semibold text-[#DC2626]">
              {errors.root.server.message}
            </p>
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
              {isSubmitting ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
