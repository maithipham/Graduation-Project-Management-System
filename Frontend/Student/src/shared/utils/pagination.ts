export type PageItem = number | 'ellipsis'

/**
 * Các nút số trang cần hiện (chỉ số 0-based), ví dụ trang 5/20 → [0, '…', 3, 4, 5, '…', 19].
 * Luôn có trang đầu, trang cuối và 1 trang mỗi bên trang hiện tại; khoảng trống chỉ thiếu 1 trang thì hiện luôn trang đó.
 */
export function getPageItems(current: number, totalPages: number): PageItem[] {
  if (totalPages <= 0) return []

  const pages = [0, current - 1, current, current + 1, totalPages - 1]
    .filter((p) => p >= 0 && p < totalPages)
  const sorted = [...new Set(pages)].sort((a, b) => a - b)

  const items: PageItem[] = []
  sorted.forEach((page, index) => {
    const prev = sorted[index - 1]
    if (prev !== undefined) {
      if (page - prev === 2) items.push(prev + 1)
      else if (page - prev > 2) items.push('ellipsis')
    }
    items.push(page)
  })
  return items
}
