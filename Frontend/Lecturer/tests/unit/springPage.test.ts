import { describe, expect, it } from 'vitest'
import { toSpringPage } from '@/shared/utils'

const content = [{ id: 'a' }, { id: 'b' }]

describe('toSpringPage', () => {
  it('giữ nguyên Page phẳng', () => {
    const page = toSpringPage(
      { content, number: 1, size: 2, totalElements: 5, totalPages: 3 },
      { page: 1, size: 2 },
    )
    expect(page).toEqual({
      content,
      number: 1,
      size: 2,
      totalElements: 5,
      totalPages: 3,
      numberOfElements: 2,
      first: false,
      last: false,
      empty: false,
    })
  })

  it('đọc được PagedModel ({ content, page: {...} }) của Spring Data 3.3+', () => {
    const page = toSpringPage({
      content,
      page: { number: 2, size: 15, totalElements: 32, totalPages: 3 },
    })
    expect(page).toMatchObject({
      number: 2,
      size: 15,
      totalElements: 32,
      totalPages: 3,
      numberOfElements: 2,
      first: false,
      last: true,
      empty: false,
    })
  })

  it('thiếu thông tin trang thì lấy trang/kích thước đã gửi lên', () => {
    const page = toSpringPage({ content }, { page: 0, size: 15 })
    expect(page).toMatchObject({ number: 0, size: 15, totalElements: 2, totalPages: 1, first: true, last: true })
  })

  it('không có dữ liệu → trang rỗng', () => {
    expect(toSpringPage(null, { page: 0, size: 15 })).toMatchObject({
      content: [],
      totalElements: 0,
      totalPages: 0,
      empty: true,
    })
  })
})
