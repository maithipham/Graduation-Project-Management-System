import { describe, expect, it } from 'vitest'
import { getNextSort, getPageItems } from '@/features/department/student_management/utils/studentTable'
import {
  createStudentSchema,
  EMPTY_CREATE_STUDENT_VALUES,
} from '@/features/department/student_management/utils/createStudentSchema'
import {
  DEFAULT_STUDENT_FILTERS,
  hasActiveFilters,
} from '@/features/department/student_management/utils/studentFilters'
import {
  applyRetryError,
  applyRetrySuccess,
  countRowsByStatus,
  importRowToFormValues,
  pickDefaultTab,
} from '@/features/department/student_management/utils/importResult'
import type { StudentImportRowResult } from '@/features/department/student_management'

describe('getNextSort', () => {
  it('bấm cùng cột: tăng dần → giảm dần → bỏ sắp xếp', () => {
    expect(getNextSort(undefined, 'name')).toBe('name,asc')
    expect(getNextSort('name,asc', 'name')).toBe('name,desc')
    expect(getNextSort('name,desc', 'name')).toBeUndefined()
  })

  it('bấm sang cột khác thì bắt đầu lại từ tăng dần', () => {
    expect(getNextSort('name,desc', 'studentCode')).toBe('studentCode,asc')
  })
})

describe('getPageItems', () => {
  it('ít trang thì hiện đủ', () => {
    expect(getPageItems(0, 1)).toEqual([0])
    expect(getPageItems(1, 3)).toEqual([0, 1, 2])
  })

  it('nhiều trang thì rút gọn bằng dấu …', () => {
    expect(getPageItems(0, 8)).toEqual([0, 1, 'ellipsis', 7])
    expect(getPageItems(4, 20)).toEqual([0, 'ellipsis', 3, 4, 5, 'ellipsis', 19])
    expect(getPageItems(19, 20)).toEqual([0, 'ellipsis', 18, 19])
  })

  it('khoảng trống chỉ thiếu 1 trang thì hiện luôn trang đó', () => {
    expect(getPageItems(3, 8)).toEqual([0, 1, 2, 3, 4, 'ellipsis', 7])
  })
})

describe('hasActiveFilters', () => {
  it('bộ lọc mặc định (status ACTIVE) không tính là đang lọc', () => {
    expect(hasActiveFilters(DEFAULT_STUDENT_FILTERS)).toBe(false)
    expect(hasActiveFilters({ ...DEFAULT_STUDENT_FILTERS, keyword: '   ' })).toBe(false)
  })

  it('đổi bất kỳ bộ lọc nào thì tính là đang lọc', () => {
    expect(hasActiveFilters({ ...DEFAULT_STUDENT_FILTERS, status: 'ALL' })).toBe(true)
    expect(hasActiveFilters({ ...DEFAULT_STUDENT_FILTERS, batch: 'K63' })).toBe(true)
  })
})

describe('createStudentSchema', () => {
  const valid = {
    studentCode: '2251172489',
    firstName: 'Lê Trung',
    lastName: 'Đức',
    email: '2251172489@gmail.com',
    phone: '0911111111',
    batch: 'K63',
    className: '63KTPM1',
    major: 'Kỹ thuật phần mềm',
  }

  const firstError = (values: Record<string, string>, field: string) => {
    const result = createStudentSchema.safeParse(values)
    if (result.success) return undefined
    return result.error.issues.find((issue) => issue.path[0] === field)?.message
  }

  it('chuẩn hóa khoảng trắng, email viết thường, khóa viết hoa', () => {
    const result = createStudentSchema.parse({
      ...valid,
      firstName: '  Lê   Trung ',
      email: ' 2251172489@GMAIL.COM ',
      batch: 'k63',
    })
    expect(result.firstName).toBe('Lê Trung')
    expect(result.email).toBe('2251172489@gmail.com')
    expect(result.batch).toBe('K63')
  })

  it('ô trống báo "không được để trống"', () => {
    expect(firstError(EMPTY_CREATE_STUDENT_VALUES, 'studentCode')).toBe(
      'Mã sinh viên không được để trống',
    )
    expect(firstError(EMPTY_CREATE_STUDENT_VALUES, 'major')).toBe('Ngành học không được để trống')
  })

  it('sai định dạng báo đúng message của BE', () => {
    expect(firstError({ ...valid, studentCode: '12345' }, 'studentCode')).toBe(
      'Mã sinh viên phải gồm đúng 10 chữ số',
    )
    expect(firstError({ ...valid, firstName: 'Lê 2' }, 'firstName')).toBe(
      'Họ chỉ được chứa chữ cái và khoảng trắng',
    )
    expect(firstError({ ...valid, lastName: 'Đức Anh' }, 'lastName')).toBe('Tên chỉ được chứa chữ cái')
    expect(firstError({ ...valid, email: 'abc@' }, 'email')).toBe('Email không đúng định dạng')
    expect(firstError({ ...valid, email: '2251172489@e.tlu.edu.vn' }, 'email')).toBe(
      'Email sinh viên phải có đuôi @gmail.com',
    )
    // Sai định dạng chỉ báo 1 lỗi, không báo thêm lỗi đuôi email
    const invalidEmail = createStudentSchema.safeParse({ ...valid, email: 'abc@' })
    expect(invalidEmail.error?.issues.filter((issue) => issue.path[0] === 'email')).toHaveLength(1)
    expect(firstError({ ...valid, phone: '1911111111' }, 'phone')).toBe(
      'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0',
    )
    expect(firstError({ ...valid, batch: 'K6' }, 'batch')).toBe(
      'Khóa học không đúng định dạng (VD: K64)',
    )
    expect(firstError({ ...valid, className: '63-KTPM' }, 'className')).toBe(
      'Tên lớp không được chứa ký tự đặc biệt',
    )
  })
})

describe('kết quả import sinh viên', () => {
  const errorRow: StudentImportRowResult = {
    rowNumber: 5,
    studentCode: '2251172489',
    firstName: 'Lê Trung',
    lastName: 'Đức',
    email: '2251172489@gmail.com',
    phone: null,
    batch: 'K64',
    className: '64KTPM1',
    majorName: 'Kỹ thuật phần mềm',
    status: 'ERROR',
    message: 'Số điện thoại không được để trống',
  }
  const fixedValues = {
    ...EMPTY_CREATE_STUDENT_VALUES,
    studentCode: '2251172489',
    firstName: 'Lê Trung',
    lastName: 'Đức',
    email: '2251172489@gmail.com',
    phone: '0911111111',
    batch: 'K64',
    className: '64KTPM2',
    major: 'Kỹ thuật phần mềm',
  }

  it('đếm số dòng theo trạng thái và mở tab đầu tiên có dữ liệu', () => {
    const rows: StudentImportRowResult[] = [
      { ...errorRow, rowNumber: 2, status: 'SUCCESS' },
      { ...errorRow, rowNumber: 3, status: 'WARNING' },
    ]
    const counts = countRowsByStatus(rows)
    expect(counts).toEqual({ ERROR: 0, WARNING: 1, SUCCESS: 1 })
    expect(pickDefaultTab(counts)).toBe('WARNING')
    expect(pickDefaultTab(countRowsByStatus([...rows, errorRow]))).toBe('ERROR')
    expect(pickDefaultTab(countRowsByStatus([]))).toBe('ERROR')
  })

  it('đưa dòng import vào form sửa: ô null thành chuỗi rỗng, majorName → major', () => {
    expect(importRowToFormValues(errorRow)).toMatchObject({ phone: '', major: 'Kỹ thuật phần mềm' })
  })

  it('gửi lại thành công chuyển dòng sang Thành công, cảnh báo 1101 sang Cảnh báo', () => {
    const saved = applyRetrySuccess(errorRow, fixedValues, { code: 1000, message: 'Đã lưu' })
    expect(saved).toMatchObject({ status: 'SUCCESS', message: 'Đã lưu', phone: '0911111111', className: '64KTPM2' })

    const unchanged = applyRetrySuccess(errorRow, fixedValues, {
      code: 1101,
      message: 'Sinh viên đã có trong hệ thống, thông tin không thay đổi',
    })
    expect(unchanged.status).toBe('WARNING')
  })

  it('gửi lại vẫn lỗi thì giữ ở tab Lỗi với lý do mới và dữ liệu đã sửa', () => {
    const failed = applyRetryError(errorRow, fixedValues, 'Email đã thuộc về tài khoản khác')
    expect(failed).toMatchObject({
      status: 'ERROR',
      message: 'Email đã thuộc về tài khoản khác',
      phone: '0911111111',
      rowNumber: 5,
    })
  })
})
