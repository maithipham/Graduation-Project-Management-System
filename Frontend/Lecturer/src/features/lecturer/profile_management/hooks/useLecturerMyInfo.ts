import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authKeys } from '@/features/auth'
import { useLecturerPortalStore } from '@/features/lecturer/lecturer_portal_storage'
import { toast } from '@/shared/components/feedback/toast.store'
import { API_SUCCESS_CODE } from '@/shared/types'
import { formatDisplayName, lecturerProfileService } from '../services/lecturerProfile.service'
import type { TeacherMyInfo, TeacherMyInfoUpdatePayload } from '../types/lecturerProfile.types'

export const lecturerProfileKeys = {
  myInfo: ['lecturer', 'my-info'] as const,
}

// GET /teacher/my-info — dùng chung cho Giảng viên và Trưởng bộ môn
export function useLecturerMyInfo() {
  return useQuery({
    queryKey: lecturerProfileKeys.myInfo,
    queryFn: lecturerProfileService.getMyInfo,
  })
}

// PUT /teacher/my-info — lỗi (4000 / 3014...) do form tự xử lý trong onError của mutate()
export function useUpdateLecturerMyInfo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: TeacherMyInfoUpdatePayload) => lecturerProfileService.updateMyInfo(body),
    onSuccess: ({ code, message }, body) => {
      // 1104 (không đổi gì): interceptor đã hiện toast vàng, BE không lưu → không làm gì thêm
      if (code !== API_SUCCESS_CODE) return

      toast.success(message || 'Đã cập nhật thông tin cá nhân')

      // Đồng bộ tên / SĐT sang header ngay, không cần tải lại trang
      const current = queryClient.getQueryData<TeacherMyInfo>(lecturerProfileKeys.myInfo)
      const name = `${body.firstName} ${body.lastName}`.trim()
      useLecturerPortalStore.getState().updateTeacherProfile({
        name: formatDisplayName(current?.academicTitle ?? null, name),
        phone: body.phone,
      })

      queryClient.invalidateQueries({ queryKey: lecturerProfileKeys.myInfo })
      // Header lấy tên từ GET /my-info
      queryClient.invalidateQueries({ queryKey: authKeys.myInfo })
    },
  })
}
