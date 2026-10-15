# Mẫu: query hook + mutation hook

Vị trí trong feature: `hooks/useSemesters.ts`

Ví dụ dùng feature `admin/semester_management` (học kỳ). Khi làm feature khác: đổi tên, giữ cấu trúc.

```ts
import {
  keepPreviousData,
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from '@/shared/components/feedback/toast.store'
import { semesterService } from '../services/semester.service'
import type { SemesterListParams, SemesterRequest } from '../types/semester.types'

// Bộ "tên cache" của feature. Sửa dữ liệu xong thì xóa cache theo các key này để danh sách tự tải lại
export const semesterKeys = {
  all: ['admin', 'semesters'] as const,
  lists: () => [...semesterKeys.all, 'list'] as const,
  list: (params: SemesterListParams) => [...semesterKeys.lists(), params] as const,
  detail: (id: number | undefined) => [...semesterKeys.all, 'detail', id] as const,
}

/** Danh sách có phân trang. Đổi trang vẫn giữ dữ liệu trang cũ đến khi trang mới về (không nháy trắng) */
export function useSemesters(params: SemesterListParams) {
  return useQuery({
    queryKey: semesterKeys.list(params),
    queryFn: () => semesterService.getPage(params),
    placeholderData: keepPreviousData,
  })
}

/** Chi tiết một học kỳ. id chưa có → chưa gọi API */
export function useSemester(id: number | undefined) {
  return useQuery({
    queryKey: semesterKeys.detail(id),
    queryFn: id === undefined ? skipToken : () => semesterService.getById(id),
  })
}

export function useCreateSemester() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: SemesterRequest) => semesterService.create(body),
    onSuccess: () => {
      toast.success('Đã thêm học kỳ')
      return queryClient.invalidateQueries({ queryKey: semesterKeys.lists() })
    },
  })
}

export function useUpdateSemester() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: SemesterRequest }) =>
      semesterService.update(id, body),
    onSuccess: (_data, { id }) => {
      toast.success('Đã cập nhật học kỳ')
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: semesterKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: semesterKeys.detail(id) }),
      ])
    },
  })
}

export function useDeleteSemester() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => semesterService.remove(id),
    onSuccess: () => {
      toast.success('Đã xóa học kỳ')
      return queryClient.invalidateQueries({ queryKey: semesterKeys.lists() })
    },
  })
}
```
