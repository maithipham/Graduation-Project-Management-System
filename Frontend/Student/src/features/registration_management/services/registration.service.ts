
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
const REGISTRATION_OVERVIEW =
  API_ENDPOINTS.student.registrationOverview
const AVAILABLE_ADVISORS = `${REGISTRATION}/advisors`

// Các hàm tiện ích dùng chung cho giao diện
export function normalizeRegistrationText(text: string): string {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim()
}

export function formatRegistrationNow(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')

  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const registrationService = {
  // GET /api/student/advisor-registrations?semesterPublicId={uuid}
  async getHistory(
    semesterPublicId: string,
  ): Promise<AdvisorRegistrationResponse[]> {
    const res = await apiClient.get<AdvisorRegistrationResponse[]>(
      REGISTRATION,
      {
        params: { semesterPublicId },
      },
    )

    return res.data ?? []
  },

  // GET /api/student/advisor-registrations/current
  async getCurrent(): Promise<AdvisorRegistrationResponse | null> {
    const res = await apiClient.get<
      ApiResponse<AdvisorRegistrationResponse | null>
    >(`${REGISTRATION}/current`)

    return res.data.data ?? null
  },

  // GET /api/student/advisor-registrations/overview?semesterPublicId={uuid}
  async getOverview(
    semesterPublicId: string,
  ): Promise<RegistrationOverviewResponse> {
    const res = await apiClient.get<RegistrationOverviewResponse>(
      REGISTRATION_OVERVIEW,
      {
        params: { semesterPublicId },
      },
    )

    return res.data
  },

  // GET /api/student/advisor-registrations/advisors?semesterPublicId={uuid}
  async getAvailableAdvisors(
    semesterPublicId: string,
  ): Promise<AvailableAdvisor[]> {
    const res = await apiClient.get<AvailableAdvisor[]>(
      AVAILABLE_ADVISORS,
      {
        params: { semesterPublicId },
      },
    )

    return res.data ?? []
  },

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

  formatNow: formatRegistrationNow,
}
