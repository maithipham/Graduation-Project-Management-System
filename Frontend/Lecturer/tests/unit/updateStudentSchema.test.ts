import { describe, expect, it } from 'vitest'
import {
  splitFullName,
  toUpdateStudentFormInput,
  updateStudentSchema,
} from '@/features/department/student_management/utils/updateStudentSchema'

describe('splitFullName', () => {
  it('từ cuối là Tên, phần còn lại là Họ và tên đệm', () => {
    expect(splitFullName('  Lê  Trung Đức ')).toEqual({ firstName: 'Lê Trung', lastName: 'Đức' })
    expect(splitFullName('Đức')).toEqual({ firstName: '', lastName: 'Đức' })
  })
})

describe('updateStudentSchema', () => {
  const detail = {
    publicId: 'id-1',
    studentCode: '2251172489',
    name: 'Lê Trung Đức',
    email: '2251172489@gmail.com',
    phone: null,
    majorName: 'Công nghệ thông tin',
    className: '64KTPM1',
    batch: 'K64',
    accountStatus: false,
  }

  it('body không có ngành, không có accountStatus', () => {
    const input = { ...toUpdateStudentFormInput(detail), phone: '0911111111', batch: 'k64' }
    const result = updateStudentSchema.parse(input)
    expect(result).toEqual({
      studentCode: '2251172489',
      firstName: 'Lê Trung',
      lastName: 'Đức',
      email: '2251172489@gmail.com',
      phone: '0911111111',
      batch: 'K64',
      className: '64KTPM1',
    })
    expect(result).not.toHaveProperty('major')
    expect(result).not.toHaveProperty('accountStatus')
  })

  it('SĐT trống (BE trả null) → báo lỗi dưới ô', () => {
    const result = updateStudentSchema.safeParse(toUpdateStudentFormInput(detail))
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['phone'])
  })
})
