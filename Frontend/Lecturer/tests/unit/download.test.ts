import { describe, expect, it } from 'vitest'
import { getFilenameFromDisposition } from '@/shared/utils'

describe('getFilenameFromDisposition', () => {
  it('đọc filename thường và filename* mã hóa UTF-8', () => {
    expect(getFilenameFromDisposition('attachment; filename="students.xlsx"', 'x.xlsx')).toBe('students.xlsx')
    expect(
      getFilenameFromDisposition("attachment; filename*=UTF-8''Danh%20s%C3%A1ch.xlsx", 'x.xlsx'),
    ).toBe('Danh sách.xlsx')
  })

  it('không có header (BE chưa expose qua CORS) thì dùng tên dự phòng', () => {
    expect(getFilenameFromDisposition(undefined, 'x.xlsx')).toBe('x.xlsx')
  })
})
