
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
      queryClient.invalidateQueries({
        queryKey: registrationKeys.all,
      })
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
      queryClient.invalidateQueries({
        queryKey: registrationKeys.all,
      })
    },
  })
}
