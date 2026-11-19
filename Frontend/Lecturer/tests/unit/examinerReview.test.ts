import { describe, expect, it } from 'vitest'
import { API_ENDPOINTS } from '@/shared/api'
import { examinerReviewKeys } from '@/features/lecturer/defense_management/hooks/useExaminerReview'
import { examinerReviewService } from '@/features/lecturer/defense_management/services/examinerReview.service'

describe('examinerReview API endpoints & keys', () => {
  it('đúng cấu trúc API_ENDPOINTS.examinerReview cho 9 API', () => {
    expect(API_ENDPOINTS.examinerReview.myCouncils).toBe('/defense-council/my')
    expect(API_ENDPOINTS.examinerReview.councilBoard('c-123')).toBe(
      '/defense-council/c-123/examiner',
    )
    expect(API_ENDPOINTS.examinerReview.assignExaminers('da-456')).toBe(
      '/defense-assignment/da-456/examiner',
    )
    expect(API_ENDPOINTS.examinerReview.myAssignments).toBe(
      '/examiner-assignment/my',
    )
    expect(API_ENDPOINTS.examinerReview.schedule('ea-789')).toBe(
      '/examiner-assignment/ea-789/schedule',
    )
    expect(API_ENDPOINTS.examinerReview.evaluation('ea-789')).toBe(
      '/examiner-assignment/ea-789/evaluation',
    )
    expect(API_ENDPOINTS.examinerReview.decision('ea-789')).toBe(
      '/examiner-assignment/ea-789/decision',
    )
    expect(API_ENDPOINTS.examinerReview.reviewFile('ea-789')).toBe(
      '/examiner-assignment/ea-789/review-file',
    )
  })

  it('đúng cấu trúc query keys examinerReviewKeys', () => {
    expect(examinerReviewKeys.all).toEqual(['lecturer', 'examiner-review'])
    expect(examinerReviewKeys.myCouncils('sem-1')).toEqual([
      'lecturer',
      'examiner-review',
      'councils',
      'sem-1',
    ])
    expect(examinerReviewKeys.myCouncils()).toEqual([
      'lecturer',
      'examiner-review',
      'councils',
      'all',
    ])
    expect(examinerReviewKeys.board('c-1')).toEqual([
      'lecturer',
      'examiner-review',
      'board',
      'c-1',
    ])
    expect(examinerReviewKeys.myAssignments('sem-2')).toEqual([
      'lecturer',
      'examiner-review',
      'assignments',
      'sem-2',
    ])
    expect(examinerReviewKeys.evaluation('ea-1')).toEqual([
      'lecturer',
      'examiner-review',
      'evaluation',
      'ea-1',
    ])
  })

  it('examinerReviewService có đủ 9 hàm API', () => {
    expect(typeof examinerReviewService.getMyCouncils).toBe('function')
    expect(typeof examinerReviewService.getCouncilBoard).toBe('function')
    expect(typeof examinerReviewService.assignExaminers).toBe('function')
    expect(typeof examinerReviewService.getMyAssignments).toBe('function')
    expect(typeof examinerReviewService.scheduleReview).toBe('function')
    expect(typeof examinerReviewService.getEvaluation).toBe('function')
    expect(typeof examinerReviewService.saveEvaluation).toBe('function')
    expect(typeof examinerReviewService.updateDecision).toBe('function')
    expect(typeof examinerReviewService.uploadReviewFile).toBe('function')
  })
})
