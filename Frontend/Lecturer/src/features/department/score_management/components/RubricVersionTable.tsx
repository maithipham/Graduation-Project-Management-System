import type { ReactNode } from 'react'
import { FolderSearch } from 'lucide-react'
import { Skeleton, TablePagination } from '@/shared/components/ui'
import type { SpringPage } from '@/shared/types'
import type { RubricListItem } from '../types'
import { RUBRIC_PAGE_SIZE_OPTIONS } from '../utils/rubricHelpers'
import { RubricVersionRow } from './RubricVersionRow'

interface RubricVersionTableProps {
  page: SpringPage<RubricListItem>
  isPending: boolean
  isError: boolean
  itemLabel: string
  /** Dòng nhập tên khi bấm "Tạo mới" (đặt ở đầu bảng) */
  pendingRow: ReactNode
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onOpen: (item: RubricListItem) => void
  onClone: (item: RubricListItem) => void
  onDelete: (item: RubricListItem) => void
}

/** [tiêu đề, độ rộng, căn giữa] theo đúng mockup */
const COLUMNS: [label: string, width: string, center: boolean][] = [
  ['STT', 'w-[5%]', true],
  ['Tên biểu mẫu', 'w-[22%]', false],
  ['Trạng thái', 'w-[11%]', false],
  ['Bắt đầu', 'w-[12%]', true],
  ['Kết thúc', 'w-[12%]', true],
  ['Học kỳ', 'w-[12%]', true],
  ['Sửa gần nhất', 'w-[14%]', false],
  ['Thao tác', 'w-[12%]', true],
]

const SKELETON_ROWS = 4

export function RubricVersionTable({
  page,
  isPending,
  isError,
  itemLabel,
  pendingRow,
  onPageChange,
  onPageSizeChange,
  onOpen,
  onClone,
  onDelete,
}: RubricVersionTableProps) {
  const startIndex = page.number * page.size

  function renderBody() {
    if (isPending) {
      return Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <tr key={index} className="h-14 border-b border-slate-100">
          {COLUMNS.map(([label]) => (
            <td key={label} className="px-3">
              <Skeleton className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))
    }
    if (isError) {
      // Toast lỗi interceptor đã hiện, ở đây chỉ báo trạng thái
      return (
        <tr>
          <td colSpan={COLUMNS.length} className="py-14 text-center text-[13px] font-semibold text-slate-500">
            Không tải được danh sách rubric.
          </td>
        </tr>
      )
    }
    return (
      <>
        {page.content.map((item, index) => (
          <RubricVersionRow
            key={item.publicId}
            index={startIndex + index + 1}
            item={item}
            onOpen={() => onOpen(item)}
            onClone={() => onClone(item)}
            onDelete={() => onDelete(item)}
          />
        ))}
        {page.empty && !pendingRow && (
          <tr>
            <td colSpan={COLUMNS.length} className="py-14 text-center">
              <FolderSearch className="mx-auto mb-2 h-8 w-8 text-slate-300" />
              <p className="text-[13px] font-semibold text-slate-600">Chưa có mẫu rubric nào</p>
              <p className="mt-1 text-[12px] text-slate-400">Nhấn "Tạo mới" để thêm mẫu rubric đầu tiên.</p>
            </td>
          </tr>
        )}
      </>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] table-fixed border-collapse">
          <thead>
            <tr className="h-10 border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              {COLUMNS.map(([label, width, center]) => (
                <th key={label} scope="col" className={`${width} px-3 ${center ? 'text-center' : 'text-left'}`}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pendingRow}
            {renderBody()}
          </tbody>
        </table>
      </div>
      <TablePagination
        data={page}
        disabled={isPending}
        onPageChange={onPageChange}
        itemLabel={itemLabel}
        pageSizeOptions={RUBRIC_PAGE_SIZE_OPTIONS}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  )
}
