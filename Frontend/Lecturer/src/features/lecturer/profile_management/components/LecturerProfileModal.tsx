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
} from '@/shared/components/ui'
import { useUpdateLecturerMyInfo } from '../hooks/useLecturerMyInfo'
import { PHONE_EXISTED, TEACHER_INFO_INVALID } from '../services/lecturerProfile.service'
import type { TeacherMyInfoUpdatePayload } from '../types/lecturerProfile.types'

// Chuẩn hóa giống BE: NFC, trim, gộp nhiều khoảng trắng thành 1
const normalizeText = (value: string) => value.normalize('NFC').trim().replace(/\s+/g, ' ')

// Quy tắc khớp BE (mục 2.4 tài liệu api_myInfo.md)
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
        .max(255, 'Tên tối đa 255 ký tự')
        .regex(LAST_NAME_REGEX, 'Tên chỉ gồm 1 từ và chỉ được chứa chữ cái'),
    ),
  phone: z
    .string()
    // Cho phép gõ "0912 345 678", bỏ dấu cách trước khi gửi (BE không tự bỏ)
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

// Lỗi 4000 sai 1 trường → BE trả message riêng của trường đó; sai ≥ 2 trường → message gộp
function fieldOfValidationMessage(message: string): keyof ProfileFormInput | null {
  if (message.includes('vui lòng kiểm tra lại')) return null
  if (message.startsWith('Số điện thoại')) return 'phone'
  if (message.startsWith('Tên')) return 'lastName'
  if (message.startsWith('Họ')) return 'firstName'
  return null
}

interface LecturerProfileModalProps {
  isOpen: boolean
  onClose: () => void
  /** Giá trị hiện tại (Họ/Tên tách từ `name` của GET /teacher/my-info) */
  initialValues: TeacherMyInfoUpdatePayload
  /** Chỉ hiển thị, không sửa và không gửi lên BE */
  email: string
}

export function LecturerProfileModal({ isOpen, onClose, initialValues, email }: LecturerProfileModalProps) {
  const updateMutation = useUpdateLecturerMyInfo()
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
      // 1000 (đã lưu) hoặc 1104 (không đổi gì, toast vàng do interceptor hiện) → đóng popup
      onSuccess: onClose,
      // Lỗi → giữ popup mở để người dùng sửa
      onError: (error) => {
        if (!isApiError(error)) {
          setError('root.server', { message: 'Cập nhật thất bại. Vui lòng thử lại.' })
          return
        }
        if (error.code === PHONE_EXISTED) {
          setError('phone', { message: error.message }, { shouldFocus: true })
          return
        }
        if (error.code === TEACHER_INFO_INVALID) {
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
              <Input placeholder="VD: Nguyễn Văn" autoComplete="family-name" {...register('firstName')} />
            </FormField>
            <FormField label="Tên" required error={errors.lastName?.message}>
              <Input placeholder="VD: An" autoComplete="given-name" {...register('lastName')} />
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
