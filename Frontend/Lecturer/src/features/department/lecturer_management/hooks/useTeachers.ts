import {
  keepPreviousData,
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { teacherService } from '../services/teacher.service'
import type { TeacherListParams } from '../types'

// Bộ "tên cache" của feature. Sau khi ghi (hạn mức/import/thêm/kích hoạt) thì invalidate theo các key này
export const departmentTeacherKeys = {
  all: ['department', 'teachers'] as const,
  lists: () => [...departmentTeacherKeys.all, 'list'] as const,
  list: (params: TeacherListParams) => [...departmentTeacherKeys.lists(), params] as const,
  detail: (publicId: string | undefined) =>
    [...departmentTeacherKeys.all, 'detail', publicId] as const,
}

/** Danh sách giảng viên (gồm cả đã tắt) có phân trang. Đổi trang vẫn giữ dữ liệu cũ đến khi dữ liệu mới về */
export function useTeachers(params: TeacherListParams) {
  return useQuery({
    queryKey: departmentTeacherKeys.list(params),
    queryFn: () => teacherService.getTeachers(params),
    placeholderData: keepPreviousData,
  })
}

/** Chi tiết một giáo viên. Chưa có publicId (popup đóng) → chưa gọi API */
export function useTeacherDetail(publicId: string | undefined) {
  return useQuery({
    queryKey: departmentTeacherKeys.detail(publicId),
    queryFn: publicId === undefined ? skipToken : () => teacherService.getTeacherDetail(publicId),
  })
}

/**
 * Import file Excel. Kết quả từng dòng do popup hiển thị nên hook không toast.
 * Xong thì tải lại danh sách (kể cả khi chỉ một phần dòng được lưu).
 */
export function useImportTeachers() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: teacherService.importTeachers,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: departmentTeacherKeys.all }),
  })
}

/** Thiết lập hạn mức 1 giáo viên. Thành công → tải lại danh sách và popup chi tiết */
export function useUpdateTeacherAmount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: teacherService.updateTeacherAmount,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: departmentTeacherKeys.all }),
  })
}

/** Thêm thủ công 1 giáo viên. Thành công (1000 / 1100) → tải lại danh sách và popup chi tiết */
export function useCreateTeacher() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: teacherService.createTeacher,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: departmentTeacherKeys.all }),
  })
}
