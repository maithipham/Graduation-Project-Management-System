import type { PageParams, SpringPage } from '@/shared/types'

interface PageMetadata {
  number: number
  size: number
  totalElements: number
  totalPages: number
}

/**
 * JSON danh sách phân trang mà Spring có thể trả về:
 * - `Page<T>` cũ: các trường nằm phẳng (`content`, `number`, `totalPages`...)
 * - `PagedModel<T>` (Spring Data 3.3+, `pageSerializationMode = VIA_DTO`):
 *   `{ content, page: { number, size, totalElements, totalPages } }`
 */
export type RawSpringPage<T> = { content?: T[] | null; page?: Partial<PageMetadata> | null } & Partial<
  Omit<SpringPage<T>, 'content'>
>

function pickNumber(...values: (number | undefined)[]): number | undefined {
  return values.find((value) => typeof value === 'number' && Number.isFinite(value))
}

/**
 * Đưa mọi dạng JSON phân trang của Spring về `SpringPage<T>` đủ trường.
 * `requested` là trang/kích thước đã gửi lên, dùng khi BE không trả các trường đó.
 */
export function toSpringPage<T>(
  raw: RawSpringPage<T> | null | undefined,
  requested?: Pick<PageParams, 'page' | 'size'>,
): SpringPage<T> {
  const content = raw?.content ?? []
  const meta: Partial<PageMetadata> = raw?.page ?? raw ?? {}

  const number = pickNumber(meta.number, requested?.page) ?? 0
  const size = pickNumber(meta.size, requested?.size) ?? content.length
  const totalElements = pickNumber(meta.totalElements) ?? number * size + content.length
  const totalPages =
    pickNumber(meta.totalPages) ?? (size > 0 ? Math.ceil(totalElements / size) : content.length > 0 ? 1 : 0)

  return {
    content,
    number,
    size,
    totalElements,
    totalPages,
    numberOfElements: content.length,
    first: number === 0,
    last: number >= totalPages - 1,
    empty: content.length === 0,
  }
}
