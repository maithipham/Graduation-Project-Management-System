import { useState } from 'react'
import { FolderOpen, Loader2, Pencil, Trash2 } from 'lucide-react'
import { Skeleton, TablePagination } from '@/shared/components/ui'
import type { SpringPage } from '@/shared/types'
import { cn } from '@/shared/utils/cn'
import type { TemplateFile } from '../types'
import { downloadTemplateFile } from '../utils/downloadTemplateFile'
import { FILE_TYPE_BADGE_CLASS } from '../utils/templateCategory'
import { TEMPLATE_PAGE_SIZE_OPTIONS } from '../utils/templateFilters'
import { TemplateFileIcon } from './TemplateFileIcon'

const ACTION_BUTTON_CLASS =
  'inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition'
const COLUMN_COUNT = 6
const SKELETON_ROWS = 5

interface TemplateTableProps {
  /** `undefined` khi đang tải lần đầu hoặc tải lỗi */
  data: SpringPage<TemplateFile> | undefined
  isPending: boolean
  isError: boolean
  /** Đang chờ trang mới (vẫn hiện trang cũ) → khóa phân trang */
  isFetching: boolean
  /** Đang lọc mà không ra kết quả → câu thông báo khác với "chưa có tài liệu" */
  hasFilters: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onEdit: (doc: TemplateFile) => void
  onDelete: (doc: TemplateFile) => void
}

/** BE trả `dd-MM-yyyy HH:mm:ss` → tách ngày / giờ để hiển thị 2 dòng */
function splitDateTime(value: string): [string, string] {
  const [date = value, time = ''] = value.split(' ')
  return [date, time]
}

function MessageRow({ title, description }: { title: string; description?: string }) {
  return (
    <tr>
      <td colSpan={COLUMN_COUNT} className="px-6 py-14 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <FolderOpen className="h-6 w-6" />
        </div>
        <p className="text-[13.5px] font-semibold text-slate-700">{title}</p>
        {description && <p className="mt-1 text-[12.5px] text-slate-500">{description}</p>}
      </td>
    </tr>
  )
}

/** Bảng danh sách tài liệu + thanh phân trang */
export function TemplateTable({
  data,
  isPending,
  isError,
  isFetching,
  hasFilters,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
}: TemplateTableProps) {
  // Dòng đang tải file về máy (khóa nút tên để không bấm 2 lần)
  const [downloadingId, setDownloadingId] = useState<string>()

  const handleDownload = async (doc: TemplateFile) => {
    if (downloadingId) return
    setDownloadingId(doc.publicId)
    try {
      await downloadTemplateFile(doc)
    } finally {
      setDownloadingId(undefined)
    }
  }

  const startIndex = data ? data.number * data.size : 0

  const renderBody = () => {
    if (isPending) {
      return Array.from({ length: SKELETON_ROWS }, (_, row) => (
        <tr key={row}>
          {Array.from({ length: COLUMN_COUNT }, (_, col) => (
            <td key={col} className="px-5 py-3.5">
              <Skeleton className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))
    }
    if (isError || !data) {
      return <MessageRow title="Không tải được danh sách tài liệu" description="Vui lòng thử lại sau." />
    }
    if (data.empty) {
      return hasFilters ? (
        <MessageRow
          title="Không tìm thấy tài liệu phù hợp"
          description="Thử đổi từ khóa tìm kiếm hoặc loại tài liệu."
        />
      ) : (
        <tr>
          <td colSpan={COLUMN_COUNT} className="px-6 py-14 text-center text-[13.5px] text-slate-500">
            Bấm "Tải lên tài liệu" để thêm tài liệu đầu tiên.
          </td>
        </tr>
      )
    }

    return data.content.map((doc, index) => {
      const [date, time] = splitDateTime(doc.updatedAt)
      const isDownloading = downloadingId === doc.publicId
      return (
        <tr key={doc.publicId} className="text-[13px] transition hover:bg-slate-50/70">
          <td className="px-4 py-3 text-center font-medium text-slate-500">{startIndex + index + 1}</td>
          <td className="px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <TemplateFileIcon fileName={doc.fileUrl} />
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => handleDownload(doc)}
                  disabled={isDownloading}
                  title={`Tải về: ${doc.fileName}`}
                  className="flex max-w-full cursor-pointer items-center gap-1.5 text-left font-semibold text-slate-800 hover:text-[#1565C0] hover:underline disabled:cursor-wait disabled:opacity-70"
                >
                  <span className="truncate">{doc.fileName}</span>
                  {isDownloading && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />}
                </button>
                {doc.uploadedByName && (
                  <p className="truncate text-[11.5px] text-slate-400">Tải lên bởi {doc.uploadedByName}</p>
                )}
              </div>
            </div>
          </td>
          <td className="px-4 py-3 text-center">
            <span
              title={doc.fileTypeName}
              className={cn(
                'inline-block max-w-full truncate whitespace-nowrap rounded-full border px-2.5 py-0.5 align-middle text-[11.5px] font-semibold',
                FILE_TYPE_BADGE_CLASS[doc.fileType] ?? FILE_TYPE_BADGE_CLASS.OTHER,
              )}
            >
              {doc.fileTypeName}
            </span>
          </td>
          <td className="whitespace-nowrap px-4 py-3 text-center text-slate-600">{doc.fileSizeText ?? '—'}</td>
          <td className="whitespace-nowrap px-4 py-3 text-center text-slate-600">
            <p>{date}</p>
            {time && <p className="text-[11.5px] text-slate-400">{time}</p>}
          </td>
          <td className="px-4 py-3">
            <div className="flex items-center justify-center gap-1">
              <button
                type="button"
                onClick={() => onEdit(doc)}
                title="Sửa tài liệu"
                aria-label={`Sửa ${doc.fileName}`}
                className={cn(ACTION_BUTTON_CLASS, 'hover:bg-blue-50 hover:text-[#1565C0]')}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(doc)}
                title="Xóa"
                aria-label={`Xóa ${doc.fileName}`}
                className={cn(ACTION_BUTTON_CLASS, 'hover:bg-rose-50 hover:text-rose-600')}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </td>
        </tr>
      )
    })
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xs">
      <div className="overflow-x-auto">
        {/* table-fixed + colgroup: độ rộng cột cố định theo tỷ lệ, tên dài tự cắt "..." thay vì đẩy cột khác */}
        <table className="w-full min-w-[900px] table-fixed border-collapse text-left">
          <colgroup>
            <col className="w-[6%]" />
            <col className="w-[41%]" />
            <col className="w-[19%]" />
            <col className="w-[10%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
          </colgroup>
          <thead>
            <tr className="h-10 border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <th className="px-4 py-2.5 text-center">STT</th>
              <th className="px-4 py-2.5 text-left">Tên tài liệu</th>
              <th className="px-4 py-2.5 text-center">Loại</th>
              <th className="px-4 py-2.5 text-center">Kích thước</th>
              <th className="px-4 py-2.5 text-center">Ngày cập nhật</th>
              <th className="px-4 py-2.5 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">{renderBody()}</tbody>
        </table>
      </div>

      {data && (
        <TablePagination
          data={data}
          disabled={isFetching}
          onPageChange={onPageChange}
          itemLabel="tài liệu"
          pageSizeOptions={TEMPLATE_PAGE_SIZE_OPTIONS}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  )
}
