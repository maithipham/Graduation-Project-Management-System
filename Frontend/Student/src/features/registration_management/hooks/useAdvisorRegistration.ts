
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/shared/components/feedback/toast.store'
import { isApiError } from '@/shared/types'
import { registrationService } from '../services/registration.service'
import type {
  SubmitAdvisorRegistrationRequest,
  UpdateAdvisorRegistrationRequest,
} from '../types/registration.types'

// Query keys dùng chung để quản lý cache
export const registrationKeys = {
  all: ['advisor-registrations'] as const,

  current: () => [...registrationKeys.all, 'current'] as const,

  overview: (semesterPublicId: string) =>
    [...registrationKeys.all, 'overview', semesterPublicId] as const,

  history: (semesterPublicId: string) =>
    [...registrationKeys.all, 'history', semesterPublicId] as const,

  advisors: (semesterPublicId: string) =>
    [...registrationKeys.all, 'advisors', semesterPublicId] as const,
}

// Các mã lỗi nghiệp vụ cho thấy dữ liệu trên màn hình đã cũ (GV hết chỉ tiêu, khóa phân công, trạng thái đơn thay đổi...)
const STALE_DATA_ERROR_CODES = new Set([4000, 4004, 1004, 3022, 2001])

// Lấy đơn đăng ký hiện tại
export function useCurrentRegistration() {
  return useQuery({
    queryKey: registrationKeys.current(),
    queryFn: () => registrationService.getCurrent(),
  })
}

// Lấy thông tin tổng quan đăng ký theo học kỳ
export function useRegistrationOverview(
  semesterPublicId: string | undefined,
) {
  return useQuery({
    queryKey: registrationKeys.overview(semesterPublicId ?? ''),
    queryFn: () => registrationService.getOverview(semesterPublicId!),
    enabled: !!semesterPublicId,
  })
}

// Lấy lịch sử đăng ký theo học kỳ
export function useRegistrationHistory(
  semesterPublicId: string | undefined,
) {
  return useQuery({
    queryKey: registrationKeys.history(semesterPublicId ?? ''),
    queryFn: () => registrationService.getHistory(semesterPublicId!),
    enabled: !!semesterPublicId,
  })
}

// Lấy danh sách giảng viên còn chỉ tiêu
export function useAvailableAdvisors(
  semesterPublicId: string | undefined,
) {
  return useQuery({
    queryKey: registrationKeys.advisors(semesterPublicId ?? ''),
    queryFn: () => registrationService.getAvailableAdvisors(semesterPublicId!),
    enabled: !!semesterPublicId,
    staleTime: 30 * 1000,
  })
}

// Gửi đơn đăng ký mới
export function useSubmitRegistration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: SubmitAdvisorRegistrationRequest) =>
      registrationService.submit(body),

    onSuccess: () => {
      toast.success('Đăng ký giảng viên hướng dẫn thành công')
      return queryClient.invalidateQueries({
        queryKey: registrationKeys.all,
      })
    },

    onError: (error) => {
      if (isApiError(error) && STALE_DATA_ERROR_CODES.has(error.code)) {
        void queryClient.invalidateQueries({
          queryKey: registrationKeys.all,
        })
      }
    },
  })
}

// Cập nhật đơn đăng ký PENDING
export function useUpdateRegistration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: UpdateAdvisorRegistrationRequest) =>
      registrationService.update(body),

    onSuccess: () => {
      toast.success('Cập nhật đơn đăng ký giảng viên hướng dẫn thành công')
      return queryClient.invalidateQueries({
        queryKey: registrationKeys.all,
      })
    },

    onError: (error) => {
      if (isApiError(error) && STALE_DATA_ERROR_CODES.has(error.code)) {
        void queryClient.invalidateQueries({
          queryKey: registrationKeys.all,
        })
      }
    },
  })
}

