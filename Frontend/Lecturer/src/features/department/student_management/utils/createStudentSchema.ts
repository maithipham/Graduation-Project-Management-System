import { z } from 'zod'

/** Bỏ khoảng trắng đầu/cuối và gộp nhiều khoảng trắng liên tiếp thành 1 (giống BE) */
const normalizeSpaces = (value: string) => value.trim().replace(/\s+/g, ' ')

/**
 * Ô chữ bắt buộc: chuẩn hóa → báo trống → kiểm tra định dạng.
 * `transform` cho phép viết hoa/thường trước khi so regex (email, khóa).
 */
function textField(
  emptyMessage: string,
  pattern: RegExp,
  invalidMessage: string,
  transform: (value: string) => string = (value) => value,
) {
  return z
    .string()
    .transform((value) => transform(normalizeSpaces(value)))
    .pipe(z.string().min(1, emptyMessage).regex(pattern, invalidMessage))
}

const EMAIL_PATTERN = /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/

/** Đuôi email bắt buộc của sinh viên (BE kiểm tra giống hệt; email giáo viên không áp dụng) */
export const STUDENT_EMAIL_DOMAIN = '@gmail.com'

// Ràng buộc và message trùng với StudentCreationRequest của BE
export const createStudentSchema = z.object({
  studentCode: textField(
    'Mã sinh viên không được để trống',
    /^\d{10}$/,
    'Mã sinh viên phải gồm đúng 10 chữ số',
  ),
  firstName: textField(
    'Họ không được để trống',
    /^\p{L}+( \p{L}+)*$/u,
    'Họ chỉ được chứa chữ cái và khoảng trắng',
  ),
  lastName: textField('Tên không được để trống', /^\p{L}+$/u, 'Tên chỉ được chứa chữ cái'),
  email: textField(
    'Email không được để trống',
    EMAIL_PATTERN,
    'Email không đúng định dạng',
    (value) => value.toLowerCase(),
  ).refine(
    // Sai định dạng thì chỉ báo lỗi định dạng, không báo thêm lỗi đuôi email
    (value) => !EMAIL_PATTERN.test(value) || value.endsWith(STUDENT_EMAIL_DOMAIN),
    `Email sinh viên phải có đuôi ${STUDENT_EMAIL_DOMAIN}`,
  ),
  phone: textField(
    'Số điện thoại không được để trống',
    /^0\d{9}$/,
    'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0',
  ),
  batch: textField(
    'Khóa học không được để trống',
    /^K\d{2}$/,
    'Khóa học không đúng định dạng (VD: K64)',
    (value) => value.toUpperCase(),
  ),
  className: textField(
    'Lớp không được để trống',
    /^[\p{L}\p{N}]+( [\p{L}\p{N}]+)*$/u,
    'Tên lớp không được chứa ký tự đặc biệt',
  ),
  // Gửi tên ngành (không phải publicId) — đúng field `major` của BE
  major: z.string().trim().min(1, 'Ngành học không được để trống'),
})

/** Giá trị người dùng nhập trên form (trước khi chuẩn hóa) */
export type CreateStudentFormInput = z.input<typeof createStudentSchema>
/** Dữ liệu sau khi zod chuẩn hóa — khớp body POST /student */
export type CreateStudentFormValues = z.output<typeof createStudentSchema>

export const EMPTY_CREATE_STUDENT_VALUES: CreateStudentFormInput = {
  studentCode: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  batch: '',
  className: '',
  major: '',
}
