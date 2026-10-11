import { describe, expect, it } from 'vitest'
import { formatDate, formatBytes, checkScoreOutlier } from '@/shared/utils'

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
