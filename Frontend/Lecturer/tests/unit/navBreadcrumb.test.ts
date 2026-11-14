import { describe, expect, it } from 'vitest'
import { getNavBreadcrumbs, type BreadcrumbNavItem } from '@/shared/utils'

const items: BreadcrumbNavItem[] = [
  { to: '/department', label: 'Dashboard', end: true },
  { to: '/department/students', label: 'Quản lý sinh viên' },
  {
    to: '/department/teachers',
    label: 'Quản lý giáo viên',
    children: [
      { to: '/department/lecturers', label: 'Giảng viên' },
      { to: '/department/reviewers', label: 'Nhận xét' },
    ],
  },
]

describe('getNavBreadcrumbs', () => {
  it('trang gốc chỉ khớp đúng URL', () => {
    expect(getNavBreadcrumbs(items, '/department')).toEqual(['Dashboard'])
    expect(getNavBreadcrumbs(items, '/department/')).toEqual(['Dashboard'])
  })

  it('mục đơn và trang con của nó (ví dụ trang chi tiết)', () => {
    expect(getNavBreadcrumbs(items, '/department/students')).toEqual(['Quản lý sinh viên'])
    expect(getNavBreadcrumbs(items, '/department/students/123')).toEqual(['Quản lý sinh viên'])
  })

  it('mục con hiện kèm mục cha, kể cả khi URL con không nằm dưới URL cha', () => {
    expect(getNavBreadcrumbs(items, '/department/lecturers')).toEqual(['Quản lý giáo viên', 'Giảng viên'])
  })

  it('không khớp nhầm tiền tố giống tên (students ≠ studentsX)', () => {
    expect(getNavBreadcrumbs(items, '/department/studentsX')).toEqual([])
  })

  it('URL không có trong menu → rỗng (không hiện nhầm "Dashboard")', () => {
    expect(getNavBreadcrumbs(items, '/department/khong-ton-tai')).toEqual([])
  })
})
