import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { FormField } from '@/shared/components/ui/form-field'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Button } from '@/shared/components/ui/button'
import { toast } from '@/shared/components/feedback/toast.store'
import {
  majorSchema,
  type Major,
  type MajorFormValues,
} from '../types/faculty.types'

interface MajorFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  facultyName: string
  editingMajor: Major | null
  onSubmitSuccess: (values: MajorFormValues, id?: number) => void
}

const emptyValues: MajorFormValues = {
  name: '',
  description: '',
  status: 'active',
}

export const MajorFormDialog: React.FC<MajorFormDialogProps> = ({
  open,
  onOpenChange,
  facultyName,
  editingMajor,
  onSubmitSuccess,
}) => {
  const isEdit = Boolean(editingMajor)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MajorFormValues>({
    resolver: zodResolver(majorSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      if (editingMajor) {
        reset({
          name: editingMajor.name,
          description: editingMajor.description,
          status: editingMajor.status,
        })
      } else {
        reset(emptyValues)
      }
    }
  }, [open, editingMajor, reset])

  const onSubmit = (values: MajorFormValues) => {
    try {
      onSubmitSuccess(values, editingMajor?.id)
      toast.success(
        isEdit
          ? 'Cập nhật chuyên ngành thành công!'
          : 'Thêm chuyên ngành mới thành công!',
      )
      onOpenChange(false)
    } catch {
      setError('root.server', {
        message: 'Đã có lỗi xảy ra khi lưu thông tin chuyên ngành.',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Cập nhật chuyên ngành' : 'Thêm chuyên ngành mới'}
          </DialogTitle>
          <DialogDescription>
            Trực thuộc: <b>{facultyName}</b>
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="Tên chuyên ngành"
            required
            error={errors.name?.message}
          >
            <Input
              placeholder="Nhập tên chuyên ngành..."
              {...register('name')}
            />
          </FormField>

          <FormField
            label="Chi tiết về ngành"
            error={errors.description?.message}
          >
            <Textarea
              rows={3}
              placeholder="Nhập mục tiêu đào tạo, kiến thức chuyên sâu và hướng đề tài tốt nghiệp..."
              {...register('description')}
            />
          </FormField>

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
