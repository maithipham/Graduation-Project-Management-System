import { z } from 'zod'

export const TLU_ORGANIZATION = 'Trường Đại học Thủy lợi'
const MAX_LENGTH = 100
const PHONE_PATTERN = /^0\d{9}$/
const EMAIL_PATTERN = /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/
// Tên trường: chữ, số, khoảng trắng và các dấu . , - & ( ) ' /
const ORGANIZATION_PATTERN = /^[\p{L}\p{M}\p{N} .,\-&()'/]+$/u

/**
 * Đuôi email giáo viên → trong / ngoài trường.
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

/**
 * Nhận diện linh hoạt trường Đại học Thủy lợi (bao gồm cả chuẩn gõ dấu trên u "Thủy" hoặc dấu trên y "Thuỷ",
 * chữ hoa, thường, viết tắt)
 */
export function isTLU(text?: string | null): boolean {
  if (!text) return false
  const clean = String(text)
    .toLowerCase()
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim()
  return (
    clean === 'trường đại học thủy lợi' ||
    clean === 'trường đại học thuỷ lợi' ||
    clean === 'đại học thủy lợi' ||
    clean === 'đại học thuỷ lợi' ||
    clean.includes('thủy lợi') ||
    clean.includes('thuỷ lợi')
  )
}

/** "trường đại học THỦY LỢI" → "Trường Đại học Thủy lợi" (BE không phân biệt hoa/thường); tên trường khác giữ nguyên */
export function toOrganization(text: string): string {
  const norm = normalizeTeacherText(text)
  return isTLU(norm) ? TLU_ORGANIZATION : norm
}

export function isValidOrganization(organization: string): boolean {
  return (
    organization.length > 0 &&
    organization.length <= MAX_LENGTH &&
    (isTLU(organization) || ORGANIZATION_PATTERN.test(organization))
  )
}

/** Cắt khoảng trắng đầu cuối, gộp nhiều khoảng trắng giữa thành 1 */
function normalizeTeacherText(value: unknown): string {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
}

/** Đọc chuỗi đã qua transform (nếu ô bị lỗi định dạng trước transform, lấy chuỗi người dùng gõ) */
const readText = (value: unknown): string => normalizeTeacherText(value)

/**
 * Đọc quy tắc theo email (nếu email đã đúng cú pháp).
 * Zod v4 gọi refine độc lập từng ô → phải đọc qua helper, không dựa vào kết quả validate của ô email
 */
const readEmailRule = (values: Record<string, unknown>): TeacherEmailRule | undefined =>
  getTeacherEmailRule(readText(values.email))

export function isExternalTeacherCheck(params: {
  email?: string | null
  organization?: string | null
  isInternal?: boolean | null
  unitType?: string | null
}): boolean {
  const email = (params.email || '').trim().toLowerCase()
  if (email.endsWith('@tlu.edu.vn')) return false
  if (email.endsWith('@gmail.com')) return true

  if (params.isInternal === false || params.unitType === 'EXTERNAL') return true
  if (params.isInternal === true || params.unitType === 'INTERNAL') return false

  const org = params.organization
  if (org && !isTLU(org)) return true

  return false
}

export function isInternalTeacherValues(values: Record<string, unknown>): boolean {
  const email = readText(values.email).toLowerCase()
  if (email.endsWith('@tlu.edu.vn')) return true
  if (email.endsWith('@gmail.com')) return false
  const org = readText(values.organization)
  return isTLU(org)
}

export function isExternalTeacherValues(values: Record<string, unknown>): boolean {
  const email = readText(values.email).toLowerCase()
  if (email.endsWith('@gmail.com')) return true
  if (email.endsWith('@tlu.edu.vn')) return false
  const org = readText(values.organization)
  return org !== '' && !isTLU(org)
}

export const createTeacherSchema = z
  .object({
    teacherCode: z
      .string()
      .transform(normalizeTeacherText)
      .pipe(
        z
          .string()
          .min(1, 'Mã giảng viên không được để trống')
          .max(50, 'Mã giảng viên không được vượt quá 50 ký tự'),
      ),
    firstName: z
      .string()
      .transform(normalizeTeacherText)
      .pipe(
        z
          .string()
          .min(1, 'Họ và tên đệm không được để trống')
          .max(MAX_LENGTH, 'Họ và tên đệm không được vượt quá 100 ký tự'),
      ),
    lastName: z
      .string()
      .transform(normalizeTeacherText)
      .pipe(
        z
          .string()
          .min(1, 'Tên không được để trống')
          .max(MAX_LENGTH, 'Tên không được vượt quá 100 ký tự'),
      ),
    email: z
      .string()
      .transform((value) => normalizeTeacherText(value).toLowerCase())
      .pipe(
        z
          .string()
          .min(1, 'Email không được để trống')
          .max(MAX_LENGTH, 'Email không được vượt quá 100 ký tự')
          .regex(EMAIL_PATTERN, 'Email không đúng định dạng')
          .refine(
            (value) => TEACHER_EMAIL_RULES.some((rule) => value.endsWith(rule.domain)),
            'Chỉ chấp nhận email @tlu.edu.vn hoặc @gmail.com',
          ),
      ),
    phone: z
      .string()
      .transform(normalizeTeacherText)
      .pipe(
        z
          .string()
          .min(1, 'Số điện thoại không được để trống')
          .regex(PHONE_PATTERN, 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0'),
      ),
    organization: z
      .string()
      .transform(normalizeTeacherText)
      .transform(toOrganization)
      .pipe(
        z
          .string()
          .min(1, 'Đơn vị công tác không được để trống')
          .max(MAX_LENGTH, 'Đơn vị công tác không được vượt quá 100 ký tự')
          .regex(ORGANIZATION_PATTERN, 'Đơn vị công tác chỉ được chứa chữ cái, số và dấu câu hợp lệ'),
      ),
    // Gửi tên hoặc mã ngành. Ngoài trường không bắt buộc (cho phép null/rỗng)
    majorId: z.union([z.string(), z.number()]).optional().nullable(),
    major: z.string().optional().nullable().transform(normalizeTeacherText),
    // Học hàm / Học vị (bắt buộc: POST /teacher: academicTitleId từ bảng academic_title hoặc academicTitle viết tắt)
    academicTitleId: z.coerce.number().optional().nullable(),
    academicTitle: z
      .string()
      .min(1, 'Vui lòng chọn học hàm / học vị')
      .transform(normalizeTeacherText),
    amount: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val ? normalizeTeacherText(val) : ''))
      .pipe(
        z
          .string()
          .regex(/^\d{0,18}$/, 'Số lượng sinh viên hướng dẫn phải là số nguyên không âm'),
      )
      .transform((val) => (val === '' ? null : val)),
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
  // Ngành học: Giáo viên trong trường bắt buộc phải chọn ngành. Giáo viên ngoài trường không bắt buộc (cho phép để trống)
  .refine(
    (values) => {
      if (isExternalTeacherValues(values)) return true
      if (isInternalTeacherValues(values)) {
        return readText(values.major) !== ''
      }
      return true
    },
    {
      message: 'Ngành học không được để trống',
      path: ['major'],
      when: () => true,
    },
  )
  .refine(
    (values) => {
      const majorText = readText(values.major)
      return majorText === '' || majorText.length <= MAX_LENGTH
    },
    { message: 'Ngành học không tồn tại trong hệ thống', path: ['major'], when: () => true },
  )
  .refine(
    (values) => {
      if (!isExternalTeacherValues(values)) return true
      return readText(values.major) === ''
    },
    {
      message: 'Giáo viên ngoài trường không được điền ngành',
      path: ['major'],
      when: () => true,
    },
  )

/** Giá trị người dùng nhập trên form (trước khi chuẩn hóa) */
export type CreateTeacherFormInput = z.input<typeof createTeacherSchema>
/** Dữ liệu sau khi zod chuẩn hóa — khớp body POST /teacher */
export type CreateTeacherFormValues = z.output<typeof createTeacherSchema>

export const EMPTY_CREATE_TEACHER_VALUES: CreateTeacherFormInput = {
  teacherCode: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  organization: '',
  majorId: null,
  major: '',
  amount: '',
  academicTitleId: null,
  academicTitle: '',
}
