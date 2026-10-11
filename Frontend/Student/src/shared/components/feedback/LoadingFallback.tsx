import { Loader2 } from 'lucide-react'

export function LoadingFallback() {
  return (
    <div
      aria-label="Đang tải trang"
      className="flex min-h-[240px] items-center justify-center gap-3 text-slate-500 animate-in fade-in duration-300"
      role="status"
    >
      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      <span className="text-sm font-medium">Đang tải dữ liệu hệ thống...</span>
    </div>
  )
}
