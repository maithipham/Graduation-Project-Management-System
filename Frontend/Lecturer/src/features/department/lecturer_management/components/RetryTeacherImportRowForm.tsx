import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Send } from 'lucide-react'
import { toast } from '@/shared/components/feedback/toast.store'
import { Button } from '@/shared/components/ui'
import { API_SUCCESS_CODE } from '@/shared/types'
import { useMajors } from '@/features/department/student_management'
import { useTeacherEmailAutoFill } from '../hooks/useTeacherEmailAutoFill'
import { useCreateTeacher } from '../hooks/useTeachers'
import type { TeacherImportRowResult } from '../types'
import {
  createTeacherSchema,
  type CreateTeacherFormInput,
  type CreateTeacherFormValues,
} from '../utils/createTeacherSchema'
import {
  applyRetryError,
  applyRetrySuccess,
  importRowToFormValues,
} from '../utils/teacherImportResult'
import { TeacherFormFields } from './TeacherFormFields'

interface RetryTeacherImportRowFormProps {
  row: TeacherImportRowResult
  onRowChange: (row: TeacherImportRowResult) => void
  onCancel: () => void
}

/** Sửa một dòng import giáo viên bị lỗi rồi gửi lại qua POST /teacher */
export function RetryTeacherImportRowForm({
  row,
  onRowChange,
  onCancel,
}: RetryTeacherImportRowFormProps) {
  const { data: majors, isPending: majorsLoading } = useMajors()
  const createTeacher = useCreateTeacher()
  const defaultValues = importRowToFormValues(row)

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    subscribe,
    control,
    formState: { errors, isSubmitted },
  } = useForm<CreateTeacherFormInput, unknown, CreateTeacherFormValues>({
    resolver: zodResolver(createTeacherSchema),
    defaultValues,
  })

  // Đổi đuôi email (VD @gmail.com → @tlu.edu.vn) → tự đổi đơn vị công tác, hạn mức giống popup "Thêm giáo viên"
  useTeacherEmailAutoFill({ subscribe, setValue, isSubmitted, initialEmail: row.email })

  // Danh sách ngành tải xong sau khi form đã gắn giá trị → ô Ngành chưa có option nên đang trống; gắn lại cho khớp
  useEffect(() => {
    if (majors) setValue('major', getValues('major'))
  }, [majors, getValues, setValue])

  const onSubmit = (values: CreateTeacherFormValues) => {
    createTeacher.mutate(values, {
      onSuccess: (result) => {
        // 1000 → báo thành công; 1100 → interceptor đã hiện toast vàng
        const updated = applyRetrySuccess(row, values, result)
        if (result.code === API_SUCCESS_CODE) toast.success(updated.message)
        onRowChange(updated)
      },
      onError: (error) => {
        // 3006/3007/4000/2007 hoặc mất mạng: hiện ngay trong form, dòng vẫn ở tab Lỗi với lý do mới
        setError('root.server', { message: error.message })
        onRowChange(applyRetryError(row, values, error.message))
      },
    })
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-3 rounded-lg border border-blue-100 bg-blue-50/40 p-4"
    >
      <TeacherFormFields
        register={register}
        control={control}
        errors={errors}
        majors={majors}
        majorsLoading={majorsLoading}
        currentMajor={defaultValues.major || undefined}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      />

      {errors.root?.server && (
        <p role="alert" className="text-sm font-semibold text-[#DC2626]">
          {errors.root.server.message}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" size="sm" disabled={createTeacher.isPending}>
          <Send /> {createTeacher.isPending ? 'Đang gửi...' : 'Gửi lại'}
        </Button>
      </div>
    </form>
  )
}
