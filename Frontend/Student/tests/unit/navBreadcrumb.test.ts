import { describe, expect, it } from 'vitest'
import { getNavBreadcrumbs, type BreadcrumbNavItem } from '@/shared/utils'

const items: BreadcrumbNavItem[] = [
  { to: '/student', label: 'Tổng quan', end: true },
  { to: '/student/topics', label: 'Đăng ký đề tài' },
  {
    to: '/student/project',
    label: 'Đồ án của tôi',
    children: [
      { to: '/student/outline', label: 'Đề cương' },
      { to: '/student/reports', label: 'Báo cáo tiến độ' },
    ],
  },
]

describe('getNavBreadcrumbs', () => {
  it('trang gốc chỉ khớp đúng URL', () => {
    expect(getNavBreadcrumbs(items, '/student')).toEqual(['Tổng quan'])
    expect(getNavBreadcrumbs(items, '/student/')).toEqual(['Tổng quan'])
  })

  it('mục đơn và trang con của nó (ví dụ trang chi tiết)', () => {
    expect(getNavBreadcrumbs(items, '/student/topics')).toEqual(['Đăng ký đề tài'])
    expect(getNavBreadcrumbs(items, '/student/topics/123')).toEqual(['Đăng ký đề tài'])
  })

  it('mục con hiện kèm mục cha, kể cả khi URL con không nằm dưới URL cha', () => {
    expect(getNavBreadcrumbs(items, '/student/outline')).toEqual(['Đồ án của tôi', 'Đề cương'])
  })

  it('không khớp nhầm tiền tố giống tên (topics ≠ topicsX)', () => {
    expect(getNavBreadcrumbs(items, '/student/topicsX')).toEqual([])
  })

  it('URL không có trong menu → rỗng (không hiện nhầm "Tổng quan")', () => {
    expect(getNavBreadcrumbs(items, '/student/khong-ton-tai')).toEqual([])
  })
})
