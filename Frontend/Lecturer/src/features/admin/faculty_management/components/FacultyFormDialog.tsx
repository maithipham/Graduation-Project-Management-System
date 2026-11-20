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
import { Select } from '@/shared/components/ui/select'
import { Textarea } from '@/shared/components/ui/textarea'
import { Button } from '@/shared/components/ui/button'
import { toast } from '@/shared/components/feedback/toast.store'
import { isApiError } from '@/shared/types'
import {
  facultySchema,
  FACULTY_ERROR_CODES,
  type Faculty,
  type FacultyFormValues,
} from '../types/faculty.types'

interface FacultyFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingFaculty: Faculty | null
  existingFaculties: Faculty[]
  onSubmitSuccess: (values: FacultyFormValues, id?: number) => Promise<unknown> | unknown
}

const emptyValues: FacultyFormValues = {
  code: '',
  name: '',
  description: '',
  status: 'active',
}

export const FacultyFormDialog: React.FC<FacultyFormDialogProps> = ({
  open,
  onOpenChange,
  editingFaculty,
  existingFaculties,
  onSubmitSuccess,
}) => {
  const isEdit = Boolean(editingFaculty)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FacultyFormValues>({
    resolver: zodResolver(facultySchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      if (editingFaculty) {
        reset({
          code: editingFaculty.code,
          name: editingFaculty.name,
          description: editingFaculty.description,
          status: editingFaculty.status,
        })
      } else {
        reset(emptyValues)
      }
    }
  }, [open, editingFaculty, reset])

  const onSubmit = async (values: FacultyFormValues) => {
    const formattedCode = values.code.toUpperCase().trim()

    // Kiểm tra trùng mã khoa
    const isDuplicate = existingFaculties.some(
      (f) =>
        f.code.toUpperCase() === formattedCode &&
        (!isEdit || f.id !== editingFaculty?.id),
    )

    if (isDuplicate) {
      setError('code', {
        type: 'manual',
        message: 'Mã khoa này đã tồn tại trong hệ thống.',
      })
      return
    }

    try {
      await onSubmitSuccess({ ...values, code: formattedCode }, editingFaculty?.id)
      toast.success(
        isEdit
          ? 'Cập nhật thông tin khoa thành công!'
          : 'Thêm khoa mới thành công!',
      )
      onOpenChange(false)
    } catch (err: unknown) {
      if (isApiError(err)) {
        if (err.code === FACULTY_ERROR_CODES.FACULTY_CODE_EXIST) {
          setError('code', { message: err.message }, { shouldFocus: true })
          return
        }
        if (err.code === FACULTY_ERROR_CODES.FACULTY_NAME_EXIST) {
          setError('name', { message: err.message }, { shouldFocus: true })
          return
        }
        setError('root.server', { message: err.message })
        return
      }
      const msg = err instanceof Error ? err.message : 'Đã có lỗi xảy ra khi lưu thông tin khoa.'
      setError('root.server', { message: msg })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Cập nhật thông tin khoa' : 'Thêm khoa đào tạo'}
          </DialogTitle>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FormField
                label="Mã khoa"
                required
                error={errors.code?.message}
                hint="Ví dụ: CNTT, KT, QTKD"
              >
                <Input
                  placeholder="CNTT"
                  className="font-mono uppercase"
                  {...register('code')}
                />
              </FormField>
            </div>

            <div>
              <FormField
                label="Trạng thái"
                error={errors.status?.message}
              >
                <Select {...register('status')}>
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Không hoạt động</option>
                </Select>
              </FormField>
            </div>

            <div className="sm:col-span-2">
              <FormField
                label="Tên khoa"
                required
                error={errors.name?.message}
              >
                <Input
                  placeholder="Ví dụ: Công nghệ thông tin"
                  {...register('name')}
                />
              </FormField>
            </div>

            <div className="sm:col-span-2">
              <FormField
                label="Chi tiết về khoa"
                error={errors.description?.message}
              >
                <Textarea
                  rows={3}
                  placeholder="Nhập thông tin mô tả chức năng, nhiệm vụ và lĩnh vực đào tạo..."
                  {...register('description')}
                />
              </FormField>
            </div>
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
