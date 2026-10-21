import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Send } from 'lucide-react'
import { toast } from '@/shared/components/feedback/toast.store'
import { Button } from '@/shared/components/ui'
import { API_SUCCESS_CODE } from '@/shared/types'
import { useCreateStudent, useMajors } from '../hooks/useStudents'
import type { StudentImportRowResult } from '../types'
import {
  createStudentSchema,
  type CreateStudentFormInput,
  type CreateStudentFormValues,
} from '../utils/createStudentSchema'
import { applyRetryError, applyRetrySuccess, importRowToFormValues } from '../utils/importResult'
import { StudentFormFields } from './StudentFormFields'

interface RetryImportRowFormProps {
  row: StudentImportRowResult
  onRowChange: (row: StudentImportRowResult) => void
  onCancel: () => void
}

/** Sửa một dòng import bị lỗi rồi gửi lại qua POST /student */
export function RetryImportRowForm({ row, onRowChange, onCancel }: RetryImportRowFormProps) {
  const { data: majors, isPending: majorsLoading } = useMajors()
  const createStudent = useCreateStudent()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CreateStudentFormInput, unknown, CreateStudentFormValues>({
    resolver: zodResolver(createStudentSchema),
    defaultValues: importRowToFormValues(row),
  })

  const onSubmit = (values: CreateStudentFormValues) => {
    createStudent.mutate(values, {
      onSuccess: (result) => {
        // 1000 → báo thành công; 11xx → interceptor đã hiện toast vàng
        if (result.code === API_SUCCESS_CODE) toast.success(result.message)
        onRowChange(applyRetrySuccess(row, values, result))
      },
      onError: (error) => {
        // 3004/3010/3011/3005/4000 hoặc mất mạng: hiện ngay trong form, dòng vẫn ở tab Lỗi với lý do mới
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
      <StudentFormFields
        register={register}
        errors={errors}
        majors={majors}
        majorsLoading={majorsLoading}
        currentMajor={row.majorName ?? undefined}
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
        <Button type="submit" size="sm" disabled={createStudent.isPending}>
          <Send /> {createStudent.isPending ? 'Đang gửi...' : 'Gửi lại'}
        </Button>
      </div>
    </form>
  )
}
