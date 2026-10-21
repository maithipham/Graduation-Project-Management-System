import type { SortValue } from '@/shared/types'

/**
 * Bấm tiêu đề cột: lần 1 tăng dần → lần 2 giảm dần → lần 3 bỏ sắp xếp.
 * Bấm sang cột khác thì bắt đầu lại từ tăng dần.
 */
export function getNextSort<F extends string>(
  current: SortValue<F> | undefined,
  field: F,
): SortValue<F> | undefined {
  if (current === `${field},asc`) return `${field},desc`
  if (current === `${field},desc`) return undefined
  return `${field},asc`
}
