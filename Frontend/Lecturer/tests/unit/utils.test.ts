import { describe, expect, it } from 'vitest'
import { checkScoreOutlier, compactParams, formatBytes, formatDate, getNextSort } from '@/shared/utils'

describe('Shared Utilities', () => {
  it('formatBytes formats file sizes correctly', () => {
    expect(formatBytes(0)).toBe('0 Bytes')
    expect(formatBytes(1024)).toBe('1 KB')
    expect(formatBytes(1024 * 1024)).toBe('1 MB')
  })

  it('formatDate formats date properly', () => {
    const date = new Date(2026, 9, 18) // 18/10/2026
    const formatted = formatDate(date, 'short')
    expect(formatted).toContain('18')
    expect(formatted).toContain('2026')
  })

  it('checkScoreOutlier detects outlier scores (> 2.0 difference)', () => {
    const normalScores = [8.5, 8.0, 9.0]
    expect(checkScoreOutlier(normalScores).hasOutlier).toBe(false)

    const outlierScores = [6.0, 9.0, 8.5]
    expect(checkScoreOutlier(outlierScores).hasOutlier).toBe(true)
    expect(checkScoreOutlier(outlierScores).diff).toBe(3.0)
  })
})

describe('sắp xếp & tham số dùng chung cho bảng', () => {
  it('getNextSort: tăng dần → giảm dần → bỏ; đổi cột thì bắt đầu lại', () => {
    expect(getNextSort<'name' | 'amount'>(undefined, 'name')).toBe('name,asc')
    expect(getNextSort<'name' | 'amount'>('name,asc', 'name')).toBe('name,desc')
    expect(getNextSort<'name' | 'amount'>('name,desc', 'name')).toBeUndefined()
    expect(getNextSort<'name' | 'amount'>('name,desc', 'amount')).toBe('amount,asc')
  })

  it('compactParams bỏ giá trị undefined và chuỗi rỗng, giữ số 0 và false', () => {
    expect(compactParams({ name: '', organization: undefined, page: 0, size: 10, active: false })).toEqual({
      page: 0,
      size: 10,
      active: false,
    })
  })
})
