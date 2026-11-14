import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { templateService } from '../services/template.service'
import type { TemplateListParams } from '../types/template.types'

export const studentTemplateKeys = {
  all: ['student', 'templateFiles'] as const,
  lists: () => [...studentTemplateKeys.all, 'list'] as const,
  list: (params: TemplateListParams) => [...studentTemplateKeys.lists(), params] as const,
}

/** Danh sách tài liệu (`GET /template/shared`). Đổi trang vẫn giữ trang cũ đến khi trang mới về */
export function useTemplateFiles(params: TemplateListParams) {
  return useQuery({
    queryKey: studentTemplateKeys.list(params),
    queryFn: () => templateService.getTemplateFiles(params),
    placeholderData: keepPreviousData,
  })
}
