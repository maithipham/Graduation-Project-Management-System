import React, { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileCheck,
  FileText,
  FileUp,
  History,
  X,
} from 'lucide-react'
import {
  Button,
  FileDropZone,
  FormField,
  Input,
  Skeleton,
  Textarea,
} from '@/shared/components/ui'
import { isApiError } from '@/shared/types'
import { cn, formatDate } from '@/shared/utils'
import { useFinalReportDetail } from '../hooks/useReportCheck'
import {
  canReviewFinalReport,
  extractReportFileName,
  formatReportDeadlineForReview,
  getAllowedReviewDecisions,
  getFileExtensionLabel,
  getReviewBlockedReason,
  isPdfFileUrl,
  isSafeReportFileUrl,
  validatePlagiarismFile,
} from '../services/reportCheck.service'
import {
  REPORT_REVIEW_ERROR_CODES,
  type FinalReportDecision,
  type FinalReportStatus,
  type ReportCheckItem,
  type ReviewFinalReportPayload,
} from '../types/reportCheck.types'

const DECISION_META: Record<
  FinalReportDecision,
  { label: string; description: string; activeClass: string }
> = {
  APPROVED: {
    label: 'Duyệt đạt (APPROVED)',
    description: 'Báo cáo đạt yêu cầu, đủ điều kiện chuyển sang bước phản biện.',
    activeClass: 'border-emerald-500 bg-emerald-50/70 text-emerald-900',
  },
  REQUEST_CHANGES: {
    label: 'Yêu cầu chỉnh sửa (REQUEST_CHANGES)',
    description: 'Sinh viên xem kết quả đạo văn, nhận xét và nộp lại khi còn hạn OPEN.',
    activeClass: 'border-amber-500 bg-amber-50/70 text-amber-900',
  },
  REJECTED: {
    label: 'Không đạt (REJECTED)',
    description: 'Đề tài sẽ chuyển sang trạng thái DISQUALIFIED trong học kỳ này.',
    activeClass: 'border-rose-500 bg-rose-50/70 text-rose-900',
  },
}

const HISTORY_STATUS_BADGE: Record<
  FinalReportStatus,
  { label: string; className: string }
> = {
  APPROVED: {
    label: 'Đã duyệt đạt',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  REQUEST_CHANGES: {
    label: 'Yêu cầu chỉnh sửa',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  REJECTED: {
    label: 'Không đạt',
    className: 'bg-rose-50 text-rose-700 border border-rose-200',
  },
  PENDING: {
    label: 'Đã nộp, chờ nhận xét',
    className: 'bg-blue-50 text-[#1565C0] border border-blue-200',
  },
}

// ==========================================
// 1. MODAL THẨM ĐỊNH & NỘP FILE KIỂM TRA TRÙNG LẶP
// ==========================================
interface FinalReportReviewModalProps {
  item: ReportCheckItem | null
  initialDecision?: FinalReportDecision
  isSubmitting?: boolean
  onClose: () => void
  onSubmitReview: (payload: ReviewFinalReportPayload) => Promise<void>
}

function createReviewSchema(allowedDecisions: FinalReportDecision[]) {
  return z.object({
    decision: z
      .enum(['APPROVED', 'REQUEST_CHANGES', 'REJECTED'], {
        error: 'Vui lòng chọn kết quả thẩm định báo cáo',
      })
      .refine((val) => allowedDecisions.includes(val), {
        message: 'Quyết định không hợp lệ với trạng thái thời hạn hiện tại',
      }),
    plagiarismRate: z
      .number({ error: 'Vui lòng nhập tỷ lệ đạo văn' })
      .min(0, 'Tỷ lệ đạo văn phải nằm trong khoảng 0% đến 100%')
      .max(100, 'Tỷ lệ đạo văn phải nằm trong khoảng 0% đến 100%'),
    plagiarismFile: z
      .custom<File | null>((val) => val === null || val instanceof File)
      .superRefine((file, ctx) => {
        const error = validatePlagiarismFile(file)
        if (error) {
          ctx.addIssue({ code: 'custom', message: error })
        }
      }),
    feedback: z.string().trim().max(2000, 'Nhận xét tối đa 2000 ký tự'),
  })
}

type ReviewFormValues = z.infer<ReturnType<typeof createReviewSchema>>

const FinalReportReviewModalContent: React.FC<{
  item: ReportCheckItem
  initialDecision?: FinalReportDecision
  isSubmitting: boolean
  onClose: () => void
  onSubmitReview: (payload: ReviewFinalReportPayload) => Promise<void>
}> = ({ item, initialDecision, isSubmitting, onClose, onSubmitReview }) => {
  const allowedDecisions = getAllowedReviewDecisions(item.deadlineStatus)
  const deadlineInfo = formatReportDeadlineForReview(
    item.deadlineEndDate,
    item.deadlineStatus,
    (iso) => formatDate(iso, 'full'),
    item.deadlineStartDate,
  )

  const defaultDecision =
    initialDecision && allowedDecisions.includes(initialDecision)
      ? initialDecision
      : (allowedDecisions[0] ?? 'APPROVED')

  const reviewSchema = createReviewSchema(allowedDecisions)

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      decision: defaultDecision,
      plagiarismRate:
        item.plagiarismRate !== null && item.plagiarismRate !== undefined
          ? item.plagiarismRate
          : (undefined as unknown as number),
      plagiarismFile: null,
      feedback: item.comment ?? '',
    },
  })

  const selectedDecision = useWatch({ control, name: 'decision' })
  const selectedFile = useWatch({ control, name: 'plagiarismFile' })

  const onSubmit = async (values: ReviewFormValues) => {
    if (!item.publicId || !values.plagiarismFile) return
    clearErrors('root.server')

    try {
      await onSubmitReview({
        publicId: item.publicId,
        plagiarismRate: values.plagiarismRate,
        plagiarismFile: values.plagiarismFile,
        decision: values.decision,
        feedback: values.feedback || undefined,
      })
    } catch (error) {
      if (isApiError(error)) {
        const msg = error.message
        if (error.code === REPORT_REVIEW_ERROR_CODES.VALIDATION_ERROR) {
          const lower = msg.toLowerCase()
          if (lower.includes('đạo văn') || lower.includes('tỷ lệ')) {
            setError('plagiarismRate', { message: msg }, { shouldFocus: true })
            return
          }
          if (lower.includes('file') || lower.includes('tệp')) {
            setError('plagiarismFile', { message: msg })
            return
          }
          if (
            lower.includes('quyết định') ||
            lower.includes('kết quả') ||
            lower.includes('approved') ||
            lower.includes('request_changes') ||
            lower.includes('rejected')
          ) {
            setError('decision', { message: msg })
            return
          }
        }
        setError('root.server', { message: msg })
        return
      }
      setError('root.server', {
        message: 'Không thể gửi kết quả thẩm định. Vui lòng thử lại.',
      })
    }
  }

  return (
    <div
      id="finalReportReviewModal"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose()
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 min-w-0">
            <FileUp className="w-5 h-5 text-[#1565C0] shrink-0" />
            <h3 className="text-[15px] font-bold text-slate-900 truncate">
              Thẩm định báo cáo Final & Kiểm tra trùng lặp
            </h3>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 disabled:opacity-40 cursor-pointer p-1 rounded-lg transition"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-4 text-[13px] max-h-[78vh] overflow-y-auto">
            {/* Thông tin sinh viên & đề tài */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                <div>
                  <span className="text-[11.5px] text-slate-500">Sinh viên: </span>
                  <span className="font-bold text-slate-900">{item.name}</span>{' '}
                  <span className="font-mono text-xs text-slate-600">({item.mssv})</span>
                </div>
                {deadlineInfo.badgeText && (
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[11px] font-bold border',
                      item.deadlineStatus === 'EXTENDED'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-blue-50 text-[#1565C0] border-blue-200',
                    )}
                  >
                    {deadlineInfo.badgeText}: {formatDate(item.deadlineEndDate, 'full')}
                  </span>
                )}
              </div>
              <div className="text-[12.5px] text-slate-700">
                <span className="text-slate-500">Đề tài: </span>
                <span className="font-semibold text-slate-900">{item.topic}</span>
              </div>
              {item.progressReport && (
                <div className="text-[12px] text-emerald-700 flex items-center gap-1.5 flex-wrap">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Đã nộp Phiếu theo dõi tiến độ</span>
                  {isSafeReportFileUrl(item.progressReport.progressFile) && (
                    <a
                      href={item.progressReport.progressFile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1565C0] hover:underline font-semibold inline-flex items-center gap-1"
                    >
                      <span>Xem phiếu</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Quyết định thẩm định */}
            <div className="space-y-1.5">
              <span className="block text-sm font-medium text-slate-700">
                Kết quả thẩm định <span className="text-[#DC2626]">*</span>
              </span>
              <div className="grid grid-cols-1 gap-2">
                {allowedDecisions.map((decision) => {
                  const meta = DECISION_META[decision]
                  const isChecked = selectedDecision === decision
                  return (
                    <label
                      key={decision}
                      className={cn(
                        'flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition',
                        isChecked
                          ? meta.activeClass
                          : 'border-slate-200 bg-white hover:border-slate-300',
                        isSubmitting && 'opacity-60 cursor-not-allowed',
                      )}
                    >
                      <input
                        type="radio"
                        value={decision}
                        disabled={isSubmitting}
                        {...register('decision')}
                        className="mt-0.5 accent-[#1565C0]"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-[13px]">{meta.label}</div>
                        <div className="text-[11.5px] opacity-85 mt-0.5">{meta.description}</div>
                      </div>
                    </label>
                  )
                })}
              </div>
              {errors.decision?.message && (
                <p role="alert" className="text-xs font-semibold text-[#DC2626]">
                  {errors.decision.message}
                </p>
              )}
            </div>

            {/* Tỷ lệ đạo văn */}
            <FormField
              label="Tỷ lệ đạo văn (%)"
              required
              hint="Giá trị hợp lệ từ 0 đến 100 (ví dụ: 12.5)."
              error={errors.plagiarismRate?.message}
            >
              <Input
                type="number"
                step="0.1"
                min={0}
                max={100}
                disabled={isSubmitting}
                placeholder="VD: 12.5"
                {...register('plagiarismRate', { valueAsNumber: true })}
              />
            </FormField>

            {/* File kết quả kiểm tra trùng lặp */}
            <FormField
              label="File kết quả kiểm tra trùng lặp (Turnitin / DoIT)"
              required
              error={errors.plagiarismFile?.message}
            >
              <FileDropZone
                file={selectedFile ?? undefined}
                accept=".doc,.docx,.pdf"
                hint="Chỉ nhận định dạng .doc, .docx hoặc .pdf (nhỏ hơn 10 MB)"
                onSelect={(file) => {
                  clearErrors('root.server')
                  setValue('plagiarismFile', file, { shouldValidate: true })
                }}
                onClear={() => {
                  setValue('plagiarismFile', null, { shouldValidate: true })
                }}
              />
            </FormField>

            {/* Ý kiến nhận xét */}
            <FormField
              label="Ý kiến nhận xét của GVHD"
              hint={
                selectedDecision === 'REQUEST_CHANGES' || selectedDecision === 'REJECTED'
                  ? 'Nên ghi rõ các nội dung cần chỉnh sửa hoặc lý do chưa đạt để sinh viên nắm được.'
                  : 'Không bắt buộc.'
              }
              error={errors.feedback?.message}
            >
              <Textarea
                rows={3}
                disabled={isSubmitting}
                placeholder="Nhập nhận xét về nội dung báo cáo và kết quả kiểm tra trùng lặp..."
                {...register('feedback')}
              />
            </FormField>

            {errors.root?.server && (
              <p role="alert" className="text-sm font-semibold text-[#DC2626]">
                {errors.root.server.message}
              </p>
            )}
          </div>

          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || allowedDecisions.length === 0}
              className="bg-[#1565C0] hover:bg-[#0D47A1] text-white"
            >
              {isSubmitting ? 'Đang gửi...' : 'Xác nhận thẩm định'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export const FinalReportReviewModal: React.FC<FinalReportReviewModalProps> = ({
  item,
  isSubmitting = false,
  ...props
}) => {
  if (!item) return null
  return (
    <FinalReportReviewModalContent
      key={item.id}
      item={item}
      isSubmitting={isSubmitting}
      {...props}
    />
  )
}

// ==========================================
// 2. MODAL XEM LỊCH SỬ NỘP BÁO CÁO (GET /report/{publicId})
// ==========================================
interface ReportHistoryModalProps {
  item: ReportCheckItem | null
  onClose: () => void
}

export const ReportHistoryModal: React.FC<ReportHistoryModalProps> = ({
  item,
  onClose,
}) => {
  const detailQuery = useFinalReportDetail(item?.publicId ?? undefined)

  if (!item) return null

  const histories = detailQuery.data?.histories ?? []

  return (
    <div
      id="reportHistoryModal"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3
              className="text-[15px] font-bold text-slate-900 flex items-center gap-2"
              id="histReportStudentName"
            >
              <History className="w-4 h-4 text-[#1565C0]" />
              <span>
                Lịch sử nộp báo cáo — {item.name} ({item.mssv})
              </span>
            </h3>
            <p
              className="text-[12px] text-slate-500 mt-0.5 line-clamp-1"
              id="histReportTopicName"
            >
              Đề tài: {item.topic}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg transition"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {detailQuery.isPending ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }, (_, idx) => (
                <Skeleton key={idx} className="h-12 w-full" />
              ))}
            </div>
          ) : detailQuery.isError ? (
            <div
              role="alert"
              className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700 flex items-center justify-between gap-3"
            >
              <span>Không tải được lịch sử nộp báo cáo. Vui lòng thử lại.</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void detailQuery.refetch()}
              >
                Tải lại
              </Button>
            </div>
          ) : histories.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs italic">
              Chưa có lịch sử nộp báo cáo nào từ sinh viên này.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-[12.5px]">
                <thead className="bg-slate-50 text-slate-600 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-20 text-center">Lần nộp</th>
                    <th className="px-4 py-3 w-44">Thời gian nộp</th>
                    <th className="px-4 py-3 min-w-[200px]">File báo cáo</th>
                    <th className="px-4 py-3 min-w-[160px]">Kiểm tra trùng lặp</th>
                    <th className="px-4 py-3 w-40 text-center">Trạng thái</th>
                    <th className="px-4 py-3 min-w-[220px]">Nhận xét GVHD</th>
                  </tr>
                </thead>
                <tbody
                  id="histReportTableBody"
                  className="divide-y divide-slate-100 bg-white"
                >
                  {histories.map((hist, idx) => {
                    const submitNumber = histories.length - idx
                    const badge =
                      HISTORY_STATUS_BADGE[hist.status] ??
                      HISTORY_STATUS_BADGE.PENDING
                    const reportFileName = extractReportFileName(
                      hist.finalHistoryFile,
                      `Báo cáo lần ${submitNumber}`,
                    )
                    const plagFileName = hist.plagiarismHistoryFile
                      ? extractReportFileName(
                          hist.plagiarismHistoryFile,
                          'File check trùng',
                        )
                      : null

                    return (
                      <tr
                        key={hist.publicId}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-4 py-3 text-center font-bold text-slate-700">
                          Lần {submitNumber}
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-medium">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{formatDate(hist.submittedAt, 'full')}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {isSafeReportFileUrl(hist.finalHistoryFile) ? (
                            <a
                              href={hist.finalHistoryFile}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 font-semibold text-[#1565C0] hover:underline break-all"
                            >
                              <FileText className="w-3.5 h-3.5 shrink-0" />
                              <span>{reportFileName}</span>
                            </a>
                          ) : (
                            <span className="font-semibold text-slate-700">
                              {reportFileName}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {hist.plagiarismRate !== null ? (
                            <div className="space-y-1">
                              <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800">
                                {hist.plagiarismRate}%
                              </span>
                              {hist.plagiarismHistoryFile &&
                                isSafeReportFileUrl(hist.plagiarismHistoryFile) && (
                                  <div>
                                    <a
                                      href={hist.plagiarismHistoryFile}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[11.5px] text-[#1565C0] hover:underline inline-flex items-center gap-1"
                                    >
                                      <span>{plagFileName}</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              Chưa chấm
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={cn(
                              'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold',
                              badge.className,
                            )}
                          >
                            {hist.statusDescription || badge.label}
                          </span>
                          {hist.reviewedAt && (
                            <div className="text-[10.5px] text-slate-400 mt-1">
                              {formatDate(hist.reviewedAt, 'full')}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {hist.supervisorFeedback || (
                            <span className="text-slate-400 italic">
                              Không có nhận xét
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  )
}

// ====================================================================
// 3. MODAL XEM CHI TIẾT & XEM TỆP BÁO CÁO FINAL THẬT TỪ BACKEND
// ====================================================================
interface ReportClassroomPreviewModalProps {
  item: ReportCheckItem | null
  onClose: () => void
  onOpenReview: (item: ReportCheckItem) => void
  onDownloadReport: (item: ReportCheckItem) => void
}

export const ReportClassroomPreviewModal: React.FC<
  ReportClassroomPreviewModalProps
> = ({ item, onClose, onOpenReview, onDownloadReport }) => {
  const detailQuery = useFinalReportDetail(item?.publicId ?? undefined)

  useEffect(() => {
    if (!item) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [item, onClose])

  if (!item) return null

  const detail = detailQuery.data
  const reportUrl = detail?.finalReportFile ?? item.reportFileUrl
  const docTitle =
    (reportUrl
      ? extractReportFileName(reportUrl, item.reportFileName || 'Báo cáo Final')
      : item.reportFileName) || 'Báo cáo Final'
  const extLabel = getFileExtensionLabel(reportUrl)
  const canPreviewPdf = isSafeReportFileUrl(reportUrl) && isPdfFileUrl(reportUrl)

  const progressReport = detail?.progressReport ?? item.progressReport
  const plagiarismRate = detail?.plagiarismRate ?? item.plagiarismRate
  const plagiarismFile = detail?.plagiarismFile ?? item.plagiarismFileUrl
  const supervisorFeedback = detail?.supervisorFeedback ?? item.comment
  const lecturerName = detail?.lecturerName ?? item.lecturerName
  const coLecturerName = detail?.coLecturerName ?? item.coLecturerName
  const submittedAt = detail?.submittedAt ?? item.reportSubmittedAt
  const statusDescription = detail?.statusDescription ?? item.statusDescription

  const canReview = detail
    ? canReviewFinalReport({
        canReview: detail.canReview,
        publicId: detail.publicId,
        status: detail.status,
        topicStatus: detail.topicStatus,
        progressReport: detail.progressReport,
        deadlineStatus: detail.deadlineStatus,
      })
    : canReviewFinalReport(item)

  const blockedReason = getReviewBlockedReason(item)

  return (
    <div
      id="fullReportPreviewModal"
      className="fixed inset-0 z-50 bg-[#202124] flex flex-col overflow-hidden animate-in fade-in duration-200"
    >
      {/* Top Bar */}
      <header className="h-14 sm:h-16 bg-[#202124] border-b border-[#3c4043] flex items-center justify-between px-3 sm:px-6 shrink-0 z-30 shadow-md gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="px-2 py-0.5 rounded bg-[#EA4335] text-white text-[11px] font-extrabold tracking-wider shrink-0 shadow-xs">
            {extLabel}
          </span>
          <div className="min-w-0">
            <h2
              id="reportPreviewDocTitle"
              className="text-white text-[13.5px] sm:text-[14.5px] font-bold truncate max-w-[220px] sm:max-w-[460px]"
              title={docTitle}
            >
              {docTitle}
            </h2>
            <p className="text-[11.5px] text-slate-400 truncate">
              {item.name} ({item.mssv})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canReview && (
            <button
              type="button"
              id="btnReportPreviewReview"
              onClick={() => onOpenReview(item)}
              className="inline-flex h-8.5 px-3 rounded-lg bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-bold shadow-xs items-center gap-1.5 transition cursor-pointer"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Thẩm định báo cáo</span>
            </button>
          )}

          {isSafeReportFileUrl(reportUrl) && (
            <>
              <a
                href={reportUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 sm:w-9 h-8 sm:h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition"
                title="Mở tệp trong tab mới"
                aria-label="Mở tệp trong tab mới"
              >
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                type="button"
                id="btnReportPreviewDownload"
                onClick={() => onDownloadReport(item)}
                className="w-8 sm:w-9 h-8 sm:h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
                title="Tải xuống tài liệu"
                aria-label="Tải xuống tài liệu"
              >
                <Download className="w-4.5 h-4.5" />
              </button>
            </>
          )}

          <button
            type="button"
            id="btnCloseReportPreview"
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Đóng xem trước (Phím Esc)"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden bg-[#2b2d30]">
        {/* Metadata panel */}
        <aside className="w-full lg:w-80 xl:w-96 bg-[#282a2d] border-b lg:border-b-0 lg:border-r border-[#3c4043] p-4 overflow-y-auto shrink-0 space-y-4 text-xs text-slate-200">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Thông tin đề tài & sinh viên
            </div>
            <div className="rounded-xl bg-[#303134] p-3.5 space-y-2 border border-[#3c4043]">
              <div>
                <div className="text-slate-400">Đề tài</div>
                <div className="font-semibold text-white mt-0.5 leading-snug">
                  {detail?.topicName ?? item.topic}
                </div>
              </div>
              <div className="flex justify-between gap-2 pt-1 border-t border-[#3c4043]">
                <span className="text-slate-400">Sinh viên</span>
                <span className="font-semibold text-white text-right">
                  {item.name} ({item.mssv})
                </span>
              </div>
              {lecturerName && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">GVHD chính</span>
                  <span className="text-slate-100 text-right">{lecturerName}</span>
                </div>
              )}
              {coLecturerName && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">Đồng hướng dẫn</span>
                  <span className="text-slate-100 text-right">{coLecturerName}</span>
                </div>
              )}
              {submittedAt && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">Thời gian nộp</span>
                  <span className="text-slate-100 text-right">
                    {formatDate(submittedAt, 'full')}
                  </span>
                </div>
              )}
              {statusDescription && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">Trạng thái</span>
                  <span className="font-semibold text-amber-300 text-right">
                    {statusDescription}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Phiếu theo dõi tiến độ
            </div>
            <div className="rounded-xl bg-[#303134] p-3.5 border border-[#3c4043] space-y-1.5">
              {progressReport ? (
                <>
                  <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Đã nộp phiếu tiến độ</span>
                  </div>
                  {progressReport.submittedAt && (
                    <div className="text-slate-400">
                      Ngày nộp: {formatDate(progressReport.submittedAt, 'full')}
                    </div>
                  )}
                  {progressReport.supervisorNote && (
                    <div className="text-slate-200">
                      Ghi chú: {progressReport.supervisorNote}
                    </div>
                  )}
                  {isSafeReportFileUrl(progressReport.progressFile) && (
                    <a
                      href={progressReport.progressFile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-400 hover:underline font-semibold pt-1"
                    >
                      <span>Mở file phiếu tiến độ</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </>
              ) : (
                <div className="text-amber-300 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>Chưa có phiếu theo dõi tiến độ (bắt buộc nộp trước khi thẩm định).</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Kết quả kiểm tra trùng lặp
            </div>
            <div className="rounded-xl bg-[#303134] p-3.5 border border-[#3c4043] space-y-1.5">
              {plagiarismRate !== null && plagiarismRate !== undefined ? (
                <>
                  <div>
                    <span className="text-slate-400">Tỷ lệ trùng lặp: </span>
                    <span className="font-bold text-white">{plagiarismRate}%</span>
                  </div>
                  {plagiarismFile && isSafeReportFileUrl(plagiarismFile) && (
                    <div>
                      <a
                        href={plagiarismFile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-400 hover:underline font-semibold break-all"
                      >
                        <span>{extractReportFileName(plagiarismFile, 'File kết quả')}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                  )}
                  {supervisorFeedback && (
                    <div className="pt-1 border-t border-[#3c4043] text-slate-200">
                      <span className="text-slate-400">Nhận xét: </span>
                      {supervisorFeedback}
                    </div>
                  )}
                </>
              ) : (
                <span className="text-slate-400 italic">Chưa có kết quả kiểm tra trùng lặp.</span>
              )}
            </div>
          </div>

          {!canReview && blockedReason && (
            <div className="rounded-xl bg-amber-950/50 border border-amber-700/60 p-3 text-amber-200">
              {blockedReason}
            </div>
          )}
        </aside>

        {/* Main Viewer */}
        <main className="flex-1 min-h-0 p-4 flex items-center justify-center">
          {detailQuery.isPending && !reportUrl ? (
            <div className="w-full max-w-3xl space-y-3">
              <Skeleton className="h-8 w-1/2 bg-slate-700" />
              <Skeleton className="h-[60vh] w-full bg-slate-700" />
            </div>
          ) : canPreviewPdf && reportUrl ? (
            <iframe
              src={reportUrl}
              title={docTitle}
              className="w-full h-full rounded-xl border border-[#3c4043] bg-white"
            />
          ) : isSafeReportFileUrl(reportUrl) ? (
            <div className="max-w-md w-full rounded-2xl bg-[#303134] border border-[#3c4043] p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-white break-all">{docTitle}</p>
                <p className="text-xs text-slate-400">
                  Trình duyệt không hỗ trợ xem trực tiếp định dạng {extLabel}. Vui lòng tải xuống hoặc mở trong tab mới.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2.5 flex-wrap">
                <Button
                  type="button"
                  onClick={() => onDownloadReport(item)}
                  className="bg-[#1565C0] hover:bg-[#0D47A1] text-white"
                >
                  <Download className="w-4 h-4" /> Tải xuống tệp
                </Button>
                <a
                  href={reportUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-500 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Mở tab mới
                </a>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-400 italic">
              Không có tệp báo cáo để hiển thị.
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
