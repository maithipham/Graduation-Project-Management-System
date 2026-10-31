import { useWatch, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form'
import { FormField, Input, Select } from '@/shared/components/ui'
import type { MajorOption } from '@/features/department/student_management'
import { useAcademicTitles } from '../hooks/useTeachers'
import { DEFAULT_ACADEMIC_TITLES } from '../services/teacher.service'
import {
  getTeacherEmailRule,
  type CreateTeacherFormInput,
  type CreateTeacherFormValues,
} from '../utils/createTeacherSchema'

interface TeacherFormFieldsProps {
  register: UseFormRegister<CreateTeacherFormInput>
  control: Control<CreateTeacherFormInput, unknown, CreateTeacherFormValues>
  errors: FieldErrors<CreateTeacherFormInput>
  majors: MajorOption[] | undefined
  majorsLoading: boolean
  /** Ngành hiện tại không có trong danh sách (VD mã ngành / tên gõ sai trong Excel) → vẫn hiện để người dùng thấy */
  currentMajor?: string
  /** Ngành bị khóa (ví dụ TBM chỉ được thêm giáo viên thuộc bộ môn của mình) */
  lockedMajor?: string
  className?: string
}

/**
 * Ngành hiện tại không trùng tên nào trong danh sách → nhãn cho option riêng (undefined nếu không cần).
 * Excel có thể ghi mã ngành (BE nhận cả tên lẫn mã) → giữ nguyên mã, hiện kèm tên ngành cho dễ đọc
 */
function getCurrentMajorLabel(currentMajor: string | undefined, majors: MajorOption[] | undefined) {
  if (!currentMajor || !majors || majors.some((major) => major.name === currentMajor)) return undefined
  const byCode = majors.find((major) => major.code?.toLowerCase() === currentMajor.toLowerCase())
  return byCode
    ? `${byCode.name} (mã ${currentMajor})`
    : `${currentMajor} (không có trong danh sách)`
}

/** 6 ô thông tin giáo viên — dùng chung cho popup "Thêm giáo viên" và form sửa dòng import lỗi */
export function TeacherFormFields({
  register,
  control,
  errors,
  majors,
  majorsLoading,
  currentMajor,
  lockedMajor,
  className = 'grid gap-4 sm:grid-cols-2',
}: TeacherFormFieldsProps) {
  // Email @gmail.com (ngoài trường) → ô Ngành bị khóa và để trống
  const email = useWatch({ control, name: 'email' })
  const external = getTeacherEmailRule(email)?.internal === false

  const { data: apiTitles } = useAcademicTitles()
  const titles = apiTitles && apiTitles.length > 0 ? apiTitles : DEFAULT_ACADEMIC_TITLES

  const currentMajorLabel = getCurrentMajorLabel(currentMajor, majors)

  return (
    <div className={className}>
      <FormField label="Họ và tên đệm" required error={errors.firstName?.message}>
        <Input placeholder="VD: Nguyễn Văn" {...register('firstName')} />
      </FormField>
      <FormField label="Tên" required error={errors.lastName?.message}>
        <Input placeholder="VD: An" {...register('lastName')} />
      </FormField>

      <FormField label="Email" required error={errors.email?.message}>
        <Input type="email" placeholder="VD: an.nv@tlu.edu.vn" {...register('email')} />
      </FormField>
      <FormField label="Số điện thoại" required error={errors.phone?.message}>
        <Input type="tel" placeholder="VD: 0987654321" {...register('phone')} />
      </FormField>

      <FormField
        label="Đơn vị công tác"
        required
        error={errors.organization?.message}
        hint={external ? 'Nhập tên trường của giáo viên ngoài trường' : undefined}
      >
        <Input placeholder="VD: Trường Đại học Bách khoa Hà Nội" {...register('organization')} />
      </FormField>
      <FormField
        label="Ngành"
        required={!external}
        error={errors.major?.message}
        hint={
          external
            ? 'Giáo viên ngoài trường không điền mục này'
            : lockedMajor
              ? 'Ngành được cố định theo bộ môn quản lý'
              : undefined
        }
      >
        <Select
          disabled={majorsLoading || external || Boolean(lockedMajor)}
          {...register('major')}
        >
          {external ? (
            <option value="">-- Không áp dụng cho giáo viên ngoài trường --</option>
          ) : lockedMajor ? (
            <option value={lockedMajor}>{lockedMajor}</option>
          ) : (
            <>
              <option value="">{majorsLoading ? 'Đang tải ngành...' : '-- Chọn ngành --'}</option>
              {currentMajor && currentMajorLabel && (
                <option value={currentMajor}>{currentMajorLabel}</option>
              )}
              {majors?.map((major) => (
                <option key={major.publicId} value={major.name}>
                  {major.name}
                </option>
              ))}
            </>
          )}
        </Select>
      </FormField>

      <FormField label="Học hàm / Học vị" error={errors.academicTitle?.message}>
        <Select {...register('academicTitle')}>
          <option value="">-- Chọn học hàm / học vị --</option>
          {titles.map((t) => (
            <option key={t.id} value={t.abbreviation}>
              {t.abbreviation} ({t.name})
            </option>
          ))}
        </Select>
      </FormField>
    </div>
  )
}
