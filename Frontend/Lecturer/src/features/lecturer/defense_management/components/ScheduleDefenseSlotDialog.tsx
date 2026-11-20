import React, { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Calendar, Clock, AlertCircle, User } from 'lucide-react'
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
import {
  useScheduleDefenseSlot,
  getDefenseScheduleErrorMessage,
} from '../hooks/useDefenseSchedule'
import type { DefenseSlot } from '../types'
import {
  combineDateAndTime,
  parseIsoParts,
  formatDateSlash,
} from '../utils/defenseDateUtils'

const scheduleDefenseSlotSchema = z
  .object({
    date: z.string().trim().min(1, 'Vui lòng chọn ngày bảo vệ'),
    startTime: z.string().trim().min(1, 'Vui lòng chọn giờ bắt đầu'),
    endTime: z.string().trim().min(1, 'Vui lòng chọn giờ kết thúc'),
    slotOrder: z
      .number()
      .int('Số thứ tự ca phải là số nguyên')
      .min(1, 'Số thứ tự ca phải từ 1 trở lên'),
    room: z.string().trim().max(255, 'Phòng bảo vệ tối đa 255 ký tự').optional(),
  })
  .refine(
    (val) => {
      if (!val.startTime || !val.endTime) return true
      return val.startTime < val.endTime
    },
    {
      message: 'Thời gian bắt đầu ca bảo vệ phải trước thời gian kết thúc',
      path: ['endTime'],
    },
  )

type ScheduleSlotFormValues = z.infer<typeof scheduleDefenseSlotSchema>

interface ScheduleDefenseSlotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  councilPublicId: string
  student: DefenseSlot | null
  defaultRoom?: string | null
  councilStartTime?: string | null
  councilEndTime?: string | null
  deadlineStartAt?: string | null
  deadlineEndAt?: string | null
}

export const ScheduleDefenseSlotDialog: React.FC<
  ScheduleDefenseSlotDialogProps
> = ({
  open,
  onOpenChange,
  councilPublicId,
  student,
  defaultRoom,
  councilStartTime,
  councilEndTime,
  deadlineStartAt,
  deadlineEndAt,
}) => {
  const scheduleMutation = useScheduleDefenseSlot(councilPublicId)
  const [serverError, setServerError] = useState<string | null>(null)

  const defaultDate = useMemo(() => {
    if (student?.defenseStartTime) {
      return parseIsoParts(student.defenseStartTime)?.date ?? ''
    }
    if (councilStartTime) {
      return parseIsoParts(councilStartTime)?.date ?? ''
    }
    if (deadlineStartAt) {
      return parseIsoParts(deadlineStartAt)?.date ?? ''
    }
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }, [student, councilStartTime, deadlineStartAt])

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<ScheduleSlotFormValues>({
    resolver: zodResolver(scheduleDefenseSlotSchema),
    defaultValues: {
      date: defaultDate,
      startTime: '08:00',
      endTime: '08:30',
      slotOrder: 1,
      room: '',
    },
  })

  useEffect(() => {
    if (open && student) {
      setServerError(null)
      const startParts = parseIsoParts(student.defenseStartTime)
      const endParts = parseIsoParts(student.defenseEndTime)

      reset({
        date: startParts?.date || defaultDate,
        startTime: startParts?.time || '08:00',
        endTime: endParts?.time || '08:30',
        slotOrder: student.slotOrder || 1,
        room: student.room || defaultRoom || '',
      })
    }
  }, [open, student, defaultDate, defaultRoom, reset])

  const currentStartTime = watch('startTime')

  const handleApplyDuration = (minutes: number) => {
    if (!currentStartTime) return
    const [h, m] = currentStartTime.split(':').map(Number)
    const total = (h || 0) * 60 + (m || 0) + minutes
    const endH = String(Math.floor(total / 60) % 24).padStart(2, '0')
    const endM = String(total % 60).padStart(2, '0')
    setValue('endTime', `${endH}:${endM}`, { shouldValidate: true })
  }

  const onSubmit = (values: ScheduleSlotFormValues) => {
    if (!student) return
    setServerError(null)

    const isoStart = combineDateAndTime(values.date, values.startTime)
    const isoEnd = combineDateAndTime(values.date, values.endTime)

    scheduleMutation.mutate(
      {
        defenseAssignmentPublicId: student.defenseAssignmentPublicId,
        data: {
          slotOrder: values.slotOrder,
          defenseStartTime: isoStart,
          defenseEndTime: isoEnd,
          room: values.room?.trim() || defaultRoom || null,
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false)
        },
        onError: (err) => {
          if (isApiError(err)) {
            // Xử lý các mã lỗi đặc thù theo prompt 3138-3145
            if (err.code === 3139) {
              setError('endTime', { message: err.message })
              return
            }
            if (err.code === 3143) {
              setError('slotOrder', { message: err.message })
              return
            }
            if (err.code === 3145) {
              setError('room', { message: err.message })
              return
            }
          }
          setServerError(getDefenseScheduleErrorMessage(err))
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#1565C0]" />
            <span>{student?.defenseStartTime ? 'Chỉnh sửa ca bảo vệ' : 'Xếp ca bảo vệ cho sinh viên'}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Thông tin ca bảo vệ sẽ được cập nhật cho sinh viên và thông báo tới các thành viên Hội đồng.
          </DialogDescription>
        </DialogHeader>

        {student && (
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-extrabold text-slate-900 text-[13px] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                {student.studentName}
              </span>
              <span className="font-mono text-slate-500 font-semibold">
                MSSV: {student.studentCode}
              </span>
            </div>
            <div className="text-slate-600 font-medium line-clamp-2" title={student.topicName ?? ''}>
              <strong className="text-slate-700">Đề tài:</strong> {student.topicName || 'Chưa có tên đề tài'}
            </div>
            <div className="text-slate-500 text-[11px] flex items-center gap-3">
              <span>GVHD: <b className="text-slate-700">{student.supervisorName || '—'}</b></span>
              {student.className && <span>Lớp: <b className="text-slate-700">{student.className}</b></span>}
            </div>
          </div>
        )}

        {(councilStartTime || deadlineStartAt) && (
          <div className="text-[11px] text-slate-500 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100 space-y-0.5">
            {councilStartTime && councilEndTime && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>
                  Khung lịch Hội đồng: <strong>{formatDateSlash(councilStartTime)}</strong> – <strong>{formatDateSlash(councilEndTime)}</strong>
                </span>
              </div>
            )}
            {deadlineStartAt && deadlineEndAt && (
              <div className="text-slate-400">
                Mốc tổ chức bảo vệ ngành: {formatDateSlash(deadlineStartAt)} – {formatDateSlash(deadlineEndAt)}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1" noValidate>
          {serverError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{serverError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Ngày bảo vệ */}
            <FormField label="Ngày bảo vệ" error={errors.date?.message} required>
              <Input
                type="date"
                {...register('date')}
                className="w-full text-xs"
              />
            </FormField>

            {/* Thứ tự ca (slotOrder) */}
            <FormField label="Số thứ tự ca (STT)" error={errors.slotOrder?.message} required>
              <Input
                type="number"
                min={1}
                {...register('slotOrder', { valueAsNumber: true })}
                className="w-full text-xs"
                placeholder="1, 2, 3..."
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Giờ bắt đầu */}
            <FormField label="Giờ bắt đầu" error={errors.startTime?.message} required>
              <Input
                type="time"
                {...register('startTime')}
                className="w-full text-xs"
              />
            </FormField>

            {/* Giờ kết thúc */}
            <FormField label="Giờ kết thúc" error={errors.endTime?.message} required>
              <Input
                type="time"
                {...register('endTime')}
                className="w-full text-xs"
              />
            </FormField>
          </div>

          {/* Chọn nhanh thời lượng */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-medium">Thời lượng:</span>
            <button
              type="button"
              onClick={() => handleApplyDuration(30)}
              className="px-2 py-0.5 text-[11px] font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            >
              +30 phút (Mặc định)
            </button>
            <button
              type="button"
              onClick={() => handleApplyDuration(40)}
              className="px-2 py-0.5 text-[11px] font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            >
              +40 phút
            </button>
            <button
              type="button"
              onClick={() => handleApplyDuration(45)}
              className="px-2 py-0.5 text-[11px] font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            >
              +45 phút
            </button>
          </div>

          {/* Phòng bảo vệ */}
          <FormField
            label="Phòng bảo vệ"
            error={errors.room?.message}
            hint="Bỏ trống sẽ tự động lấy địa điểm mặc định của Hội đồng."
          >
            <Input
              type="text"
              {...register('room')}
              className="w-full text-xs"
              placeholder={defaultRoom || 'Phòng Hội thảo 302 - Nhà T45'}
            />
          </FormField>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={scheduleMutation.isPending}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={scheduleMutation.isPending}
              className="text-xs bg-[#1565C0] hover:bg-[#0D47A1] text-white"
            >
              {scheduleMutation.isPending ? 'Đang lưu...' : 'Lưu ca bảo vệ'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
