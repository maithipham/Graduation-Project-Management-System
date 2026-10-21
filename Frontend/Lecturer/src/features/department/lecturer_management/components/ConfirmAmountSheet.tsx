import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/shared/components/ui'
import { formatAmount } from '../utils/teacherDisplay'

interface ConfirmAmountSheetProps {
  teacherName: string
  from: number | null
  to: string
  isPending: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Popup nhỏ trượt từ dưới lên hỏi có lưu hạn mức mới không.
 * Bắt buộc trả lời: không có nút X, bấm nền hoặc Escape không đóng, Tab chỉ chạy giữa 2 nút.
 */
export function ConfirmAmountSheet({
  teacherName,
  from,
  to,
  isPending,
  onConfirm,
  onCancel,
}: ConfirmAmountSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    confirmRef.current?.focus()
  }, [])

  // Giữ focus trong popup để không thao tác được phần trang phía sau bằng bàn phím
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return
    const buttons = sheetRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')
    if (!buttons?.length) return
    const first = buttons[0]
    const last = buttons[buttons.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return createPortal(
    // Lớp nền chặn mọi click xuống trang, không đóng popup.
    // Portal vẫn nổi bọt sự kiện theo cây React → chặn lại để click không lan lên dòng bảng (mở chi tiết)
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:pb-8"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div
        ref={sheetRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-amount-title"
        aria-describedby="confirm-amount-description"
        onKeyDown={handleKeyDown}
        className="w-full max-w-md animate-[slideUpFade_0.25s_cubic-bezier(0.16,1,0.3,1)] rounded-xl border border-slate-200 bg-white p-5 shadow-2xl"
      >
        <h2 id="confirm-amount-title" className="text-base font-semibold text-slate-900">
          Bạn có muốn cập nhật số lượng giảng viên không?
        </h2>
        <p id="confirm-amount-description" className="mt-1.5 text-sm text-slate-500">
          Hạn mức của <span className="font-medium text-slate-700">{teacherName}</span>:{' '}
          <span className="tabular-nums">{formatAmount(from)}</span> →{' '}
          <span className="font-semibold tabular-nums text-blue-700">{to}</span>
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isPending}>
            Không
          </Button>
          <Button ref={confirmRef} size="sm" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Đang cập nhật...' : 'Cập nhật'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
