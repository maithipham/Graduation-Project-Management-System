import { describe, expect, it } from 'vitest'
import { getHomePath, isUserRole } from '@/features/auth'
import { getInitials } from '@/shared/utils'

describe('getHomePath', () => {
  it('sinh viên → dashboard /student, không phụ thuộc thứ tự BE trả về', () => {
    expect(getHomePath(['STUDENT'])).toBe('/student')
    expect(getHomePath(['LECTURER', 'STUDENT'])).toBe('/student')
  })

  it('không có role STUDENT (ví dụ tài khoản cán bộ) → null', () => {
    expect(getHomePath([])).toBeNull()
    expect(getHomePath(['LECTURER', 'ADMIN'])).toBeNull()
  })
})

describe('isUserRole', () => {
  it('chỉ nhận đúng role STUDENT', () => {
    expect(isUserRole('STUDENT')).toBe(true)
    expect(isUserRole('student')).toBe(false)
    expect(isUserRole('LECTURER')).toBe(false)
  })
})

describe('getInitials', () => {
  it('lấy chữ đầu của từ đầu và từ cuối', () => {
    expect(getInitials('Trần Minh Khôi')).toBe('TK')
    expect(getInitials('  nguyễn   văn   an ')).toBe('NA')
    expect(getInitials('Khôi')).toBe('K')
  })

  it('tên rỗng → "?"', () => {
    expect(getInitials('')).toBe('?')
    expect(getInitials(undefined)).toBe('?')
  })
})
