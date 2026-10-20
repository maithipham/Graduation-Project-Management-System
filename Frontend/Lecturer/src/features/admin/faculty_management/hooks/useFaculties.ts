import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/shared/components/feedback/toast.store'
import { facultyService } from '../services/faculty.service'
import { majorService } from '../services/major.service'
import type {
  FacultyCreationRequestBE,
  FacultyUpdateRequestBE,
  MajorRequestBE,
} from '../types/faculty.types'

export const FACULTY_KEYS = {
  all: ['admin', 'faculties'] as const,
  list: (params?: { page?: number; size?: number; keyword?: string }) =>
    [...FACULTY_KEYS.all, 'list', params] as const,
  detail: (id: string) => [...FACULTY_KEYS.all, 'detail', id] as const,
  headCandidates: () => [...FACULTY_KEYS.all, 'head-candidates'] as const,
  majors: (facultyId: string) => [...FACULTY_KEYS.all, 'majors', facultyId] as const,
}

export function useFaculties(params?: { page?: number; size?: number; keyword?: string }) {
  return useQuery({
    queryKey: FACULTY_KEYS.list(params),
    queryFn: () => facultyService.getAll(params),
    staleTime: 5 * 60 * 1000,
  })
}

export function useFacultyDetail(id: string) {
  return useQuery({
    queryKey: FACULTY_KEYS.detail(id),
    queryFn: () => facultyService.getById(id),
    enabled: Boolean(id),
  })
}

export function useHeadCandidates() {
  return useQuery({
    queryKey: FACULTY_KEYS.headCandidates(),
    queryFn: () => facultyService.getHeadCandidates(),
    staleTime: 10 * 60 * 1000,
  })
}

export function useFacultyMajors(facultyId: string) {
  return useQuery({
    queryKey: FACULTY_KEYS.majors(facultyId),
    queryFn: () => majorService.getByFaculty(facultyId),
    enabled: Boolean(facultyId),
  })
}

export function useCreateFaculty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: FacultyCreationRequestBE) => facultyService.create(body),
    onSuccess: () => {
      toast.success('Thêm khoa mới thành công!')
      queryClient.invalidateQueries({ queryKey: FACULTY_KEYS.all })
    },
  })
}

export function useUpdateFaculty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: FacultyUpdateRequestBE }) =>
      facultyService.update(id, body),
    onSuccess: () => {
      toast.success('Cập nhật thông tin khoa thành công!')
      queryClient.invalidateQueries({ queryKey: FACULTY_KEYS.all })
    },
  })
}

export function useDeleteFaculty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => facultyService.delete(id),
    onSuccess: () => {
      toast.success('Xóa khoa thành công!')
      queryClient.invalidateQueries({ queryKey: FACULTY_KEYS.all })
    },
  })
}

export function useAddMajorToFaculty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ facultyId, body }: { facultyId: string; body: MajorRequestBE }) =>
      majorService.create(facultyId, body),
    onSuccess: () => {
      toast.success('Thêm chuyên ngành thành công!')
      queryClient.invalidateQueries({ queryKey: FACULTY_KEYS.all })
    },
  })
}

export function useUpdateMajor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ majorId, body }: { majorId: string; body: MajorRequestBE }) =>
      majorService.update(majorId, body),
    onSuccess: () => {
      toast.success('Cập nhật chuyên ngành thành công!')
      queryClient.invalidateQueries({ queryKey: FACULTY_KEYS.all })
    },
  })
}

export function useDeleteMajor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (majorId: string) => majorService.delete(majorId),
    onSuccess: () => {
      toast.success('Xóa chuyên ngành thành công!')
      queryClient.invalidateQueries({ queryKey: FACULTY_KEYS.all })
    },
  })
}
