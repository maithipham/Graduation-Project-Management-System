import { z } from 'zod'
import type { StudentDetail } from '../types'
import { createStudentSchema } from './createStudentSchema'

// Cùng ràng buộc với form thêm, bỏ ngành (không được sửa) và thêm trạng thái tài khoản
export const updateStudentSchema = createStudentSchema.omit({ major: true }).extend({
  accountStatus: z.boolean(),
})

/** Giá trị người dùng nhập trên form (trước khi chuẩn hóa) */
export type UpdateStudentFormInput = z.input<typeof updateStudentSchema>
/** Dữ liệu sau khi zod chuẩn hóa — khớp body PUT /student/{publicId} */
export type UpdateStudentFormValues = z.output<typeof updateStudentSchema>

export const EMPTY_UPDATE_STUDENT_VALUES: UpdateStudentFormInput = {
  studentCode: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  batch: '',
  className: '',
  accountStatus: true,
}

/**
 * GET /student/{publicId} chỉ trả `name` (Họ + Tên đã ghép) → tách lại cho 2 ô:
 * từ cuối là Tên, phần còn lại là Họ và tên đệm ("Lê Trung Đức" → "Lê Trung" + "Đức")
 */
export function splitFullName(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const lastName = words.pop() ?? ''
  return { firstName: words.join(' '), lastName }
}

/** Dữ liệu BE → giá trị form, field null thành '' */
export function toUpdateStudentFormInput(student: StudentDetail): UpdateStudentFormInput {
  return {
    studentCode: student.studentCode,
    ...splitFullName(student.name),
    email: student.email,
    phone: student.phone ?? '',
    batch: student.batch,
    className: student.className,
    accountStatus: student.accountStatus,
  }
}
