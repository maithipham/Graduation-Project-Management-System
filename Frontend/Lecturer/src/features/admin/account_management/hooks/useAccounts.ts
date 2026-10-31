import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
  skipToken,
} from '@tanstack/react-query'
import { referenceDataQueryOptions } from '@/shared/api'
import { toast } from '@/shared/components/feedback/toast.store'
import { saveBlob } from '@/shared/utils'
import {
  accountService,
  type AccountListParams,
} from '../services/account.service'
import type {
  AddAccountFormValues,
  AccountRole,
  AccountStatus,
  StudentAccountListParams,
} from '../types/account.types'

export const ACCOUNT_KEYS = {
  all: ['admin', 'accounts'] as const,
  list: (params?: AccountListParams) =>
    [...ACCOUNT_KEYS.all, 'list', params] as const,
  detail: (id: string | number) =>
    [...ACCOUNT_KEYS.all, 'detail', String(id)] as const,
  activities: (id: string | number) =>
    [...ACCOUNT_KEYS.all, 'activities', String(id)] as const,
  studentBatches: () => [...ACCOUNT_KEYS.all, 'student-batches'] as const,
  students: () => [...ACCOUNT_KEYS.all, 'students'] as const,
  studentList: (params: StudentAccountListParams) =>
    [...ACCOUNT_KEYS.students(), 'list', params] as const,
  studentDetail: (publicId: string) =>
    [...ACCOUNT_KEYS.students(), 'detail', publicId] as const,
}

/**
 * Danh sách tài khoản sinh viên (GET /student/account), lọc + phân trang phía server
 */
export function useStudentAccounts(params: StudentAccountListParams) {
  return useQuery({
    queryKey: ACCOUNT_KEYS.studentList(params),
    queryFn: () => accountService.getStudentAccounts(params),
    // Đổi trang / đổi lọc vẫn giữ dữ liệu cũ, bảng không nháy trắng
    placeholderData: keepPreviousData,
  })
}

/**
 * Chi tiết tài khoản sinh viên; publicId = null thì chưa gọi
 */
export function useStudentAccountDetail(publicId: string | null) {
  return useQuery({
    queryKey: ACCOUNT_KEYS.studentDetail(publicId ?? ''),
    queryFn: publicId ? () => accountService.getStudentAccountDetail(publicId) : skipToken,
  })
}

/**
 * Xóa (hoặc khóa) tài khoản sinh viên. Toast hiện đúng message BE trả về.
 */
export function useDeleteStudentAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (publicId: string) => accountService.deleteStudentAccount(publicId),
    onSuccess: (message) => {
      toast.success(message)
      queryClient.invalidateQueries({ queryKey: ACCOUNT_KEYS.students() })
    },
    // Lỗi (ví dụ 404 3008 sinh viên đã bị xóa ở tab khác): interceptor đã toast, chỉ tải lại danh sách
    onError: () => queryClient.invalidateQueries({ queryKey: ACCOUNT_KEYS.students() }),
  })
}

/**
 * Sửa tài khoản sinh viên. Hook không toast: popup tự xử lý 1000 (toast xanh) / lỗi (hiện trong form).
 * Invalidate `all` → bảng, chi tiết và dropdown Khóa đều tải lại
 */
export function useUpdateStudentAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: accountService.updateStudentAccount,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCOUNT_KEYS.all }),
  })
}

/**
 * Thêm tài khoản sinh viên (popup Thêm và gửi lại dòng import lỗi). Popup tự toast / hiện lỗi
 */
export function useCreateStudentAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: accountService.createStudentAccount,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCOUNT_KEYS.all }),
  })
}

/**
 * Import file Excel. Kết quả từng dòng do popup hiển thị nên hook không toast.
 * Xong thì tải lại danh sách (kể cả khi chỉ một phần dòng được lưu)
 */
export function useImportStudentAccounts() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: accountService.importStudentAccounts,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCOUNT_KEYS.all }),
  })
}

/**
 * Xuất Excel tài khoản sinh viên theo bộ lọc đang chọn, tải file về máy
 */
export function useExportStudentAccounts() {
  return useMutation({
    mutationFn: accountService.exportStudentAccounts,
    onSuccess: (file) => {
      saveBlob(file)
      toast.success('Đã xuất file danh sách tài khoản sinh viên')
    },
  })
}

/**
 * Hook lấy tất cả khóa sinh viên (GET /student/batch/all) cho bộ lọc "Tất cả khóa".
 * Chỉ gọi khi `enabled` (trang Sinh viên).
 */
export function useAllStudentBatches({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ACCOUNT_KEYS.studentBatches(),
    queryFn: accountService.getAllStudentBatches,
    enabled,
    ...referenceDataQueryOptions,
  })
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
