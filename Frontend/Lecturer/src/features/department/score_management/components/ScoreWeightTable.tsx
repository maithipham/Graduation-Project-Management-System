import { CalendarCheck, CalendarRange, FolderSearch, Lock, Pencil, Trash2, Undo2 } from 'lucide-react'
import { Skeleton } from '@/shared/components/ui'
import type { ScoreWeightConfig } from '../types'
import { formatSemesterRange } from '../utils/rubricHelpers'
import { formatBeDateTime, toRubricStatus } from '../utils/rubricMapper'
import { ActionMenu, type ActionMenuItem } from './ActionMenu'
import { RubricStatusBadge } from './RubricStatusBadge'

interface ScoreWeightTableProps {
  items: ScoreWeightConfig[]
  isPending: boolean
  isError: boolean
  onEdit: (item: ScoreWeightConfig) => void
  onApply: (item: ScoreWeightConfig) => void
  onChangeRange: (item: ScoreWeightConfig) => void
  onCancelApply: (item: ScoreWeightConfig) => void
  onDelete: (item: ScoreWeightConfig) => void
}

/** [tiêu đề, độ rộng, căn giữa] */
const COLUMNS: [label: string, width: string, center: boolean][] = [
  ['STT', 'w-[5%]', true],
  ['Tên cấu hình', 'w-[17%]', false],
  ['Trọng số', 'w-[17%]', true],
  ['Trạng thái', 'w-[10%]', false],
  ['Thời gian áp dụng', 'w-[17%]', true],
  ['Phiếu chấm', 'w-[10%]', true],
  ['Sửa gần nhất', 'w-[12%]', false],
  ['Thao tác', 'w-[12%]', true],
]

const SKELETON_ROWS = 3


/** Bảng cấu hình trọng số (W1). Nút thao tác hiện theo các cờ canXxx của BE */
export function ScoreWeightTable({
  items,
  isPending,
  isError,
  onEdit,
  onApply,
  onChangeRange,
  onCancelApply,
  onDelete,
}: ScoreWeightTableProps) {
  /** Các mục trong menu "···", hiện theo cờ canXxx của BE */
  function actionItems(item: ScoreWeightConfig): ActionMenuItem[] {
    const items: ActionMenuItem[] = []
    if (item.canEdit) items.push({ label: 'Sửa', icon: Pencil, onSelect: () => onEdit(item) })
    if (item.canApply) items.push({ label: 'Áp dụng', icon: CalendarCheck, onSelect: () => onApply(item) })
    if (item.canChangeToSemester)
      items.push({ label: 'Sửa kỳ', icon: CalendarRange, onSelect: () => onChangeRange(item) })
    if (item.canCancelApply)
      items.push({ label: 'Hủy áp dụng', icon: Undo2, onSelect: () => onCancelApply(item), danger: true })
    if (item.canDelete) items.push({ label: 'Xóa', icon: Trash2, onSelect: () => onDelete(item), danger: true })
    return items
  }

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
            Không tải được danh sách cấu hình trọng số.
          </td>
        </tr>
      )
    }
    if (items.length === 0) {
      return (
        <tr>
          <td colSpan={COLUMNS.length} className="py-14 text-center">
            <FolderSearch className="mx-auto mb-2 h-8 w-8 text-slate-300" />
            <p className="text-[13px] font-semibold text-slate-600">Chưa có cấu hình trọng số nào</p>
            <p className="mt-1 text-[12px] text-slate-400">Nhấn "Tạo mới" để thêm cấu hình đầu tiên.</p>
          </td>
        </tr>
      )
    }
    return items.map((item, index) => (
      <tr
        key={item.publicId}
        className="h-14 border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50/60"
      >
        <td className="px-3 text-center text-[12.5px] font-semibold text-slate-500">{index + 1}</td>

        <td className="px-3">
          <p className="truncate text-[13px] font-bold text-slate-800" title={item.name}>
            {item.name}
          </p>
        </td>

        <td className="px-3 text-center text-[12.5px] text-slate-700">
          HD <b>{item.advisorWeight}%</b> · PB <b>{item.examinerWeight}%</b> · HĐ <b>{item.councilWeight}%</b>
        </td>

        <td className="px-3">
          <RubricStatusBadge status={toRubricStatus(item.displayStatus)} label={item.displayStatusName} />
        </td>

        <td className="px-3 text-center text-[12.5px] text-slate-700">
          {item.fromSemester ? (
            formatSemesterRange(item.fromSemester, item.toSemester)
          ) : (
            <span className="italic text-slate-400">Chưa áp dụng</span>
          )}
        </td>

        <td className="px-3 text-center">
          {item.hasSubmittedSheets ? (
            <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-amber-700">
              <Lock className="h-3.5 w-3.5" />
              Đã có phiếu nộp
            </span>
          ) : (
            <span className="text-[12px] italic text-slate-400">Chưa có</span>
          )}
        </td>

        <td className="px-3">
          <p className="truncate text-[11.5px] font-semibold text-slate-700" title={item.updatedByName ?? undefined}>
            {item.updatedByName ?? item.createdByName ?? '–'}
          </p>
          <p className="text-[10.5px] text-slate-400">
            {formatBeDateTime(item.updatedAt) ?? formatBeDateTime(item.createdAt) ?? '–'}
          </p>
        </td>

        <td className="px-3">
          <div className="flex justify-center">
            <ActionMenu items={actionItems(item)} />
          </div>
        </td>
      </tr>
    ))
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] table-fixed border-collapse">
          <thead>
            <tr className="h-10 border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              {COLUMNS.map(([label, width, center]) => (
                <th key={label} scope="col" className={`${width} px-3 ${center ? 'text-center' : 'text-left'}`}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{renderBody()}</tbody>
        </table>
      </div>
    </div>
  )
}
