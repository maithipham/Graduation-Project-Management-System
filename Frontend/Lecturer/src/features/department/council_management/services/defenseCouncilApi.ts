import { apiClient } from '@/shared/api'
import type { ApiResponse, SpringPage } from '@/shared/types'
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

const BASE_URL = apiClient.defaults.baseURL?.endsWith('/api')
  ? '/v1/defense-councils'
  : '/api/v1/defense-councils'

export const defenseCouncilApi = {
  /**
   * 1. GET /?semesterId={id}&majorId={id}
   */
  async getCouncils(params: {
    semesterId: number | string
    majorId: number | string
  }): Promise<CouncilListResponse> {
    const res = await apiClient.get<ApiResponse<CouncilListResponse>>(BASE_URL, {
      params,
    })
    return res.data.data
  },

  /**
   * 2. POST /batch
   */
  async createBatch(data: CreateCouncilBatchRequest): Promise<DefenseCouncil[]> {
    const res = await apiClient.post<ApiResponse<DefenseCouncil[]>>(`${BASE_URL}/batch`, data)
    return res.data.data
  },

  /**
   * 3. PATCH /{councilPublicId}
   */
  async updateLocation(
    councilPublicId: string,
    data: UpdateCouncilLocationRequest,
  ): Promise<DefenseCouncil> {
    const res = await apiClient.patch<ApiResponse<DefenseCouncil>>(
      `${BASE_URL}/${councilPublicId}`,
      data,
    )
    return res.data.data
  },

  /**
   * 4. GET /teachers?semesterId={id}&majorId={id}&scope={ALL|IN_MAJOR|OUT_MAJOR|EXTERNAL}&assignedOnly={bool}&keyword={str}
   */
  async getTeachers(params: CandidateTeacherParams): Promise<CandidateTeacher[]> {
    const res = await apiClient.get<ApiResponse<CandidateTeacher[]>>(`${BASE_URL}/teachers`, {
      params,
    })
    return res.data.data
  },

  /**
   * 5. PUT /{councilPublicId}/members
   */
  async updateMembers(
    councilPublicId: string,
    data: UpdateCouncilMembersRequest,
  ): Promise<DefenseCouncil> {
    const res = await apiClient.put<ApiResponse<DefenseCouncil>>(
      `${BASE_URL}/${councilPublicId}/members`,
      data,
    )
    return res.data.data
  },

  /**
   * 6. GET /students?semesterId={id}&majorId={id}&assigned={bool}&page={0-based}&size=20
   */
  async getStudents(params: EligibleStudentParams): Promise<SpringPage<EligibleStudent>> {
    const res = await apiClient.get<ApiResponse<SpringPage<EligibleStudent>>>(
      `${BASE_URL}/students`,
      {
        params,
      },
    )
    return res.data.data
  },

  /**
   * 7. POST /{councilPublicId}/assignments
   */
  async assignStudents(
    councilPublicId: string,
    data: AssignStudentsToCouncilRequest,
  ): Promise<void> {
    const res = await apiClient.post<ApiResponse<void>>(
      `${BASE_URL}/${councilPublicId}/assignments`,
      data,
    )
    return res.data.data
  },

  /**
   * 8. DELETE /{councilPublicId}/assignments/{assignmentPublicId}
   */
  async removeStudentAssignment(
    councilPublicId: string,
    assignmentPublicId: string,
  ): Promise<void> {
    const res = await apiClient.delete<ApiResponse<void>>(
      `${BASE_URL}/${councilPublicId}/assignments/${assignmentPublicId}`,
    )
    return res.data.data
  },
}
