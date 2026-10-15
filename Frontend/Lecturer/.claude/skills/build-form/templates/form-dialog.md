# Mẫu: form tạo/sửa trong Dialog

Vị trí trong feature: `components/SemesterFormDialog.tsx`

Ví dụ dùng feature `admin/semester_management` (học kỳ). Khi làm feature khác: đổi tên, giữ cấu trúc.

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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  Input,
} from '@/shared/components/ui'
import { useCreateSemester, useUpdateSemester } from '../hooks/useSemesters'
import type { Semester } from '../types/semester.types'

// Mã lỗi BE trả khi trùng mã học kỳ (lấy từ ErrorCode.java của BE — chưa biết thì hỏi, không đoán)
const SEMESTER_CODE_EXISTED = 3001

// Quy tắc kiểm tra dữ liệu, giống @NotBlank/@Size trên DTO Java. Thông báo lỗi viết tiếng Việt ở đây
const semesterSchema = z
  .object({
    code: z.string().trim().min(1, 'Vui lòng nhập mã học kỳ').max(20, 'Mã học kỳ tối đa 20 ký tự'),
    name: z.string().trim().min(1, 'Vui lòng nhập tên học kỳ'),
    startDate: z.string().min(1, 'Vui lòng chọn ngày bắt đầu'),
    endDate: z.string().min(1, 'Vui lòng chọn ngày kết thúc'),
  })
  .refine((values) => !values.startDate || !values.endDate || values.endDate > values.startDate, {
    message: 'Ngày kết thúc phải sau ngày bắt đầu',
    path: ['endDate'],
  })

type SemesterFormValues = z.infer<typeof semesterSchema>

const emptyValues: SemesterFormValues = { code: '', name: '', startDate: '', endDate: '' }

interface SemesterFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Truyền semester → form sửa; không truyền → form tạo mới */
  semester?: Semester
}

export function SemesterFormDialog({ open, onOpenChange, semester }: SemesterFormDialogProps) {
  const createMutation = useCreateSemester()
  const updateMutation = useUpdateSemester()
  const isPending = createMutation.isPending || updateMutation.isPending

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<SemesterFormValues>({
    resolver: zodResolver(semesterSchema),
    defaultValues: emptyValues,
  })

  // Mỗi lần mở dialog: nạp dữ liệu cũ (sửa) hoặc làm trống (tạo mới)
  useEffect(() => {
    if (!open) return
    reset(
      semester
        ? {
            code: semester.code,
            name: semester.name,
            startDate: semester.startDate,
            endDate: semester.endDate,
          }
        : emptyValues,
    )
  }, [open, semester, reset])

  const onSubmit = (values: SemesterFormValues) => {
    const callbacks = {
      onSuccess: () => onOpenChange(false),
      onError: (error: unknown) => {
        // Lỗi gắn với một ô → hiện dòng đỏ ngay dưới ô đó
        if (isApiError(error) && error.code === SEMESTER_CODE_EXISTED) {
          setError('code', { message: error.message }, { shouldFocus: true })
          return
        }
        // Lỗi khác → dòng đỏ chung phía trên nút Lưu
        setError('root.server', {
          message: isApiError(error) ? error.message : 'Có lỗi xảy ra, vui lòng thử lại.',
        })
      },
    }

    if (semester) updateMutation.mutate({ id: semester.id, body: values }, callbacks)
    else createMutation.mutate(values, callbacks)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{semester ? 'Sửa học kỳ' : 'Thêm học kỳ'}</DialogTitle>
        </DialogHeader>

        {/* noValidate: tắt popup "Please fill out this field." của trình duyệt, lỗi do zod + FormField hiển thị */}
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Mã học kỳ" required error={errors.code?.message}>
            <Input placeholder="VD: HK1-2026" {...register('code')} />
          </FormField>

          <FormField label="Tên học kỳ" required error={errors.name?.message}>
            <Input placeholder="VD: Học kỳ 1 năm học 2026-2027" {...register('name')} />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Ngày bắt đầu" required error={errors.startDate?.message}>
              <Input type="date" {...register('startDate')} />
            </FormField>
            <FormField label="Ngày kết thúc" required error={errors.endDate?.message}>
              <Input type="date" {...register('endDate')} />
            </FormField>
          </div>

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
              {isPending ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```
