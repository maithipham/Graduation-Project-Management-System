import { apiClient, API_ENDPOINTS } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'

import type {
  AdvisorRegistrationResponse,
  ApiRegistrationStatus,
  GetSupervisorRequestsParams,
  SupervisorRequestCounts,
  SupervisorRequestItem,
  SupervisorTabStatus,
  TeacherAdvisorRegistrationListResponse,
} from '../types/supervisorRegistration.types'

export type { GetSupervisorRequestsParams }

const mapStatus = (
  status: ApiRegistrationStatus,
): SupervisorRequestItem['status'] => {
  switch (status) {
    case 'PENDING':
      return 'pending'
    case 'TEACHER_APPROVED':
    case 'HOD_APPROVED':
    case 'HOD_REJECTED':
      return 'approved'
    case 'REJECTED':
      return 'rejected'
    case 'ASSIGNED_BY_HOD':
      return 'assigned'
    default:
      return 'pending'
  }
}

const APPROVED_TAB_STATUSES: ReadonlySet<ApiRegistrationStatus> = new Set([
  'TEACHER_APPROVED',
  'HOD_APPROVED',
  'HOD_REJECTED',
])

const REJECTED_TAB_STATUSES: ReadonlySet<ApiRegistrationStatus> = new Set([
  'REJECTED',
])

const ASSIGNED_TAB_STATUSES: ReadonlySet<ApiRegistrationStatus> = new Set([
  'ASSIGNED_BY_HOD',
])

const mapTabToApiStatus = (
  status?: SupervisorTabStatus,
): ApiRegistrationStatus | undefined => {
  switch (status) {
    case 'pending':
      return 'PENDING'
    case 'rejected':
      return 'REJECTED'
    case 'assigned':
      return 'ASSIGNED_BY_HOD'
    // tab 'approved' gồm nhiều trạng thái (TEACHER_APPROVED, HOD_APPROVED, HOD_REJECTED), BE chỉ nhận 1 enum nên không truyền status để lấy toàn bộ rồi lọc
    case 'approved':
    default:
      return undefined
  }
}

const mapRequest = (
  item: AdvisorRegistrationResponse,
): SupervisorRequestItem => ({
  id: item.registrationPublicId,
  mssv: item.studentCode,
  name: item.studentName,
  major: item.majorName ?? '',
  topic: item.topicName ?? '',
  submittedDate: item.submittedAt ?? '',
  processedAt: item.processedAt ?? undefined,
  status: mapStatus(item.status),
  apiStatus: item.status,
  statusDescription: item.statusDescription,
})

// Giống một @Service: chỉ gọi API và bóc wrapper ApiResponse, không xử lý giao diện
export const supervisorRegistrationService = {
  // 1. GET /api/teacher/advisor-registrations — Danh sách đơn đăng ký và bộ đếm theo học kỳ
  getRequests: async (
    params: GetSupervisorRequestsParams,
  ): Promise<{
    items: SupervisorRequestItem[]
    counts: SupervisorRequestCounts
  }> => {
    const response = await apiClient.get<
      ApiResponse<TeacherAdvisorRegistrationListResponse>
    >(API_ENDPOINTS.lecturer.base, {
      params: {
        semesterPublicId: params.semesterPublicId,
        status: mapTabToApiStatus(params.status),
        keyword: params.keyword?.trim() || undefined,
      },
    })

    const data = response.data.data
    const rawRegistrations = data?.registrations ?? []
    const filteredRegistrations =
      params.status === 'pending'
        ? rawRegistrations.filter((item) => item.status === 'PENDING')
        : params.status === 'approved'
          ? rawRegistrations.filter((item) =>
              APPROVED_TAB_STATUSES.has(item.status),
            )
          : params.status === 'rejected'
            ? rawRegistrations.filter((item) =>
                REJECTED_TAB_STATUSES.has(item.status),
              )
            : params.status === 'assigned'
              ? rawRegistrations.filter((item) =>
                  ASSIGNED_TAB_STATUSES.has(item.status),
                )
              : rawRegistrations

    // Đếm số lượng theo từng tab:
    // Khi lấy toàn bộ danh sách (tab approved hoặc không truyền status), đếm trực tiếp từ danh sách trả về để khớp chính xác các tab gộp/tách.
    const hasFullList = !params.status || params.status === 'approved'
    const assignedFromApi = (data as { assignedCount?: number } | undefined)?.assignedCount
    const calculatedAssigned =
      assignedFromApi !== undefined
        ? assignedFromApi
        : Math.max(
            0,
            (data?.totalCount ?? 0) -
              (data?.pendingCount ?? 0) -
              (data?.approvedCount ?? 0) -
              (data?.rejectedCount ?? 0),
          )

    const counts: SupervisorRequestCounts = hasFullList
      ? {
          pending: rawRegistrations.filter((item) => item.status === 'PENDING').length,
          approved: rawRegistrations.filter((item) => APPROVED_TAB_STATUSES.has(item.status)).length,
          rejected: rawRegistrations.filter((item) => REJECTED_TAB_STATUSES.has(item.status)).length,
          assigned: rawRegistrations.filter((item) => ASSIGNED_TAB_STATUSES.has(item.status)).length,
          all: data?.totalCount ?? rawRegistrations.length,
        }
      : {
          pending: data?.pendingCount ?? 0,
          approved: data?.approvedCount ?? 0,
          rejected: data?.rejectedCount ?? 0,
          assigned: calculatedAssigned,
          all: data?.totalCount ?? 0,
        }

    return {
      items: filteredRegistrations.map(mapRequest),
      counts,
    }
  },

  // 2. GET /api/teacher/advisor-registrations/{publicId} — Chi tiết một đơn đăng ký
  getRequestDetail: async (
    id: string,
  ): Promise<AdvisorRegistrationResponse> => {
    const response = await apiClient.get<
      ApiResponse<AdvisorRegistrationResponse>
    >(API_ENDPOINTS.lecturer.detail(id))

    return response.data.data
  },

  // 3. PATCH /api/teacher/advisor-registrations/{publicId}/approve — Duyệt đơn
  approveRequest: async (id: string): Promise<AdvisorRegistrationResponse> => {
    const response = await apiClient.patch<
      ApiResponse<AdvisorRegistrationResponse>
    >(API_ENDPOINTS.lecturer.approve(id))

    return response.data.data
  },

  // 4. PATCH /api/teacher/advisor-registrations/{publicId}/reject — Từ chối đơn
  rejectRequest: async (id: string): Promise<AdvisorRegistrationResponse> => {
    const response = await apiClient.patch<
      ApiResponse<AdvisorRegistrationResponse>
    >(API_ENDPOINTS.lecturer.reject(id))

    return response.data.data
  },
}
