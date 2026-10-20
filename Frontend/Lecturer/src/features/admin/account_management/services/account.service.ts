import { apiClient } from '@/shared/api/client'
import { API_ENDPOINTS } from '@/shared/api/endpoints'
import type { ApiResponse } from '@/shared/types'
import type { PageResponseBE } from '@/features/admin/semester_management'
import type {
  AddAccountFormValues,
  AccountActivity,
  AccountRole,
  AccountStatus,
} from '../types/account.types'

export interface AccountListParams {
  page?: number
  size?: number
  keyword?: string
  role?: string
  status?: string
}

export interface AccountResponseBE {
  id: string
  name: string
  email: string
  phone?: string
  role: AccountRole
  status: AccountStatus
  unit?: string
  department?: string
  createdAt: string
  lastLogin?: string
}

export interface AccountDetailResponseBE extends AccountResponseBE {
  activities?: AccountActivity[]
}

export const accountService = {
  /**
   * Lấy danh sách tài khoản người dùng có phân trang và bộ lọc
   */
  getAccounts: async (params?: AccountListParams) => {
    const res = await apiClient.get<ApiResponse<PageResponseBE<AccountResponseBE>>>(
      API_ENDPOINTS.admin.accounts,
      { params },
    )
    return res.data.data
  },

  /**
   * Lấy thông tin chi tiết một tài khoản
   */
  getAccountById: async (id: string | number) => {
    const res = await apiClient.get<ApiResponse<AccountDetailResponseBE>>(
      `${API_ENDPOINTS.admin.accounts}/${id}`,
    )
    return res.data.data
  },

  /**
   * Tạo tài khoản mới (Sinh viên / Giảng viên)
   */
  createAccount: async (body: AddAccountFormValues) => {
    const res = await apiClient.post<ApiResponse<AccountResponseBE>>(
      API_ENDPOINTS.admin.accounts,
      body,
    )
    return res.data.data
  },

  /**
   * Cập nhật thông tin vai trò hoặc trạng thái tài khoản
   */
  updateAccountStatus: async (
    id: string | number,
    data: { role?: AccountRole; status?: AccountStatus },
  ) => {
    const res = await apiClient.patch<ApiResponse<void>>(
      `${API_ENDPOINTS.admin.accounts}/${id}`,
      data,
    )
    return res.data.data
  },

  /**
   * Lấy lịch sử hoạt động của một tài khoản
   */
  getAccountActivities: async (id: string | number) => {
    const res = await apiClient.get<ApiResponse<AccountActivity[]>>(
      `${API_ENDPOINTS.admin.accounts}/${id}/activities`,
    )
    return res.data.data
  },
}
