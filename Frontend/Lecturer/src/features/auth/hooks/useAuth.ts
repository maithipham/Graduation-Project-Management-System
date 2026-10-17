import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/auth.service'
import type { UserInfo } from '../types'
import { SIGNED_OUT_STATE } from '../utils/loginState'

export const authKeys = {
  // Nguồn duy nhất cho "đã đăng nhập chưa, tên gì, có role nào"
  myInfo: ['auth', 'me'] as const,
}

/**
 * Cấu hình query /my-info. Export để nơi khác (ví dụ SSE) kiểm tra lại phiên bằng queryClient.fetchQuery:
 * gặp 401 thì interceptor tự refresh token, refresh hỏng thì tự về /login.
 */
export const myInfoQueryOptions = queryOptions({
  queryKey: authKeys.myInfo,
  queryFn: () => authService.getMyInfo(),
  staleTime: 5 * 60 * 1000,
})

/** Thông tin người dùng đang đăng nhập. enabled: false → chỉ đọc cache, không gọi API */
export function useMyInfo({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({ ...myInfoQueryOptions, enabled })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => authService.login(code),
    // /login đã trả { name, roles } → ghi thẳng vào cache, không cần gọi /my-info nữa
    onSuccess: (user: UserInfo) => queryClient.setQueryData(authKeys.myInfo, user),
  })
}

export function useLogout() {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: () => authService.logout(),
    // Thành công hay lỗi đều đăng xuất ở frontend. Cache được xóa ở trang /login (xem SIGNED_OUT_STATE)
    onSettled: () => navigate('/login', { replace: true, state: SIGNED_OUT_STATE }),
  })
}
