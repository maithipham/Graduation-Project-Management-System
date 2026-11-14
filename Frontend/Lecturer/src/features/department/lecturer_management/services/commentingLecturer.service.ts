import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type {
  CommentingLecturerApi,
  StudentAssignmentApi,
  CommentingLecturer,
  StudentAssignment,
  ManualAssignRequest,
  AutoDistributeRequest,
} from '../types/commenting.types'
import {
  transformCommentingLecturer,
  transformStudentAssignment,
} from '../utils/commenting.mapper'

/**
 * Service tích hợp REST API cho chức năng Phân công Giảng viên Nhận xét (commenting_lecturer).
 */
export const commentingLecturerService = {
  /**
   * GET /api/v1/assignments/commenting-lecturers?semesterId=...
   * Lấy danh sách giảng viên nhận xét kèm số lượng sinh viên đang được phân công nhận xét.
   */
  async getCommentingLecturers(
    semesterId: string,
    managedMajorName?: string,
  ): Promise<CommentingLecturer[]> {
    if (!semesterId || semesterId === 'all') return []
    const res = await apiClient.get<ApiResponse<CommentingLecturerApi[]>>(
      '/api/v1/assignments/commenting-lecturers',
      {
        params: { semesterId },
      },
    )
    const rawList = res.data?.data || []
    return rawList.map((item) => transformCommentingLecturer(item, managedMajorName))
  },

  /**
   * GET /api/v1/assignments/commenting-lecturers/unassigned-students?semesterId=...
   * Lấy danh sách các sinh viên / đề tài chưa được phân công giảng viên nhận xét.
   */
  async getUnassignedStudents(semesterId: string): Promise<StudentAssignment[]> {
    if (!semesterId || semesterId === 'all') return []
    const res = await apiClient.get<ApiResponse<StudentAssignmentApi[]>>(
      '/api/v1/assignments/commenting-lecturers/unassigned-students',
      {
        params: { semesterId },
      },
    )
    const rawList = res.data?.data || []
    return rawList.map(transformStudentAssignment)
  },

  /**
   * GET /api/v1/assignments/commenting-lecturers/students?semesterId=...&status=...
   * Lấy danh sách toàn bộ sinh viên trong kỳ (có thể lọc ALL, UNASSIGNED, ASSIGNED).
   */
  async getStudents(semesterId: string, status = 'ALL'): Promise<StudentAssignment[]> {
    if (!semesterId || semesterId === 'all') return []
    const res = await apiClient.get<ApiResponse<StudentAssignmentApi[]>>(
      '/api/v1/assignments/commenting-lecturers/students',
      {
        params: { semesterId, status },
      },
    )
    const rawList = res.data?.data || []
    return rawList.map(transformStudentAssignment)
  },

  /**
   * POST /api/v1/assignments/commenting-lecturers/manual
   * Phân công thủ công một giảng viên nhận xét cho danh sách sinh viên / đề tài được tích chọn.
   */
  async assignManual(request: ManualAssignRequest): Promise<void> {
    const isUuid =
      typeof request.commentingLecturerPublicId === 'string' &&
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        request.commentingLecturerPublicId,
      )

    await apiClient.post<ApiResponse<void>>('/api/v1/assignments/commenting-lecturers/manual', {
      commentingLecturerId: request.commentingLecturerId,
      commentingLecturerPublicId: isUuid ? request.commentingLecturerPublicId : undefined,
      studentOrTopicIds: request.studentOrTopicIds,
      publicIds: request.publicIds,
    })
  },

  /**
   * POST /api/v1/assignments/commenting-lecturers/auto-distribute
   * Phân công nhanh (chia đều) hoặc xem trước (preview = true) kết quả chia đều tự động.
   */
  async autoDistribute(request: AutoDistributeRequest): Promise<StudentAssignment[]> {
    const res = await apiClient.post<ApiResponse<StudentAssignmentApi[]>>(
      '/api/v1/assignments/commenting-lecturers/auto-distribute',
      {
        semesterId: request.semesterId,
        departmentId: request.departmentId,
        preview: Boolean(request.preview),
      },
    )
    const rawList = res.data?.data || []
    return rawList.map(transformStudentAssignment)
  },
}

