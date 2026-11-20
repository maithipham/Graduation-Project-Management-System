import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '@/shared/api'
import { defenseCouncilApi } from '@/features/department/council_management/services/defenseCouncilApi'
import {
  generateCouncilCodes,
  formatDefenseDateRange,
  ROLE_CONFIG,
} from '@/features/department/council_management/utils/councilFormatters'

describe('Defense Council Unit Tests', () => {
  describe('councilFormatters', () => {
    it('generateCouncilCodes: tạo mã hội đồng tự động theo mã bộ môn và số lượng', () => {
      const year = new Date().getFullYear().toString()
      const codes = generateCouncilCodes('KTPM', 3, 0)
      expect(codes).toEqual([`KTPM${year}01`, `KTPM${year}02`, `KTPM${year}03`])
    })

    it('generateCouncilCodes: tạo mã nối tiếp nếu đã có sẵn hội đồng', () => {
      const year = new Date().getFullYear().toString()
      const codes = generateCouncilCodes('KTPM', 2, 3)
      expect(codes).toEqual([`KTPM${year}04`, `KTPM${year}05`])
    })

    it('formatDefenseDateRange: định dạng ngày bắt đầu và kết thúc', () => {
      const formatted = formatDefenseDateRange(
        '2026-12-20T08:00:00',
        '2026-12-22T17:00:00',
      )
      expect(formatted).toContain('20/12/2026')
      expect(formatted).toContain('22/12/2026')
    })

    it('ROLE_CONFIG: có đủ 3 vai trò quy chuẩn', () => {
      expect(ROLE_CONFIG.CHAIRPERSON.label).toBe('Chủ tịch')
      expect(ROLE_CONFIG.SECRETARY.label).toBe('Thư ký')
      expect(ROLE_CONFIG.COUNCIL_MEMBER.label).toBe('Ủy viên')
    })
  })

  describe('defenseCouncilApi (Updated REST URLs - Inter 3 Bước 11)', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('getCouncils: gọi GET /defense-council với semesterId và majorId', async () => {
      const mockResponse = {
        code: 1000,
        message: 'Success',
        data: {
          councils: [],
          incompleteCouncilCount: 0,
          waitingStudentCount: 0,
        },
      }
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: mockResponse })

      const result = await defenseCouncilApi.getCouncils({ semesterId: 1, majorId: 2 })
      expect(apiClient.get).toHaveBeenCalledWith(
        '/defense-council',
        expect.objectContaining({ params: { semesterId: 1, majorId: 2 } }),
      )
      expect(result).toEqual(mockResponse.data)
    })

    it('createBatch: gọi POST /defense-council/batch với đúng payload', async () => {
      const mockCouncil = {
        publicId: 'c-1',
        code: 'KTPM202601',
        name: 'Hội đồng KTPM 01',
        location: null,
        defenseStartTime: '2026-12-20T08:00:00',
        defenseEndTime: '2026-12-22T17:00:00',
        status: 'DRAFT',
        studentCount: 0,
        memberCount: 0,
        members: [],
      }
      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: { code: 1000, message: 'Success', data: [mockCouncil] },
      })

      const payload = {
        semesterId: 1,
        majorId: 1,
        quantity: 1,
        defenseStartTime: '2026-12-20T08:00:00',
        defenseEndTime: '2026-12-22T17:00:00',
      }
      const result = await defenseCouncilApi.createBatch(payload)
      expect(apiClient.post).toHaveBeenCalledWith(
        '/defense-council/batch',
        payload,
      )
      expect(result).toEqual([mockCouncil])
    })

    it('updateLocation: gọi PATCH /defense-council/{councilPublicId} với location', async () => {
      vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
        data: { code: 1000, message: 'Success', data: { location: 'P.301' } },
      })

      await defenseCouncilApi.updateLocation('c-uuid-1', { location: 'P.301' })
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/defense-council/c-uuid-1',
        { location: 'P.301' },
      )
    })

    it('getTeachers: gọi GET /defense-council/teacher với candidate query params', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { code: 1000, message: 'Success', data: [] },
      })

      const params = {
        semesterId: 'sem-1',
        majorId: 'maj-1',
        scope: 'IN_MAJOR' as const,
        assignedOnly: false,
        keyword: 'Nguyen',
      }
      await defenseCouncilApi.getTeachers(params)
      expect(apiClient.get).toHaveBeenCalledWith(
        '/defense-council/teacher',
        { params },
      )
    })

    it('updateMembers: gọi PUT /defense-council/{councilPublicId}/member với members payload', async () => {
      vi.spyOn(apiClient, 'put').mockResolvedValueOnce({
        data: { code: 1000, message: 'Success', data: {} },
      })

      const membersPayload = {
        members: [
          { teacherId: 101, role: 'CHAIRPERSON' as const },
          { teacherId: 102, role: 'SECRETARY' as const },
          { teacherId: 103, role: 'COUNCIL_MEMBER' as const },
          { teacherId: 104, role: 'COUNCIL_MEMBER' as const },
          { teacherId: 105, role: 'COUNCIL_MEMBER' as const },
        ],
      }
      await defenseCouncilApi.updateMembers('c-uuid-1', membersPayload)
      expect(apiClient.put).toHaveBeenCalledWith(
        '/defense-council/c-uuid-1/member',
        membersPayload,
      )
    })

    it('getStudents: gọi GET /defense-council/student với student params', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: {
          code: 1000,
          message: 'Success',
          data: {
            content: [],
            totalElements: 0,
            totalPages: 1,
            size: 20,
            number: 0,
          },
        },
      })

      const params = {
        semesterId: 'sem-1',
        majorId: 'maj-1',
        assigned: false,
        page: 0,
        size: 20,
      }
      await defenseCouncilApi.getStudents(params)
      expect(apiClient.get).toHaveBeenCalledWith(
        '/defense-council/student',
        { params },
      )
    })

    it('assignStudents: gọi POST /defense-council/{councilPublicId}/assignment', async () => {
      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: { code: 1000, message: 'Success', data: null },
      })

      await defenseCouncilApi.assignStudents('c-uuid-1', {
        thesisTopicPublicIds: ['topic-1', 'topic-2'],
      })
      expect(apiClient.post).toHaveBeenCalledWith(
        '/defense-council/c-uuid-1/assignment',
        { thesisTopicPublicIds: ['topic-1', 'topic-2'] },
      )
    })

    it('removeStudentAssignment: gọi DELETE /defense-council/{councilPublicId}/assignment/{assignmentPublicId}', async () => {
      vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
        data: { code: 1000, message: 'Success', data: null },
      })

      await defenseCouncilApi.removeStudentAssignment('c-uuid-1', 'as-uuid-1')
      expect(apiClient.delete).toHaveBeenCalledWith(
        '/defense-council/c-uuid-1/assignment/as-uuid-1',
      )
    })
  })
})
