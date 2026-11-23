import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authKeys } from '@/features/auth'
import { toast } from '@/shared/components/feedback/toast.store'
import { profileService } from '../services/profile.service'
import type { StudentMyInfoUpdateRequest } from '../types/profile.types'

export const studentProfileKeys = {
  myInfo: ['student', 'my-info'] as const,
}

// GET /student/my-info — thông tin cá nhân + đề tài / GVHD kỳ hiện tại
export function useStudentMyInfo() {
  return useQuery({
    queryKey: studentProfileKeys.myInfo,
    queryFn: profileService.getMyInfo,
  })
}

// PUT /student/my-info — lỗi (1103 / 4000 / 3014...) do form tự xử lý trong onError của mutate()
export function useUpdateStudentMyInfo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: StudentMyInfoUpdateRequest) => profileService.updateMyInfo(body),
    onSuccess: (message) => {
      toast.success(message || 'Đã cập nhật thông tin cá nhân')
      // Tải lại trang cá nhân + tên trên header (header dùng GET /my-info)
      queryClient.invalidateQueries({ queryKey: studentProfileKeys.myInfo })
      queryClient.invalidateQueries({ queryKey: authKeys.myInfo })
    },
  })
}
