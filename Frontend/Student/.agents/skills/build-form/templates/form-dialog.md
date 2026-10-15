# Mẫu: form tạo/sửa trong Dialog

Vị trí trong feature: `components/RegistrationFormDialog.tsx`

Ví dụ dùng feature `student/supervisor_registration` (đăng ký GVHD). Khi làm feature khác: đổi tên, giữ cấu trúc.

```tsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { isApiError } from '@/shared/types'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  Input,
  Textarea,
} from '@/shared/components/ui'
import { useRegisterSupervisor, useUpdateRegistration } from '../hooks/useSupervisorRegistration'
import type { SupervisorRegistration, SupervisorSummary } from '../types/registration.types'

// Mã lỗi BE trả khi tên đề tài bị trùng (lấy từ ErrorCode.java của BE — chưa biết thì hỏi, không đoán)
const TOPIC_TITLE_EXISTED = 4002

// Quy tắc kiểm tra dữ liệu, giống @NotBlank/@Size trên DTO Java. Thông báo lỗi viết tiếng Việt ở đây
const registrationSchema = z.object({
  topicTitle: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên đề tài dự kiến')
    .max(200, 'Tên đề tài tối đa 200 ký tự'),
  note: z.string().trim().max(500, 'Ghi chú tối đa 500 ký tự'),
})

type RegistrationFormValues = z.infer<typeof registrationSchema>

const emptyValues: RegistrationFormValues = { topicTitle: '', note: '' }

interface RegistrationFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** GVHD sinh viên muốn đăng ký */
  supervisor: SupervisorSummary
  /** Truyền registration → form sửa; không truyền → form đăng ký mới */
  registration?: SupervisorRegistration
}

export function RegistrationFormDialog({
  open,
  onOpenChange,
  supervisor,
  registration,
}: RegistrationFormDialogProps) {
  const registerMutation = useRegisterSupervisor()
  const updateMutation = useUpdateRegistration()
  const isPending = registerMutation.isPending || updateMutation.isPending

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: emptyValues,
  })

  // Mỗi lần mở dialog: nạp dữ liệu cũ (sửa) hoặc làm trống (đăng ký mới)
  useEffect(() => {
    if (!open) return
    reset(
      registration
        ? { topicTitle: registration.topicTitle, note: registration.note ?? '' }
        : emptyValues,
    )
  }, [open, registration, reset])

  const onSubmit = (values: RegistrationFormValues) => {
    // Đổi giá trị form sang body gửi BE: ô trống → null
    const body = {
      supervisorId: supervisor.id,
      topicTitle: values.topicTitle,
      note: values.note || null,
    }
    const callbacks = {
      onSuccess: () => onOpenChange(false),
      onError: (error: unknown) => {
        // Lỗi gắn với một ô → hiện dòng đỏ ngay dưới ô đó
        if (isApiError(error) && error.code === TOPIC_TITLE_EXISTED) {
          setError('topicTitle', { message: error.message }, { shouldFocus: true })
          return
        }
        // Lỗi khác (ví dụ GVHD đã đủ chỉ tiêu, hết hạn đăng ký) → dòng đỏ chung phía trên nút gửi
        setError('root.server', {
          message: isApiError(error) ? error.message : 'Có lỗi xảy ra, vui lòng thử lại.',
        })
      },
    }

    if (registration) updateMutation.mutate({ id: registration.id, body }, callbacks)
    else registerMutation.mutate(body, callbacks)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{registration ? 'Sửa đăng ký GVHD' : 'Đăng ký GVHD'}</DialogTitle>
          <DialogDescription>Giảng viên: {supervisor.fullName}</DialogDescription>
        </DialogHeader>

        {/* noValidate: tắt popup "Please fill out this field." của trình duyệt, lỗi do zod + FormField hiển thị */}
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Tên đề tài dự kiến" required error={errors.topicTitle?.message}>
            <Input placeholder="VD: Xây dựng hệ thống quản lý đồ án" {...register('topicTitle')} />
          </FormField>

          <FormField
            label="Ghi chú cho giảng viên"
            hint="Không bắt buộc, tối đa 500 ký tự."
            error={errors.note?.message}
          >
            <Textarea rows={4} {...register('note')} />
          </FormField>

          {errors.root?.server && (
            <p role="alert" className="text-sm font-semibold text-[#DC2626]">
              {errors.root.server.message}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Đang gửi...' : registration ? 'Lưu' : 'Gửi đăng ký'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```
