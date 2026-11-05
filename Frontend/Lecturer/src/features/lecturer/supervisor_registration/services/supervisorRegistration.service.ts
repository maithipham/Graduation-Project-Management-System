import apiClient from '@/shared/api/client'
import { API_ENDPOINTS } from '@/shared/api/endpoints'

import type {
  SupervisorRequestItem,
  SupervisorRequestCounts,
  SupervisorTabStatus,
  AdvisorRegistrationResponse,
  TeacherAdvisorRegistrationListResponse,
  ApiRegistrationStatus,
} from '../types/supervisorRegistration.types'

// Tham số lấy danh sách yêu cầu
export interface GetSupervisorRequestsParams {
  semesterPublicId: string
  status?: SupervisorTabStatus
  keyword?: string
}

// Chuyển trạng thái BE sang trạng thái giao diện
const mapStatus = (
  status: ApiRegistrationStatus,
): SupervisorRequestItem['status'] => {
  switch (status) {
    case 'PENDING':
      return 'pending'

    case 'REJECTED':
      return 'rejected'

    case 'TEACHER_APPROVED':
    case 'HOD_APPROVED':
    case 'ASSIGNED_BY_HOD':
      return 'approved'

    default:
      return 'pending'
  }
}

// Chuyển dữ liệu BE thành dữ liệu giao diện
const mapRequest = (
  item: AdvisorRegistrationResponse,
): SupervisorRequestItem => {
  const status = mapStatus(item.status)

  return {
    id: item.registrationPublicId,
    mssv: item.studentCode,
    name: item.studentName,
    major: item.majorName ?? '',
    topic: item.topicName ?? '',

    // Thời gian sinh viên gửi đơn
    submittedDate: item.submittedAt ?? '',

    // Thời gian giảng viên duyệt hoặc từ chối
    processedAt: item.processedAt ?? undefined,

    status,
    email: '',
    phone: '',
    note: '',
  }
}

export const supervisorRegistrationService = {
  // Lấy danh sách yêu cầu đăng ký GVHD
  getRequests: async (
    params: GetSupervisorRequestsParams,
  ): Promise<{
    items: SupervisorRequestItem[]
    counts: SupervisorRequestCounts
  }> => {
    const response = await apiClient.get<TeacherAdvisorRegistrationListResponse>(
      API_ENDPOINTS.lecturer.base,
      {
        params: {
          semesterPublicId: params.semesterPublicId,
          status: params.status
            ? params.status.toUpperCase() === 'APPROVED'
              ? 'TEACHER_APPROVED'
              : params.status.toUpperCase()
            : undefined,
          keyword: params.keyword?.trim() || undefined,
        },
      },
    )

    const data = response.data

    return {
      items: data.registrations.map(mapRequest),

      counts: {
        pending: data.pendingCount,
        approved: data.approvedCount,
        rejected: data.rejectedCount,
        all: data.totalCount,
      },
    }
  },

  // Lấy chi tiết yêu cầu
  getRequestDetail: async (
    id: string,
  ): Promise<AdvisorRegistrationResponse> => {
    const response = await apiClient.get<AdvisorRegistrationResponse>(
      API_ENDPOINTS.lecturer.detail(id),
    )

    return response.data
  },

  // Duyệt yêu cầu
  approveRequest: async (id: string): Promise<AdvisorRegistrationResponse> => {
    const response = await apiClient.patch<AdvisorRegistrationResponse>(
      API_ENDPOINTS.lecturer.approve(id),
    )

    return response.data
  },

  // Từ chối yêu cầu - không cần lý do
  rejectRequest: async (id: string): Promise<AdvisorRegistrationResponse> => {
    const response = await apiClient.patch<AdvisorRegistrationResponse>(
      API_ENDPOINTS.lecturer.reject(id),
    )

    return response.data
  },
}