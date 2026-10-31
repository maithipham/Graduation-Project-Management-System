import {
  keepPreviousData,
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from '@/shared/components/feedback/toast.store'
import { teacherService } from '../services/teacher.service'
import type { TeacherListParams } from '../types'

// Bộ "tên cache" của feature. Sau khi ghi (hạn mức/import/thêm/kích hoạt/phân công) thì invalidate theo các key này
export const departmentTeacherKeys = {
  all: ['department', 'teachers'] as const,
  academicTitles: () => [...departmentTeacherKeys.all, 'academic-titles'] as const,
  available: (params: { semesterId?: string; keyword?: string }) =>
    [...departmentTeacherKeys.all, 'available', params] as const,
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

/** Danh mục học hàm, học vị (GET /teacher/academic-titles) */
export function useAcademicTitles() {
  return useQuery({
    queryKey: departmentTeacherKeys.academicTitles(),
    queryFn: () => teacherService.getAcademicTitles(),
    staleTime: 60 * 60 * 1000, // 1 giờ
  })
}

/** Danh sách giảng viên khả dụng chưa làm GVHD trong kỳ (GET /teacher/available) */
export function useAvailableTeachers(params: {
  semesterId?: string
  keyword?: string
  page?: number
  size?: number
}) {
  return useQuery({
    queryKey: departmentTeacherKeys.available(params),
    queryFn: () => teacherService.getAvailableTeachers(params),
    placeholderData: keepPreviousData,
  })
}

/** Phân công danh sách giảng viên làm GVHD trong học kỳ (chỉ kỳ ONGOING) */
export function useAssignAdvisors() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      semesterId,
      teacherIds,
      maxStudentsPerTeacher,
    }: {
      semesterId: string
      teacherIds: number[]
      maxStudentsPerTeacher?: number
    }) =>
      teacherService.assignAdvisors(semesterId, {
        teacherIds,
        maxStudentsPerTeacher,
      }),
    onSuccess: (msg) => {
      toast.success(msg)
      queryClient.invalidateQueries({ queryKey: departmentTeacherKeys.all })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Không thể phân công GVHD. Vui lòng kiểm tra lại trạng thái học kỳ.')
    },
  })
}

/** Import file Excel danh sách GVHD trong kỳ (POST /semesters/{semesterId}/advisors/import-excel) */
export function useImportAdvisorsExcel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ semesterId, file }: { semesterId: string; file: File }) =>
      teacherService.importAdvisorsExcel(semesterId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentTeacherKeys.all })
      queryClient.invalidateQueries({ queryKey: ['supervisors'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Import danh sách giáo viên hướng dẫn thất bại')
    },
  })
}
