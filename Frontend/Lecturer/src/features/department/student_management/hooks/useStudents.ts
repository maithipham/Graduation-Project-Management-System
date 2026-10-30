import {
  keepPreviousData,
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { referenceDataQueryOptions } from '@/shared/api'
import { toast } from '@/shared/components/feedback/toast.store'
import { isApiError } from '@/shared/types'
import { saveBlob } from '@/shared/utils'
import { studentService } from '../services/student.service'
import type { StudentBatchParams, StudentListParams } from '../types'

// Bộ "tên cache" của feature. Sau khi ghi (import/thêm) thì invalidate theo `all`
// → danh sách và dropdown Khóa đều được tải lại
export const departmentStudentKeys = {
  all: ['department', 'students'] as const,
  lists: () => [...departmentStudentKeys.all, 'list'] as const,
  list: (params: StudentListParams) => [...departmentStudentKeys.lists(), params] as const,
  detail: (publicId: string | undefined) =>
    [...departmentStudentKeys.all, 'detail', publicId] as const,
  batches: (params: StudentBatchParams) => [...departmentStudentKeys.all, 'batches', params] as const,
}

export const majorKeys = {
  all: ['majors'] as const,
}

export const semesterKeys = {
  all: ['semester-options'] as const,
  current: () => [...semesterKeys.all, 'current'] as const,
}

/** POST /student, POST /student/import: chưa có học kì đang diễn ra */
export const NO_CURRENT_SEMESTER_CODE = 3030

/**
 * Học kì hiện tại FE đang cache đã cũ (kì vừa kết thúc / bị đổi) → tải lại GET /semester/current,
 * trang sẽ tự khóa nút Import / Thêm sinh viên
 */
function refreshCurrentSemesterOn3030(queryClient: QueryClient, error: unknown) {
  if (isApiError(error) && error.code === NO_CURRENT_SEMESTER_CODE) {
    void queryClient.invalidateQueries({ queryKey: semesterKeys.current() })
  }
}

/**
 * Danh sách sinh viên có phân trang. Đổi trang/bộ lọc vẫn giữ dữ liệu cũ đến khi dữ liệu mới về.
 * `enabled = false` khi trang chưa xác định được học kì (tránh gọi 2 lần lúc mở trang)
 */
export function useStudents(params: StudentListParams, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: departmentStudentKeys.list(params),
    queryFn: () => studentService.getStudents(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

/** Các khóa có sinh viên trong học kì (dropdown Khóa). Chưa có học kì → chưa gọi */
export function useBatches(params: StudentBatchParams) {
  return useQuery({
    queryKey: departmentStudentKeys.batches(params),
    queryFn: params.semesterId ? () => studentService.getBatches(params) : skipToken,
  })
}

/** Tất cả học kì cho dropdown Năm học / Học kì */
export function useSemesters() {
  return useQuery({
    queryKey: semesterKeys.all,
    queryFn: studentService.getSemesters,
    ...referenceDataQueryOptions,
  })
}

/** Học kì hiện tại — chọn sẵn khi mở trang. Lỗi / không có → trang tự chọn kì mới nhất */
export function useCurrentSemester() {
  return useQuery({
    queryKey: semesterKeys.current(),
    queryFn: studentService.getCurrentSemester,
    ...referenceDataQueryOptions,
    retry: false,
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
 * Export danh sách ra Excel rồi cho trình duyệt lưu file. Chỉ đọc dữ liệu nên không invalidate cache.
 * Lỗi đã được interceptor toast.
 */
export function useExportStudents() {
  return useMutation({
    mutationFn: studentService.exportStudents,
    onSuccess: (file) => {
      saveBlob(file)
      toast.success('Đã xuất file danh sách sinh viên')
    },
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
    onError: (error) => refreshCurrentSemesterOn3030(queryClient, error),
  })
}

/**
 * Xóa sinh viên khỏi học kì. Lỗi cũng tải lại danh sách: thường là do dữ liệu trên bảng đã cũ
 * (sinh viên vừa đăng ký GVHD – 3028, đã bị xóa – 3027...)
 */
export function useDeleteStudent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: studentService.deleteStudent,
    onSettled: () => queryClient.invalidateQueries({ queryKey: departmentStudentKeys.all }),
  })
}

/**
 * Thêm một sinh viên (POST /student) vào học kì hiện tại — BE tự xác định, không gửi semesterId.
 * Thành công hoặc cảnh báo đều tải lại danh sách
 */
export function useCreateStudent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: studentService.createStudent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: departmentStudentKeys.all }),
    onError: (error) => refreshCurrentSemesterOn3030(queryClient, error),
  })
}

/**
 * Sửa thông tin + trạng thái tài khoản của sinh viên (PUT /student/{publicId}).
 * Invalidate `all` → bảng, dropdown Khóa và chi tiết sinh viên đều tải lại
 */
export function useUpdateStudent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: studentService.updateStudent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: departmentStudentKeys.all }),
  })
}
