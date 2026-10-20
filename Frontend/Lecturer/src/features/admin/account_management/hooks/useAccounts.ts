import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/shared/components/feedback/toast.store'
import {
  accountService,
  type AccountListParams,
} from '../services/account.service'
import type {
  AddAccountFormValues,
  AccountRole,
  AccountStatus,
} from '../types/account.types'

export const ACCOUNT_KEYS = {
  all: ['admin', 'accounts'] as const,
  list: (params?: AccountListParams) =>
    [...ACCOUNT_KEYS.all, 'list', params] as const,
  detail: (id: string | number) =>
    [...ACCOUNT_KEYS.all, 'detail', String(id)] as const,
  activities: (id: string | number) =>
    [...ACCOUNT_KEYS.all, 'activities', String(id)] as const,
}

/**
 * Hook lấy danh sách tài khoản theo trang, tìm kiếm và bộ lọc
 */
export function useAccounts(params?: AccountListParams) {
  return useQuery({
    queryKey: ACCOUNT_KEYS.list(params),
    queryFn: () => accountService.getAccounts(params),
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Hook lấy chi tiết một tài khoản
 */
export function useAccountDetail(id: string | number | null) {
  return useQuery({
    queryKey: ACCOUNT_KEYS.detail(id || ''),
    queryFn: () => (id ? accountService.getAccountById(id) : null),
    enabled: Boolean(id),
  })
}

/**
 * Hook lấy danh sách lịch sử hoạt động của một tài khoản
 */
export function useAccountActivities(id: string | number | null) {
  return useQuery({
    queryKey: ACCOUNT_KEYS.activities(id || ''),
    queryFn: () => (id ? accountService.getAccountActivities(id) : []),
    enabled: Boolean(id),
  })
}

/**
 * Hook tạo tài khoản mới
 */
export function useCreateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: AddAccountFormValues) => accountService.createAccount(body),
    onSuccess: () => {
      toast.success('Thêm tài khoản mới thành công!')
      queryClient.invalidateQueries({ queryKey: ACCOUNT_KEYS.all })
    },
  })
}

/**
 * Hook cập nhật vai trò hoặc trạng thái tài khoản
 */
export function useUpdateAccountStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string | number
      data: { role?: AccountRole; status?: AccountStatus }
    }) => accountService.updateAccountStatus(id, data),
    onSuccess: () => {
      toast.success('Cập nhật tài khoản thành công!')
      queryClient.invalidateQueries({ queryKey: ACCOUNT_KEYS.all })
    },
  })
}
