import { useEffect, useRef, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { Skeleton } from '@/shared/components/ui'
import { cn, formatDate } from '@/shared/utils'
import { useMarkAllNotificationsRead, useNotifications } from '../hooks/useNotifications'
import { useNotificationStream } from '../hooks/useNotificationStream'

/**
 * Quả chuông trên header: số thông báo chưa đọc + danh sách thả xuống.
 * Mở chuông khi còn thông báo chưa đọc → tự đánh dấu tất cả là đã đọc (PATCH /notification).
 * Đồng thời giữ kết nối SSE để nhận thông báo mới trong lúc đang dùng.
 */
export function NotificationBell() {
  useNotificationStream()
  const { data: notifications = [], isPending, isError } = useNotifications()
  const markAllRead = useMarkAllNotificationsRead()

  const [open, setOpen] = useState(false)
  // Những thông báo chưa đọc lúc mở chuông: vẫn tô nổi bật dù đã được đánh dấu đã đọc ngay sau đó
  const [highlightIds, setHighlightIds] = useState<ReadonlySet<number>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((item) => !item.isRead).length

  const close = () => {
    setOpen(false)
    setHighlightIds(new Set())
  }

  // Đóng khi bấm ra ngoài hoặc nhấn Esc
  useEffect(() => {
    if (!open) return
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) close()
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const handleToggle = () => {
    if (open) {
      close()
      return
    }
    setOpen(true)
    if (unreadCount > 0) {
      setHighlightIds(new Set(notifications.filter((item) => !item.isRead).map((item) => item.id)))
      markAllRead.mutate()
    }
  }

  const renderContent = () => {
    if (isPending) {
      return (
        <div className="space-y-3 px-4 py-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="space-y-1.5">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      )
    }

    if (isError) {
      return (
        <p className="px-4 py-8 text-center text-xs text-slate-500">
          Không tải được thông báo. Vui lòng thử lại sau.
        </p>
      )
    }

    if (notifications.length === 0) {
      return (
        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
          <BellOff size={22} className="text-slate-300" />
          <p className="text-xs text-slate-500">Chưa có thông báo nào.</p>
        </div>
      )
    }

    return (
      <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
        {notifications.map((item) => {
          const isNew = !item.isRead || highlightIds.has(item.id)
          return (
            <li key={item.id} className={cn('flex gap-2.5 px-4 py-3', isNew && 'bg-blue-50/60')}>
              <span
                className={cn(
                  'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                  isNew ? 'bg-[#1565C0]' : 'bg-transparent',
                )}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p
                  className={cn(
                    'whitespace-pre-line break-words text-xs',
                    isNew ? 'font-semibold text-slate-800' : 'text-slate-600',
                  )}
                >
                  {item.message}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">{formatDate(item.createdAt, 'full')}</p>
              </div>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="relative cursor-pointer rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
        aria-label={unreadCount > 0 ? `Thông báo (${unreadCount} chưa đọc)` : 'Thông báo'}
        aria-expanded={open}
        title="Thông báo"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          <div className="border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-bold text-slate-800">Thông báo</span>
          </div>
          {renderContent()}
        </div>
      )}
    </div>
  )
}
