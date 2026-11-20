import { useState } from 'react'
import {
  AlertTriangle,
  BookOpenCheck,
  ClipboardCheck,
  Clock,
  Eye,
  FileText,
  FileX,
  Upload,
} from 'lucide-react'
import { Skeleton } from '@/shared/components/ui'
import { cn, formatDate } from '@/shared/utils'
import { SubmitReportModal } from '../components/SubmitReportModal'
import { useMyFinalReport, useSubmitFinalReport } from '../hooks/useReportsManagement'
import { extractReportFileName, isSafeReportFileUrl } from '../services/reports.service'
import type { FinalReportStatus } from '../types/reports.types'
import {
  formatReportDeadlineName,
  getFinalReportSubmitState,
} from '../utils/reportDeadline'

const FINAL_REPORT_STATUS_STYLE: Record<
  FinalReportStatus,
  { label: string; badgeClassName: string }
> = {
  APPROVED: {
    label: 'Đã duyệt đạt',
    badgeClassName: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  REQUEST_CHANGES: {
    label: 'Yêu cầu chỉnh sửa',
    badgeClassName: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  REJECTED: {
    label: 'Không đạt',
    badgeClassName: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  PENDING: {
    label: 'Đã nộp, chờ nhận xét',
    badgeClassName: 'bg-blue-50 text-[#1565C0] border-blue-200',
  },
}

function renderStatusBadge(
  status: FinalReportStatus,
  statusDescription?: string | null,
  reviewedAt?: string | null,
) {
  const config = FINAL_REPORT_STATUS_STYLE[status] ?? FINAL_REPORT_STATUS_STYLE.PENDING
  return (
    <div className="flex flex-col items-start gap-1">
      <span
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border',
          config.badgeClassName,
        )}
      >
        {statusDescription || config.label}
      </span>
      {reviewedAt && (
        <span className="text-[11px] text-slate-500 font-medium">
          {formatDate(reviewedAt, 'full')}
        </span>
      )}
    </div>
  )
}

function renderFileLink(fileUrl: string | null | undefined, fallbackName: string, title: string) {
  if (!fileUrl) return <span className="text-slate-400">Chưa có</span>
  const fileName = extractReportFileName(fileUrl, fallbackName)
  if (!isSafeReportFileUrl(fileUrl)) {
    return <span className="font-medium text-slate-800 break-all">{fileName}</span>
  }
  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-[#1565C0] hover:underline font-medium text-slate-800 break-all"
        title={title}
      >
        {fileName}
      </a>
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="p-0.5 rounded text-slate-400 hover:text-[#1565C0] hover:bg-blue-50 transition shrink-0"
        title={title}
        aria-label={title}
      >
        <Eye className="w-4 h-4" />
      </a>
    </div>
  )
}

export default function StudentReportsPage() {
  const { data: reportData, isPending, isError } = useMyFinalReport()
  const submitReportMutation = useSubmitFinalReport()
  const [submitModalOpen, setSubmitModalOpen] = useState(false)

  const submitState = getFinalReportSubmitState(reportData)
  const { deadlineDisplay } = submitState
  const canSubmit = !isPending && !isError && submitState.canSubmit

  const hasTopic = Boolean(reportData?.topicPublicId)
  const isDisqualified = reportData?.topicStatus === 'DISQUALIFIED'
  const histories = reportData?.histories ?? []
  const hasSubmittedBefore = Boolean(reportData?.publicId) || histories.length > 0
  const progressReport = reportData?.progressReport ?? null

  const handleSubmitReport = async (file: File) => {
    await submitReportMutation.mutateAsync(file)
    setSubmitModalOpen(false)
  }

  return (
    <div className="w-full max-w-full space-y-5">
      {/* 1. Khối thông tin đề tài, thời hạn nộp & nút Nộp báo cáo Final */}
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-xs">
        {isPending ? (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto] gap-4 items-center">
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-5 w-80 max-w-full" />
              <Skeleton className="h-4 w-56" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-5 w-52" />
            </div>
            <Skeleton className="h-9 w-36 rounded-lg" />
          </div>
        ) : isError ? (
          <div
            role="alert"
            className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs font-medium text-rose-700"
          >
            Không tải được thông tin báo cáo Final từ máy chủ. Vui lòng thử lại sau.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto] divide-y lg:divide-y-0 lg:divide-x divide-slate-100 items-center gap-4 lg:gap-0">
            {/* Cột 1: Thông tin đề tài & GVHD */}
            <div className="lg:pr-5 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <BookOpenCheck className="w-4 h-4 text-[#1565C0] shrink-0" />
                <h2 className="text-xs font-bold text-slate-800">Thông tin đề tài</h2>
              </div>

              {isDisqualified ? (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1"
                >
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Đề tài đã bị đình chỉ (DISQUALIFIED)</span>
                  </p>
                  <p className="text-[11px] text-rose-700">
                    Lý do: {reportData?.disqualificationReason || 'Không xác định'}
                  </p>
                </div>
              ) : !hasTopic ? (
                <p className="text-xs text-slate-600">
                  Bạn chưa nằm trong danh sách sinh viên thực hiện đồ án của học kỳ này.
                </p>
              ) : (
                <>
                  <p className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug wrap-break-word">
                    {reportData?.topicName || 'Chưa có tên đề tài'}
                  </p>
                  <div className="text-xs text-slate-600 space-y-0.5">
                    <div>
                      Giáo viên hướng dẫn:{' '}
                      <strong className="text-slate-800 font-semibold">
                        {reportData?.lecturerName || 'Chưa phân công'}
                      </strong>
                    </div>
                    {reportData?.coLecturerName && (
                      <div>
                        Đồng GVHD:{' '}
                        <strong className="text-slate-800 font-medium">
                          {reportData.coLecturerName}
                        </strong>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Cột 2: Thời hạn nộp */}
            <div className="pt-4 lg:pt-0 lg:px-5 space-y-1.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Clock className="w-4 h-4 text-[#1565C0] shrink-0" />
                <h2 className="text-xs font-bold text-slate-800">
                  {formatReportDeadlineName(reportData?.deadlineName)}
                </h2>
                {deadlineDisplay.badgeText && (
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border',
                      deadlineDisplay.badgeClassName,
                    )}
                  >
                    {deadlineDisplay.badgeText}
                  </span>
                )}
              </div>

              <div
                id="reportDeadlineText"
                className={cn(
                  'text-xs sm:text-[13px] font-bold leading-snug',
                  deadlineDisplay.toneClassName,
                )}
              >
                {deadlineDisplay.text}
              </div>

              {!submitState.canSubmit && submitState.reason && (
                <p
                  className={cn(
                    'text-[11.5px] font-medium rounded-md px-2.5 py-1.5 border leading-snug',
                    reportData?.status === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200',
                  )}
                >
                  {submitState.reason}
                </p>
              )}
            </div>

            {/* Cột 3: Nút NỘP / NỘP LẠI */}
            <div className="pt-4 lg:pt-0 lg:pl-5 flex items-center justify-start lg:justify-center">
              <button
                type="button"
                id="btnOpenSubmitReportModal"
                disabled={!canSubmit || submitReportMutation.isPending}
                onClick={() => setSubmitModalOpen(true)}
                className="h-9 px-5 rounded-lg border border-[#1565C0] text-[#1565C0] hover:bg-blue-50/70 disabled:border-slate-200 disabled:text-slate-400 disabled:bg-slate-100 disabled:cursor-not-allowed text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap uppercase tracking-wide"
              >
                <Upload className="w-4 h-4" />
                <span id="submitBtnLabel">
                  {submitReportMutation.isPending
                    ? 'Đang nộp...'
                    : hasSubmittedBefore
                      ? 'NỘP LẠI'
                      : 'NỘP BÁO CÁO'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Khối Trạng thái Báo cáo Final hiện tại & Phiếu theo dõi tiến độ */}
      {(isPending || (!isError && hasTopic)) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Báo cáo Final hiện tại */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#1565C0]" />
                <h2 className="text-xs sm:text-[13px] font-bold text-slate-900">
                  Báo cáo Final hiện tại
                </h2>
              </div>
              {!isPending &&
                reportData?.status &&
                renderStatusBadge(reportData.status, reportData.statusDescription)}
            </div>

            {isPending ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-4 w-64" />
              </div>
            ) : !reportData?.publicId ? (
              <p className="text-xs text-slate-500">
                Bạn chưa nộp báo cáo Final nào trong học kỳ này.
              </p>
            ) : (
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-slate-500 shrink-0">Tệp đã nộp:</span>
                  <div className="text-right">
                    {renderFileLink(
                      reportData.finalReportFile,
                      'Bao_cao_Final',
                      'Xem tệp báo cáo Final',
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Thời gian nộp:</span>
                  <span className="font-medium text-slate-800">
                    {formatDate(reportData.submittedAt, 'full') || '—'}
                  </span>
                </div>
                {reportData.reviewedAt && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">Thời gian thẩm định:</span>
                    <span className="font-medium text-slate-800">
                      {formatDate(reportData.reviewedAt, 'full')}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Tỷ lệ trùng lặp:</span>
                  <span className="font-semibold text-slate-900">
                    {reportData.plagiarismRate !== null
                      ? `${reportData.plagiarismRate}%`
                      : 'Chưa chấm'}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-slate-500 shrink-0">Minh chứng kiểm tra trùng:</span>
                  <div className="text-right">
                    {reportData.plagiarismFile ? (
                      renderFileLink(
                        reportData.plagiarismFile,
                        'Ket_qua_kiem_tra_trung',
                        'Xem tệp minh chứng kiểm tra trùng lặp',
                      )
                    ) : (
                      <span className="text-slate-400">Chưa có</span>
                    )}
                  </div>
                </div>
                {reportData.supervisorFeedback && (
                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <span className="text-slate-500 font-medium block">
                      Nhận xét của GVHD:
                    </span>
                    <p className="text-slate-700 leading-relaxed wrap-break-word bg-slate-50 rounded-lg p-2.5 border border-slate-200/70">
                      {reportData.supervisorFeedback}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Phiếu theo dõi tiến độ */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-[#1565C0]" />
              <h2 className="text-xs sm:text-[13px] font-bold text-slate-900">
                Phiếu theo dõi tiến độ
              </h2>
            </div>

            {isPending ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-52" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-60" />
              </div>
            ) : !progressReport ? (
              <p className="text-xs text-slate-500">
                Giảng viên hướng dẫn chưa tải lên phiếu theo dõi tiến độ.
              </p>
            ) : (
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-slate-500 shrink-0">Tệp phiếu tiến độ:</span>
                  <div className="text-right">
                    {renderFileLink(
                      progressReport.progressFile,
                      'Phieu_theo_doi_tien_do',
                      'Xem phiếu theo dõi tiến độ',
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Giảng viên tải lên:</span>
                  <span className="font-medium text-slate-800">
                    {progressReport.supervisorName || reportData?.lecturerName || '—'}
                  </span>
                </div>
                {progressReport.submittedAt && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">Thời gian cập nhật:</span>
                    <span className="font-medium text-slate-800">
                      {formatDate(progressReport.submittedAt, 'full')}
                    </span>
                  </div>
                )}
                {progressReport.supervisorNote && (
                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <span className="text-slate-500 font-medium block">
                      Ghi chú của GVHD:
                    </span>
                    <p className="text-slate-700 leading-relaxed wrap-break-word bg-slate-50 rounded-lg p-2.5 border border-slate-200/70">
                      {progressReport.supervisorNote}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. KHỐI LỊCH SỬ NỘP BÁO CÁO */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#1565C0]" />
          <h2
            className="text-xs sm:text-[13px] font-bold text-slate-900"
            id="historyTableTitle"
          >
            Lịch sử nộp báo cáo
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-[13px] text-slate-600 border-collapse">
            <thead className="bg-slate-50/70 text-[12px] font-bold text-slate-700 border-b border-slate-100">
              <tr>
                <th className="py-3 px-5 font-semibold text-slate-700">
                  Thời gian nộp
                </th>
                <th className="py-3 px-5 font-semibold text-slate-700">
                  Tên tệp
                </th>
                <th className="py-3 px-5 font-semibold text-slate-700">
                  Trạng thái
                </th>
                <th className="py-3 px-5 font-semibold text-slate-700">
                  Kết quả kiểm tra trùng
                </th>
                <th className="py-3 px-5 font-semibold text-slate-700">
                  Nhận xét của GVHD
                </th>
              </tr>
            </thead>
            <tbody
              id="reportHistoryTableBody"
              className="divide-y divide-slate-100 bg-white"
            >
              {isPending ? (
                Array.from({ length: 2 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="py-3.5 px-5"><Skeleton className="h-4 w-28" /></td>
                    <td className="py-3.5 px-5"><Skeleton className="h-4 w-44" /></td>
                    <td className="py-3.5 px-5"><Skeleton className="h-5 w-28 rounded-full" /></td>
                    <td className="py-3.5 px-5"><Skeleton className="h-4 w-36" /></td>
                    <td className="py-3.5 px-5"><Skeleton className="h-4 w-48" /></td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="py-8 px-5 text-center text-rose-600 text-xs font-medium">
                    Không tải được lịch sử nộp báo cáo từ máy chủ. Vui lòng thử lại sau.
                  </td>
                </tr>
              ) : histories.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-10 text-center text-slate-400 text-xs"
                  >
                    <FileX size={32} className="text-slate-300 mx-auto mb-2" />
                    Chưa có lần nộp báo cáo Final nào trong học kỳ này.
                  </td>
                </tr>
              ) : (
                histories.map((row) => (
                  <tr
                    key={row.publicId}
                    className="hover:bg-slate-50/70 transition border-b border-slate-100"
                  >
                    <td className="py-3.5 px-5 text-slate-900 font-medium whitespace-nowrap">
                      {formatDate(row.submittedAt, 'full') || '—'}
                    </td>

                    <td className="py-3.5 px-5">
                      {renderFileLink(
                        row.finalHistoryFile,
                        'Bao_cao_Final',
                        'Xem tệp báo cáo',
                      )}
                    </td>

                    <td className="py-3.5 px-5 whitespace-nowrap">
                      {renderStatusBadge(row.status, row.statusDescription, row.reviewedAt)}
                    </td>

                    <td className="py-3.5 px-5">
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-semibold text-slate-800 text-xs">
                          {row.plagiarismRate !== null
                            ? `Tỷ lệ trùng lặp: ${row.plagiarismRate}%`
                            : 'Chưa chấm'}
                        </span>
                        {row.plagiarismHistoryFile &&
                          renderFileLink(
                            row.plagiarismHistoryFile,
                            'Ket_qua_kiem_tra_trung',
                            'Xem file minh chứng kiểm tra trùng lặp',
                          )}
                      </div>
                    </td>

                    <td className="py-3.5 px-5 text-xs text-slate-700 leading-relaxed max-w-[280px] wrap-break-word">
                      {row.supervisorFeedback || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit Report Modal */}
      <SubmitReportModal
        open={submitModalOpen}
        isSubmitting={submitReportMutation.isPending}
        isResubmit={hasSubmittedBefore}
        onClose={() => setSubmitModalOpen(false)}
        onSubmitReport={handleSubmitReport}
      />
    </div>
  )
}
