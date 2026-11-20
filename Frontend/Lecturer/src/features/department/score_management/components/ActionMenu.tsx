import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal, type LucideIcon } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

export interface ActionMenuItem {
  label: string
  icon: LucideIcon
  onSelect: () => void
  /** Thao tác nguy hiểm (Xóa, Hủy áp dụng) → chữ đỏ */
  danger?: boolean
}

/** Rộng menu = w-36 của mockup */
const MENU_WIDTH = 144

/** Nút "···" ở cột thao tác, bấm vào hiện danh sách thao tác. Không có mục nào → không hiện nút */
export function ActionMenu({ items }: { items: ActionMenuItem[] }) {
  // Menu dùng vị trí fixed: bảng có overflow nên menu absolute sẽ bị cắt ở các dòng cuối
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const open = position !== null

  useEffect(() => {
    if (!open) return
    function close() {
      setPosition(null)
    }
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) close()
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  if (items.length === 0) return null

  function toggle() {
    const rect = buttonRef.current?.getBoundingClientRect()
    setPosition(open || !rect ? null : { top: rect.bottom + 4, left: rect.right - MENU_WIDTH })
  }

  function run(action: () => void) {
    setPosition(null)
    action()
  }

  return (
    <div ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Thao tác khác"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {position && (
        <div
          role="menu"
          style={{ top: position.top, left: position.left, width: MENU_WIDTH }}
          className="fixed z-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-left shadow-lg"
        >
          {items.map(({ label, icon: Icon, onSelect, danger }) => (
            <button
              key={label}
              type="button"
              role="menuitem"
              onClick={() => run(onSelect)}
              className={cn(
                'flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-[12.5px] font-medium',
                danger ? 'text-rose-600 hover:bg-rose-50' : 'text-slate-700 hover:bg-slate-50',
              )}
            >
              <Icon className={cn('h-3.5 w-3.5', !danger && 'text-slate-500')} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
