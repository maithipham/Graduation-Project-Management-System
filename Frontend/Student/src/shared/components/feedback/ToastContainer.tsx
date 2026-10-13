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
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
    textClass: 'text-emerald-900',
    iconClass: 'text-emerald-600',
  },
  error: {
    icon: AlertCircle,
    bgClass: 'bg-rose-50',
    borderClass: 'border-rose-200',
    textClass: 'text-rose-900',
    iconClass: 'text-rose-600',
  },
  warning: {
    icon: AlertTriangle,
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    textClass: 'text-amber-900',
    iconClass: 'text-amber-600',
  },
  info: {
    icon: Info,
    bgClass: 'bg-sky-50',
    borderClass: 'border-sky-200',
    textClass: 'text-sky-900',
    iconClass: 'text-sky-600',
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
      <div className={`mt-0.5 shrink-0 ${config.iconClass}`}>
        <Icon className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-snug break-words ${config.textClass}`}>
          {item.message}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        aria-label="Đóng thông báo"
        className="shrink-0 rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-black/5 transition-colors cursor-pointer"
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
