import { useState } from 'react'
import { useDebounce } from '@/shared/hooks'
import { TemplateTable } from '../components/TemplateTable'
import { TemplateToolbar } from '../components/TemplateToolbar'
import { useTemplateFiles } from '../hooks/useTemplateFiles'
import type { TemplateFilters, TemplateListParams } from '../types/template.types'
import {
  DEFAULT_TEMPLATE_PAGE_SIZE,
  EMPTY_TEMPLATE_FILTERS,
  TEMPLATE_SEARCH_DEBOUNCE_MS,
} from '../utils/templateFilters'

/**
 * Trang "Tài liệu mẫu" của Sinh viên — giao diện giống hệt màn giảng viên: chỉ xem + tải về
 * (không tải lên / sửa / xóa). Dữ liệu từ `GET /template/shared`.
 */
export default function StudentDocumentsPage() {
  const [filters, setFilters] = useState<TemplateFilters>(EMPTY_TEMPLATE_FILTERS)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_TEMPLATE_PAGE_SIZE)

  // Gõ xong 400ms mới gọi API
  const keyword = useDebounce(filters.keyword.trim(), TEMPLATE_SEARCH_DEBOUNCE_MS)
  const params: TemplateListParams = {
    keyword: keyword || undefined,
    fileType: filters.fileType || undefined,
    page,
    size: pageSize,
  }
  const { data, isPending, isError, isFetching } = useTemplateFiles(params)

  const changeFilters = (patch: Partial<TemplateFilters>) => {
    setFilters((current) => ({ ...current, ...patch }))
    setPage(0)
  }

  return (
    <div className="space-y-3">
      <TemplateToolbar filters={filters} onChange={changeFilters} />

      <TemplateTable
        data={data}
        isPending={isPending}
        isError={isError}
        isFetching={isFetching}
        hasFilters={filters.keyword.trim() !== '' || filters.fileType !== ''}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(0)
        }}
      />
    </div>
  )
}
