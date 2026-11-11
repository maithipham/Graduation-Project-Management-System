import { useState } from 'react'
import { useDebounce } from '@/shared/hooks'
import { DeleteTemplateDialog } from '../components/DeleteTemplateDialog'
import { EditTemplateDialog } from '../components/EditTemplateDialog'
import { TemplateTable } from '../components/TemplateTable'
import { TemplateToolbar } from '../components/TemplateToolbar'
import { UploadTemplateDialog } from '../components/UploadTemplateDialog'
import { useTemplateFiles } from '../hooks/useTemplateFiles'
import type { TemplateFile, TemplateFileListParams, TemplateFilters } from '../types'
import {
  DEFAULT_TEMPLATE_PAGE_SIZE,
  EMPTY_TEMPLATE_FILTERS,
  TEMPLATE_SEARCH_DEBOUNCE_MS,
} from '../utils/templateFilters'

/** Trang "Tài liệu & Biểu mẫu" của Trưởng bộ môn — danh sách + tải lên / sửa / xóa qua `/template` */
export default function TemplateManagementPage() {
  const [filters, setFilters] = useState<TemplateFilters>(EMPTY_TEMPLATE_FILTERS)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_TEMPLATE_PAGE_SIZE)

  const [uploadOpen, setUploadOpen] = useState(false)
  const [editing, setEditing] = useState<TemplateFile>()
  const [deleting, setDeleting] = useState<TemplateFile>()

  // Gõ xong 400ms mới gọi API
  const keyword = useDebounce(filters.keyword.trim(), TEMPLATE_SEARCH_DEBOUNCE_MS)
  const params: TemplateFileListParams = {
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

  // Vừa xóa dòng cuối cùng của trang (không phải trang đầu) → lùi về trang trước
  const handleDeleted = () => {
    if (data && data.numberOfElements === 1 && page > 0) setPage(page - 1)
  }

  return (
    <div className="space-y-3">
      <TemplateToolbar
        filters={filters}
        onChange={changeFilters}
        onUploadClick={() => setUploadOpen(true)}
      />

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
        onEdit={setEditing}
        onDelete={setDeleting}
      />

      <UploadTemplateDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      <EditTemplateDialog document={editing} onClose={() => setEditing(undefined)} />
      <DeleteTemplateDialog
        document={deleting}
        onClose={() => setDeleting(undefined)}
        onDeleted={handleDeleted}
      />
    </div>
  )
}
