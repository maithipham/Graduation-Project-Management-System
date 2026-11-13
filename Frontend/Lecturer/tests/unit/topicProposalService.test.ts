import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api'
import {
  computeTopicDeadlineStatus,
  topicProposalService,
} from '@/features/lecturer/topic_proposal'
import type {
  DeadlineMilestone,
  TopicTitleHistoryResponse,
} from '@/features/lecturer/topic_proposal'

vi.mock('@/shared/api', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
  },
  API_ENDPOINTS: {
    topicTitle: {
      supervisorRequests: '/topic/title-request',
      review: (publicId: string) => `/topic/title-request/${publicId}/review`,
      historyByTopic: (topicPublicId: string) => `/topic/${topicPublicId}/title-history`,
      deadlines: '/api/v1/deadlines',
    },
  },
}))

describe('topicProposalService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('computeTopicDeadlineStatus', () => {
    it('trả về NOT_CONFIGURED khi không có dữ liệu deadline hoặc thiếu ngày', () => {
      expect(computeTopicDeadlineStatus(null)).toEqual({
        status: 'NOT_CONFIGURED',
        label: 'Chưa có',
        canTeacherReview: false,
        startDate: null,
        endDate: null,
      })

      expect(
        computeTopicDeadlineStatus({
          code: 'SV_CHINH_SUA_NOP_LAI_DE_CUONG',
          name: 'Hạn đề cương',
          startDate: null,
          endDate: null,
          status: 'NOT_STARTED',
        }),
      ).toEqual({
        status: 'NOT_CONFIGURED',
        label: 'Chưa có',
        canTeacherReview: false,
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
      const res = computeTopicDeadlineStatus(pastDeadline)
      expect(res.status).toBe('CLOSED')
      expect(res.canTeacherReview).toBe(false)
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
      const res = computeTopicDeadlineStatus(futureDeadline)
      expect(res.status).toBe('NOT_STARTED')
      expect(res.canTeacherReview).toBe(false)
      expect(res.label).toContain('Chưa mở')
    })

    it('trả về EXTENDED khi status là EXTENDED và cho phép GVHD duyệt tiếp', () => {
      const extendedDeadline: DeadlineMilestone = {
        code: 'SV_CHINH_SUA_NOP_LAI_DE_CUONG',
        name: 'Hạn đề cương',
        startDate: '2026-01-01T00:00:00',
        endDate: '2099-12-31T23:59:59',
        status: 'EXTENDED',
      }
      const res = computeTopicDeadlineStatus(extendedDeadline)
      expect(res.status).toBe('EXTENDED')
      expect(res.canTeacherReview).toBe(true)
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
      const res = computeTopicDeadlineStatus(openDeadline)
      expect(res.status).toBe('OPEN')
      expect(res.canTeacherReview).toBe(true)
    })
  })

  describe('getRequestsForSupervisor', () => {
    it('gọi đúng endpoint với params và trả về mảng dữ liệu', async () => {
      const mockList: TopicTitleHistoryResponse[] = [
        {
          publicId: 'req-1',
          topicPublicId: 'top-1',
          studentPublicId: 'stu-1',
          studentCode: '2051060001',
          studentName: 'Nguyễn Văn An',
          oldName: null,
          newName: 'Đề tài mới',
          status: 'PENDING',
          statusDescription: 'Chờ GVHD xác nhận',
          requestedAt: '2026-11-12T14:30:00',
          reviewedAt: null,
          reviewerPublicId: null,
          reviewerName: null,
          canReview: true,
        },
      ]

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { code: 1000, message: null, data: mockList },
      } as any)

      const result = await topicProposalService.getRequestsForSupervisor({
        semesterId: 'sem-1',
        status: 'PENDING',
      })

      expect(apiClient.get).toHaveBeenCalledWith('/topic/title-request', {
        params: { semesterId: 'sem-1', status: 'PENDING' },
      })
      expect(result).toEqual(mockList)
    })
  })

  describe('reviewTopicTitle', () => {
    it('gửi PUT tới đúng endpoint với payload APPROVED', async () => {
      vi.mocked(apiClient.put).mockResolvedValueOnce({
        data: { code: 1000, message: 'Thành công', data: null },
      } as any)

      await topicProposalService.reviewTopicTitle('req-1', {
        decision: 'APPROVED',
      })

      expect(apiClient.put).toHaveBeenCalledWith(
        '/topic/title-request/req-1/review',
        { decision: 'APPROVED' },
      )
    })
  })

  describe('getTopicHistory', () => {
    it('gửi GET tới đúng endpoint lịch sử đề tài', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { code: 1000, message: null, data: [] },
      } as any)

      const res = await topicProposalService.getTopicHistory('top-1')
      expect(apiClient.get).toHaveBeenCalledWith('/topic/top-1/title-history')
      expect(res).toEqual([])
    })
  })

  describe('getOutlineDeadline', () => {
    it('tìm thấy mốc SV_CHINH_SUA_NOP_LAI_DE_CUONG trong giaoNhanDeadlines từ Backend thật', async () => {
      const mockMilestone: DeadlineMilestone = {
        code: 'SV_CHINH_SUA_NOP_LAI_DE_CUONG',
        name: 'Hạn sinh viên chỉnh sửa & nộp lại đề cương',
        startDate: '2026-11-01T00:00:00',
        endDate: '2026-11-20T23:59:59',
        status: 'IN_PROGRESS',
      }

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          code: 1000,
          message: null,
          data: {
            giaoNhanDeadlines: [mockMilestone],
          },
        },
      } as any)

      const res = await topicProposalService.getOutlineDeadline('sem-1')
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/deadlines', {
        params: { semesterId: 'sem-1' },
        skipErrorToast: true,
      })
      expect(res).toEqual(mockMilestone)
    })

    it('tìm thấy mốc SV_CHINH_SUA_NOP_LAI_DE_CUONG trong thucHienDeadlines', async () => {
      const mockMilestone: DeadlineMilestone = {
        code: 'SV_CHINH_SUA_NOP_LAI_DE_CUONG',
        name: 'Hạn nộp & chỉnh sửa đề cương',
        startDate: '2026-11-01T00:00:00',
        endDate: '2026-11-20T23:59:59',
        status: 'IN_PROGRESS',
      }

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          code: 1000,
          message: null,
          data: {
            thucHienDeadlines: [mockMilestone],
          },
        },
      } as any)

      const res = await topicProposalService.getOutlineDeadline('sem-1')
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/deadlines', {
        params: { semesterId: 'sem-1' },
        skipErrorToast: true,
      })
      expect(res).toEqual(mockMilestone)
    })
  })

  describe('getCounts', () => {
    it('tính chính xác số lượng đơn theo trạng thái', () => {
      const items: TopicTitleHistoryResponse[] = [
        { status: 'PENDING' } as any,
        { status: 'PENDING' } as any,
        { status: 'APPROVED' } as any,
        { status: 'REJECTED' } as any,
      ]

      const counts = topicProposalService.getCounts(items)
      expect(counts).toEqual({
        pending: 2,
        approved: 1,
        rejected: 1,
        all: 4,
      })
    })
  })
})

