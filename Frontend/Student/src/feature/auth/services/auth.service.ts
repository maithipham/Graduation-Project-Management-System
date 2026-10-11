import { apiClient } from '../../../shared/api/client'
import { API_ENDPOINTS } from '../../../shared/api/endpoints'
import type { ApiResponse, UserProfile, UserRole } from '@/shared/types'

export interface LoginCredentials {
  code: string
  password?: string
  role?: UserRole
}

export interface AuthResponseData {
  token: string
  refreshToken?: string
  user: UserProfile
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponseData> => {
    const res = await apiClient.post<ApiResponse<AuthResponseData>>(
      API_ENDPOINTS.auth.login,
      credentials,
    )
    return res.data.data
  },

  logout: async (): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.auth.logout)
  },

  getCurrentUser: async (): Promise<UserProfile> => {
    const res = await apiClient.get<ApiResponse<UserProfile>>(API_ENDPOINTS.auth.me)
    return res.data.data
  },

  refreshToken: async (token: string): Promise<{ accessToken: string }> => {
    const res = await apiClient.post<ApiResponse<{ accessToken: string }>>(
      API_ENDPOINTS.auth.refreshToken,
      { refreshToken: token },
    )
    return res.data.data
  },
}
