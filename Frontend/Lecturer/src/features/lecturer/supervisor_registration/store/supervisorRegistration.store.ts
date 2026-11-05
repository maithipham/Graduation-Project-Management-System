import { create } from 'zustand'

import { supervisorRegistrationService } from '../services/supervisorRegistration.service'

import type {
  SupervisorRequestItem,
  SupervisorRequestCounts,
  SupervisorTabStatus,
} from '../types/supervisorRegistration.types'

import type {
  GetSupervisorRequestsParams,
} from '../services/supervisorRegistration.service'

interface SupervisorRegistrationState {
  supervisorRequests: SupervisorRequestItem[]
  counts: SupervisorRequestCounts

  loading: boolean
  error: string | null

  currentParams: GetSupervisorRequestsParams | null

  fetchRequests: (params: GetSupervisorRequestsParams) => Promise<void>
  approveRequest: (id: string) => Promise<void>
  rejectRequest: (id: string) => Promise<void>
  clearError: () => void
}

const initialCounts: SupervisorRequestCounts = {
  pending: 0,
  approved: 0,
  rejected: 0,
  all: 0,
}

export const useSupervisorRegistrationStore =
  create<SupervisorRegistrationState>((set, get) => ({
    supervisorRequests: [],
    counts: initialCounts,

    loading: false,
    error: null,

    currentParams: null,

    // Lấy danh sách yêu cầu từ BE
    fetchRequests: async (params) => {
      set({
        loading: true,
        error: null,
        currentParams: params,
      })

      try {
        const result =
          await supervisorRegistrationService.getRequests(params)

        set({
          supervisorRequests: result.items,
          counts: result.counts,
          loading: false,
        })
      } catch (error: any) {
        set({
          loading: false,
          error:
            error.response?.data?.message ||
            error.message ||
            'Không thể tải danh sách yêu cầu đăng ký GVHD.',
        })
      }
    },

    // Duyệt yêu cầu
    approveRequest: async (id) => {
      try {
        set({ error: null })

        await supervisorRegistrationService.approveRequest(id)

        const params = get().currentParams

        if (params) {
          await get().fetchRequests(params)
        }
      } catch (error: any) {
        set({
          error:
            error.response?.data?.message ||
            error.message ||
            'Không thể duyệt yêu cầu.',
        })

        throw error
      }
    },

    // Từ chối yêu cầu - không cần lý do
    rejectRequest: async (id) => {
      try {
        set({ error: null })

        await supervisorRegistrationService.rejectRequest(id)

        const params = get().currentParams

        if (params) {
          await get().fetchRequests(params)
        }
      } catch (error: any) {
        set({
          error:
            error.response?.data?.message ||
            error.message ||
            'Không thể từ chối yêu cầu.',
        })

        throw error
      }
    },

    clearError: () => set({ error: null }),
  }))