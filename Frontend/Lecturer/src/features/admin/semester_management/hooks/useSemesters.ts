import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/shared/components/feedback/toast.store'
import { semesterService } from '../services/semester.service'
import type { SemesterRequestBE, SemesterConfigBE } from '../types/semester.types'

export const SEMESTER_KEYS = {
  all: ['admin', 'semesters'] as const,
  list: (params?: { page?: number; size?: number; search?: string }) =>
    [...SEMESTER_KEYS.all, 'list', params] as const,
  detail: (id: string) => [...SEMESTER_KEYS.all, 'detail', id] as const,
  current: () => [...SEMESTER_KEYS.all, 'current'] as const,
  config: () => [...SEMESTER_KEYS.all, 'config'] as const,
}

export function useSemesters(params?: { page?: number; size?: number; search?: string }) {
  return useQuery({
    queryKey: SEMESTER_KEYS.list(params),
    queryFn: () => semesterService.getAll(params),
    staleTime: 60 * 1000,
  })
}

export function useCurrentSemester() {
  return useQuery({
    queryKey: SEMESTER_KEYS.current(),
    queryFn: () => semesterService.getCurrent(),
    staleTime: 60 * 1000,
  })
}

export function useSemesterDetail(id: string) {
  return useQuery({
    queryKey: SEMESTER_KEYS.detail(id),
    queryFn: () => semesterService.getById(id),
    enabled: Boolean(id),
  })
}

export function useSemesterConfig() {
  return useQuery({
    queryKey: SEMESTER_KEYS.config(),
    queryFn: () => semesterService.getConfig(),
    staleTime: 60 * 1000,
  })
}

export function useUpdateSemester() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: SemesterRequestBE }) =>
      semesterService.update(id, body),
    onSuccess: (_, variables) => {
      if (variables.body.applyToFutureSemesters) {
        toast.success(
          'Cập nhật học kỳ thành công! Khung thời gian chuẩn đã được cập nhật cho các năm sau.',
        )
      } else {
        toast.success('Cập nhật khoảng thời gian học kỳ thành công!')
      }
      queryClient.invalidateQueries({ queryKey: SEMESTER_KEYS.all })
    },
  })
}

export function useUpdateSemesterConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: SemesterConfigBE) => semesterService.updateConfig(body),
    onSuccess: () => {
      toast.success('Cập nhật khung thời gian chuẩn thành công! Các năm sau sẽ tự động áp dụng.')
      queryClient.invalidateQueries({ queryKey: SEMESTER_KEYS.all })
    },
  })
}

export function useSyncSemesters() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => semesterService.sync(),
    onSuccess: () => {
      toast.success('Đã đồng bộ chu kỳ học kỳ thành công!')
      queryClient.invalidateQueries({ queryKey: SEMESTER_KEYS.all })
    },
  })
}
