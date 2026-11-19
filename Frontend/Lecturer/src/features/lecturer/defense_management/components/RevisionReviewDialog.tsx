import React, { useState } from 'react'
import { CheckCircle2, ExternalLink, RotateCcw } from 'lucide-react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Skeleton,
} from '@/shared/components/ui'
import { formatDate } from '@/shared/utils'
import { useDefenseRevisionDetail, useReviewDefenseRevision } from '../hooks/useDefenseEvaluation'
import type { DefenseRevision, RevisionStatus } from '../types'

const STATUS_LABEL: Record<RevisionStatus, string> = {
  REQUIRED: 'Chờ nộp',
  SUBMITTED: 'Đã nộp – chờ duyệt',
  APPROVED: 'Đã duyệt',
  RETURNED: 'Bị trả lại',
  OVERDUE: 'Quá hạn',
}

interface RevisionReviewDialogProps {
  revisionPublicId: string | null
  onClose: () => void
}

/**
 * BƯỚC 14 – Pha 3b: Thư ký / Chủ tịch xem và duyệt bản sửa báo cáo sau bảo vệ.
 * Duyệt (APPROVED) → đồ án hoàn thành; Trả lại (RETURNED) bắt buộc lý do.
 */
export const RevisionReviewDialog: React.FC<RevisionReviewDialogProps> = ({ revisionPublicId, onClose }) => {
  const { data, isPending, isError } = useDefenseRevisionDetail(revisionPublicId)

  return (
    <Dialog open={Boolean(revisionPublicId)} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900">Chỉnh sửa báo cáo sau bảo vệ</DialogTitle>
        </DialogHeader>
        {isPending && <Skeleton className="h-60 w-full" />}
        {isError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-4 rounded-xl">
            Không tải được thông tin chỉnh sửa báo cáo.
          </div>
        )}
        {data && <RevisionContent key={`${data.status}-${data.submittedAt ?? ''}`} revision={data} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

const RevisionContent: React.FC<{ revision: DefenseRevision; onClose: () => void }> = ({ revision, onClose }) => {
  const reviewMutation = useReviewDefenseRevision()
  const [note, setNote] = useState('')
  const [noteError, setNoteError] = useState<string | null>(null)

  const review = (decision: 'APPROVED' | 'RETURNED') => {
    if (decision === 'RETURNED' && !note.trim()) {
      setNoteError('Vui lòng nhập lý do trả lại bản sửa')
      return
    }
    reviewMutation.mutate(
      { revisionPublicId: revision.revisionPublicId, data: { decision, reviewNote: note.trim() || null } },
      { onSuccess: onClose },
    )
  }

  const fileLink = (url: string | null, name: string | null, label: string) =>
    url ? (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[#1565C0] font-semibold hover:underline"
      >
        <ExternalLink className="w-3.5 h-3.5" /> {name || label}
      </a>
    ) : (
      <span className="text-slate-400">Không có</span>
    )

  return (
    <div className="text-xs text-slate-700 space-y-4">
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
        <div>
          <b>Sinh viên:</b> {revision.studentName} ({revision.studentCode}) · Hội đồng {revision.councilCode}
        </div>
        <div>
          <b>Đề tài:</b> {revision.topicName || '—'}
        </div>
        <div>
          <b>Trạng thái:</b> <span className="font-bold text-[#1565C0]">{STATUS_LABEL[revision.status]}</span>
          {revision.deadlineEndAt && <> · Hạn nộp: {formatDate(revision.deadlineEndAt, 'full')}</>}
        </div>
      </div>

      <div>
        <div className="font-bold text-slate-900 mb-1">Nội dung Hội đồng yêu cầu chỉnh sửa</div>
        <div className="whitespace-pre-line p-3 rounded-xl border border-slate-200">{revision.requirement}</div>
      </div>

      {revision.submittedAt && (
        <div className="space-y-1">
          <div className="font-bold text-slate-900">Bản nộp mới nhất ({formatDate(revision.submittedAt, 'full')})</div>
          <div>Báo cáo đã sửa: {fileLink(revision.revisedReportFile, revision.revisedReportFileName, 'Báo cáo')}</div>
          <div>Bản giải trình: {fileLink(revision.explanationFile, revision.explanationFileName, 'Giải trình')}</div>
          {revision.studentNote && <div>Ghi chú của sinh viên: {revision.studentNote}</div>}
        </div>
      )}

      {revision.histories.length > 1 && (
        <div>
          <div className="font-bold text-slate-900 mb-1">Lịch sử nộp</div>
          <ul className="space-y-1">
            {revision.histories.map((h) => (
              <li key={h.historyPublicId} className="p-2 rounded-lg border border-slate-100">
                {formatDate(h.submittedAt, 'full')} – <b>{STATUS_LABEL[h.status]}</b>
                {h.reviewNote && <> – Lý do: {h.reviewNote}</>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {revision.canReview ? (
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <label className="font-bold text-slate-900">Nhận xét / lý do trả lại</label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => {
              setNote(e.target.value)
              setNoteError(null)
            }}
            placeholder="Bắt buộc khi trả lại bản sửa"
            className={`w-full p-2.5 rounded-xl border text-xs outline-none focus:border-[#1565C0] ${
              noteError ? 'border-[#DC2626]' : 'border-slate-300'
            }`}
          />
          {noteError && <p className="text-xs font-bold text-[#DC2626]">{noteError}</p>}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={reviewMutation.isPending}
              onClick={() => review('RETURNED')}
              className="inline-flex items-center gap-1.5 text-orange-700 border-orange-300"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Trả lại
            </Button>
            <Button
              size="sm"
              disabled={reviewMutation.isPending}
              onClick={() => review('APPROVED')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> {reviewMutation.isPending ? 'Đang lưu...' : 'Duyệt'}
            </Button>
          </div>
        </div>
      ) : (
        revision.reviewNote && (
          <div className="border-t border-slate-100 pt-3">
            <b>Nhận xét của người duyệt{revision.reviewerName ? ` (${revision.reviewerName})` : ''}:</b>{' '}
            {revision.reviewNote}
          </div>
        )
      )}
    </div>
  )
}

export default RevisionReviewDialog
