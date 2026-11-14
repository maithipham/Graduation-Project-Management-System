import { describe, expect, it } from 'vitest'
import {
  DEFAULT_TEACHER_FILTERS,
  hasActiveTeacherFilters,
  toOrganizationParams,
} from '@/features/department/lecturer_management/utils/teacherFilters'

describe('toOrganizationParams', () => {
  it('gửi thẳng organizationType = internal / external, tất cả đơn vị thì không gửi', () => {
    expect(toOrganizationParams('')).toEqual({})
    expect(toOrganizationParams('internal')).toEqual({ organizationType: 'internal' })
    expect(toOrganizationParams('external')).toEqual({ organizationType: 'external' })
  })
})

describe('hasActiveTeacherFilters', () => {
  it('chọn đơn vị hoặc khoa thì coi là đang lọc', () => {
    expect(hasActiveTeacherFilters(DEFAULT_TEACHER_FILTERS)).toBe(false)
    expect(hasActiveTeacherFilters({ ...DEFAULT_TEACHER_FILTERS, organization: 'external' })).toBe(true)
    expect(hasActiveTeacherFilters({ ...DEFAULT_TEACHER_FILTERS, majorName: 'An ninh mạng' })).toBe(true)
    expect(hasActiveTeacherFilters({ ...DEFAULT_TEACHER_FILTERS, name: '  ' })).toBe(false)
  })
})
