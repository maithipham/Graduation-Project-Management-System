import { describe, expect, it } from 'vitest'
import { getHomePath, isUserRole } from '@/features/auth'
import { getInitials } from '@/shared/utils'

describe('getHomePath', () => {
  it('chọn trang chủ theo thứ tự ưu tiên, không phụ thuộc thứ tự BE trả về', () => {
    expect(getHomePath(['SUPERVISOR', 'ADMIN'])).toBe('/admin')
    expect(getHomePath(['SUPERVISOR', 'HEAD_OF_MAJOR'])).toBe('/department')
    expect(getHomePath(['HEAD_OF_MAJOR', 'SUPERVISOR'])).toBe('/department')
    expect(getHomePath(['SUPERVISOR'])).toBe('/lecturer')
  })

  it('không có role nào của portal cán bộ → null', () => {
    expect(getHomePath([])).toBeNull()
    expect(getHomePath(['STUDENT'])).toBeNull()
    // Tên role cũ BE không còn trả về
    expect(getHomePath(['LECTURER', 'HEAD_OF_DEPARTMENT'])).toBeNull()
  })
})

describe('isUserRole', () => {
  it('chỉ nhận đúng 3 role của portal cán bộ', () => {
    expect(isUserRole('ADMIN')).toBe(true)
    expect(isUserRole('HEAD_OF_MAJOR')).toBe(true)
    expect(isUserRole('SUPERVISOR')).toBe(true)
    expect(isUserRole('HEAD_OF_DEPARTMENT')).toBe(false)
    expect(isUserRole('LECTURER')).toBe(false)
    expect(isUserRole('lecturer')).toBe(false)
    expect(isUserRole('STUDENT')).toBe(false)
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
