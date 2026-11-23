import { apiClient } from '@/shared/api'
import type { ApiResponse, SpringPage } from '@/shared/types'
import { toSpringPage, type RawSpringPage } from '@/shared/utils'
import { DEFENSE_COUNCIL_ENDPOINTS } from '../constants/endpoints'
import type {
  DefenseCouncil,
  CouncilListResponse,
  CreateCouncilBatchRequest,
  UpdateCouncilLocationRequest,
  UpdateCommonDefenseDateRequest,
  CandidateTeacher,
  CandidateTeacherParams,
  UpdateCouncilMembersRequest,
  EligibleStudent,
  EligibleStudentParams,
  AssignStudentsToCouncilRequest,
} from '../types'

/** Phần cần dùng của response GET /api/v1/deadlines (3 nhóm mốc) */
interface RawDeadlineItem {
  code: string
  startDate?: string | null
  endDate?: string | null
}
interface RawDeadlineGroups {
  giaoNhanDeadlines?: RawDeadlineItem[]
  thucHienDeadlines?: RawDeadlineItem[]
  danhGiaDeadlines?: RawDeadlineItem[]
}

export const defenseCouncilApi = {
  /**
   * 1. GET /defense-council?semesterId={id}&majorId={id}
   */
  async getCouncils(params: {
    semesterId: number | string
    majorId: number | string
  }): Promise<CouncilListResponse> {
    const res = await apiClient.get<ApiResponse<CouncilListResponse>>(
      DEFENSE_COUNCIL_ENDPOINTS.OVERVIEW,
      { params },
    )
    return res.data.data
  },

  /**
   * 2. POST /defense-council/batch
   */
  async createBatch(data: CreateCouncilBatchRequest): Promise<DefenseCouncil[]> {
    const res = await apiClient.post<ApiResponse<DefenseCouncil[]>>(
      DEFENSE_COUNCIL_ENDPOINTS.BATCH_CREATE,
      data,
    )
    return res.data.data
  },

  /**
   * 3. PATCH /defense-council/{councilPublicId}
   */
  async updateLocation(
    councilPublicId: string,
    data: UpdateCouncilLocationRequest,
  ): Promise<DefenseCouncil> {
    const res = await apiClient.patch<ApiResponse<DefenseCouncil>>(
      DEFENSE_COUNCIL_ENDPOINTS.DETAIL(councilPublicId),
      data,
    )
    return res.data.data
  },

  /**
   * 3b. PATCH /defense-council/defense-date — sửa ngày bảo vệ chung
   */
  async updateCommonDefenseDate(data: UpdateCommonDefenseDateRequest): Promise<DefenseCouncil[]> {
    const res = await apiClient.patch<ApiResponse<DefenseCouncil[]>>(
      DEFENSE_COUNCIL_ENDPOINTS.DEFENSE_DATE,
      data,
    )
    return res.data.data
  },

  /**
   * 3c. DELETE /defense-council/{councilPublicId}
   */
  async deleteCouncil(councilPublicId: string): Promise<void> {
    const res = await apiClient.delete<ApiResponse<void>>(
      DEFENSE_COUNCIL_ENDPOINTS.DETAIL(councilPublicId),
    )
    return res.data.data
  },

  /**
   * 3d. GET /api/v1/deadlines — lấy mốc THANH_LAP_HOI_DONG để biết đang mở hay đóng
   */
  async getFormationMilestone(params: {
    semesterId: number | string
    majorId: number | string
  }): Promise<{ startDate: string | null; endDate: string | null } | null> {
    const res = await apiClient.get<ApiResponse<RawDeadlineGroups>>(
      DEFENSE_COUNCIL_ENDPOINTS.DEADLINES,
      { params },
    )
    const data = res.data.data
    const all = [
      ...(data?.giaoNhanDeadlines ?? []),
      ...(data?.thucHienDeadlines ?? []),
      ...(data?.danhGiaDeadlines ?? []),
    ]
    const item = all.find((d) => d.code === 'THANH_LAP_HOI_DONG')
    return item ? { startDate: item.startDate ?? null, endDate: item.endDate ?? null } : null
  },

  /**
   * 4. GET /defense-council/teacher?semesterId={id}&majorId={id}&scope={ALL|IN_MAJOR|OUT_MAJOR|EXTERNAL}&assignedOnly={bool}&keyword={str}
   */
  async getTeachers(params: CandidateTeacherParams): Promise<CandidateTeacher[]> {
    const res = await apiClient.get<ApiResponse<CandidateTeacher[]>>(
      DEFENSE_COUNCIL_ENDPOINTS.TEACHERS,
      { params },
    )
    return res.data.data
  },

  /**
   * 5. PUT /defense-council/{councilPublicId}/member
   */
  async updateMembers(
    councilPublicId: string,
    data: UpdateCouncilMembersRequest,
  ): Promise<DefenseCouncil> {
    const res = await apiClient.put<ApiResponse<DefenseCouncil>>(
      DEFENSE_COUNCIL_ENDPOINTS.MEMBERS(councilPublicId),
      data,
    )
    return res.data.data
  },

  /**
   * 6. GET /defense-council/student?semesterId={id}&majorId={id}&assigned={bool}&page={0-based}&size=20
   */
  async getStudents(params: EligibleStudentParams): Promise<SpringPage<EligibleStudent>> {
    // BE bật PageSerializationMode.VIA_DTO → Page trả về dạng { content, page: { totalElements, ... } }
    const res = await apiClient.get<ApiResponse<RawSpringPage<EligibleStudent>>>(
      DEFENSE_COUNCIL_ENDPOINTS.STUDENTS,
      { params },
    )
    return toSpringPage(res.data.data, { page: params.page ?? 0, size: params.size ?? 20 })
  },

  /**
   * 7. POST /defense-council/{councilPublicId}/assignment
   */
  async assignStudents(
    councilPublicId: string,
    data: AssignStudentsToCouncilRequest,
  ): Promise<void> {
    const res = await apiClient.post<ApiResponse<void>>(
      DEFENSE_COUNCIL_ENDPOINTS.ASSIGN_STUDENTS(councilPublicId),
      data,
    )
    return res.data.data
  },

  /**
   * 8. DELETE /defense-council/{councilPublicId}/assignment/{assignmentPublicId}
   */
  async removeStudentAssignment(
    councilPublicId: string,
    assignmentPublicId: string,
  ): Promise<void> {
    const res = await apiClient.delete<ApiResponse<void>>(
      DEFENSE_COUNCIL_ENDPOINTS.REMOVE_ASSIGNMENT(councilPublicId, assignmentPublicId),
    )
    return res.data.data
  },
}
