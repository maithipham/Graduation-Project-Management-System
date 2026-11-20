import { describe, expect, it } from 'vitest'
import { scoreWeightSchema, sumScoreWeights } from '@/features/department/score_management/utils/scoreWeightSchema'

const valid = { name: 'Trọng số K66', advisorWeight: 40, examinerWeight: 30, councilWeight: 30 }

/** Lấy message lỗi theo path (VD 'total', 'advisorWeight') */
function issueAt(input: unknown, path: string): string | undefined {
  const result = scoreWeightSchema.safeParse(input)
  if (result.success) return undefined
  return result.error.issues.find((issue) => issue.path.join('.') === path)?.message
}

describe('sumScoreWeights', () => {
  it('cộng không lệch số thực: 33.33 + 33.33 + 33.34 = 100', () => {
    expect(sumScoreWeights({ advisorWeight: 33.33, examinerWeight: 33.33, councilWeight: 33.34 })).toBe(100)
  })

  it('ô chưa nhập (NaN) tính là 0', () => {
    expect(sumScoreWeights({ advisorWeight: 40, examinerWeight: Number.NaN, councilWeight: 30 })).toBe(70)
  })
})

describe('scoreWeightSchema', () => {
  it('hợp lệ khi tổng đúng 100 và trim tên', () => {
    const result = scoreWeightSchema.safeParse({ ...valid, name: '  Trọng số K66  ' })
    expect(result.success).toBe(true)
    expect(result.data?.name).toBe('Trọng số K66')
  })

  it('chấp nhận số lẻ 2 chữ số thập phân có tổng 100', () => {
    expect(
      scoreWeightSchema.safeParse({ ...valid, advisorWeight: 33.33, examinerWeight: 33.33, councilWeight: 33.34 })
        .success,
    ).toBe(true)
  })

  it('báo lỗi tổng ở path total khi tổng khác 100', () => {
    expect(issueAt({ ...valid, councilWeight: 20 }, 'total')).toBe('Tổng trọng số 3 đầu điểm phải bằng 100%')
  })

  it('báo lỗi tên trống', () => {
    expect(issueAt({ ...valid, name: '   ' }, 'name')).toBe('Tên cấu hình không được để trống')
  })

  it('báo lỗi khi trọng số chưa nhập (NaN)', () => {
    expect(issueAt({ ...valid, advisorWeight: Number.NaN }, 'advisorWeight')).toBe('Vui lòng nhập trọng số')
  })

  it('báo lỗi khi trọng số bằng 0', () => {
    expect(issueAt({ ...valid, advisorWeight: 0, examinerWeight: 70 }, 'advisorWeight')).toBe(
      'Trọng số phải lớn hơn 0%',
    )
  })

  it('báo lỗi khi trọng số quá 100', () => {
    expect(issueAt({ ...valid, advisorWeight: 101 }, 'advisorWeight')).toBe('Trọng số tối đa 100%')
  })

  it('báo lỗi khi quá 2 chữ số thập phân', () => {
    expect(issueAt({ ...valid, advisorWeight: 33.333 }, 'advisorWeight')).toBe('Trọng số tối đa 2 chữ số thập phân')
  })
})
