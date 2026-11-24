import { CheckCircle2, Circle, Clock } from 'lucide-react'
import { Skeleton } from '@/shared/components/ui'
import { cn, formatDate } from '@/shared/utils'
import type { MilestoneProgress, MilestoneState } from '../types/deadline.types'

interface DeadlineProgressProps {
  milestones: MilestoneProgress[]
  percent: number
  semesterName?: string
  isLoading: boolean
  isError: boolean
}

const STATE_LABEL: Record<MilestoneState, string> = {
  done: 'Đã kết thúc',
  active: 'Đang diễn ra',
  upcoming: 'Sắp tới',
  unscheduled: 'Chưa thiết lập',
}

const STATE_TONE: Record<MilestoneState, string> = {
  done: 'text-emerald-600',
  active: 'text-blue-600',
  upcoming: 'text-slate-500',
  unscheduled: 'text-slate-400',
}

function StateIcon({ state }: { state: MilestoneState }) {
  if (state === 'done') return <CheckCircle2 className="size-5 text-emerald-500" />
  if (state === 'active') return <Clock className="size-5 text-blue-500" />
  return <Circle className="size-5 text-slate-300" />
}

export function DeadlineProgress({
  milestones,
  percent,
  semesterName,
  isLoading,
  isError,
}: DeadlineProgressProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Tiến độ đồ án</h2>
          {semesterName && <p className="text-xs text-slate-500">{semesterName}</p>}
        </div>
        <span className="text-2xl font-bold text-blue-600">{percent}%</span>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {isError && (
        <p className="text-xs text-rose-600">Không tải được các mốc thời hạn của học kỳ.</p>
      )}

      {!isLoading && !isError && milestones.length === 0 && (
        <p className="text-xs text-slate-500">Học kỳ hiện tại chưa có mốc thời hạn nào.</p>
      )}

      <ol className="space-y-1">
        {milestones.map((m) => (
          <li
            key={m.templateId}
            className={cn(
              'flex items-start gap-3 rounded-lg px-3 py-2.5',
              m.state === 'active' && 'bg-blue-50/60',
            )}
          >
            <span className="mt-0.5 shrink-0">
              <StateIcon state={m.state} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-x-3">
                <span
                  className={cn(
                    'text-sm font-medium',
                    m.state === 'unscheduled' ? 'text-slate-400' : 'text-slate-900',
                  )}
                >
                  {m.name}
                </span>
                <span className={cn('text-xs font-semibold', STATE_TONE[m.state])}>
                  {STATE_LABEL[m.state]}
                </span>
              </div>
              {m.state !== 'unscheduled' && (
                <p className="text-xs text-slate-500">
                  {formatDate(m.startDate, 'full')} – {formatDate(m.endDate, 'full')}
                </p>
              )}
              {m.state === 'active' && (
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-blue-100">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${Math.round(m.elapsed * 100)}%` }}
                  />
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
