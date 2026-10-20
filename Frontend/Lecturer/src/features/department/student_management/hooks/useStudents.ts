import { keepPreviousData, skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { referenceDataQueryOptions } from '@/shared/api'
import { studentService } from '../services/student.service'
import type { StudentListParams } from '../types'

// Bộ "tên cache" của feature. Sau khi ghi (import/thêm/kích hoạt) thì invalidate theo các key này
export const departmentStudentKeys = {
  all: ['department', 'students'] as const,
  lists: () => [...departmentStudentKeys.all, 'list'] as const,
  list: (params: StudentListParams) => [...departmentStudentKeys.lists(), params] as const,
  detail: (publicId: string | undefined) =>
    [...departmentStudentKeys.all, 'detail', publicId] as const,
}

export const majorKeys = {
  all: ['majors'] as const,
}

/** Danh sách sinh viên có phân trang. Đổi trang/bộ lọc vẫn giữ dữ liệu cũ đến khi dữ liệu mới về */
export function useStudents(params: StudentListParams) {
  return useQuery({
    queryKey: departmentStudentKeys.list(params),
    queryFn: () => studentService.getStudents(params),
    placeholderData: keepPreviousData,
  })
}

/** Chi tiết một sinh viên. Chưa có publicId (popup đóng) → chưa gọi API */
export function useStudentDetail(publicId: string | undefined) {
  return useQuery({
    queryKey: departmentStudentKeys.detail(publicId),
    queryFn: publicId === undefined ? skipToken : () => studentService.getStudentDetail(publicId),
  })
}

/** Danh sách ngành cho dropdown — ít đổi nên cache lâu */
export function useMajors() {
  return useQuery({
    queryKey: majorKeys.all,
    queryFn: studentService.getMajors,
    ...referenceDataQueryOptions,
  })
}

/**
 * Import file Excel. Kết quả từng dòng do popup hiển thị nên hook không toast.
 * Xong thì tải lại danh sách (kể cả khi chỉ một phần dòng được lưu).
 */
export function useImportStudents() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: studentService.importStudents,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: departmentStudentKeys.all }),
  })
}

/** Thêm một sinh viên (POST /student). Thành công hoặc cảnh báo đều tải lại danh sách */
export function useCreateStudent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: studentService.createStudent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: departmentStudentKeys.all }),
  })
}
