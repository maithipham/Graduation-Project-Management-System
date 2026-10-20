import { Badge } from '@/shared/components/ui'

export function StudentStatusBadge({ active }: { active: boolean }) {
  return active ? (
    <Badge variant="success" className="gap-1.5">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
      Đang hoạt động
    </Badge>
  ) : (
    <Badge variant="secondary" className="gap-1.5 text-slate-600">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden="true" />
      Đã tắt
    </Badge>
  )
}
