/** Badge trạng thái tài khoản sinh viên: true = Hoạt động, false = Không hoạt động */
export function StudentAccountStatusBadge({ active }: { active: boolean }) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
        Hoạt động
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
      Không hoạt động
    </span>
  )
}
