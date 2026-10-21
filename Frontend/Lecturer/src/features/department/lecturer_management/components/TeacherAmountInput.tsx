import { useEffect, useRef, useState } from 'react'
import { toast } from '@/shared/components/feedback/toast.store'
import { Input } from '@/shared/components/ui'
import { cn } from '@/shared/utils/cn'
import { useUpdateTeacherAmount } from '../hooks/useTeachers'
import type { TeacherListItem } from '../types'
import { teacherAmountInputId } from '../utils/teacherDisplay'
import { ConfirmAmountSheet } from './ConfirmAmountSheet'

// Giống BE: chỉ chữ số 0–9 (số nguyên ≥ 0, không dấu, không thập phân), tối đa 18 chữ số
const AMOUNT_PATTERN = /^\d{1,18}$/
// Ô type="number" vẫn cho gõ các ký tự này → chặn luôn
const BLOCKED_KEYS = new Set(['-', '+', '.', ',', 'e', 'E'])
/** Ngừng bấm tăng/giảm bấy lâu thì mới hỏi xác nhận (để bấm liên tiếp nhiều lần) */
const STEP_CONFIRM_DELAY_MS = 1000

/**
 * Ô nhập hạn mức trong bảng.
 * Bấm mũi tên tăng/giảm (hoặc phím ↑ ↓, lăn chuột) bao nhiêu lần cũng được: ngừng bấm 1 giây thì hỏi xác nhận
 * một lần với số cuối cùng. Gõ số → hỏi khi Enter hoặc rời ô (Enter / rời ô cũng hỏi ngay sau khi bấm tăng/giảm).
 * Người dùng chọn "Không" hoặc lưu lỗi → trả về giá trị cũ.
 */
export function TeacherAmountInput({ teacher }: { teacher: TeacherListItem }) {
  const original = teacher.amount === null ? '' : String(teacher.amount)
  const [draft, setDraft] = useState(original)
  const [pending, setPending] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const stepTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const { mutate, isPending } = useUpdateTeacherAmount()

  const clearStepTimer = () => clearTimeout(stepTimer.current)

  // Rời trang / dòng bị tải lại khi đang chờ → hủy hẹn giờ
  useEffect(() => clearStepTimer, [])

  const revert = () => {
    setDraft(original)
    setPending(null)
  }

  const askConfirm = (value: string) => {
    clearStepTimer()
    if (pending !== null) return
    // "007" → "7" (BE cũng lưu thành 7)
    const normalized = value.trim().replace(/^0+(?=\d)/, '')
    // Không đổi hoặc xóa trống ô (BE bắt buộc có giá trị) → giữ giá trị cũ
    if (normalized === original || normalized === '') return setDraft(original)
    if (!AMOUNT_PATTERN.test(normalized)) {
      toast.warning('Hạn mức phải là số nguyên không âm, tối đa 18 chữ số')
      return setDraft(original)
    }
    setDraft(normalized)
    setPending(normalized)
  }

  const confirm = () => {
    if (pending === null) return
    mutate(
      { publicId: teacher.publicId, amount: pending },
      {
        // Danh sách tải lại → ô này nhận giá trị mới từ server
        onSuccess: (message) => {
          toast.success(message || 'Cập nhật số lượng hướng dẫn thành công')
          setPending(null)
        },
        // Toast lỗi do interceptor hiện
        onError: revert,
      },
    )
  }

  const cancel = () => {
    revert()
    inputRef.current?.focus()
  }

  return (
    <>
      <Input
        ref={inputRef}
        id={teacherAmountInputId(teacher.publicId)}
        type="number"
        min={0}
        step={1}
        inputMode="numeric"
        placeholder="—"
        aria-label={`Hạn mức của ${teacher.name}`}
        value={draft}
        // Số đang khác số đã lưu → viền vàng nhạt báo "chưa lưu"
        className={cn(
          'h-8 w-24 tabular-nums',
          draft !== original && 'border-amber-400 bg-amber-50 focus-visible:ring-amber-500',
        )}
        // Không để click / phím lan lên dòng → không mở popup chi tiết
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          e.stopPropagation()
          if (BLOCKED_KEYS.has(e.key)) e.preventDefault()
          if (e.key === 'Enter') {
            // Popup mở ra thì focus nhảy sang nút "Cập nhật" → chặn để chính phím Enter này không bấm luôn nút đó
            e.preventDefault()
            askConfirm(e.currentTarget.value)
          }
          if (e.key === 'Escape') {
            clearStepTimer()
            setDraft(original)
          }
        }}
        onChange={(e) => {
          const value = e.target.value
          setDraft(value)
          // Đổi đúng 1 đơn vị so với giá trị trước = bấm mũi tên tăng/giảm → đợi ngừng bấm rồi mới hỏi.
          // Mỗi lần bấm tiếp thì đếm lại từ đầu
          const stepped = value !== '' && draft !== '' && Math.abs(Number(value) - Number(draft)) === 1
          clearStepTimer()
          if (stepped) stepTimer.current = setTimeout(() => askConfirm(value), STEP_CONFIRM_DELAY_MS)
        }}
        onBlur={(e) => askConfirm(e.target.value)}
      />
      {pending !== null && (
        <ConfirmAmountSheet
          teacherName={teacher.name}
          from={teacher.amount}
          to={pending}
          isPending={isPending}
          onConfirm={confirm}
          onCancel={cancel}
        />
      )}
    </>
  )
}
