import React, { useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { FormField } from '@/shared/components/ui/form-field'
import { Input } from '@/shared/components/ui/input'
import { Select } from '@/shared/components/ui/select'
import { SearchableSelect } from '@/shared/components/ui/searchable-select'
import { Textarea } from '@/shared/components/ui/textarea'
import { Button } from '@/shared/components/ui/button'
import { toast } from '@/shared/components/feedback/toast.store'
import { useHeadCandidates } from '../hooks/useFaculties'
import { useAccountStore } from '@/features/admin/account_management'
import { isApiError } from '@/shared/types'
import {
  majorSchema,
  FACULTY_ERROR_CODES,
  type Major,
  type MajorFormValues,
} from '../types/faculty.types'

interface MajorFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  facultyName: string
  editingMajor: Major | null
  existingMajors?: Major[]
  onSubmitSuccess: (values: MajorFormValues, id?: number) => Promise<unknown> | unknown
}

const emptyValues: MajorFormValues = {
  code: '',
  name: '',
  headTeacherId: '',
  headFullName: '',
  description: '',
  status: 'active',
}

export const MajorFormDialog: React.FC<MajorFormDialogProps> = ({
  open,
  onOpenChange,
  facultyName,
  editingMajor,
  existingMajors = [],
  onSubmitSuccess,
}) => {
  const isEdit = Boolean(editingMajor)
  const { data: candidates } = useHeadCandidates()
  const accounts = useAccountStore((s) => s.accounts)

  const candidateOptions = useMemo(() => {
    if (candidates && candidates.length > 0) {
      return candidates.map((c) => ({
        value: String(c.teacherId ?? c.id),
        label: `${c.academicRank ? c.academicRank + ' ' : ''}${c.fullName}`,
        description: c.email || c.majorName || undefined,
      }))
    }
    const lecturers = accounts.filter((a) => a.role === 'Giảng viên')
    if (lecturers.length > 0) {
      return lecturers.map((lec) => ({
        value: String(lec.id),
        label: lec.name,
        description: lec.email || lec.unit,
      }))
    }
    return []
  }, [candidates, accounts])

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MajorFormValues>({
    resolver: zodResolver(majorSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      if (editingMajor) {
        const matchedCandidate = candidates?.find(
          (c) =>
            (editingMajor.headTeacherId &&
              (c.teacherId === editingMajor.headTeacherId || c.id === editingMajor.headTeacherId)) ||
            (editingMajor.headFullName &&
              (c.fullName === editingMajor.headFullName ||
                `${c.academicRank ? c.academicRank + ' ' : ''}${c.fullName}` === editingMajor.headFullName)),
        )

        reset({
          code: editingMajor.code || '',
          name: editingMajor.name,
          headTeacherId: editingMajor.headTeacherId
            ? String(editingMajor.headTeacherId)
            : matchedCandidate
              ? String(matchedCandidate.teacherId ?? matchedCandidate.id)
              : '',
          headFullName: editingMajor.headFullName || '',
          description: editingMajor.description,
          status: editingMajor.status,
        })
      } else {
        reset(emptyValues)
      }
    }
  }, [open, editingMajor, reset, candidates])

  const onSubmit = async (values: MajorFormValues) => {
    const formattedCode = values.code.toUpperCase().trim()

    // Kiểm tra trùng mã ngành phía client (nếu có danh sách ngành hiện tại)
    const isDuplicateCode = existingMajors.some(
      (m) =>
        m.code &&
        m.code.toUpperCase().trim() === formattedCode &&
        (!isEdit || m.id !== editingMajor?.id),
    )

    if (isDuplicateCode) {
      setError('code', {
        type: 'manual',
        message: 'Mã chuyên ngành này đã tồn tại trong hệ thống.',
      })
      return
    }

    try {
      const selectedCandidate = candidateOptions.find(
        (c) => String(c.value) === String(values.headTeacherId),
      )
      const headFullName = selectedCandidate ? selectedCandidate.label : values.headFullName || ''

      await onSubmitSuccess(
        {
          ...values,
          code: formattedCode,
          headTeacherId: values.headTeacherId || undefined,
          headFullName,
        },
        editingMajor?.id,
      )
      toast.success(
        isEdit
          ? 'Cập nhật chuyên ngành thành công!'
          : 'Thêm chuyên ngành mới thành công!',
      )
      onOpenChange(false)
    } catch (err: unknown) {
      if (isApiError(err)) {
        if (err.code === FACULTY_ERROR_CODES.MAJOR_CODE_EXIST) {
          setError('code', { message: err.message }, { shouldFocus: true })
          return
        }
        if (err.code === FACULTY_ERROR_CODES.MAJOR_NAME_EXIST_IN_FACULTY) {
          setError('name', { message: err.message }, { shouldFocus: true })
          return
        }
        if (
          err.code === FACULTY_ERROR_CODES.HEAD_OF_DEPARTMENT_NOT_FOUND ||
          err.code === FACULTY_ERROR_CODES.ACCOUNT_NOT_HEAD_OF_DEPARTMENT
        ) {
          setError('headTeacherId', { message: err.message })
          return
        }
        setError('root.server', { message: err.message })
        return
      }
      const msg = err instanceof Error ? err.message : 'Đã có lỗi xảy ra khi lưu thông tin chuyên ngành.'
      setError('root.server', { message: msg })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Cập nhật chuyên ngành' : 'Thêm chuyên ngành mới'}
          </DialogTitle>
          <DialogDescription>
            Khoa trực thuộc: <b className="text-slate-800">{facultyName}</b>
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FormField
                label="Mã chuyên ngành"
                required
                error={errors.code?.message}
                hint="Ví dụ: CNTT, KTPM, 7480201"
              >
                <Input
                  placeholder="KTPM"
                  className="font-mono uppercase"
                  {...register('code')}
                />
              </FormField>
            </div>

            <div>
              <FormField
                label="Trạng thái"
                error={errors.status?.message}
              >
                <Select {...register('status')}>
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Không hoạt động</option>
                </Select>
              </FormField>
            </div>

            <div className="sm:col-span-2">
              <FormField
                label="Tên chuyên ngành"
                required
                error={errors.name?.message}
              >
                <Input
                  placeholder="Ví dụ: Kỹ thuật phần mềm"
                  {...register('name')}
                />
              </FormField>
            </div>

            <div className="sm:col-span-2">
              <FormField
                label="Trưởng bộ môn"
                error={errors.headTeacherId?.message}
                hint="Không bắt buộc (có thể phân công hoặc bổ nhiệm sau)"
              >
                <Controller
                  control={control}
                  name="headTeacherId"
                  render={({ field }) => (
                    <SearchableSelect
                      options={candidateOptions}
                      value={field.value || ''}
                      onChange={(val) => {
                        field.onChange(val)
                      }}
                      placeholder="-- Chọn giảng viên làm Trưởng bộ môn (tùy chọn) --"
                      searchPlaceholder="Gõ tên hoặc email giảng viên..."
                      emptyText="Chưa có giảng viên nào trong hệ thống"
                      allowClear
                    />
                  )}
                />
              </FormField>
            </div>

            <div className="sm:col-span-2">
              <FormField
                label="Chi tiết về ngành"
                error={errors.description?.message}
              >
                <Textarea
                  rows={3}
                  placeholder="Nhập mục tiêu đào tạo, định hướng chuyên môn và hướng đề tài tốt nghiệp..."
                  {...register('description')}
                />
              </FormField>
            </div>
          </div>

          {errors.root?.server && (
            <p role="alert" className="text-xs font-semibold text-[#DC2626]">
              {errors.root.server.message}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#1565C0] hover:bg-[#0D47A1] text-white"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
