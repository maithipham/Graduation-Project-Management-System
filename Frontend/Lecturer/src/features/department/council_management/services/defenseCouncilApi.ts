import { apiClient } from '@/shared/api'
import type { ApiResponse, SpringPage } from '@/shared/types'
import { DEFENSE_COUNCIL_ENDPOINTS } from '../constants/endpoints'
import type {
  DefenseCouncil,
  CouncilListResponse,
  CreateCouncilBatchRequest,
  UpdateCouncilLocationRequest,
  CandidateTeacher,
  CandidateTeacherParams,
  UpdateCouncilMembersRequest,
  EligibleStudent,
  EligibleStudentParams,
  AssignStudentsToCouncilRequest,
} from '../types'

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
    const res = await apiClient.get<ApiResponse<SpringPage<EligibleStudent>>>(
      DEFENSE_COUNCIL_ENDPOINTS.STUDENTS,
      { params },
    )
    return res.data.data
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
