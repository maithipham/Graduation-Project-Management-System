import { z } from 'zod'

/** Mọi field chuỗi dài quá 255 ký tự (đếm sau khi chuẩn hóa) bị BE coi là sai định dạng của field đó */
const MAX_LENGTH = 255

/** Tên chuẩn của đơn vị công tác trong trường (email @tlu.edu.vn) */
export const TLU_ORGANIZATION = 'Trường Đại học Thủy lợi'

/**
 * Chuẩn hóa giống BE trước khi kiểm tra: NFC, khoảng trắng (cả tab, xuống dòng) gộp thành 1,
 * xóa ký tự ẩn (zero-width, ký tự điều khiển), bỏ khoảng trắng đầu/cuối
 */
export function normalizeTeacherText(value: string): string {
  return value
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .replace(/[\p{Cc}\p{Cf}]/gu, '')
    .replace(/ {2,}/g, ' ')
    .trim()
}

/**
 * Ô chữ bắt buộc: chuẩn hóa → báo trống → kiểm tra định dạng (mỗi ô chỉ hiện lỗi đầu tiên).
 * Độ dài 255 được đếm trên chuỗi đã chuẩn hóa, giống BE.
 * `transform` cho phép đổi giá trị sau chuẩn hóa trước khi so regex (email viết thường, tên Thủy lợi).
 */
function textField(
  emptyMessage: string,
  pattern: RegExp,
  invalidMessage: string,
  transform: (value: string) => string = (value) => value,
) {
  return z
    .string()
    .transform((value) => transform(normalizeTeacherText(value)))
    .pipe(
      z
        .string()
        .min(1, emptyMessage)
        .max(MAX_LENGTH, invalidMessage)
        .regex(pattern, invalidMessage),
    )
}

const EMAIL_PATTERN = /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/
// Tên trường: chữ, số, khoảng trắng và các dấu . , - & ( ) ' /
const ORGANIZATION_PATTERN = /^[\p{L}\p{M}\p{N} .,\-&()'/]+$/u

/**
 * Đuôi email giáo viên → trong / ngoài trường và hạn mức mặc định (BE tự gán khi không gửi amount).
 * Trong trường: đơn vị là Trường Đại học Thủy lợi, bắt buộc có ngành. Ngoài trường: tên trường khác, không có ngành
 */
export const TEACHER_EMAIL_RULES = [
  { domain: '@tlu.edu.vn', internal: true, amount: 20 },
  { domain: '@gmail.com', internal: false, amount: 10 },
] as const

export type TeacherEmailRule = (typeof TEACHER_EMAIL_RULES)[number]

/**
 * Email đúng định dạng + đúng đuôi → quy tắc tương ứng; còn lại (trống, sai định dạng, @outlook.com,
 * @e.tlu.edu.vn của sinh viên...) → undefined
 */
export function getTeacherEmailRule(email: string): TeacherEmailRule | undefined {
  const value = normalizeTeacherText(email).toLowerCase()
  if (!EMAIL_PATTERN.test(value)) return undefined
  return TEACHER_EMAIL_RULES.find((rule) => value.endsWith(rule.domain))
}

/** "trường đại học THỦY LỢI" → "Trường Đại học Thủy lợi" (BE không phân biệt hoa/thường); tên trường khác giữ nguyên */
function toOrganization(value: string): string {
  return value.toLowerCase() === TLU_ORGANIZATION.toLowerCase() ? TLU_ORGANIZATION : value
}

/** Đơn vị đã qua bước định dạng (dùng để biết có nên so với email hay chưa) */
function isValidOrganization(value: string): boolean {
  return value.length > 0 && value.length <= MAX_LENGTH && ORGANIZATION_PATTERN.test(value)
}

// Các refine nhiều ô nhận giá trị chưa chắc đã qua schema (when: () => true) → tự chuẩn hóa lại
const readEmailRule = (values: { email: unknown }) => getTeacherEmailRule(String(values.email))
const readText = (value: unknown) => normalizeTeacherText(String(value ?? ''))

// Ràng buộc và message trùng với bảng lỗi Mục 6.5 (api_addLecturer.md)
export const ACADEMIC_TITLES = [
  { value: 'ThS.', label: 'ThS. (Thạc sĩ)' },
  { value: 'TS.', label: 'TS. (Tiến sĩ)' },
  { value: 'PGS.TS.', label: 'PGS.TS. (Phó Giáo sư)' },
  { value: 'GS.TS.', label: 'GS.TS. (Giáo sư)' },
  { value: 'KS.', label: 'KS. (Kỹ sư)' },
  { value: 'CN.', label: 'CN. (Cử nhân)' },
] as const

export type AcademicTitleValue = (typeof ACADEMIC_TITLES)[number]['value']

export const createTeacherSchema = z
  .object({
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
      (value) => !EMAIL_PATTERN.test(value) || getTeacherEmailRule(value) !== undefined,
      'Email giáo viên phải có đuôi @tlu.edu.vn (trong trường) hoặc @gmail.com (ngoài trường)',
    ),
    phone: textField(
      'Số điện thoại không được để trống',
      /^0\d{9}$/,
      'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0',
    ),
    organization: textField(
      'Đơn vị công tác không được để trống',
      ORGANIZATION_PATTERN,
      "Đơn vị công tác chỉ gồm chữ, số, khoảng trắng và các dấu . , - & ( ) ' / (tối đa 255 ký tự)",
      toOrganization,
    ),
    // Gửi tên ngành (BE nhận tên hoặc mã ngành). Bắt buộc hay phải trống tùy email → kiểm tra ở refine bên dưới
    major: z.string().transform(normalizeTeacherText),
    // Học hàm / Học vị (POST /teacher: academicTitleId từ bảng academic_title hoặc academicTitle viết tắt)
    academicTitleId: z.coerce.number().optional().nullable(),
    academicTitle: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val ? normalizeTeacherText(val) : null)),
    // Không bắt buộc: bỏ trống → null để BE tự gán. Chỉ nhận chữ số (không 5.5, -1, +5), tối đa 18 chữ số
    amount: z
      .string()
      .transform(normalizeTeacherText)
      .pipe(
        z
          .string()
          .regex(/^\d{0,18}$/, 'Số lượng sinh viên hướng dẫn phải là số nguyên không âm'),
      )
      .transform((value) => (value === '' ? null : value)),
  })
  // Các refine dưới đây vẫn chạy khi ô khác đang lỗi (when: () => true),
  // để người dùng thấy hết lỗi trong 1 lần bấm Lưu
  .refine(
    (values) => {
      // Chỉ so khi email và đơn vị đều đã hợp lệ (giống BE)
      const rule = readEmailRule(values)
      const organization = toOrganization(readText(values.organization))
      if (!rule || !isValidOrganization(organization)) return true
      return rule.internal === (organization === TLU_ORGANIZATION)
    },
    {
      message:
        'Đơn vị công tác không khớp với email (email @tlu.edu.vn phải là Trường Đại học Thủy lợi, email @gmail.com phải là trường khác)',
      path: ['organization'],
      when: () => true,
    },
  )
  // Email chưa hợp lệ (kể cả sai đuôi) thì BE chưa biết trong hay ngoài trường → không báo lỗi ngành
  .refine((values) => readEmailRule(values)?.internal !== true || readText(values.major) !== '', {
    message: 'Ngành học không được để trống',
    path: ['major'],
    when: () => true,
  })
  .refine(
    (values) => readEmailRule(values)?.internal !== true || readText(values.major).length <= MAX_LENGTH,
    { message: 'Ngành học không tồn tại trong hệ thống', path: ['major'], when: () => true },
  )
  .refine((values) => readEmailRule(values)?.internal !== false || readText(values.major) === '', {
    message: 'Giáo viên ngoài trường không được điền ngành',
    path: ['major'],
    when: () => true,
  })

/** Giá trị người dùng nhập trên form (trước khi chuẩn hóa) */
export type CreateTeacherFormInput = z.input<typeof createTeacherSchema>
/** Dữ liệu sau khi zod chuẩn hóa — khớp body POST /teacher */
export type CreateTeacherFormValues = z.output<typeof createTeacherSchema>

export const EMPTY_CREATE_TEACHER_VALUES: CreateTeacherFormInput = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  organization: '',
  major: '',
  amount: '',
  academicTitleId: null,
  academicTitle: '',
}
