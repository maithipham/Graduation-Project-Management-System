import { describe, expect, it } from 'vitest'
import { ApiError } from '@/shared/types'
import type {
  AdvisorGradeGroup,
  AdvisorGradeSheet,
  AdvisorGradeTopic,
} from '@/features/lecturer/guiding_evaluation/types/advisorGrade.types'
import {
  canOpenAdvisorGradeSheet,
  computeAdvisorGradePreview,
  getAdvisorGradeActionLabel,
  getAdvisorGradeReadonlyMessage,
  getInitialScoreInputs,
  getSheetLockAt,
  getSubmitBlockers,
  isAdvisorGradeAlreadySubmittedError,
  isAdvisorGradeLockingError,
  parseScoreInput,
  toAdvisorGradeSheetBody,
} from '@/features/lecturer/guiding_evaluation/utils/advisorGrade.utils'

// Rubric mẫu giống tài liệu: 4 nhóm 20 / 30 / 40 / 10, tổng trọng số tiêu chí = 100
const groups: AdvisorGradeGroup[] = [
  {
    publicId: 'g1',
    name: 'Chuyên cần',
    displayOrder: 1,
    weight: 20,
    criteria: [
      { publicId: 'c1', name: 'Tiêu chí 1', displayOrder: 1, weight: 10, maxScore: 1, score: 8.5 },
      { publicId: 'c2', name: 'Tiêu chí 2', displayOrder: 2, weight: 10, maxScore: 1, score: null },
    ],
  },
  {
    publicId: 'g2',
    name: 'Nội dung',
    displayOrder: 2,
    weight: 80,
    criteria: [
      { publicId: 'c3', name: 'Tiêu chí 3', displayOrder: 1, weight: 55, maxScore: 5.5, score: null },
      { publicId: 'c4', name: 'Tiêu chí 4', displayOrder: 2, weight: 25, maxScore: 2.5, score: null },
    ],
  },
]

const topic = (over: Partial<AdvisorGradeTopic> = {}): AdvisorGradeTopic => ({
  topicPublicId: 't1',
  topicName: 'Đề tài',
  studentCode: '2151060001',
  studentName: 'Nguyễn Văn A',
  className: '63CNTT1',
  topicStatus: 'IN_PROGRESS',
  currentStage: 'STAGE_4_REPORT_APPROVED',
  sheetPublicId: null,
  sheetStatus: 'NOT_STARTED',
  gradedCount: 0,
  totalCriteria: 4,
  advisorScore: null,
  lockAt: null,
  canGrade: true,
  readonlyReason: null,
  ...over,
})

describe('parseScoreInput', () => {
  it('ô trống là null (chưa chấm), không phải 0', () => {
    expect(parseScoreInput('')).toEqual({ ok: true, value: null })
    expect(parseScoreInput('   ')).toEqual({ ok: true, value: null })
    expect(parseScoreInput(undefined)).toEqual({ ok: true, value: null })
  })

  it('nhận số hợp lệ, kể cả 0, 10 và dấu phẩy', () => {
    expect(parseScoreInput('0')).toEqual({ ok: true, value: 0 })
    expect(parseScoreInput('10')).toEqual({ ok: true, value: 10 })
    expect(parseScoreInput('8.5')).toEqual({ ok: true, value: 8.5 })
    expect(parseScoreInput('8,5')).toEqual({ ok: true, value: 8.5 })
  })

  it('báo lỗi khi ngoài 0–10, quá 1 chữ số thập phân hoặc không phải số', () => {
    for (const bad of ['10.5', '11', '-1', '8.55', 'abc', '8.', '.5']) {
      expect(parseScoreInput(bad).ok, bad).toBe(false)
    }
  })
})

describe('computeAdvisorGradePreview', () => {
  it('bỏ qua tiêu chí chưa có điểm, đếm đúng số đã chấm', () => {
    const preview = computeAdvisorGradePreview(groups, { c1: 8.5, c2: null })
    expect(preview.gradedCount).toBe(1)
    expect(preview.totalCriteria).toBe(4)
    expect(preview.groupTotals).toEqual({ g1: 0.85, g2: 0 })
    expect(preview.totalScore).toBe(0.85)
    expect(preview.advisorScore).toBe(0.9)
  })

  it('chưa chấm tiêu chí nào thì advisorScore là null', () => {
    expect(computeAdvisorGradePreview(groups, {}).advisorScore).toBeNull()
  })

  it('làm tròn HALF_UP chính xác (7.25 → 7.3, 7.24999 → 7.2)', () => {
    // 10*10% + 10*10% + 7.5*55% + 6.5*25% = 1 + 1 + 4.125 + 1.625 = 7.75
    expect(computeAdvisorGradePreview(groups, { c1: 10, c2: 10, c3: 7.5, c4: 6.5 })).toMatchObject({
      totalScore: 7.75,
      advisorScore: 7.8,
    })
    // 7.25: 1 + 1 + 5*55% (2.75) + 10*25% (2.5)
    expect(computeAdvisorGradePreview(groups, { c1: 10, c2: 10, c3: 5, c4: 10 })).toMatchObject({
      totalScore: 7.25,
      advisorScore: 7.3,
    })
    // Trọng số lẻ: 9.9 * 33.33% = 3.29967 → 3.3
    const odd: AdvisorGradeGroup[] = [
      {
        publicId: 'g',
        name: 'g',
        displayOrder: 1,
        weight: 33.33,
        criteria: [{ publicId: 'x', name: 'x', displayOrder: 1, weight: 33.33, maxScore: 3.333, score: null }],
      },
    ]
    expect(computeAdvisorGradePreview(odd, { x: 9.9 })).toMatchObject({ totalScore: 3.29967, advisorScore: 3.3 })
  })

  it('đủ 10 điểm mọi tiêu chí = 10', () => {
    expect(computeAdvisorGradePreview(groups, { c1: 10, c2: 10, c3: 10, c4: 10 }).advisorScore).toBe(10)
  })
})

describe('toAdvisorGradeSheetBody', () => {
  it('luôn gửi đủ mọi tiêu chí theo thứ tự, thiếu thì score null', () => {
    const body = toAdvisorGradeSheetBody(groups, { c1: 8.5, c4: 0 }, '  Tốt  ')
    expect(body).toEqual({
      generalComment: 'Tốt',
      details: [
        { criteriaId: 'c1', score: 8.5 },
        { criteriaId: 'c2', score: null },
        { criteriaId: 'c3', score: null },
        { criteriaId: 'c4', score: 0 },
      ],
    })
  })

  it('nhận xét trống gửi null', () => {
    expect(toAdvisorGradeSheetBody(groups, {}, '   ').generalComment).toBeNull()
    expect(toAdvisorGradeSheetBody(groups, {}, null).generalComment).toBeNull()
  })
})

describe('getSubmitBlockers', () => {
  it('liệt kê tiêu chí thiếu điểm và thiếu nhận xét; điểm 0 không tính là thiếu', () => {
    expect(getSubmitBlockers(groups, { c1: 0, c2: 5 }, '')).toEqual({
      missingCriteriaIds: ['c3', 'c4'],
      missingComment: true,
    })
    expect(getSubmitBlockers(groups, { c1: 1, c2: 2, c3: 3, c4: 4 }, 'Ok')).toEqual({
      missingCriteriaIds: [],
      missingComment: false,
    })
  })
})

describe('getInitialScoreInputs', () => {
  it('đổi điểm của phiếu thành chuỗi cho ô nhập, null → ""', () => {
    const sheet = { groups } as AdvisorGradeSheet
    expect(getInitialScoreInputs(sheet)).toEqual({ c1: '8.5', c2: '', c3: '', c4: '' })
  })
})

describe('điều kiện trên bảng', () => {
  it('không mở phiếu khi chưa có phiếu và không chấm được', () => {
    expect(canOpenAdvisorGradeSheet(topic())).toBe(true)
    expect(canOpenAdvisorGradeSheet(topic({ canGrade: false, readonlyReason: 'GRADING_LOCKED' }))).toBe(false)
    // Đã có phiếu thì vẫn mở để xem dù không sửa được
    expect(
      canOpenAdvisorGradeSheet(topic({ sheetStatus: 'SUBMITTED', sheetPublicId: 's1', canGrade: false })),
    ).toBe(true)
  })

  it('nhãn nút Chấm / Sửa điểm / Xem', () => {
    expect(getAdvisorGradeActionLabel(topic())).toBe('Chấm')
    expect(getAdvisorGradeActionLabel(topic({ sheetStatus: 'DRAFT' }))).toBe('Chấm')
    // Đã nộp nhưng chưa khóa chấm → nộp lại được
    expect(getAdvisorGradeActionLabel(topic({ sheetStatus: 'SUBMITTED' }))).toBe('Sửa điểm')
    expect(getAdvisorGradeActionLabel(topic({ sheetStatus: 'SUBMITTED', canGrade: false }))).toBe('Xem')
    expect(getAdvisorGradeActionLabel(topic({ sheetStatus: 'DRAFT', canGrade: false }))).toBe('Xem')
  })
})

describe('thời điểm khóa chấm và lý do chỉ xem', () => {
  it('lockAt của phiếu = endDate mốc hội đồng, null khi chưa có mốc', () => {
    expect(getSheetLockAt({ startDate: null, endDate: '2026-11-30T23:59:59', locked: false })).toBe(
      '2026-11-30T23:59:59',
    )
    expect(getSheetLockAt(null)).toBeNull()
    expect(getSheetLockAt(undefined)).toBeNull()
  })

  it('lý do kèm thời điểm khóa khi GRADING_LOCKED', () => {
    expect(getAdvisorGradeReadonlyMessage(null, '2026-11-30T23:59:59')).toBeNull()
    expect(getAdvisorGradeReadonlyMessage('GRADING_LOCKED', '2026-11-30T23:59:59')).toMatch(
      /^Đã qua thời gian tổ chức hội đồng bảo vệ, không thể chấm hoặc sửa điểm \(khóa lúc .*30\/11\/2026.*\)\.$/,
    )
    expect(getAdvisorGradeReadonlyMessage('GRADING_LOCKED', null)).toBe(
      'Đã qua thời gian tổ chức hội đồng bảo vệ, không thể chấm hoặc sửa điểm.',
    )
    expect(getAdvisorGradeReadonlyMessage('TOPIC_CANCELLED', '2026-11-30T23:59:59')).toBe('Đề tài đã hủy.')
  })
})

describe('phân loại lỗi', () => {
  it('isAdvisorGradeLockingError chỉ nhận 3117 / 3168', () => {
    for (const code of [3117, 3168]) {
      expect(isAdvisorGradeLockingError(new ApiError('x', code)), String(code)).toBe(true)
    }
    for (const code of [3118, 3119, 3120, 4000, 2001]) {
      expect(isAdvisorGradeLockingError(new ApiError('x', code)), String(code)).toBe(false)
    }
    expect(isAdvisorGradeLockingError(new Error('x'))).toBe(false)
  })

  it('isAdvisorGradeAlreadySubmittedError chỉ nhận 3118', () => {
    expect(isAdvisorGradeAlreadySubmittedError(new ApiError('x', 3118))).toBe(true)
    expect(isAdvisorGradeAlreadySubmittedError(new ApiError('x', 3168))).toBe(false)
    expect(isAdvisorGradeAlreadySubmittedError(new Error('x'))).toBe(false)
  })
})
