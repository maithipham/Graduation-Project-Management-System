import { describe, expect, it } from 'vitest'
import type { EvaluationTemplateDetail, RubricTreeGroup } from '@/features/department/score_management/types'
import {
  beDateToApiDate,
  formatApiDate,
  formatBeDate,
  formatBeDateTime,
  renumberTree,
  sumTreeWeight,
  toEvaluationType,
  toRubricDetail,
  toRubricRole,
  toRubricStatus,
  toSaveRubricBody,
} from '@/features/department/score_management/utils/rubricMapper'
import {
  createEffectiveFromSchema,
  getScheduledSaveBlockReason,
  saveRubricSchema,
  sumWeight,
} from '@/features/department/score_management/utils/rubricSchema'

const detailDto: EvaluationTemplateDetail = {
  publicId: 't-1',
  name: 'Rubric CNTT 2026',
  type: 'EXAMINER',
  effectiveFrom: '01-01-2026',
  effectiveTo: null,
  displayStatus: 'ACTIVE',
  displayStatusName: 'Đang áp dụng',
  version: 3,
  totalWeight: 100,
  criteriaCount: 3,
  semesterCount: 2,
  sheetCount: 37,
  canEdit: false,
  canApply: false,
  applyBlockedReason: null,
  canChangeEffectiveFrom: false,
  canCancelApply: false,
  canDelete: false,
  createdByName: 'Nguyễn Văn A',
  updatedByName: 'Nguyễn Văn A',
  createdAt: '20-12-2025 09:15:00',
  updatedAt: '21-12-2025 14:05:30',
  groups: [
    {
      publicId: 'g-2',
      displayOrder: 2,
      name: 'Báo cáo',
      totalWeight: 60,
      maxScore: 6,
      criteria: [{ publicId: 'c-3', displayOrder: 1, name: 'Hình thức', weight: 60, maxScore: 6 }],
    },
    {
      publicId: 'g-1',
      displayOrder: 1,
      name: 'Thái độ',
      totalWeight: 40,
      maxScore: 4,
      criteria: [
        { publicId: 'c-2', displayOrder: 2, name: 'Đúng hạn', weight: 15.5, maxScore: 1.55 },
        { publicId: 'c-1', displayOrder: 1, name: 'Chuyên cần', weight: 24.5, maxScore: 2.45 },
      ],
    },
  ],
}

describe('rubricMapper', () => {
  it('đổi enum BE ↔ giao diện', () => {
    expect(toEvaluationType('supervisor')).toBe('ADVISOR')
    expect(toEvaluationType('reviewer')).toBe('EXAMINER')
    expect(toRubricRole('COUNCIL')).toBe('council')
    expect(toRubricStatus('SCHEDULED')).toBe('upcoming')
    expect(toRubricStatus('EXPIRED')).toBe('archived')
  })

  it('đổi định dạng ngày không qua Date (không lệch múi giờ)', () => {
    expect(formatBeDate('01-12-2026')).toBe('01/12/2026')
    expect(formatBeDate(null)).toBeNull()
    expect(formatBeDate('2026-12-01')).toBeNull()
    expect(formatBeDateTime('21-12-2025 14:05:30')).toBe('21/12/2025 14:05')
    expect(beDateToApiDate('01-12-2026')).toBe('2026-12-01')
    expect(formatApiDate('2026-12-01')).toBe('01/12/2026')
  })

  it('dựng cây theo displayOrder và đánh mã 1, 1.1', () => {
    const detail = toRubricDetail(detailDto)
    expect(detail.role).toBe('reviewer')
    expect(detail.status).toBe('active')
    expect(detail.effectiveFrom).toBe('01/01/2026')
    expect(detail.version).toBe(3)
    expect(detail.groups.map((g) => [g.code, g.name])).toEqual([
      ['1', 'Thái độ'],
      ['2', 'Báo cáo'],
    ])
    expect(detail.groups[0].criteria.map((c) => [c.code, c.name, c.maxScore])).toEqual([
      ['1.1', 'Chuyên cần', 2.45],
      ['1.2', 'Đúng hạn', 1.55],
    ])
    expect(sumTreeWeight(detail.groups)).toBe(100)
  })

  it('ghép body A5: phần tử mới publicId null, không gửi maxScore/code', () => {
    const groups: RubricTreeGroup[] = renumberTree([
      {
        key: 'g-1',
        publicId: 'g-1',
        code: '',
        name: '  Thái độ ',
        criteria: [
          { key: 'c-1', publicId: 'c-1', code: '', name: 'Chuyên cần', weight: 24.5, maxScore: 2.45 },
          { key: 'new-1', publicId: null, code: '', name: 'Mới', weight: 0.1 + 0.2, maxScore: null },
        ],
      },
    ])
    expect(groups[0].criteria[1].code).toBe('1.2')

    expect(toSaveRubricBody(' Rubric ', 3, groups)).toEqual({
      name: 'Rubric',
      version: 3,
      groups: [
        {
          publicId: 'g-1',
          name: 'Thái độ',
          criteria: [
            { publicId: 'c-1', name: 'Chuyên cần', weight: 24.5 },
            { publicId: null, name: 'Mới', weight: 0.3 },
          ],
        },
      ],
    })
  })
})

describe('rubricSchema', () => {
  const validBody = {
    name: 'Rubric',
    version: 1,
    groups: [{ publicId: null, name: 'Nhóm', criteria: [{ publicId: null, name: 'Tiêu chí', weight: 15.55 }] }],
  }

  it('cho lưu Nháp chưa đủ 100%', () => {
    expect(saveRubricSchema.safeParse(validBody).success).toBe(true)
  })

  it('báo lỗi trọng số và tên', () => {
    const result = saveRubricSchema.safeParse({
      ...validBody,
      name: '   ',
      groups: [{ publicId: null, name: 'Nhóm', criteria: [{ publicId: null, name: 'A', weight: 1.234 }] }],
    })
    expect(result.success).toBe(false)
    const messages = result.error?.issues.map((issue) => issue.message)
    expect(messages).toContain('Tên rubric không được để trống')
    expect(messages).toContain('Trọng số tối đa 2 chữ số thập phân')

    const zero = saveRubricSchema.safeParse({
      ...validBody,
      groups: [{ publicId: null, name: 'Nhóm', criteria: [{ publicId: null, name: 'A', weight: 0 }] }],
    })
    expect(zero.error?.issues[0].message).toBe('Trọng số tiêu chí phải lớn hơn 0%')
  })

  it('tính tổng và chặn lưu rubric Sắp áp dụng chưa hợp lệ', () => {
    expect(sumWeight([{ criteria: [{ weight: 0.1 }, { weight: 0.2 }] }])).toBe(0.3)
    expect(getScheduledSaveBlockReason([{ criteria: [{ weight: 90 }] }])).toBe('Tổng trọng số (90%) phải bằng 100%')
    expect(getScheduledSaveBlockReason([{ criteria: [{ weight: 100 }] }, { criteria: [] }])).toBe(
      'Mỗi nhóm tiêu chí phải có ít nhất một tiêu chí',
    )
    expect(getScheduledSaveBlockReason([{ criteria: [{ weight: 60 }, { weight: 40 }] }])).toBeNull()
  })

  it('ngày áp dụng không được ở quá khứ', () => {
    const schema = createEffectiveFromSchema('2026-11-16')
    expect(schema.safeParse({ effectiveFrom: '2026-11-16' }).success).toBe(true)
    expect(schema.safeParse({ effectiveFrom: '2026-11-15' }).error?.issues[0].message).toBe(
      'Ngày áp dụng không được ở quá khứ',
    )
    expect(schema.safeParse({ effectiveFrom: '' }).error?.issues[0].message).toBe('Vui lòng chọn ngày áp dụng')
  })
})

describe('formatEffectiveRange', () => {
  it('hiển thị khoảng áp dụng theo trạng thái', async () => {
    const { formatEffectiveRange } = await import('@/features/department/score_management/utils/rubricHelpers')
    expect(formatEffectiveRange(null, null, 'draft')).toBe('Chưa áp dụng')
    expect(formatEffectiveRange('25/11/2026', null, 'upcoming')).toBe('Từ 25/11/2026')
    expect(formatEffectiveRange('01/01/2026', null, 'active')).toBe('01/01/2026 – nay')
    expect(formatEffectiveRange('01/01/2026', '24/11/2026', 'archived')).toBe('01/01/2026 – 24/11/2026')
  })
})
