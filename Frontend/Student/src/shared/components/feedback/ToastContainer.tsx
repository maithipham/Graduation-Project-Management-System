import React from 'react'
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react'
import { useToastStore, type ToastType, type ToastItem } from './toast.store'

const TOAST_CONFIGS: Record<
  ToastType,
  {
    icon: React.ComponentType<{ className?: string }>
    bgClass: string
    borderClass: string
    textClass: string
    iconClass: string
  }
> = {
  success: {
    icon: CheckCircle2,
    bgClass: 'bg-emerald-100',
    borderClass: 'border-emerald-300',
    textClass: 'text-emerald-950',
    iconClass: 'text-emerald-700',
  },
  error: {
    icon: AlertCircle,
    bgClass: 'bg-rose-100',
    borderClass: 'border-rose-300',
    textClass: 'text-rose-950',
    iconClass: 'text-rose-700',
  },
  warning: {
    icon: AlertTriangle,
    bgClass: 'bg-amber-100',
    borderClass: 'border-amber-300',
    textClass: 'text-amber-950',
    iconClass: 'text-amber-700',
  },
  info: {
    icon: Info,
    bgClass: 'bg-sky-100',
    borderClass: 'border-sky-300',
    textClass: 'text-sky-950',
    iconClass: 'text-sky-700',
  },
}

function ToastSingleItem({
  item,
  onDismiss,
}: {
  item: ToastItem
  onDismiss: (id: string) => void
}) {
  const config = TOAST_CONFIGS[item.type]
  const Icon = config.icon

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex items-start gap-3 w-full max-w-sm rounded-xl border p-4 shadow-lg backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-3 ${config.bgClass} ${config.borderClass}`}
    >
      {/* Icon, chữ và nút đóng cùng cao 20px (= leading-5 của chữ) → thẳng hàng với dòng chữ đầu tiên,
          thông báo nhiều dòng thì icon vẫn đứng ở dòng đầu */}
      <div className={`flex h-5 shrink-0 items-center ${config.iconClass}`}>
        <Icon className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-5 break-words ${config.textClass}`}>
          {item.message}
        </p>
      </div>

      {/* p-1.5 + -m-1: vùng bấm 28px nhưng chỉ chiếm 20px trong bố cục, dấu X nằm giữa dòng chữ đầu tiên */}
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        aria-label="Đóng thông báo"
        className="-m-1 flex shrink-0 items-center rounded-lg p-1.5 text-slate-500 hover:text-slate-800 hover:bg-black/5 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts)
  const removeToast = useToastStore((state) => state.removeToast)

  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((t) => (
        <ToastSingleItem key={t.id} item={t} onDismiss={removeToast} />
      ))}
    </div>
  )
}

export default ToastContainer
