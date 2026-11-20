import React, { useEffect } from 'react'
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
  Select,
} from '@/shared/components/ui'
import { useAssignExaminers } from '../hooks/useExaminerReview'
import type { CouncilMember, CouncilStudentExaminer } from '../types'

const assignExaminersSchema = z
  .object({
    councilMemberPublicId1: z
      .string()
      .trim()
      .min(1, 'Vui lòng chọn Giảng viên phản biện 1'),
    councilMemberPublicId2: z
      .string()
      .trim()
      .min(1, 'Vui lòng chọn Giảng viên phản biện 2'),
  })
  .refine(
    (values) =>
      !values.councilMemberPublicId1 ||
      !values.councilMemberPublicId2 ||
      values.councilMemberPublicId1 !== values.councilMemberPublicId2,
    {
      message: '2 Giảng viên phản biện không được trùng nhau',
      path: ['councilMemberPublicId2'],
    },
  )

type AssignExaminersFormValues = z.infer<typeof assignExaminersSchema>

interface AssignExaminersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: CouncilStudentExaminer | null
  members: CouncilMember[]
  councilPublicId: string
}

export const AssignExaminersDialog: React.FC<AssignExaminersDialogProps> = ({
  open,
  onOpenChange,
  student,
  members,
  councilPublicId,
}) => {
  const assignMutation = useAssignExaminers(councilPublicId)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<AssignExaminersFormValues>({
    resolver: zodResolver(assignExaminersSchema),
    defaultValues: {
      councilMemberPublicId1: '',
      councilMemberPublicId2: '',
    },
  })

  useEffect(() => {
    if (open && student) {
      const ex1 = student.examiners.find((e) => e.examinerOrder === 1)
      const ex2 = student.examiners.find((e) => e.examinerOrder === 2)
      reset({
        councilMemberPublicId1: ex1?.councilMemberPublicId ?? '',
        councilMemberPublicId2: ex2?.councilMemberPublicId ?? '',
      })
    }
  }, [open, student, reset])

  const onSubmit = (values: AssignExaminersFormValues) => {
    if (!student) return

    assignMutation.mutate(
      {
        defenseAssignmentPublicId: student.defenseAssignmentPublicId,
        data: values,
      },
      {
        onSuccess: () => {
          onOpenChange(false)
        },
        onError: (err) => {
          if (isApiError(err)) {
            if (err.code === 3124) {
              setError('councilMemberPublicId2', {
                message: '2 Giảng viên phản biện không được trùng nhau',
              })
              return
            }
            if (err.code === 3125) {
              setError('councilMemberPublicId1', {
                message: 'GVPB không được trùng với GVHD của sinh viên',
              })
              return
            }
            if (err.code === 3126) {
              setError('root.server', {
                message: 'Không thể thay GVPB đã nộp phiếu hoặc đã quyết định',
              })
              return
            }
            setError('root.server', {
              message: err.message || 'Không thể phân công GVPB',
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

  const ineligibleIds = new Set(student?.ineligibleMemberPublicIds ?? [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Phân công Giảng viên phản biện</DialogTitle>
          <DialogDescription>
            {student ? (
              <span>
                Sinh viên: <strong>{student.studentName}</strong> (
                {student.studentCode}) — Lớp: {student.className ?? '—'}
              </span>
            ) : (
              'Chọn 2 Giảng viên trong Hội đồng làm Giảng viên phản biện cho sinh viên.'
            )}
          </DialogDescription>
        </DialogHeader>

        {student && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs space-y-1.5 my-2">
            <div>
              <span className="text-slate-500">Đề tài:</span>{' '}
              <span className="font-semibold text-slate-800">
                {student.topicName ?? 'Chưa có tên đề tài'}
              </span>
            </div>
            <div>
              <span className="text-slate-500">GVHD:</span>{' '}
              <span className="font-semibold text-slate-800">
                {student.supervisorName ?? '—'}
                {student.coSupervisorName
                  ? ` (Đồng GVHD: ${student.coSupervisorName})`
                  : ''}
              </span>
            </div>
          </div>
        )}

        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 pt-2"
        >
          <FormField
            label="Giảng viên phản biện 1"
            required
            error={errors.councilMemberPublicId1?.message}
          >
            <Select {...register('councilMemberPublicId1')}>
              <option value="">-- Chọn Giảng viên phản biện 1 --</option>
              {members.map((m) => {
                const isIneligible = ineligibleIds.has(m.memberPublicId)
                return (
                  <option
                    key={m.memberPublicId}
                    value={m.memberPublicId}
                    disabled={isIneligible}
                  >
                    {m.academicTitle} {m.fullName}
                    {m.teacherCode ? ` (${m.teacherCode})` : ''} —{' '}
                    {m.role === 'CHAIRPERSON'
                      ? 'Chủ tịch'
                      : m.role === 'SECRETARY'
                        ? 'Thư ký'
                        : 'Ủy viên'}
                    {isIneligible ? ' [GVHD của SV - Không thể chọn]' : ''}
                  </option>
                )
              })}
            </Select>
          </FormField>

          <FormField
            label="Giảng viên phản biện 2"
            required
            error={errors.councilMemberPublicId2?.message}
          >
            <Select {...register('councilMemberPublicId2')}>
              <option value="">-- Chọn Giảng viên phản biện 2 --</option>
              {members.map((m) => {
                const isIneligible = ineligibleIds.has(m.memberPublicId)
                return (
                  <option
                    key={m.memberPublicId}
                    value={m.memberPublicId}
                    disabled={isIneligible}
                  >
                    {m.academicTitle} {m.fullName}
                    {m.teacherCode ? ` (${m.teacherCode})` : ''} —{' '}
                    {m.role === 'CHAIRPERSON'
                      ? 'Chủ tịch'
                      : m.role === 'SECRETARY'
                        ? 'Thư ký'
                        : 'Ủy viên'}
                    {isIneligible ? ' [GVHD của SV - Không thể chọn]' : ''}
                  </option>
                )
              })}
            </Select>
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
              disabled={assignMutation.isPending}
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={assignMutation.isPending}>
              {assignMutation.isPending ? 'Đang lưu...' : 'Lưu phân công'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
