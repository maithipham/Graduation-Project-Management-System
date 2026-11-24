import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'

/**
 * Chia 2 cột có thanh kéo ở giữa: trỏ chuột vào thanh rồi kéo để đổi độ rộng 2 cột.
 * - Chỉ 1 cột có độ rộng cố định theo px (`sizedPane`), cột còn lại tự co giãn lấp phần còn lại.
 * - Độ rộng được nhớ trong localStorage theo `storageKey` (mỗi máy / trình duyệt một bản).
 * - Bấm đúp vào thanh kéo để trả về độ rộng mặc định. Có thể dùng phím ← → khi thanh kéo đang được focus.
 * - `stackBelowLg` = true: dưới màn lg (1024px) 2 cột xếp dọc, ẩn thanh kéo.
 */
interface ResizableSplitProps {
  start: ReactNode
  end: ReactNode
  /** Cột có độ rộng cố định (px). Cột kia tự lấp phần còn lại. */
  sizedPane?: 'start' | 'end'
  defaultSize: number
  minSize?: number
  maxSize?: number
  /** Độ rộng tối thiểu của cột tự co giãn (px), để kéo không làm cột đó quá hẹp. */
  minOtherSize?: number
  /** Khóa lưu localStorage; bỏ trống thì không nhớ. */
  storageKey?: string
  stackBelowLg?: boolean
  className?: string
  startClassName?: string
  endClassName?: string
}

const KEYBOARD_STEP = 24
const STORAGE_PREFIX = 'gpms.split.'

function readStoredSize(storageKey: string | undefined): number | null {
  if (!storageKey) return null
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + storageKey)
    const value = raw === null ? NaN : Number(raw)
    return Number.isFinite(value) ? value : null
  } catch {
    return null
  }
}

function writeStoredSize(storageKey: string | undefined, size: number) {
  if (!storageKey) return
  try {
    window.localStorage.setItem(STORAGE_PREFIX + storageKey, String(Math.round(size)))
  } catch {
    // Trình duyệt chặn localStorage: bỏ qua, chỉ là không nhớ độ rộng
  }
}

export function ResizableSplit({
  start,
  end,
  sizedPane = 'end',
  defaultSize,
  minSize = 200,
  maxSize = Number.POSITIVE_INFINITY,
  minOtherSize = 320,
  storageKey,
  stackBelowLg = false,
  className,
  startClassName,
  endClassName,
}: ResizableSplitProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startX: number; startSize: number } | null>(null)
  const [size, setSize] = useState(() => readStoredSize(storageKey) ?? defaultSize)
  const [isDragging, setIsDragging] = useState(false)

  // Giới hạn độ rộng theo min/max và theo bề rộng khung hiện tại
  const clamp = useCallback(
    (value: number) => {
      const containerWidth = containerRef.current?.clientWidth ?? Number.POSITIVE_INFINITY
      const upper = Math.min(maxSize, containerWidth - minOtherSize)
      return Math.max(minSize, Math.min(value, upper))
    },
    [maxSize, minOtherSize, minSize],
  )

  // Khi đổi kích thước cửa sổ, kéo độ rộng về trong giới hạn
  useEffect(() => {
    const el = containerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => setSize((s) => clamp(s)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [clamp])

  const applySize = (next: number) => {
    const clamped = clamp(next)
    setSize(clamped)
    return clamped
  }

  // Kéo sang phải: cột trái to ra, cột phải nhỏ lại
  const direction = sizedPane === 'start' ? 1 : -1

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { startX: e.clientX, startSize: size }
    setIsDragging(true)
  }

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return
    applySize(drag.startSize + (e.clientX - drag.startX) * direction)
  }

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    dragRef.current = null
    setIsDragging(false)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    writeStoredSize(storageKey, size)
  }

  const handleDoubleClick = () => {
    writeStoredSize(storageKey, applySize(defaultSize))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const delta = (e.key === 'ArrowRight' ? KEYBOARD_STEP : -KEYBOARD_STEP) * direction
    writeStoredSize(storageKey, applySize(size + delta))
  }

  const sizedClass = stackBelowLg ? 'w-full lg:w-[var(--split-size)] lg:shrink-0' : 'w-[var(--split-size)] shrink-0'
  const fluidClass = 'min-w-0 flex-1'
  const sizeStyle = { '--split-size': `${size}px` } as CSSProperties

  return (
    <div
      ref={containerRef}
      className={cn('flex min-h-0', stackBelowLg ? 'flex-col gap-4 lg:flex-row lg:gap-0' : 'flex-row', isDragging && 'select-none cursor-col-resize', className)}
      style={sizeStyle}
    >
      <div className={cn(sizedPane === 'start' ? sizedClass : fluidClass, startClassName)}>{start}</div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Kéo để đổi độ rộng hai cột"
        aria-valuenow={Math.round(size)}
        tabIndex={0}
        title="Kéo để đổi độ rộng · bấm đúp để về mặc định"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          'group relative w-3 shrink-0 cursor-col-resize touch-none items-stretch justify-center outline-none',
          stackBelowLg ? 'hidden lg:flex' : 'flex',
        )}
      >
        <span
          className={cn(
            'my-2 w-[3px] rounded-full transition-colors',
            isDragging ? 'bg-[#1565C0]' : 'bg-transparent group-hover:bg-blue-300 group-focus-visible:bg-blue-400',
          )}
        />
      </div>

      <div className={cn(sizedPane === 'end' ? sizedClass : fluidClass, endClassName)}>{end}</div>
    </div>
  )
}
