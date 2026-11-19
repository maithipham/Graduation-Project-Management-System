import React, { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Clock, Info } from 'lucide-react'
import { z } from 'zod'
import { isApiError } from '@/shared/types'
import { formatDateForInput } from '@/shared/utils'
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
import { useScheduleExaminerReview } from '../hooks/useExaminerReview'
import type { MyExaminerAssignment } from '../types'

const QUICK_TIME_SLOTS = [
  { start: '08:00', end: '08:45', label: '08:00 – 08:45' },
  { start: '09:00', end: '09:45', label: '09:00 – 09:45' },
  { start: '10:00', end: '10:45', label: '10:00 – 10:45' },
  { start: '11:00', end: '11:45', label: '11:00 – 11:45' },
  { start: '13:30', end: '14:15', label: '13:30 – 14:15' },
  { start: '14:30', end: '15:15', label: '14:30 – 15:15' },
  { start: '15:30', end: '16:15', label: '15:30 – 16:15' },
  { start: '16:30', end: '17:15', label: '16:30 – 17:15' },
]

const createScheduleSchema = (minDate?: string, maxDate?: string) =>
  z
    .object({
      reviewDate: z.string().trim().min(1, 'Vui lòng chọn ngày phản biện'),
      reviewStartTime: z.string().trim().min(1, 'Vui lòng chọn giờ bắt đầu'),
      reviewEndTime: z.string().trim().min(1, 'Vui lòng chọn giờ kết thúc'),
      reviewLocation: z
        .string()
        .trim()
        .min(1, 'Vui lòng nhập địa điểm / phòng phản biện')
        .max(255, 'Địa điểm tối đa 255 ký tự'),
      reviewNote: z.string().optional(),
    })
    .refine(
      (val) => {
        if (!val.reviewDate) return true
        if (minDate && val.reviewDate < minDate) return false
        if (maxDate && val.reviewDate > maxDate) return false
        return true
      },
      {
        message:
          minDate && maxDate
            ? `Ngày phản biện phải trong khoảng từ ${minDate} đến ${maxDate}`
            : 'Ngày phản biện ngoài mốc quy định',
        path: ['reviewDate'],
      },
    )
    .refine(
      (val) => {
        if (!val.reviewStartTime || !val.reviewEndTime) return true
        return val.reviewStartTime < val.reviewEndTime
      },
      {
        message: 'Giờ bắt đầu phải trước giờ kết thúc',
        path: ['reviewEndTime'],
      },
    )

type ScheduleFormValues = z.infer<ReturnType<typeof createScheduleSchema>>

interface ScheduleReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment: MyExaminerAssignment | null
}

export const ScheduleReviewDialog: React.FC<ScheduleReviewDialogProps> = ({
  open,
  onOpenChange,
  assignment,
}) => {
  const scheduleMutation = useScheduleExaminerReview()

  const minDate = assignment?.scheduleStartAt
    ? formatDateForInput(assignment.scheduleStartAt)
    : undefined
  const maxDate = assignment?.scheduleEndAt
    ? formatDateForInput(assignment.scheduleEndAt)
    : undefined

  const scheduleSchema = useMemo(
    () => createScheduleSchema(minDate, maxDate),
    [minDate, maxDate],
  )

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors },
  } = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      reviewDate: '',
      reviewStartTime: '',
      reviewEndTime: '',
      reviewLocation: '',
      reviewNote: '',
    },
  })

  useEffect(() => {
    if (open && assignment) {
      reset({
        reviewDate: assignment.reviewDate ?? '',
        reviewStartTime: assignment.reviewStartTime ?? '',
        reviewEndTime: assignment.reviewEndTime ?? '',
        reviewLocation: assignment.reviewLocation ?? '',
        reviewNote: assignment.reviewNote ?? '',
      })
    }
  }, [open, assignment, reset])

  const onSubmit = (values: ScheduleFormValues) => {
    if (!assignment) return

    scheduleMutation.mutate(
      {
        examinerAssignmentPublicId: assignment.examinerAssignmentPublicId,
        data: {
          reviewDate: values.reviewDate,
          reviewStartTime: values.reviewStartTime,
          reviewEndTime: values.reviewEndTime,
          reviewLocation: values.reviewLocation,
          reviewNote: values.reviewNote ? values.reviewNote.trim() : null,
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false)
        },
        onError: (err) => {
          if (isApiError(err)) {
            if (err.code === 3129) {
              setError('reviewEndTime', {
                message: 'Giờ bắt đầu phải trước giờ kết thúc',
              })
              return
            }
            if (err.code === 3130) {
              setError('reviewDate', {
                message: err.message || 'Ngày phản biện ngoài mốc quy định',
              })
              return
            }
            if (err.code === 3132) {
              setError('root.server', {
                message: 'Sinh viên đã xếp ca hoặc hoàn tất, không thể sửa lịch',
              })
              return
            }
            setError('root.server', {
              message: err.message || 'Không thể cập nhật lịch phản biện',
            })
            return
          }
          setError('root.server', {
            message: 'Có lỗi xảy ra, vui lòng thử lại.',
          })
        },
      },
    )
  }

  const isLocked = !assignment?.scheduleOpen || !assignment?.editable

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Lịch phản biện {assignment ? `${assignment.examinerOrder} – ${assignment.studentName}` : ''}
          </DialogTitle>
          <DialogDescription className="space-y-1">
            {assignment ? (
              <span className="block text-slate-600 text-xs">
                Mã sinh viên: <strong className="font-mono text-slate-800">{assignment.studentCode}</strong>
                {assignment.className ? ` · Lớp: ${assignment.className}` : ''}
              </span>
            ) : null}
            <span className="block text-slate-500 font-medium text-xs flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>Lịch chỉ áp dụng cho suất phản biện của bạn, không thay đổi lịch của GVPB còn lại.</span>
            </span>
          </DialogDescription>
        </DialogHeader>

        {isLocked && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-xl">
            {!assignment?.scheduleOpen
              ? 'Hiện tại đang ngoài khung thời gian tạo lịch phản biện.'
              : 'Sinh viên đã được xếp ca hoặc hoàn tất, không thể chỉnh sửa lịch.'}
          </div>
        )}

        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 pt-2"
        >
          <FormField
            label="Ngày phản biện"
            required
            error={errors.reviewDate?.message}
            hint={
              minDate && maxDate
                ? `Thời gian cho phép: từ ${minDate} đến ${maxDate}`
                : undefined
            }
          >
            <Input
              type="date"
              disabled={isLocked}
              min={minDate}
              max={maxDate}
              {...register('reviewDate')}
            />
          </FormField>

          {/* Quick Slot Buttons */}
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Chọn nhanh khung giờ
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {QUICK_TIME_SLOTS.map((slot) => (
                <button
                  key={slot.label}
                  type="button"
                  disabled={isLocked}
                  onClick={() => {
                    setValue('reviewStartTime', slot.start, {
                      shouldValidate: true,
                    })
                    setValue('reviewEndTime', slot.end, {
                      shouldValidate: true,
                    })
                  }}
                  className="px-2 py-1.5 rounded-lg text-xs font-medium border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 hover:text-[#1565C0] transition text-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              label="Giờ bắt đầu"
              required
              error={errors.reviewStartTime?.message}
            >
              <Input
                type="time"
                disabled={isLocked}
                {...register('reviewStartTime')}
              />
            </FormField>

            <FormField
              label="Giờ kết thúc"
              required
              error={errors.reviewEndTime?.message}
            >
              <Input
                type="time"
                disabled={isLocked}
                {...register('reviewEndTime')}
              />
            </FormField>
          </div>

          <FormField
            label="Địa điểm / Phòng phản biện"
            required
            error={errors.reviewLocation?.message}
          >
            <Input
              placeholder="VD: Phòng 301-A2 hoặc Trực tuyến qua MS Teams"
              disabled={isLocked}
              {...register('reviewLocation')}
            />
          </FormField>

          <FormField
            label="Ghi chú thêm (tùy chọn)"
            error={errors.reviewNote?.message}
          >
            <Textarea
              placeholder="Nhập ghi chú cho sinh viên..."
              rows={2}
              disabled={isLocked}
              {...register('reviewNote')}
            />
          </FormField>

          {errors.root?.server && (
            <p role="alert" className="text-sm font-semibold text-[#DC2626]">
              {errors.root.server.message}
            </p>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={scheduleMutation.isPending}
              onClick={() => onOpenChange(false)}
            >
              Đóng
            </Button>
            {!isLocked && (
              <Button type="submit" disabled={scheduleMutation.isPending}>
                {scheduleMutation.isPending ? 'Đang lưu...' : 'Lưu lịch phản biện'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
