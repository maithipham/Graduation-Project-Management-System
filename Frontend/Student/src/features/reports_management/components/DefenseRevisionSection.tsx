import React, { useState } from 'react'
import { AlertTriangle, Clock, Eye, FilePen, History, Upload } from 'lucide-react'
import { Skeleton } from '@/shared/components/ui'
import { cn, formatDate } from '@/shared/utils'
import { useMyDefenseRevision, useSubmitDefenseRevision } from '../hooks/useDefenseRevision'
import { isSafeReportFileUrl } from '../services/reports.service'
import type {
  DefenseRevisionResponse,
  DefenseRevisionStatus,
} from '../types/defenseRevision.types'
import {
  SubmitDefenseRevisionModal,
  type SubmitRevisionValues,
} from './SubmitDefenseRevisionModal'

const STATUS_STYLE: Record<DefenseRevisionStatus, { label: string; className: string }> = {
  REQUIRED: { label: 'Chờ nộp', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  SUBMITTED: { label: 'Đã nộp, chờ duyệt', className: 'bg-blue-50 text-[#1565C0] border-blue-200' },
  APPROVED: { label: 'Đã duyệt', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  RETURNED: { label: 'Bị trả lại', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  OVERDUE: { label: 'Quá hạn', className: 'bg-slate-100 text-slate-600 border-slate-300' },
}

function StatusBadge({ status }: { status: DefenseRevisionStatus }) {
  const config = STATUS_STYLE[status] ?? STATUS_STYLE.REQUIRED
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border whitespace-nowrap',
        config.className,
      )}
    >
      {config.label}
    </span>
  )
}

function FileLink({ url, name, fallback }: { url: string | null; name: string | null; fallback: string }) {
  if (!url) return <span className="text-slate-400">Chưa có</span>
  const label = name || fallback
  if (!isSafeReportFileUrl(url)) {
    return <span className="font-medium text-slate-800 break-all">{label}</span>
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-medium text-slate-800 hover:text-[#1565C0] hover:underline break-all"
    >
      {label}
      <Eye className="w-3.5 h-3.5 shrink-0 text-slate-400" />
    </a>
  )
}

/** Dòng giải thích khi nút nộp bị khóa (BE vẫn kiểm tra lại). */
function getLockedReason(revision: DefenseRevisionResponse): string | null {
  if (revision.submitOpen) return null
  switch (revision.status) {
    case 'SUBMITTED':
      return 'Bạn đã nộp bản sửa, đang chờ Thư ký / Chủ tịch Hội đồng duyệt.'
    case 'APPROVED':
      return 'Bản sửa đã được duyệt. Đồ án của bạn đã hoàn thành.'
    case 'OVERDUE':
      return 'Đã hết hạn nộp báo cáo sau bảo vệ.'
    default:
      if (!revision.deadlineEndAt) return 'Hạn nộp sẽ được thông báo sau.'
      if (revision.deadlineStartAt && new Date(revision.deadlineStartAt) > new Date()) {
        return 'Chưa đến thời gian nộp báo cáo sau bảo vệ.'
      }
      return 'Đã hết hạn nộp báo cáo sau bảo vệ.'
  }
}

/**
 * Khối "Nộp lại báo cáo sau bảo vệ" trên trang Báo cáo.
 * Chỉ hiện khi Thư ký đánh dấu sinh viên phải nộp lại trong biên bản và Hội đồng đã hoàn tất bảo vệ.
 */
export const DefenseRevisionSection: React.FC = () => {
  const { data: revision, isPending, isError } = useMyDefenseRevision()
  const submitMutation = useSubmitDefenseRevision()
  const [modalOpen, setModalOpen] = useState(false)

  // Không có yêu cầu hoặc lỗi tải (interceptor đã toast) → không chiếm chỗ trên trang
  if (isError || (!isPending && !revision)) return null

  if (isPending) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-xs space-y-2">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
    )
  }

  if (!revision) return null

  const histories = revision.histories ?? []
  const lockedReason = getLockedReason(revision)
  const isResubmit = histories.length > 0

  const handleSubmit = async (values: SubmitRevisionValues) => {
    await submitMutation.mutateAsync({ revisionPublicId: revision.revisionPublicId, ...values })
    setModalOpen(false)
  }

  return (
    <div
      id="defenseRevisionSection"
      className={cn(
        'rounded-xl border bg-white shadow-xs overflow-hidden',
        revision.status === 'APPROVED' ? 'border-emerald-200' : 'border-amber-300',
      )}
    >
      {/* Tiêu đề + trạng thái + nút nộp */}
      <div
        className={cn(
          'px-5 py-3.5 border-b flex items-center justify-between gap-3 flex-wrap',
          revision.status === 'APPROVED'
            ? 'bg-emerald-50/60 border-emerald-100'
            : 'bg-amber-50/70 border-amber-100',
        )}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <FilePen className="w-4 h-4 text-amber-700 shrink-0" />
          <h2 className="text-xs sm:text-[13px] font-bold text-slate-900">
            Nộp lại báo cáo cuối cùng sau bảo vệ
          </h2>
          <StatusBadge status={revision.status} />
        </div>
        <button
          type="button"
          id="btnOpenDefenseRevisionModal"
          disabled={!revision.submitOpen || submitMutation.isPending}
          onClick={() => setModalOpen(true)}
          className="h-9 px-5 rounded-lg border border-[#1565C0] bg-white text-[#1565C0] hover:bg-blue-50/70 disabled:border-slate-200 disabled:text-slate-400 disabled:bg-slate-100 disabled:cursor-not-allowed text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap uppercase tracking-wide"
        >
          <Upload className="w-4 h-4" />
          {submitMutation.isPending ? 'Đang nộp...' : isResubmit ? 'Nộp lại' : 'Nộp bản sửa'}
        </button>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs text-slate-600">
        {/* Yêu cầu của Hội đồng */}
        <div className="space-y-2">
          <div className="text-slate-500">
            Hội đồng <strong className="text-slate-800">{revision.councilCode}</strong> yêu cầu chỉnh sửa:
          </div>
          <p className="whitespace-pre-line wrap-break-word text-slate-800 leading-relaxed bg-slate-50 rounded-lg p-3 border border-slate-200/70">
            {revision.requirement}
          </p>
          <div className="flex items-center gap-1.5 text-slate-700">
            <Clock className="w-4 h-4 text-[#1565C0] shrink-0" />
            <span>
              Hạn nộp:{' '}
              <strong className="text-slate-900">
                {revision.deadlineEndAt
                  ? `${revision.deadlineStartAt ? `${formatDate(revision.deadlineStartAt, 'full')} – ` : ''}${formatDate(revision.deadlineEndAt, 'full')}`
                  : 'Sẽ được thông báo sau'}
              </strong>
            </span>
          </div>
          {lockedReason && (
            <p
              className={cn(
                'text-[11.5px] font-medium rounded-md px-2.5 py-1.5 border leading-snug',
                revision.status === 'APPROVED'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200',
              )}
            >
              {lockedReason}
            </p>
          )}
        </div>

        {/* Bản nộp mới nhất + nhận xét người duyệt */}
        <div className="space-y-2">
          <div className="font-semibold text-slate-800">Bản nộp mới nhất</div>
          {!revision.submittedAt ? (
            <p className="text-slate-500">Bạn chưa nộp bản sửa nào.</p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <span className="text-slate-500 shrink-0">Báo cáo đã sửa:</span>
                <FileLink
                  url={revision.revisedReportFile}
                  name={revision.revisedReportFileName}
                  fallback="Báo cáo"
                />
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-slate-500 shrink-0">Bản giải trình:</span>
                <FileLink
                  url={revision.explanationFile}
                  name={revision.explanationFileName}
                  fallback="Giải trình"
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Thời gian nộp:</span>
                <span className="font-medium text-slate-800">
                  {formatDate(revision.submittedAt, 'full')}
                </span>
              </div>
            </>
          )}
          {revision.reviewNote && (
            <div
              role={revision.status === 'RETURNED' ? 'alert' : undefined}
              className={cn(
                'mt-1 rounded-lg p-2.5 border space-y-1',
                revision.status === 'RETURNED'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-slate-50 border-slate-200/70 text-slate-700',
              )}
            >
              <div className="font-semibold flex items-center gap-1.5">
                {revision.status === 'RETURNED' && <AlertTriangle className="w-4 h-4 shrink-0" />}
                {revision.status === 'RETURNED' ? 'Lý do trả lại' : 'Nhận xét'}
                {revision.reviewerName ? ` (${revision.reviewerName})` : ''}:
              </div>
              <p className="whitespace-pre-line wrap-break-word">{revision.reviewNote}</p>
            </div>
          )}
        </div>
      </div>

      {/* Lịch sử nộp */}
      {histories.length > 0 && (
        <div className="border-t border-slate-100">
          <div className="px-5 py-3 flex items-center gap-2">
            <History className="w-4 h-4 text-[#1565C0]" />
            <h3 className="text-xs font-bold text-slate-900">Lịch sử nộp sau bảo vệ</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead className="bg-slate-50/70 text-[12px] font-semibold text-slate-700 border-y border-slate-100">
                <tr>
                  <th className="py-2.5 px-5">Thời gian nộp</th>
                  <th className="py-2.5 px-5">Báo cáo / Giải trình</th>
                  <th className="py-2.5 px-5">Trạng thái</th>
                  <th className="py-2.5 px-5">Nhận xét người duyệt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {histories.map((h) => (
                  <tr key={h.historyPublicId} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-5 text-slate-900 font-medium whitespace-nowrap">
                      {formatDate(h.submittedAt, 'full')}
                    </td>
                    <td className="py-3 px-5 space-y-1">
                      <div>
                        <FileLink url={h.revisedReportFile} name={h.revisedReportFileName} fallback="Báo cáo" />
                      </div>
                      {h.explanationFile && (
                        <div>
                          <FileLink url={h.explanationFile} name={h.explanationFileName} fallback="Giải trình" />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex flex-col items-start gap-1">
                        <StatusBadge status={h.status} />
                        {h.reviewedAt && (
                          <span className="text-[11px] text-slate-500">{formatDate(h.reviewedAt, 'full')}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-5 max-w-[280px] wrap-break-word whitespace-pre-line">
                      {h.reviewNote
                        ? `${h.reviewerName ? `${h.reviewerName}: ` : ''}${h.reviewNote}`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <SubmitDefenseRevisionModal
        open={modalOpen}
        isSubmitting={submitMutation.isPending}
        isResubmit={isResubmit}
        onClose={() => setModalOpen(false)}
        onSubmitRevision={handleSubmit}
      />
    </div>
  )
}
