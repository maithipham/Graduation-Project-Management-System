import type { KeyboardEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { RubricStatusBadge } from './RubricStatusBadge'

interface RubricPendingRowProps {
  name: string
  /** Lỗi hiện ngay dưới ô tên (lỗi kiểm tra hoặc lỗi BE trả về) */
  error: string | null
  isPending: boolean
  onChange: (name: string) => void
  onSave: () => void
  onCancel: () => void
}

/**
 * Dòng nhập inline ở đầu bảng khi bấm "Tạo mới". Chỉ nhập tên (A3 chỉ nhận type + name),
 * ngày áp dụng chọn sau ở nút "Áp dụng" trong popup chi tiết. Enter = lưu, Esc = hủy.
 */
export function RubricPendingRow({ name, error, isPending, onChange, onSave, onCancel }: RubricPendingRowProps) {
  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' && !isPending) onSave()
    if (event.key === 'Escape') onCancel()
  }

  return (
    <tr className="border-b border-slate-100 bg-blue-50/20">
      <td className="px-3 py-3 text-center">
        <span className="mx-auto block h-4 w-1.5 rounded-full bg-[#1565C0]" aria-hidden="true" />
      </td>
      <td className="px-3 py-3">
        <input
          type="text"
          autoFocus
          value={name}
          maxLength={255}
          disabled={isPending}
          placeholder="Nhập tên mẫu rubric..."
          aria-label="Tên mẫu rubric mới"
          aria-invalid={error !== null}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          className="h-8 w-full rounded-lg border border-[#1565C0] bg-white px-2.5 text-[13px] font-semibold text-slate-800 outline-none ring-2 ring-blue-100 placeholder:font-normal placeholder:text-slate-400 aria-invalid:border-[#DC2626] aria-invalid:ring-red-100"
        />
        {error && <p className="mt-1 text-[12px] font-semibold text-[#DC2626]">{error}</p>}
      </td>
      <td className="px-3 py-3">
        <RubricStatusBadge status="draft" />
      </td>
      <td colSpan={4} className="px-3 py-3 text-[12px] italic text-slate-400">
        Chọn ngày áp dụng sau khi thiết lập xong tiêu chí
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={onSave}
            disabled={isPending}
            className="h-8 cursor-pointer rounded-lg bg-[#1565C0] px-3 text-[12px] font-semibold text-white transition-colors hover:bg-[#0D47A1] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? 'Đang lưu...' : 'Lưu'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            aria-label="Hủy dòng nhập"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}
