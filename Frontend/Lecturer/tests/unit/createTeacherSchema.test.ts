import { describe, expect, it } from 'vitest'
import {
  createTeacherSchema,
  EMPTY_CREATE_TEACHER_VALUES,
  getTeacherEmailRule,
  TLU_ORGANIZATION,
  type CreateTeacherFormInput,
} from '@/features/department/lecturer_management/utils/createTeacherSchema'

const VALID: CreateTeacherFormInput = {
  firstName: 'Nguyễn Văn',
  lastName: 'An',
  email: 'an.nv@tlu.edu.vn',
  phone: '0987654321',
  organization: TLU_ORGANIZATION,
  major: 'Kỹ thuật phần mềm',
  amount: '15',
}

const EXTERNAL: CreateTeacherFormInput = {
  ...VALID,
  email: 'an.nv@gmail.com',
  organization: 'Trường Đại học Bách khoa Hà Nội',
  major: '',
}

const MISMATCH =
  'Đơn vị công tác không khớp với email (email @tlu.edu.vn phải là Trường Đại học Thủy lợi, email @gmail.com phải là trường khác)'
const ORGANIZATION_INVALID =
  "Đơn vị công tác chỉ gồm chữ, số, khoảng trắng và các dấu . , - & ( ) ' / (tối đa 255 ký tự)"

/** Lỗi đầu tiên của từng ô (form chỉ hiện 1 dòng đỏ / ô) */
function firstErrors(input: CreateTeacherFormInput): Record<string, string> {
  const result = createTeacherSchema.safeParse(input)
  if (result.success) return {}
  const errors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const key = String(issue.path[0])
    errors[key] ??= issue.message
  }
  return errors
}

describe('createTeacherSchema', () => {
  it('chuẩn hóa: gộp khoảng trắng, xóa ký tự ẩn, email viết thường, tên Thủy lợi đúng chữ hoa', () => {
    const result = createTeacherSchema.parse({
      ...VALID,
      firstName: '  Nguyễn\t  Văn​ ',
      email: ' AN.NV@TLU.EDU.VN ',
      organization: '  trường  ĐẠI HỌC thủy lợi ',
    })
    expect(result).toMatchObject({
      firstName: 'Nguyễn Văn',
      email: 'an.nv@tlu.edu.vn',
      organization: TLU_ORGANIZATION,
      amount: '15',
    })
  })

  it('ngoài trường: tên trường khác giữ nguyên, ngành gửi chuỗi rỗng', () => {
    expect(createTeacherSchema.parse(EXTERNAL)).toMatchObject({
      organization: 'Trường Đại học Bách khoa Hà Nội',
      major: '',
    })
  })

  it('hạn mức bỏ trống → null (BE tự gán)', () => {
    expect(createTeacherSchema.parse({ ...VALID, amount: '  ' }).amount).toBeNull()
  })

  it('ô trống báo "không được để trống"; email trống thì chưa báo lỗi ngành', () => {
    expect(firstErrors(EMPTY_CREATE_TEACHER_VALUES)).toEqual({
      firstName: 'Họ không được để trống',
      lastName: 'Tên không được để trống',
      email: 'Email không được để trống',
      phone: 'Số điện thoại không được để trống',
      organization: 'Đơn vị công tác không được để trống',
    })
  })

  it('sai định dạng báo đúng message của BE', () => {
    expect(
      firstErrors({
        ...VALID,
        firstName: 'Nguyễn 2',
        lastName: 'Văn An',
        phone: '987654321',
        email: 'an.nv@',
        organization: 'Trường #1',
        amount: '5.5',
      }),
    ).toEqual({
      firstName: 'Họ chỉ được chứa chữ cái và khoảng trắng',
      lastName: 'Tên chỉ được chứa chữ cái',
      email: 'Email không đúng định dạng',
      phone: 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0',
      organization: ORGANIZATION_INVALID,
      amount: 'Số lượng sinh viên hướng dẫn phải là số nguyên không âm',
    })
  })

  it("đơn vị nhận chữ, số và các dấu . , - & ( ) ' /", () => {
    expect(
      firstErrors({ ...EXTERNAL, organization: "Đại học Quốc gia (ĐHQG-HN), K'2 & Co. 1/2" }),
    ).toEqual({})
  })

  it('email sai đuôi (kể cả email sinh viên @e.tlu.edu.vn) bị chặn', () => {
    expect(firstErrors({ ...VALID, email: 'sv@e.tlu.edu.vn' }).email).toBe(
      'Email giáo viên phải có đuôi @tlu.edu.vn (trong trường) hoặc @gmail.com (ngoài trường)',
    )
  })

  it('đơn vị không khớp email báo lỗi cả 2 chiều, kể cả khi ô khác đang lỗi', () => {
    expect(firstErrors({ ...VALID, organization: 'Trường Đại học Bách khoa Hà Nội' })).toEqual({
      organization: MISMATCH,
    })
    expect(firstErrors({ ...EXTERNAL, organization: 'trường đại học thủy lợi' })).toEqual({
      organization: MISMATCH,
    })
    expect(firstErrors({ ...EXTERNAL, phone: '', organization: TLU_ORGANIZATION })).toEqual({
      phone: 'Số điện thoại không được để trống',
      organization: MISMATCH,
    })
    // Email sai thì chưa so đơn vị
    expect(firstErrors({ ...VALID, email: 'abc', organization: 'Trường Đại học Bách khoa' })).toEqual({
      email: 'Email không đúng định dạng',
    })
  })

  it('ngành: bắt buộc với trong trường, phải trống với ngoài trường', () => {
    expect(firstErrors({ ...VALID, major: '  ' })).toEqual({ major: 'Ngành học không được để trống' })
    expect(firstErrors({ ...EXTERNAL, major: 'Kỹ thuật phần mềm' })).toEqual({
      major: 'Giáo viên ngoài trường không được điền ngành',
    })
  })

  it.each(['abc', 'gv@outlook.com', 'sv@e.tlu.edu.vn'])(
    'email "%s" chưa hợp lệ thì không báo lỗi ngành',
    (email) => {
      expect(firstErrors({ ...VALID, email, major: '' }).major).toBeUndefined()
      expect(firstErrors({ ...EXTERNAL, email, major: 'Kỹ thuật phần mềm' }).major).toBeUndefined()
    },
  )

  it.each(['-1', '+5', '5.0', 'abc', '1'.repeat(19)])('hạn mức "%s" không hợp lệ', (amount) => {
    expect(firstErrors({ ...VALID, amount }).amount).toBe(
      'Số lượng sinh viên hướng dẫn phải là số nguyên không âm',
    )
  })

  it('chuỗi dài quá 255 ký tự coi như sai định dạng', () => {
    expect(firstErrors({ ...VALID, firstName: 'A'.repeat(256) }).firstName).toBe(
      'Họ chỉ được chứa chữ cái và khoảng trắng',
    )
    expect(firstErrors({ ...EXTERNAL, organization: 'A'.repeat(256) }).organization).toBe(
      ORGANIZATION_INVALID,
    )
  })

  it('255 ký tự đếm sau khi chuẩn hóa (gộp khoảng trắng, trim), giống BE', () => {
    // 253 chữ + 2 khoảng trắng giữa = 255 ký tự sau chuẩn hóa, nhưng 260 ký tự trước chuẩn hóa
    const organization = `  ${'A'.repeat(100)}   ${'B'.repeat(100)}  ${'C'.repeat(53)} `
    expect(organization.length).toBeGreaterThan(255)
    expect(firstErrors({ ...EXTERNAL, organization })).toEqual({})
  })
})

describe('getTeacherEmailRule', () => {
  it('đuôi email → trong / ngoài trường + hạn mức mặc định', () => {
    expect(getTeacherEmailRule('A@TLU.EDU.VN')).toMatchObject({ internal: true, amount: 20 })
    expect(getTeacherEmailRule('b@gmail.com')).toMatchObject({ internal: false, amount: 10 })
    expect(getTeacherEmailRule('c@e.tlu.edu.vn')).toBeUndefined()
    expect(getTeacherEmailRule('d@outlook.com')).toBeUndefined()
    expect(getTeacherEmailRule('chưa xong@')).toBeUndefined()
  })
})
