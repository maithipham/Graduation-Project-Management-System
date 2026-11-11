
import { apiClient, API_ENDPOINTS } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type {
  AdvisorRegistrationResponse,
  AvailableAdvisor,
  RegistrationOverviewResponse,
  SubmitAdvisorRegistrationRequest,
  UpdateAdvisorRegistrationRequest,
} from '../types/registration.types'

const REGISTRATION = API_ENDPOINTS.student.advisorRegistrations
const REGISTRATION_OVERVIEW = API_ENDPOINTS.student.registrationOverview
const AVAILABLE_ADVISORS = API_ENDPOINTS.student.availableAdvisors

export const registrationService = {
  // 3. Lịch sử đơn đăng ký theo học kỳ
  // GET /api/student/advisor-registrations?semesterPublicId={uuid}
  async getHistory(
    semesterPublicId: string,
  ): Promise<AdvisorRegistrationResponse[]> {
    const res = await apiClient.get<ApiResponse<AdvisorRegistrationResponse[]>>(
      REGISTRATION,
      {
        params: { semesterPublicId },
      },
    )

    return res.data.data ?? []
  },

  // Đơn đăng ký mới nhất trong học kỳ hiện tại
  // GET /api/student/advisor-registrations/current
  async getCurrent(): Promise<AdvisorRegistrationResponse | null> {
    const res = await apiClient.get<
      ApiResponse<AdvisorRegistrationResponse | null>
    >(`${REGISTRATION}/current`)

    return res.data.data ?? null
  },

  // 5 & 6. Tổng quan (GVHD, đề tài chính thức & hạn đăng ký GVHD) theo học kỳ
  // GET /api/student/advisor-registrations/overview?semesterPublicId={uuid}
  async getOverview(
    semesterPublicId: string,
  ): Promise<RegistrationOverviewResponse> {
    const res = await apiClient.get<ApiResponse<RegistrationOverviewResponse>>(
      REGISTRATION_OVERVIEW,
      {
        params: { semesterPublicId },
      },
    )

    return res.data.data
  },

  // 4. Danh sách GVHD của học kỳ hiện tại còn chỉ tiêu
  // GET /api/student/advisor-registrations/advisors?semesterPublicId={uuid}
  async getAvailableAdvisors(
    semesterPublicId: string,
  ): Promise<AvailableAdvisor[]> {
    const res = await apiClient.get<ApiResponse<AvailableAdvisor[]>>(
      AVAILABLE_ADVISORS,
      {
        params: { semesterPublicId },
      },
    )

    return res.data.data ?? []
  },

  // 1. Tạo đơn đăng ký GVHD mới
  // POST /api/student/advisor-registrations
  async submit(
    body: SubmitAdvisorRegistrationRequest,
  ): Promise<AdvisorRegistrationResponse> {
    const res = await apiClient.post<
      ApiResponse<AdvisorRegistrationResponse>
    >(REGISTRATION, body, {
      skipErrorToast: true,
    })

    return res.data.data
  },

  // 2. Cập nhật đơn đăng ký GVHD đang PENDING
  // PUT /api/student/advisor-registrations
  async update(
    body: UpdateAdvisorRegistrationRequest,
  ): Promise<AdvisorRegistrationResponse> {
    const res = await apiClient.put<
      ApiResponse<AdvisorRegistrationResponse>
    >(REGISTRATION, body, {
      skipErrorToast: true,
    })

    return res.data.data
  },
}

