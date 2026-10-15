# Mẫu: query hook + mutation hook

Vị trí trong feature: `hooks/useSupervisorRegistration.ts`

Ví dụ dùng feature `student/supervisor_registration` (đăng ký GVHD). Khi làm feature khác: đổi tên, giữ cấu trúc.

```ts
import {
  keepPreviousData,
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from '@/shared/components/feedback/toast.store'
import { registrationService } from '../services/registration.service'
import type {
  SupervisorListParams,
  SupervisorRegistrationRequest,
} from '../types/registration.types'

// Bộ "tên cache" của feature. Sửa dữ liệu xong thì xóa cache theo các key này để màn hình tự tải lại
export const registrationKeys = {
  all: ['student', 'supervisor-registration'] as const,
  supervisorLists: () => [...registrationKeys.all, 'supervisors'] as const,
  supervisorList: (params: SupervisorListParams) =>
    [...registrationKeys.supervisorLists(), params] as const,
  supervisorDetail: (id: number | undefined) =>
    [...registrationKeys.all, 'supervisor', id] as const,
  mine: () => [...registrationKeys.all, 'mine'] as const,
}

/** Danh sách GVHD có phân trang. Đổi trang vẫn giữ dữ liệu trang cũ đến khi trang mới về (không nháy trắng) */
export function useSupervisors(params: SupervisorListParams) {
  return useQuery({
    queryKey: registrationKeys.supervisorList(params),
    queryFn: () => registrationService.getSupervisorPage(params),
    placeholderData: keepPreviousData,
  })
}

/** Chi tiết một GVHD. id chưa có → chưa gọi API */
export function useSupervisor(id: number | undefined) {
  return useQuery({
    queryKey: registrationKeys.supervisorDetail(id),
    queryFn: id === undefined ? skipToken : () => registrationService.getSupervisorById(id),
  })
}

/** Đăng ký GVHD hiện tại của sinh viên đang đăng nhập (null = chưa đăng ký) */
export function useMyRegistration() {
  return useQuery({
    queryKey: registrationKeys.mine(),
    queryFn: () => registrationService.getMyRegistration(),
  })
}

export function useRegisterSupervisor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: SupervisorRegistrationRequest) => registrationService.register(body),
    onSuccess: () => {
      toast.success('Đã gửi đăng ký GVHD')
      // Số chỉ tiêu của GVHD cũng đổi → tải lại cả danh sách GVHD
      return queryClient.invalidateQueries({ queryKey: registrationKeys.all })
    },
  })
}

export function useUpdateRegistration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: SupervisorRegistrationRequest }) =>
      registrationService.update(id, body),
    onSuccess: () => {
      toast.success('Đã cập nhật đăng ký')
      return queryClient.invalidateQueries({ queryKey: registrationKeys.mine() })
    },
  })
}

export function useCancelRegistration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => registrationService.cancel(id),
    onSuccess: () => {
      toast.success('Đã hủy đăng ký')
      return queryClient.invalidateQueries({ queryKey: registrationKeys.all })
    },
  })
}
```
