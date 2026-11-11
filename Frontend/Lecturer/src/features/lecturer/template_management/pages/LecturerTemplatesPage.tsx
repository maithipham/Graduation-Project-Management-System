import { useState } from 'react'
import { useDebounce } from '@/shared/hooks'
import { TemplateTable } from '../components/TemplateTable'
import { TemplateToolbar } from '../components/TemplateToolbar'
import { useLecturerTemplateFiles } from '../hooks/useLecturerTemplateFiles'
import type { LecturerTemplateFilters, LecturerTemplateListParams } from '../types/templateManagement.types'
import {
  DEFAULT_TEMPLATE_PAGE_SIZE,
  EMPTY_TEMPLATE_FILTERS,
  TEMPLATE_SEARCH_DEBOUNCE_MS,
} from '../utils/templateFilters'

/**
 * Trang "Tài liệu mẫu" của Giảng viên — giao diện giống trang Trưởng bộ môn nhưng chỉ xem + tải về
 * (không tải lên / sửa / xóa). Dữ liệu từ `GET /template`.
 */
export default function LecturerTemplatesPage() {
  const [filters, setFilters] = useState<LecturerTemplateFilters>(EMPTY_TEMPLATE_FILTERS)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_TEMPLATE_PAGE_SIZE)

  // Gõ xong 400ms mới gọi API
  const keyword = useDebounce(filters.keyword.trim(), TEMPLATE_SEARCH_DEBOUNCE_MS)
  const params: LecturerTemplateListParams = {
    keyword: keyword || undefined,
    fileType: filters.fileType || undefined,
    page,
    size: pageSize,
  }
  const { data, isPending, isError, isFetching } = useLecturerTemplateFiles(params)

  const changeFilters = (patch: Partial<LecturerTemplateFilters>) => {
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
