import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Info } from 'lucide-react'
import { toast } from '@/shared/components/feedback/toast.store'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui'
import { API_SUCCESS_CODE } from '@/shared/types'
import { useCreateStudent } from '../hooks/useStudents'
import type { MajorOption } from '../types'
import {
  createStudentSchema,
  EMPTY_CREATE_STUDENT_VALUES,
  type CreateStudentFormInput,
  type CreateStudentFormValues,
} from '../utils/createStudentSchema'
import { StudentFormFields } from './StudentFormFields'

interface CreateStudentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  majors: MajorOption[] | undefined
  majorsLoading: boolean
}

export function CreateStudentDialog({
  open,
  onOpenChange,
  majors,
  majorsLoading,
}: CreateStudentDialogProps) {
  const createStudent = useCreateStudent()

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateStudentFormInput, unknown, CreateStudentFormValues>({
    resolver: zodResolver(createStudentSchema),
    defaultValues: EMPTY_CREATE_STUDENT_VALUES,
  })

  // Mỗi lần mở popup: làm trống form
  useEffect(() => {
    if (open) reset(EMPTY_CREATE_STUDENT_VALUES)
  }, [open, reset])

  // Đang lưu thì không cho đóng, tránh tưởng đã hủy trong khi BE vẫn ghi
  const handleOpenChange = (value: boolean) => {
    if (!value && createStudent.isPending) return
    onOpenChange(value)
  }

  const onSubmit = (values: CreateStudentFormValues) => {
    createStudent.mutate(values, {
      onSuccess: (result) => {
        // 1000: thêm mới / cập nhật / kích hoạt lại → toast xanh với đúng câu của BE.
        // 11xx (VD 1101 đã có, không đổi): interceptor đã hiện toast vàng
        if (result.code === API_SUCCESS_CODE) toast.success(result.message)
        onOpenChange(false)
      },
      // 3010 (email thuộc tài khoản khác), 3011 (mã SV thuộc tài khoản khác),
      // 3004 (mã SV và email thuộc 2 tài khoản khác nhau), 3005 (không khớp hồ sơ gốc), 4000, mất mạng:
      // hiện ngay trong form, giữ nguyên dữ liệu để sửa
      onError: (error) => setError('root.server', { message: error.message }),
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm sinh viên</DialogTitle>
          <DialogDescription>Nhập thông tin một sinh viên làm đồ án kì này.</DialogDescription>
        </DialogHeader>

        {/* noValidate: tắt popup của trình duyệt, lỗi do zod + FormField hiển thị */}
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <StudentFormFields
            register={register}
            errors={errors}
            majors={majors}
            majorsLoading={majorsLoading}
          />

          {errors.root?.server && (
            <p role="alert" className="text-sm font-semibold text-[#DC2626]">
              {errors.root.server.message}
            </p>
          )}

          <p className="flex items-start gap-2 text-xs text-slate-500">
            <Info className="mt-px h-3.5 w-3.5 shrink-0" />
            Nếu sinh viên đã có trong hệ thống, chỉ Lớp và Số điện thoại được cập nhật.
          </p>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={createStudent.isPending}
              onClick={() => handleOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={createStudent.isPending}>
              {createStudent.isPending ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
