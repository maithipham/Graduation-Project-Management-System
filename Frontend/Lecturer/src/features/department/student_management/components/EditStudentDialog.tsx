import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, Pencil } from 'lucide-react'
import { toast } from '@/shared/components/feedback/toast.store'
import { Button, Dialog, DialogContent, FormField, Input, Skeleton } from '@/shared/components/ui'
import { API_SUCCESS_CODE } from '@/shared/types'
import { useStudentDetail, useUpdateStudent } from '../hooks/useStudents'
import type { StudentListItem } from '../types'
import { STUDENT_EMAIL_DOMAIN } from '../utils/createStudentSchema'
import {
  EMPTY_UPDATE_STUDENT_VALUES,
  toUpdateStudentFormInput,
  updateStudentSchema,
  type UpdateStudentFormInput,
  type UpdateStudentFormValues,
} from '../utils/updateStudentSchema'

interface EditStudentDialogProps {
  /** Dòng đang sửa; undefined = popup đóng */
  student: StudentListItem | undefined
  onClose: () => void
}

export function EditStudentDialog({ student: row, onClose }: EditStudentDialogProps) {
  // Danh sách không có email / SĐT → lấy chi tiết để điền sẵn form
  const { data: student, isPending, isError } = useStudentDetail(row?.publicId)
  const updateStudent = useUpdateStudent()

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<UpdateStudentFormInput, unknown, UpdateStudentFormValues>({
    resolver: zodResolver(updateStudentSchema),
    defaultValues: EMPTY_UPDATE_STUDENT_VALUES,
  })

  // Chỉ nạp dữ liệu 1 lần cho mỗi sinh viên: chi tiết tự tải lại (quay lại tab...) không được xóa chữ đang gõ
  const loadedId = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (!row) {
      loadedId.current = undefined
      return
    }
    if (student && student.publicId === row.publicId && loadedId.current !== student.publicId) {
      loadedId.current = student.publicId
      reset(toUpdateStudentFormInput(student))
    }
  }, [row, student, reset])

  // Đang lưu thì không cho đóng, tránh tưởng đã hủy trong khi BE vẫn ghi
  const close = () => {
    if (!updateStudent.isPending) onClose()
  }

  const onSubmit = (values: UpdateStudentFormValues) => {
    if (!row) return
    updateStudent.mutate(
      { publicId: row.publicId, body: values },
      {
        onSuccess: (result) => {
          // 11xx: interceptor đã hiện toast vàng
          if (result.code === API_SUCCESS_CODE) toast.success(result.message || 'Cập nhật sinh viên thành công')
          onClose()
        },
        // Lỗi BE (trùng MSSV / email...), mất mạng: hiện ngay trong form, giữ nguyên dữ liệu để sửa
        onError: (error) => setError('root.server', { message: error.message }),
      },
    )
  }

  const isSaving = updateStudent.isPending
  const ready = !isPending && !isError && student !== undefined

  return (
    <Dialog open={row !== undefined} onOpenChange={(open) => !open && close()}>
      {/* gap-0: bỏ khoảng cách 16px mặc định giữa header / nội dung / footer của DialogContent */}
      <DialogContent className="max-h-[92vh] max-w-2xl gap-0 overflow-y-auto rounded-2xl p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Header Modal */}
        <div className="sticky top-0 z-10 flex items-start gap-3.5 border-b border-slate-200 bg-white px-5 py-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E3F2FD] text-[#1565C0]">
            <Pencil className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[16px] font-bold tracking-tight text-slate-800">Sửa thông tin sinh viên</h3>
            <p className="mt-0.5 text-[12.5px] text-slate-500">
              Cập nhật hồ sơ của sinh viên
            </p>
          </div>
        </div>

        {/* noValidate: tắt popup của trình duyệt, lỗi do zod + FormField hiển thị */}
        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 bg-white px-5 py-4">
            {isPending ? (
              <EditStudentSkeleton />
            ) : !ready ? (
              <div className="py-12 text-center text-[13px] text-slate-500">
                Không tải được thông tin sinh viên.
              </div>
            ) : (
              <>
                {/* Ngành: in đậm, chỉ xem — BE không nhận ngành trong body sửa */}
                <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/90 bg-slate-50/70 px-3.5 py-2.5">
                  <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="text-[12.5px] font-medium text-slate-500">Ngành:</span>
                  <span className="truncate text-[13.5px] font-bold text-slate-800">
                    {student.majorName || '—'}
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Mã sinh viên" required error={errors.studentCode?.message}>
                    <Input placeholder="VD: 2251172489" inputMode="numeric" {...register('studentCode')} />
                  </FormField>
                  <FormField label="Email" required error={errors.email?.message}>
                    <Input
                      type="email"
                      placeholder={`VD: 2251172489${STUDENT_EMAIL_DOMAIN}`}
                      {...register('email')}
                    />
                  </FormField>

                  <FormField label="Họ và tên đệm" required error={errors.firstName?.message}>
                    <Input placeholder="VD: Lê Trung" {...register('firstName')} />
                  </FormField>
                  <FormField label="Tên" required error={errors.lastName?.message}>
                    <Input placeholder="VD: Đức" {...register('lastName')} />
                  </FormField>

                  <FormField label="Số điện thoại" required error={errors.phone?.message}>
                    <Input type="tel" placeholder="VD: 0911111111" {...register('phone')} />
                  </FormField>
                  <FormField label="Khóa" required error={errors.batch?.message}>
                    <Input placeholder="VD: K63" {...register('batch')} />
                  </FormField>

                  <FormField label="Lớp" required error={errors.className?.message}>
                    <Input placeholder="VD: 63KTPM1" {...register('className')} />
                  </FormField>
                </div>

                {errors.root?.server && (
                  <p role="alert" className="text-sm font-semibold text-[#DC2626]">
                    {errors.root.server.message}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Footer Modal */}
          <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-3">
            <Button
              type="button"
              variant="outline"
              onClick={close}
              disabled={isSaving}
              className="h-9 rounded-lg border-slate-300 bg-white px-4 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSaving || !ready}
              className="h-9 rounded-lg px-4 text-[13px] font-semibold"
            >
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Khung đang tải cùng bố cục form thật → dữ liệu về popup không đổi chiều cao */
function EditStudentSkeleton() {
  return (
    <>
      <Skeleton className="h-10.5 w-full rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    </>
  )
}
