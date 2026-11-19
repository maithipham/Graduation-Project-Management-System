import { describe, expect, it } from 'vitest'
import type {
  EvaluationTemplateDetail,
  RubricSemesterOption,
  RubricTreeGroup,
} from '@/features/department/score_management/types'
import {
  beDateSortKey,
  formatBeDate,
  formatBeDateTime,
  renumberTree,
  sumTreeWeight,
  toEvaluationType,
  toRubricDetail,
  toRubricRole,
  toRubricStatus,
  toSaveRubricBody,
  toSemesterRubricAssignment,
} from '@/features/department/score_management/utils/rubricMapper'
import {
  formatSemesterRange,
  formatSemesterShort,
  getFromSemesterOptions,
  getToSemesterOptions,
  keepValidToSemester,
} from '@/features/department/score_management/utils/rubricHelpers'
import {
  getScheduledSaveBlockReason,
  saveRubricSchema,
  semesterRangeSchema,
  sumWeight,
} from '@/features/department/score_management/utils/rubricSchema'

const detailDto: EvaluationTemplateDetail = {
  publicId: 't-1',
  name: 'Rubric CNTT 2026',
  type: 'EXAMINER',
  fromSemester: { publicId: 's-1', name: 'HK1 2025-2026' },
  toSemester: null,
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
  canChangeFromSemester: false,
  canChangeToSemester: true,
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
    expect(beDateSortKey('01-12-2026')).toBe('20261201')
    expect(beDateSortKey('31-01-2026') < beDateSortKey('01-02-2026')).toBe(true)
    expect(beDateSortKey(null)).toBe('')
  })

  it('học kỳ chưa có rubric: BE bỏ field → model đưa về null', () => {
    expect(toSemesterRubricAssignment({ evaluationType: 'ADVISOR', evaluationTypeName: 'Hướng dẫn' })).toEqual({
      role: 'supervisor',
      roleLabel: 'Hướng dẫn',
      templatePublicId: null,
      templateName: null,
      status: null,
      statusLabel: null,
      fromSemester: null,
      toSemester: null,
    })
  })

  it('dựng cây theo displayOrder và đánh mã 1, 1.1', () => {
    const detail = toRubricDetail(detailDto)
    expect(detail.role).toBe('reviewer')
    expect(detail.status).toBe('active')
    expect(detail.fromSemester).toEqual({ publicId: 's-1', name: 'HK1 2025-2026' })
    expect(detail.toSemester).toBeNull()
    expect(detail.canChangeFromSemester).toBe(false)
    expect(detail.canChangeToSemester).toBe(true)
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

  it('tính tổng và chặn lưu rubric đã áp dụng chưa hợp lệ', () => {
    expect(sumWeight([{ criteria: [{ weight: 0.1 }, { weight: 0.2 }] }])).toBe(0.3)
    expect(getScheduledSaveBlockReason([])).toBe('Rubric đã áp dụng phải có ít nhất một nhóm tiêu chí')
    expect(getScheduledSaveBlockReason([{ criteria: [{ weight: 90 }] }])).toBe('Tổng trọng số (90%) phải bằng 100%')
    expect(getScheduledSaveBlockReason([{ criteria: [{ weight: 100 }] }, { criteria: [] }])).toBe(
      'Mỗi nhóm tiêu chí phải có ít nhất một tiêu chí',
    )
    expect(getScheduledSaveBlockReason([{ criteria: [{ weight: 60 }, { weight: 40 }] }])).toBeNull()
  })

  it('khoảng kỳ: "Từ kỳ" bắt buộc, "Đến kỳ" null = chưa xác định', () => {
    expect(semesterRangeSchema.safeParse({ fromSemesterId: 's-1', toSemesterId: null }).success).toBe(true)
    expect(semesterRangeSchema.safeParse({ fromSemesterId: 's-1', toSemesterId: 's-2' }).success).toBe(true)
    expect(semesterRangeSchema.safeParse({ fromSemesterId: '', toSemesterId: null }).error?.issues[0].message).toBe(
      'Vui lòng chọn Từ kỳ',
    )
  })
})

describe('rubricHelpers – khoảng học kỳ', () => {
  function semester(
    publicId: string,
    startDate: string,
    statusCode: RubricSemesterOption['statusCode'],
  ): RubricSemesterOption {
    return { publicId, name: publicId.toUpperCase(), startDate, endDate: '', status: '', statusCode }
  }
  // Cố ý xếp lộn xộn để kiểm tra so sánh theo ngày (dd-MM-yyyy), không theo thứ tự mảng
  const semesters = [
    semester('hk2', '01-02-2026', 'ONGOING'),
    semester('hk1', '01-09-2025', 'COMPLETED'),
    semester('hk3', '01-09-2026', 'UPCOMING'),
  ]

  it('hiển thị khoảng kỳ', () => {
    expect(formatSemesterRange(null, null)).toBe('Chưa áp dụng')
    expect(formatSemesterRange({ publicId: 'a', name: 'HK1' }, null)).toBe('HK1 → Chưa xác định')
    expect(formatSemesterRange({ publicId: 'a', name: 'HK1' }, { publicId: 'b', name: 'HK2' })).toBe('HK1 → HK2')
    expect(formatSemesterShort({ publicId: 'a', name: 'Học kỳ 1 năm học 2026-2027' })).toBe('2026-2027 - Học kỳ 1')
    expect(formatSemesterShort({ publicId: 'a', name: 'HK hè' })).toBe('HK hè')
    expect(formatSemesterShort(null)).toBe('')
  })

  it('"Từ kỳ" bỏ kỳ đã kết thúc, trừ kỳ đang lưu', () => {
    expect(getFromSemesterOptions(semesters).map((s) => s.publicId)).toEqual(['hk2', 'hk3'])
    expect(getFromSemesterOptions(semesters, 'hk1').map((s) => s.publicId)).toEqual(['hk2', 'hk1', 'hk3'])
  })

  it('"Đến kỳ" chỉ gồm kỳ bắt đầu từ "Từ kỳ" trở đi', () => {
    expect(getToSemesterOptions(semesters, null)).toEqual([])
    expect(getToSemesterOptions(semesters, 'hk2').map((s) => s.publicId)).toEqual(['hk2', 'hk3'])
    expect(keepValidToSemester(semesters, 'hk3', 'hk2')).toBeNull()
    expect(keepValidToSemester(semesters, 'hk2', 'hk3')).toBe('hk3')
    expect(keepValidToSemester(semesters, 'hk2', null)).toBeNull()
  })
})
