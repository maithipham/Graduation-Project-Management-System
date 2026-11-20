import { CheckSquare, Eye, Lock } from 'lucide-react'
import { Skeleton } from '@/shared/components/ui'
import { cn } from '@/shared/utils/cn'
import type { AdvisorGradeDeadline, AdvisorGradeTopic } from '../types/advisorGrade.types'
import {
  ADVISOR_GRADE_STATUS_META,
  canOpenAdvisorGradeSheet,
  getAdvisorGradeActionLabel,
  getAdvisorGradeReadonlyMessage,
} from '../utils/advisorGrade.utils'

// Ô "Điểm hướng dẫn" trên bảng: trạng thái phiếu (C1) + nút mở popup phiếu chấm.

const TONE_CLASS = {
  slate: 'bg-slate-50 text-slate-600 border-slate-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
} as const

interface AdvisorGradeCellProps {
  /** Dòng tương ứng ở C1; `undefined` = đề tài không có trong danh sách chấm */
  topic: AdvisorGradeTopic | undefined
  deadline: AdvisorGradeDeadline | null
  isLoading?: boolean
  onOpen: (topic: AdvisorGradeTopic) => void
}

export function AdvisorGradeCell({ topic, deadline, isLoading = false, onOpen }: AdvisorGradeCellProps) {
  if (isLoading) return <Skeleton className="h-8 w-28" />

  if (!topic) {
    return <span className="text-[12px] italic text-slate-400">Chưa đến giai đoạn chấm</span>
  }

  const reason = getAdvisorGradeReadonlyMessage(topic.readonlyReason, deadline)

  // Chưa có phiếu và không chấm được → không mở (gọi C2 chắc chắn lỗi)
  if (!canOpenAdvisorGradeSheet(topic)) {
    return (
      <div className="flex max-w-[200px] flex-col items-start gap-1">
        <button
          type="button"
          disabled
          title={reason ?? undefined}
          className="inline-flex h-8 cursor-not-allowed items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-[12px] font-bold text-slate-400"
        >
          <Lock className="h-3.5 w-3.5" />
          <span>Chấm điểm</span>
        </button>
        {reason && <span className="whitespace-normal text-[11px] leading-snug text-slate-500">{reason}</span>}
      </div>
    )
  }

  const label = getAdvisorGradeActionLabel(topic)
  const status = ADVISOR_GRADE_STATUS_META[topic.sheetStatus]

  if (topic.sheetStatus === 'SUBMITTED') {
    return (
      <div className="inline-flex items-center gap-1.5">
        <span className="text-[13.5px] font-extrabold text-slate-900">
          {topic.advisorScore === null ? '—' : topic.advisorScore.toFixed(1)}
        </span>
        <span className="text-xs font-semibold text-slate-400">/ 10.0</span>
        <button
          type="button"
          onClick={() => onOpen(topic)}
          className="ml-0.5 inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-[12px] font-semibold text-slate-500 transition hover:bg-blue-50 hover:text-[#1565C0]"
          title="Xem phiếu chấm đã nộp"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>Xem</span>
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => onOpen(topic)}
        title={reason ?? undefined}
        className={cn(
          'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-3.5 text-[12px] font-bold shadow-xs transition',
          label === 'Chấm'
            ? 'bg-[#1565C0] text-white hover:bg-blue-700'
            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
        )}
      >
        {label === 'Chấm' ? <CheckSquare className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        <span>{label === 'Chấm' ? 'Chấm điểm' : 'Xem'}</span>
      </button>
      {topic.sheetStatus === 'DRAFT' && (
        <span
          className={cn(
            'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold',
            TONE_CLASS[status.tone],
          )}
        >
          {status.label}
          {topic.totalCriteria !== null && ` · ${topic.gradedCount}/${topic.totalCriteria} tiêu chí`}
        </span>
      )}
    </div>
  )
}
