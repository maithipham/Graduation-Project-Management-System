import React, { useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  facultySchema,
  FACULTY_ERROR_CODES,
  type Faculty,
  type FacultyFormValues,
} from '../types/faculty.types'

interface FacultyFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingFaculty: Faculty | null
  existingFaculties: Faculty[]
  onSubmitSuccess: (values: FacultyFormValues, id?: number) => Promise<unknown> | unknown
}

const emptyValues: FacultyFormValues = {
  code: '',
  name: '',
  headOfDepartmentId: '',
  dean: '',
  description: '',
  status: 'active',
}

export const FacultyFormDialog: React.FC<FacultyFormDialogProps> = ({
  open,
  onOpenChange,
  editingFaculty,
  existingFaculties,
  onSubmitSuccess,
}) => {
  const isEdit = Boolean(editingFaculty)
  const { data: candidates } = useHeadCandidates()
  const accounts = useAccountStore((s) => s.accounts)

  const candidateOptions = useMemo(() => {
    // 1. Nếu BE trả về head candidates
    if (candidates && candidates.length > 0) {
      return candidates.map((c) => ({
        value: String(c.id),
        label: `${c.academicRank ? c.academicRank + ' ' : ''}${c.fullName}`,
        description: c.email || undefined,
      }))
    }
    // 2. Lấy thêm từ danh sách giảng viên trong hệ thống nếu có
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
  } = useForm<FacultyFormValues>({
    resolver: zodResolver(facultySchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      if (editingFaculty) {
        const matchedCandidate = candidates?.find(
          (c) =>
            editingFaculty.dean &&
            (c.fullName === editingFaculty.dean ||
              `${c.academicRank ? c.academicRank + ' ' : ''}${c.fullName}` === editingFaculty.dean),
        )
        reset({
          code: editingFaculty.code,
          name: editingFaculty.name,
          headOfDepartmentId: matchedCandidate ? String(matchedCandidate.id) : '',
          dean: editingFaculty.dean,
          description: editingFaculty.description,
          status: editingFaculty.status,
        })
      } else {
        reset(emptyValues)
      }
    }
  }, [open, editingFaculty, reset, candidates])

  const onSubmit = async (values: FacultyFormValues) => {
    const formattedCode = values.code.toUpperCase().trim()

    // Kiểm tra trùng mã khoa
    const isDuplicate = existingFaculties.some(
      (f) =>
        f.code.toUpperCase() === formattedCode &&
        (!isEdit || f.id !== editingFaculty?.id),
    )

    if (isDuplicate) {
      setError('code', {
        type: 'manual',
        message: 'Mã khoa này đã tồn tại trong hệ thống.',
      })
      return
    }

    try {
      const selectedCandidate = candidates?.find(
        (c) => String(c.id) === String(values.headOfDepartmentId),
      )
      const deanName = selectedCandidate
        ? `${selectedCandidate.academicRank ? selectedCandidate.academicRank + ' ' : ''}${selectedCandidate.fullName}`
        : values.dean || ''

      await onSubmitSuccess(
        {
          ...values,
          code: formattedCode,
          dean: deanName,
          headOfDepartmentId: values.headOfDepartmentId || undefined,
        },
        editingFaculty?.id,
      )
      toast.success(
        isEdit
          ? 'Cập nhật thông tin khoa thành công!'
          : 'Thêm khoa mới thành công!',
      )
      onOpenChange(false)
    } catch (err: unknown) {
      if (isApiError(err)) {
        if (err.code === FACULTY_ERROR_CODES.FACULTY_CODE_EXIST) {
          setError('code', { message: err.message }, { shouldFocus: true })
          return
        }
        if (err.code === FACULTY_ERROR_CODES.FACULTY_NAME_EXIST) {
          setError('name', { message: err.message }, { shouldFocus: true })
          return
        }
        if (
          err.code === FACULTY_ERROR_CODES.HEAD_OF_DEPARTMENT_NOT_FOUND ||
          err.code === FACULTY_ERROR_CODES.ACCOUNT_NOT_HEAD_OF_DEPARTMENT
        ) {
          setError('headOfDepartmentId', { message: err.message })
          return
        }
        setError('root.server', { message: err.message })
        return
      }
      const msg = err instanceof Error ? err.message : 'Đã có lỗi xảy ra khi lưu thông tin khoa.'
      setError('root.server', { message: msg })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Cập nhật thông tin khoa' : 'Thêm khoa đào tạo'}
          </DialogTitle>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FormField
                label="Mã khoa"
                required
                error={errors.code?.message}
                hint="Ví dụ: CNTT, KT, QTKD"
              >
                <Input
                  placeholder="CNTT"
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
                label="Tên khoa"
                required
                error={errors.name?.message}
              >
                <Input
                  placeholder="Ví dụ: Công nghệ thông tin"
                  {...register('name')}
                />
              </FormField>
            </div>

            <div className="sm:col-span-2">
              <FormField
                label="Trưởng khoa"
                error={errors.headOfDepartmentId?.message || errors.dean?.message}
                hint="Không bắt buộc (có thể tìm kiếm và bổ nhiệm sau)"
              >
                <Controller
                  control={control}
                  name="headOfDepartmentId"
                  render={({ field }) => (
                    <SearchableSelect
                      options={candidateOptions}
                      value={field.value || ''}
                      onChange={(val) => {
                        field.onChange(val)
                      }}
                      placeholder="-- Chọn giảng viên làm trưởng khoa (tùy chọn) --"
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
                label="Chi tiết về khoa"
                error={errors.description?.message}
              >
                <Textarea
                  rows={3}
                  placeholder="Nhập thông tin mô tả chức năng, nhiệm vụ và lĩnh vực đào tạo..."
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
