import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { isApiError } from '@/shared/types'
import { toast } from '@/shared/components/feedback/toast.store'
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
} from '@/shared/components/ui'
import { useUpdateStudentMyInfo } from '../hooks/useProfileManagement'
import {
  PHONE_EXISTED,
  STUDENT_INFO_INVALID,
  STUDENT_INFO_NOT_CHANGED,
} from '../services/profile.service'
import type { StudentMyInfoUpdateRequest } from '../types/profile.types'

// Chuẩn hóa giống BE: NFC, trim, gộp nhiều khoảng trắng thành 1
const normalizeText = (value: string) => value.normalize('NFC').trim().replace(/\s+/g, ' ')

// Quy tắc khớp BE (mục 3.1 tài liệu API)
const FIRST_NAME_REGEX = /^\p{Script=Latin}+( \p{Script=Latin}+)*$/u
const LAST_NAME_REGEX = /^\p{Script=Latin}+$/u
const PHONE_REGEX = /^0\d{9}$/

const profileSchema = z.object({
  firstName: z
    .string()
    .transform(normalizeText)
    .pipe(
      z
        .string()
        .min(1, 'Họ không được để trống')
        .max(255, 'Họ tối đa 255 ký tự')
        .regex(FIRST_NAME_REGEX, 'Họ không được chứa số và kí tự đặc biệt'),
    ),
  lastName: z
    .string()
    .transform(normalizeText)
    .pipe(
      z
        .string()
        .min(1, 'Tên không được để trống')
        .regex(LAST_NAME_REGEX, 'Tên chỉ gồm 1 từ và chỉ được chứa chữ cái'),
    ),
  phone: z
    .string()
    // Cho phép gõ "0912 345 678", bỏ dấu cách trước khi gửi
    .transform((value) => value.replace(/\s/g, ''))
    .pipe(
      z
        .string()
        .min(1, 'Số điện thoại không được để trống')
        .regex(PHONE_REGEX, 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0'),
    ),
})

type ProfileFormInput = z.input<typeof profileSchema>
type ProfileFormValues = z.output<typeof profileSchema>

// Lỗi 4000 chỉ sai 1 trường → BE trả message riêng của trường đó; sai ≥ 2 trường → message gộp
function fieldOfValidationMessage(message: string): keyof ProfileFormInput | null {
  if (message.includes('vui lòng kiểm tra lại')) return null
  if (message.startsWith('Số điện thoại')) return 'phone'
  if (message.startsWith('Tên')) return 'lastName'
  if (message.startsWith('Họ')) return 'firstName'
  return null
}

interface ProfileContactModalProps {
  isOpen: boolean
  onClose: () => void
  /** Giá trị hiện tại (Họ/Tên tách từ `name` của GET /student/my-info) */
  initialValues: StudentMyInfoUpdateRequest
  /** Chỉ hiển thị, sinh viên không sửa được */
  email: string
}

export function ProfileContactModal({ isOpen, onClose, initialValues, email }: ProfileContactModalProps) {
  const updateMutation = useUpdateStudentMyInfo()
  const isSaving = updateMutation.isPending

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ProfileFormInput, unknown, ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: '', lastName: '', phone: '' },
  })

  // Mỗi lần mở popup: nạp lại giá trị hiện tại
  const { firstName, lastName, phone } = initialValues
  useEffect(() => {
    if (isOpen) reset({ firstName, lastName, phone })
  }, [isOpen, firstName, lastName, phone, reset])

  const onSubmit = (values: ProfileFormValues) => {
    updateMutation.mutate(values, {
      onSuccess: onClose,
      onError: (error) => {
        if (!isApiError(error)) {
          setError('root.server', { message: 'Cập nhật thất bại. Vui lòng thử lại.' })
          return
        }
        // 1103: không có gì thay đổi → cảnh báo vàng, đóng popup
        if (error.code === STUDENT_INFO_NOT_CHANGED) {
          toast.warning(error.message)
          onClose()
          return
        }
        if (error.code === PHONE_EXISTED) {
          setError('phone', { message: error.message }, { shouldFocus: true })
          return
        }
        if (error.code === STUDENT_INFO_INVALID) {
          const field = fieldOfValidationMessage(error.message)
          if (field) {
            setError(field, { message: error.message }, { shouldFocus: true })
            return
          }
        }
        setError('root.server', { message: error.message })
      },
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSaving && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cập nhật thông tin cá nhân</DialogTitle>
          <DialogDescription>Bạn có thể sửa Họ, Tên và Số điện thoại.</DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField
              label="Họ và tên đệm"
              required
              error={errors.firstName?.message}
              className="sm:col-span-2"
            >
              <Input placeholder="VD: Phạm Thị" autoComplete="family-name" {...register('firstName')} />
            </FormField>
            <FormField label="Tên" required error={errors.lastName?.message}>
              <Input placeholder="VD: Mai" autoComplete="given-name" {...register('lastName')} />
            </FormField>
          </div>

          <FormField label="Số điện thoại" required error={errors.phone?.message}>
            <Input type="tel" inputMode="numeric" placeholder="VD: 0912345678" {...register('phone')} />
          </FormField>

          <FormField label="Email" hint="Email không thể thay đổi.">
            <Input value={email} readOnly disabled />
          </FormField>

          {errors.root?.server && (
            <p role="alert" className="text-sm font-semibold text-[#DC2626]">
              {errors.root.server.message}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
