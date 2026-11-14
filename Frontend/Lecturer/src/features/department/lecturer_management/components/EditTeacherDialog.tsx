import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Info } from 'lucide-react'
import { toast } from '@/shared/components/feedback/toast.store'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui'
import { API_SUCCESS_CODE } from '@/shared/types'
import type { MajorOption } from '@/features/department/student_management'
import { useAcademicTitles, useUpdateTeacher } from '../hooks/useTeachers'
import { DEFAULT_ACADEMIC_TITLES } from '../services/teacher.service'
import { useTeacherEmailAutoFill } from '../hooks/useTeacherEmailAutoFill'
import type { TeacherListItem, TeacherUpdateRequest } from '../types'
import {
  createTeacherSchema,
  EMPTY_CREATE_TEACHER_VALUES,
  isExternalTeacherCheck,
  isTLU,
  TLU_ORGANIZATION,
  type CreateTeacherFormInput,
  type CreateTeacherFormValues,
} from '../utils/createTeacherSchema'
import { TeacherFormFields } from './TeacherFormFields'

const DEFAULT_SUCCESS_MESSAGE = 'Cập nhật giảng viên thành công'

interface EditTeacherDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teacher: TeacherListItem | null
  majors: MajorOption[] | undefined
  majorsLoading: boolean
  lockedMajor?: string
  onSuccess?: () => void
}

export function EditTeacherDialog({
  open,
  onOpenChange,
  teacher,
  majors,
  majorsLoading,
  lockedMajor,
  onSuccess,
}: EditTeacherDialogProps) {
  const updateTeacher = useUpdateTeacher()
  const { data: academicTitles } = useAcademicTitles()
  const activeMajor = lockedMajor || ''

  const isExternalTeacher = isExternalTeacherCheck({
    email: teacher?.email,
    organization: teacher?.organization,
    isInternal: teacher?.isInternal,
    unitType: teacher?.unitType,
  })
  const effectiveLockedMajor = isExternalTeacher ? undefined : (lockedMajor || activeMajor || undefined)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    subscribe,
    control,
    formState: { errors, isSubmitted },
  } = useForm<CreateTeacherFormInput, unknown, CreateTeacherFormValues>({
    resolver: zodResolver(createTeacherSchema),
    defaultValues: EMPTY_CREATE_TEACHER_VALUES,
  })

  const { resetAutoFill } = useTeacherEmailAutoFill({
    subscribe,
    setValue,
    isSubmitted,
    defaultMajor: effectiveLockedMajor || '',
  })

  // Điền dữ liệu của giảng viên cần sửa khi mở modal
  useEffect(() => {
    if (open && teacher) {
      let firstName = teacher.firstName || ''
      let lastName = teacher.lastName || ''
      if (!firstName && !lastName && teacher.name) {
        const parts = teacher.name.trim().split(' ')
        lastName = parts.pop() || ''
        firstName = parts.join(' ')
      }

      const isExternal = isExternalTeacherCheck({
        email: teacher.email,
        organization: teacher.organization,
        isInternal: teacher.isInternal,
        unitType: teacher.unitType,
      })

      const resolvedMajor = isExternal
        ? ''
        : (teacher.majorName || effectiveLockedMajor || activeMajor || '')

      reset({
        teacherCode: teacher.teacherCode || '',
        firstName,
        lastName,
        email: teacher.email || '',
        phone: teacher.phone || '',
        organization: isTLU(teacher.organization) ? TLU_ORGANIZATION : (teacher.organization || ''),
        majorId: isExternal ? null : (teacher.majorPublicId ?? null),
        major: resolvedMajor,
        academicTitleId: teacher.academicTitleId ?? null,
        academicTitle: teacher.academicTitle || '',
        amount: teacher.maxStudents ? String(teacher.maxStudents) : '',
      })
      resetAutoFill()
    }
  }, [open, teacher, reset, resetAutoFill, effectiveLockedMajor, activeMajor])

  // Luôn đảm bảo giá trị major đồng bộ với ngành cố định của TBM khi mở modal cho giảng viên trong trường
  useEffect(() => {
    if (open && !isExternalTeacher && effectiveLockedMajor) {
      setValue('major', effectiveLockedMajor)
    }
  }, [open, isExternalTeacher, effectiveLockedMajor, setValue])

  const handleOpenChange = (value: boolean) => {
    if (!value && updateTeacher.isPending) return
    onOpenChange(value)
  }

  const onSubmit = (values: CreateTeacherFormValues) => {
    if (!teacher) return

    const teacherId = teacher.id || teacher.teacherId || teacher.publicId
    const isExternal = isExternalTeacherCheck({
      email: values.email,
      organization: values.organization,
    })

    const allTitles = academicTitles && academicTitles.length > 0 ? academicTitles : DEFAULT_ACADEMIC_TITLES
    const matchedTitle = allTitles.find(
      (t) => t.abbreviation === values.academicTitle || String(t.id) === String(values.academicTitleId),
    )

    let majorId: string | number | null = null
    let majorName: string | null = null

    if (!isExternal) {
      const selectedMajorName = (effectiveLockedMajor || values.major || '').trim()
      const matchedMajor = majors?.find(
        (m) =>
          m.name.toLowerCase() === selectedMajorName.toLowerCase() ||
          m.publicId === values.majorId ||
          (m.code && m.code.toLowerCase() === selectedMajorName.toLowerCase()),
      )
      majorId = matchedMajor ? matchedMajor.publicId : (values.majorId ?? null)
      majorName = matchedMajor ? matchedMajor.name : (selectedMajorName || null)
    }

    const payload: TeacherUpdateRequest = {
      teacherCode: values.teacherCode,
      firstName: values.firstName,
      lastName: values.lastName,
      name: `${values.firstName} ${values.lastName}`.trim(),
      email: values.email,
      phone: values.phone,
      organization: values.organization,
      major: isExternal ? '' : (majorName || ''),
      majorName: isExternal ? null : majorName,
      majorId: isExternal ? null : majorId,
      academicTitleId: matchedTitle ? matchedTitle.id : (values.academicTitleId ?? null),
      academicTitle: matchedTitle ? matchedTitle.abbreviation : (values.academicTitle || null),
    }

    updateTeacher.mutate(
      { id: teacherId, body: payload },
      {
        onSuccess: (result) => {
          if (result.code === API_SUCCESS_CODE) {
            toast.success(result.message || DEFAULT_SUCCESS_MESSAGE)
          }
          onOpenChange(false)
          onSuccess?.()
        },
        onError: (error) => setError('root.server', { message: error.message }),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cập nhật thông tin giảng viên</DialogTitle>
          <DialogDescription>
            Chỉnh sửa thông tin chi tiết giảng viên trong hệ thống.
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <TeacherFormFields
            register={register}
            control={control}
            setValue={setValue}
            errors={errors}
            majors={majors}
            majorsLoading={majorsLoading}
            currentMajor={isExternalTeacher ? undefined : (teacher?.majorName || undefined)}
            lockedMajor={effectiveLockedMajor}
          />

          {errors.root?.server && (
            <p role="alert" className="text-sm font-semibold text-[#DC2626]">
              {errors.root.server.message}
            </p>
          )}

          <p className="flex items-start gap-2 text-xs text-slate-500">
            <Info className="mt-px h-3.5 w-3.5 shrink-0" />
            Thông tin sẽ được cập nhật đồng bộ cho tài khoản giảng viên trong hệ thống.
          </p>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={updateTeacher.isPending}
              onClick={() => handleOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={updateTeacher.isPending}>
              {updateTeacher.isPending ? 'Đang cập nhật...' : 'Cập nhật'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

