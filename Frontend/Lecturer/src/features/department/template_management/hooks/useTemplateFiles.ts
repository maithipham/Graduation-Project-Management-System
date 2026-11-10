import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/shared/components/feedback'
import { isApiError } from '@/shared/types'
import { templateFileService } from '../services/templateFile.service'
import type { TemplateFileCreateBody, TemplateFileListParams, TemplateFileUpdateBody } from '../types'

/** Mã lỗi BE: tài liệu không tồn tại (người khác vừa xóa) */
export const TEMPLATE_FILE_NOT_FOUND_CODE = 3067

export const templateFileKeys = {
  all: ['department', 'templateFiles'] as const,
  lists: () => [...templateFileKeys.all, 'list'] as const,
  list: (params: TemplateFileListParams) => [...templateFileKeys.lists(), params] as const,
}

/** Danh sách tài liệu có phân trang. Đổi trang vẫn giữ dữ liệu trang cũ đến khi trang mới về */
export function useTemplateFiles(params: TemplateFileListParams) {
  return useQuery({
    queryKey: templateFileKeys.list(params),
    queryFn: () => templateFileService.getTemplateFiles(params),
    placeholderData: keepPreviousData,
  })
}

/** Tài liệu đã bị xóa ở nơi khác → tải lại danh sách cho khớp */
function useRefreshWhenNotFound() {
  const queryClient = useQueryClient()
  return (error: unknown) => {
    if (isApiError(error) && error.code === TEMPLATE_FILE_NOT_FOUND_CODE) {
      void queryClient.invalidateQueries({ queryKey: templateFileKeys.lists() })
    }
  }
}

export function useCreateTemplateFile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ body, signal }: { body: TemplateFileCreateBody; signal?: AbortSignal }) =>
      templateFileService.createTemplateFile(body, signal),
    onSuccess: (message) => {
      toast.success(message || 'Thêm mới tài liệu thành công')
      return queryClient.invalidateQueries({ queryKey: templateFileKeys.lists() })
    },
  })
}

export function useUpdateTemplateFile() {
  const queryClient = useQueryClient()
  const refreshWhenNotFound = useRefreshWhenNotFound()
  return useMutation({
    mutationFn: ({
      publicId,
      body,
      signal,
    }: {
      publicId: string
      body: TemplateFileUpdateBody
      signal?: AbortSignal
    }) =>
      templateFileService.updateTemplateFile(publicId, body, signal),
    onSuccess: (message) => {
      toast.success(message || 'Cập nhật tài liệu thành công')
      return queryClient.invalidateQueries({ queryKey: templateFileKeys.lists() })
    },
    onError: refreshWhenNotFound,
  })
}

export function useDeleteTemplateFile() {
  const queryClient = useQueryClient()
  const refreshWhenNotFound = useRefreshWhenNotFound()
  return useMutation({
    mutationFn: (publicId: string) => templateFileService.deleteTemplateFile(publicId),
    onSuccess: (message) => {
      toast.success(message || 'Xóa tài liệu thành công')
      return queryClient.invalidateQueries({ queryKey: templateFileKeys.lists() })
    },
    onError: refreshWhenNotFound,
  })
}
