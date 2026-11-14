import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { FormField, Input, Select } from '@/shared/components/ui'
import type { MajorOption } from '../types'
import { STUDENT_EMAIL_DOMAIN, type CreateStudentFormInput } from '../utils/createStudentSchema'

interface StudentFormFieldsProps {
  register: UseFormRegister<CreateStudentFormInput>
  errors: FieldErrors<CreateStudentFormInput>
  majors: MajorOption[] | undefined
  majorsLoading: boolean
  /** Ngành hiện tại không có trong danh sách (VD tên ngành gõ sai trong Excel) → vẫn hiện để người dùng thấy */
  currentMajor?: string
  className?: string
}

/** 8 ô thông tin sinh viên — dùng chung cho popup "Thêm sinh viên" và form sửa dòng import lỗi */
export function StudentFormFields({
  register,
  errors,
  majors,
  majorsLoading,
  currentMajor,
  className = 'grid gap-4 sm:grid-cols-2',
}: StudentFormFieldsProps) {
  const unknownMajor =
    currentMajor && majors && !majors.some((major) => major.name === currentMajor)
      ? currentMajor
      : undefined

  return (
    <div className={className}>
      <FormField label="Mã sinh viên" required error={errors.studentCode?.message}>
        <Input placeholder="VD: 2251172489" inputMode="numeric" {...register('studentCode')} />
      </FormField>
      <FormField label="Email" required error={errors.email?.message}>
        <Input type="email" placeholder={`VD: 2251172489${STUDENT_EMAIL_DOMAIN}`} {...register('email')} />
      </FormField>

      <FormField label="Họ và tên đệm" required error={errors.firstName?.message}>
        <Input placeholder="VD: Lê Trung" {...register('firstName')} />
      </FormField>
      <FormField label="Tên" required error={errors.lastName?.message}>
        <Input placeholder="VD: Đức" {...register('lastName')} />
      </FormField>

      <FormField label="Số điện thoại" required error={errors.phone?.message}>
        <Input type="tel" placeholder="VD: 0911111111" {...register('phone')} />
      </FormField>
      <FormField label="Khóa" required error={errors.batch?.message}>
        <Input placeholder="VD: K63" {...register('batch')} />
      </FormField>

      <FormField label="Lớp" required error={errors.className?.message}>
        <Input placeholder="VD: 63KTPM1" {...register('className')} />
      </FormField>
      <FormField label="Ngành" required error={errors.major?.message}>
        <Select disabled={majorsLoading} {...register('major')}>
          <option value="">{majorsLoading ? 'Đang tải ngành...' : '-- Chọn ngành --'}</option>
          {unknownMajor && (
            <option value={unknownMajor}>{unknownMajor} (không có trong danh sách)</option>
          )}
          {majors?.map((major) => (
            <option key={major.publicId} value={major.name}>
              {major.name}
            </option>
          ))}
        </Select>
      </FormField>
    </div>
  )
}
