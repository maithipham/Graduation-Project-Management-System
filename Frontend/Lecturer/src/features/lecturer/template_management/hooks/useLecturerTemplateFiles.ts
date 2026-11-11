import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { lecturerTemplateService } from '../services/lecturerTemplate.service'
import type { LecturerTemplateListParams } from '../types/templateManagement.types'

export const lecturerTemplateKeys = {
  all: ['lecturer', 'templateFiles'] as const,
  lists: () => [...lecturerTemplateKeys.all, 'list'] as const,
  list: (params: LecturerTemplateListParams) => [...lecturerTemplateKeys.lists(), params] as const,
}

/** Danh sách tài liệu (`GET /template`). Đổi trang vẫn giữ trang cũ đến khi trang mới về */
export function useLecturerTemplateFiles(params: LecturerTemplateListParams) {
  return useQuery({
    queryKey: lecturerTemplateKeys.list(params),
    queryFn: () => lecturerTemplateService.getTemplateFiles(params),
    placeholderData: keepPreviousData,
  })
}
