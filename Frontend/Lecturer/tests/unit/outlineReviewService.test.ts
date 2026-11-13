import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api'
import {
  computeOutlineDeadlineStatus,
  outlineReviewService,
} from '@/features/lecturer/outline_review/services/outlineReview.service'
import type {
  DeadlineMilestone,
  ThesisOutlineResponse,
} from '@/features/lecturer/outline_review/types/outlineReview.types'

vi.mock('@/shared/api', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
  },
  API_ENDPOINTS: {
    outline: {
      supervisorList: '/outline/supervisor-list',
      reviewList: '/outline/review-list',
      detail: (publicId: string) => `/outline/${publicId}`,
      review: (publicId: string) => `/outline/${publicId}/review`,
      advisorFeedback: (publicId: string) => `/outline/${publicId}/advisor-feedback`,
      deadlines: '/api/v1/deadlines',
    },
  },
}))

describe('outlineReviewService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('computeOutlineDeadlineStatus', () => {
    it('trả về NOT_CONFIGURED khi không có dữ liệu deadline hoặc thiếu ngày', () => {
      expect(computeOutlineDeadlineStatus(null)).toEqual({
        status: 'NOT_CONFIGURED',
        label: 'Chưa có',
        canReview: false,
        canWriteFeedback: false,
        startDate: null,
        endDate: null,
      })

      expect(
        computeOutlineDeadlineStatus({
          code: 'SV_CHINH_SUA_NOP_LAI_DE_CUONG',
          name: 'Hạn đề cương',
          startDate: null,
          endDate: null,
        }),
      ).toEqual({
        status: 'NOT_CONFIGURED',
        label: 'Chưa có',
        canReview: false,
        canWriteFeedback: false,
        startDate: null,
        endDate: null,
      })
    })

    it('trả về CLOSED khi status là COMPLETED hoặc đã quá endDate', () => {
      const pastDeadline: DeadlineMilestone = {
        code: 'SV_CHINH_SUA_NOP_LAI_DE_CUONG',
        name: 'Hạn đề cương',
        startDate: '2026-01-01T00:00:00',
        endDate: '2026-01-10T23:59:59',
        status: 'IN_PROGRESS',
      }
      const res = computeOutlineDeadlineStatus(pastDeadline)
      expect(res.status).toBe('CLOSED')
      expect(res.canReview).toBe(false)
      expect(res.canWriteFeedback).toBe(false)
      expect(res.label).toContain('Đã hết hạn')
    })

    it('trả về NOT_STARTED khi thời gian hiện tại trước startDate', () => {
      const futureDeadline: DeadlineMilestone = {
        code: 'SV_CHINH_SUA_NOP_LAI_DE_CUONG',
        name: 'Hạn đề cương',
        startDate: '2099-01-01T00:00:00',
        endDate: '2099-01-10T23:59:59',
        status: 'NOT_STARTED',
      }
      const res = computeOutlineDeadlineStatus(futureDeadline)
      expect(res.status).toBe('NOT_STARTED')
      expect(res.canReview).toBe(false)
      expect(res.canWriteFeedback).toBe(false)
      expect(res.label).toContain('Chưa mở')
    })

    it('trả về EXTENDED khi status là EXTENDED và cho phép chấm tiếp', () => {
      const extendedDeadline: DeadlineMilestone = {
        code: 'SV_CHINH_SUA_NOP_LAI_DE_CUONG',
        name: 'Hạn đề cương',
        startDate: '2026-01-01T00:00:00',
        endDate: '2099-12-31T23:59:59',
        status: 'EXTENDED',
      }
      const res = computeOutlineDeadlineStatus(extendedDeadline)
      expect(res.status).toBe('EXTENDED')
      expect(res.canReview).toBe(true)
      expect(res.canWriteFeedback).toBe(true)
      expect(res.label).toContain('Đang gia hạn chấm')
    })

    it('trả về OPEN khi đang trong hạn mở', () => {
      const openDeadline: DeadlineMilestone = {
        code: 'SV_CHINH_SUA_NOP_LAI_DE_CUONG',
        name: 'Hạn đề cương',
        startDate: '2026-01-01T00:00:00',
        endDate: '2099-12-31T23:59:59',
        status: 'IN_PROGRESS',
      }
      const res = computeOutlineDeadlineStatus(openDeadline)
      expect(res.status).toBe('OPEN')
      expect(res.canReview).toBe(true)
      expect(res.canWriteFeedback).toBe(true)
    })
  })

  describe('getSupervisorList', () => {
    it('gọi GET /outline/supervisor-list với params và trả về mảng dữ liệu', async () => {
      const mockList: ThesisOutlineResponse[] = [
        {
          publicId: 'out-1',
          topicPublicId: 'top-1',
          studentPublicId: 'stu-1',
          studentCode: '2051060001',
          studentName: 'Nguyễn Văn An',
          currentStage: 'STAGE_2_TOPIC_CONFIRMED',
          topicStatus: 'IN_PROGRESS',
          canReview: false,
          canWriteAdvisorFeedback: true,
          status: 'PENDING',
        } as ThesisOutlineResponse,
      ]

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { code: 1000, message: null, data: mockList },
      } as any)

      const result = await outlineReviewService.getSupervisorList({
        semesterId: 'sem-1',
        status: 'PENDING',
      })

      expect(apiClient.get).toHaveBeenCalledWith('/outline/supervisor-list', {
        params: { semesterId: 'sem-1', status: 'PENDING' },
      })
      expect(result).toEqual(mockList)
    })
  })

  describe('getReviewerList', () => {
    it('gọi GET /outline/review-list với params và trả về mảng dữ liệu', async () => {
      const mockList: ThesisOutlineResponse[] = [
        {
          publicId: 'out-2',
          topicPublicId: 'top-2',
          studentPublicId: 'stu-2',
          studentCode: '2051060002',
          studentName: 'Trần Thị Bình',
          currentStage: 'STAGE_2_TOPIC_CONFIRMED',
          topicStatus: 'IN_PROGRESS',
          canReview: true,
          canWriteAdvisorFeedback: false,
          status: 'PENDING',
        } as ThesisOutlineResponse,
      ]

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { code: 1000, message: null, data: mockList },
      } as any)

      const result = await outlineReviewService.getReviewerList({
        semesterId: 'sem-1',
      })

      expect(apiClient.get).toHaveBeenCalledWith('/outline/review-list', {
        params: { semesterId: 'sem-1' },
      })
      expect(result).toEqual(mockList)
    })
  })

  describe('reviewOutline', () => {
    it('gửi PUT tới đúng endpoint với payload APPROVED và feedback', async () => {
      vi.mocked(apiClient.put).mockResolvedValueOnce({
        data: { code: 1000, message: 'Thành công', data: null },
      } as any)

      await outlineReviewService.reviewOutline('out-1', {
        decision: 'APPROVED',
        feedback: 'Đề cương tốt.',
      })

      expect(apiClient.put).toHaveBeenCalledWith(
        '/outline/out-1/review',
        { decision: 'APPROVED', feedback: 'Đề cương tốt.' },
        { skipErrorToast: true },
      )
    })
  })

  describe('writeAdvisorFeedback', () => {
    it('gửi PUT tới đúng endpoint với feedback', async () => {
      vi.mocked(apiClient.put).mockResolvedValueOnce({
        data: { code: 1000, message: 'Thành công', data: null },
      } as any)

      await outlineReviewService.writeAdvisorFeedback('out-1', {
        feedback: 'Góp ý GVHD.',
      })

      expect(apiClient.put).toHaveBeenCalledWith(
        '/outline/out-1/advisor-feedback',
        { feedback: 'Góp ý GVHD.' },
        { skipErrorToast: true },
      )
    })
  })

  describe('getCounts', () => {
    it('tính chính xác số lượng đề cương theo từng trạng thái', () => {
      const items: ThesisOutlineResponse[] = [
        { status: 'PENDING' } as any,
        { status: 'APPROVED' } as any,
        { status: 'REQUEST_CHANGES' } as any,
        { status: 'REJECTED' } as any,
        { status: 'PENDING' } as any,
      ]

      const counts = outlineReviewService.getCounts(items)
      expect(counts).toEqual({
        pending: 2,
        approved: 1,
        requestChanges: 1,
        rejected: 1,
        all: 5,
      })
    })
  })
})

