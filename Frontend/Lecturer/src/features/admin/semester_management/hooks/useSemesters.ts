import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/shared/components/feedback/toast.store'
import { semesterService } from '../services/semester.service'
import type { SemesterRequestBE } from '../types/semester.types'

export const SEMESTER_KEYS = {
  all: ['admin', 'semesters'] as const,
  list: (params?: { page?: number; size?: number; search?: string }) =>
    [...SEMESTER_KEYS.all, 'list', params] as const,
  detail: (id: string) => [...SEMESTER_KEYS.all, 'detail', id] as const,
}

export function useSemesters(params?: { page?: number; size?: number; search?: string }) {
  return useQuery({
    queryKey: SEMESTER_KEYS.list(params),
    queryFn: () => semesterService.getAll(params),
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

export function useCreateSemester() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: SemesterRequestBE) => semesterService.create(body),
    onSuccess: () => {
      toast.success('Thêm học kỳ mới thành công!')
      queryClient.invalidateQueries({ queryKey: SEMESTER_KEYS.all })
    },
  })
}

export function useUpdateSemester() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: SemesterRequestBE }) =>
      semesterService.update(id, body),
    onSuccess: () => {
      toast.success('Cập nhật học kỳ thành công!')
      queryClient.invalidateQueries({ queryKey: SEMESTER_KEYS.all })
    },
  })
}

export function useDeleteSemester() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => semesterService.delete(id),
    onSuccess: () => {
      toast.success('Xóa học kỳ thành công!')
      queryClient.invalidateQueries({ queryKey: SEMESTER_KEYS.all })
    },
  })
}
