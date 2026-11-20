import type { ReactNode } from 'react'
import { FileX2, AlertTriangle } from 'lucide-react'
import { Button, Skeleton } from '@/shared/components/ui'
import { isApiError } from '@/shared/types'
import { ScoreResultCard } from '../components/ScoreResultCard'
import { useMyScore } from '../hooks/useScoreManagement'
import { SCORE_ERROR_CODE } from '../types/score.types'

// Trạng thái rỗng / lỗi hiển thị trong trang (request dùng skipErrorToast nên không có toast)
function StatusCard({
  icon,
  text,
  onRetry,
  retrying,
}: {
  icon: ReactNode
  text: string
  onRetry?: () => void
  retrying?: boolean
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-10 shadow-xs flex flex-col items-center gap-3 text-center">
      {icon}
      <p className="text-sm font-medium text-slate-600">{text}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} disabled={retrying}>
          {retrying ? 'Đang tải lại...' : 'Thử lại'}
        </Button>
      )}
    </div>
  )
}

function ScoreCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
      <Skeleton className="h-6 w-64" />
      <Skeleton className="h-4 w-96 max-w-full" />
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-40 w-full" />
    </div>
  )
}

export default function StudentResultsPage() {
  const { data, isPending, isError, error, refetch, isFetching } = useMyScore()

  let content: ReactNode
  if (isPending) {
    content = <ScoreCardSkeleton />
  } else if (isError) {
    const code = isApiError(error) ? error.code : undefined
    const emptyIcon = <FileX2 className="size-10 text-slate-300" />
    if (code === SCORE_ERROR_CODE.TOPIC_NOT_FOUND) {
      content = <StatusCard icon={emptyIcon} text="Bạn chưa có đề tài đồ án trong học kỳ này." />
    } else if (code === SCORE_ERROR_CODE.SEMESTER_REQUIRED) {
      content = <StatusCard icon={emptyIcon} text="Hiện chưa có học kỳ nào đang diễn ra." />
    } else {
      content = (
        <StatusCard
          icon={<AlertTriangle className="size-10 text-rose-400" />}
          text="Không tải được kết quả. Vui lòng thử lại."
          onRetry={() => refetch()}
          retrying={isFetching}
        />
      )
    }
  } else {
    content = <ScoreResultCard item={data} />
  }

  return <div className="max-w-7xl w-full mx-auto space-y-6">{content}</div>
}
