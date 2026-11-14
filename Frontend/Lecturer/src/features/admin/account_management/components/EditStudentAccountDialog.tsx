import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Pencil } from 'lucide-react'
import { toast } from '@/shared/components/feedback/toast.store'
import { Button, Dialog, DialogContent, Skeleton } from '@/shared/components/ui'
import { API_SUCCESS_CODE } from '@/shared/types'
import { cn } from '@/shared/utils/cn'
import {
  createStudentSchema,
  EMPTY_CREATE_STUDENT_VALUES,
  splitFullName,
  StudentFormFields,
  useMajors,
  type CreateStudentFormInput,
  type CreateStudentFormValues,
} from '@/features/department'
import { useStudentAccountDetail, useUpdateStudentAccount } from '../hooks/useAccounts'
import type { StudentAccountDetail, StudentAccountItem } from '../types/account.types'

interface EditStudentAccountDialogProps {
  /** Dòng đang sửa; null = popup đóng */
  student: StudentAccountItem | null
  onClose: () => void
}

/** Chi tiết BE → giá trị form. BE chỉ trả `name` đã ghép → tách lại Họ và tên đệm / Tên */
function toFormInput(student: StudentAccountDetail): CreateStudentFormInput {
  return {
    studentCode: student.studentCode,
    ...splitFullName(student.name),
    email: student.email,
    phone: student.phone ?? '',
    batch: student.batch,
    className: student.className,
    major: student.majorName ?? '',
  }
}

/**
 * Popup sửa tài khoản sinh viên (PUT /student/account/{publicId}): sửa 8 trường (đổi được Ngành)
 * và mở / khóa tài khoản bằng công tắc "Hoạt động"
 */
export function EditStudentAccountDialog({ student: row, onClose }: EditStudentAccountDialogProps) {
  // Danh sách không có SĐT → lấy chi tiết để điền sẵn form
  const { data: student, isPending, isError } = useStudentAccountDetail(row?.publicId ?? null)
  const { data: majors, isPending: majorsLoading } = useMajors()
  const updateAccount = useUpdateStudentAccount()
  // Công tắc trạng thái nằm ngoài form zod: chỉ gửi khi Admin đổi so với hiện tại
  const [active, setActive] = useState(false)

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

  // Chỉ nạp dữ liệu 1 lần cho mỗi sinh viên: chi tiết tự tải lại (quay lại tab...) không được xóa chữ đang gõ.
  // Chờ danh sách ngành về trước, nếu không ô chọn Ngành không có option để hiện giá trị
  const loadedId = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (!row) {
      loadedId.current = undefined
      return
    }
    if (
      !majorsLoading &&
      student &&
      student.publicId === row.publicId &&
      loadedId.current !== student.publicId
    ) {
      loadedId.current = student.publicId
      reset(toFormInput(student))
      setActive(student.accountStatus)
    }
  }, [row, student, majorsLoading, reset])

  // Đang lưu thì không cho đóng, tránh tưởng đã hủy trong khi BE vẫn ghi
  const close = () => {
    if (!updateAccount.isPending) onClose()
  }

  const onSubmit = (values: CreateStudentFormValues) => {
    if (!row || !student) return
    const body = active === student.accountStatus ? values : { ...values, accountStatus: active }
    updateAccount.mutate(
      { publicId: row.publicId, body },
      {
        onSuccess: (result) => {
          // 1000 "Đã cập nhật: ..." → toast xanh; 1103 (không đổi gì): interceptor đã hiện toast vàng
          if (result.code === API_SUCCESS_CODE) toast.success(result.message || 'Cập nhật sinh viên thành công')
          onClose()
        },
        // 4000, 3014 (trùng), 3033 (đổi ngành khi đang làm đồ án), 404 3008, mất mạng:
        // hiện ở đầu form, giữ nguyên dữ liệu để sửa
        onError: (error) => setError('root.server', { message: error.message }),
      },
    )
  }

  const isSaving = updateAccount.isPending
  const loading = isPending || majorsLoading
  const ready = !loading && !isError && student !== undefined

  return (
    <Dialog open={row !== null} onOpenChange={(open) => !open && close()}>
      {/* gap-0: bỏ khoảng cách 16px mặc định giữa header / nội dung / footer của DialogContent */}
      <DialogContent className="max-h-[92vh] max-w-2xl gap-0 overflow-y-auto rounded-2xl p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="sticky top-0 z-10 flex items-start gap-3.5 border-b border-slate-200 bg-white px-5 py-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E3F2FD] text-[#1565C0]">
            <Pencil className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[16px] font-bold tracking-tight text-slate-800">Sửa tài khoản sinh viên</h3>
            <p className="mt-0.5 text-[12.5px] text-slate-500">
              Cập nhật thông tin, ngành và trạng thái đăng nhập của sinh viên
            </p>
          </div>
        </div>

        {/* noValidate: tắt popup của trình duyệt, lỗi do zod + FormField hiển thị */}
        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 bg-white px-5 py-4">
            {loading ? (
              <EditStudentAccountSkeleton />
            ) : !ready ? (
              <div className="py-12 text-center text-[13px] text-slate-500">
                Không tải được thông tin sinh viên.
              </div>
            ) : (
              <>
                {/* Lỗi BE hiện ở đầu form */}
                {errors.root?.server && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 text-[12.5px] text-rose-700"
                  >
                    <AlertCircle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-rose-600" />
                    <div className="flex-1 font-medium leading-relaxed">{errors.root.server.message}</div>
                  </div>
                )}

                <StudentFormFields
                  register={register}
                  errors={errors}
                  majors={majors}
                  majorsLoading={majorsLoading}
                  currentMajor={student.majorName ?? undefined}
                />

                <AccountStatusSwitch checked={active} onChange={setActive} disabled={isSaving} />
              </>
            )}
          </div>

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

interface AccountStatusSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

/** Công tắc "Hoạt động": bật = được đăng nhập, tắt = khóa tài khoản */
function AccountStatusSwitch({ checked, onChange, disabled }: AccountStatusSwitchProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5">
      <div>
        <p id="account-status-label" className="text-sm font-semibold text-slate-800">
          Hoạt động
        </p>
        <p className="text-xs text-slate-500">
          {checked ? 'Sinh viên đăng nhập được vào hệ thống' : 'Tài khoản đang bị khóa đăng nhập'}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby="account-status-label"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-blue-600' : 'bg-slate-300',
        )}
      >
        <span
          className={cn(
            'inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-5.5' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  )
}

/** Khung đang tải cùng bố cục form thật → dữ liệu về popup không đổi chiều cao */
function EditStudentAccountSkeleton() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-15 w-full rounded-xl" />
    </>
  )
}
