import React, { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileDown,
  FileSpreadsheet,
  FileText,
  FileUp,
  History,
  RotateCcw,
  X,
} from 'lucide-react'
import {
  Button,
  FileDropZone,
  FormField,
  Skeleton,
  Textarea,
} from '@/shared/components/ui'
import { isApiError } from '@/shared/types'
import { cn, formatDate } from '@/shared/utils'
import { useSupervisorReportDetail } from '../hooks/useGuidingEvaluation'
import {
  canLecturerSubmitProgressReport,
  extractProgressFileName,
  formatProgressDeadlineForSupervisor,
  getProgressFileExtensionLabel,
  getProgressUploadBlockedReason,
  isPdfProgressFileUrl,
  isSafeProgressFileUrl,
  validateProgressFile,
} from '../services/guidingEvaluation.service'
import {
  PROGRESS_REPORT_ERROR_CODES,
  type GuidingEvaluationItem,
  type GuidingFinalReportStatus,
  type RubricCriterionKey,
  type RubricScores,
  type SubmitProgressReportPayload,
} from '../types/guidingEvaluation.types'
import {
  clampRubricValue,
  computeRubricSummary,
  getInitialRubricScores,
  RUBRIC_GROUPS,
} from '../utils/guidingEvaluation.utils'

const HISTORY_STATUS_BADGE: Record<
  GuidingFinalReportStatus,
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
// 1. MODAL NỘP / CẬP NHẬT PHIẾU THEO DÕI TIẾN ĐỘ
// ==========================================
interface UploadTrackingModalProps {
  item: GuidingEvaluationItem | null
  isSubmitting?: boolean
  onClose: () => void
  onConfirm: (
    item: GuidingEvaluationItem,
    payload: SubmitProgressReportPayload,
  ) => Promise<void>
}

const uploadProgressSchema = z.object({
  file: z
    .custom<File | null>((val) => val === null || val instanceof File)
    .superRefine((file, ctx) => {
      const error = validateProgressFile(file)
      if (error) {
        ctx.addIssue({ code: 'custom', message: error })
      }
    }),
  supervisorNote: z
    .string()
    .trim()
    .max(2000, 'Nhận xét đánh giá tối đa 2000 ký tự'),
})

type UploadProgressFormValues = z.infer<typeof uploadProgressSchema>

const UploadTrackingModalContent: React.FC<{
  item: GuidingEvaluationItem
  isSubmitting: boolean
  onClose: () => void
  onConfirm: (
    item: GuidingEvaluationItem,
    payload: SubmitProgressReportPayload,
  ) => Promise<void>
}> = ({ item, isSubmitting, onClose, onConfirm }) => {
  const isReUpload = Boolean(item.progressReport)
  const deadlineInfo = formatProgressDeadlineForSupervisor(
    item.deadlineEndDate,
    item.deadlineStatus,
    (iso) => formatDate(iso, 'full'),
    item.deadlineStartDate,
  )

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<UploadProgressFormValues>({
    resolver: zodResolver(uploadProgressSchema),
    defaultValues: {
      file: null,
      supervisorNote: item.supervisorNote ?? '',
    },
  })

  const selectedFile = useWatch({ control, name: 'file' })

  const onSubmit = async (values: UploadProgressFormValues) => {
    if (!values.file) return
    clearErrors('root.server')

    try {
      await onConfirm(item, {
        topicPublicId: item.topicPublicId,
        file: values.file,
        supervisorNote: values.supervisorNote || undefined,
      })
    } catch (error) {
      if (isApiError(error)) {
        const msg = error.message
        if (error.code === PROGRESS_REPORT_ERROR_CODES.VALIDATION_ERROR) {
          const lower = msg.toLowerCase()
          if (
            lower.includes('file') ||
            lower.includes('tệp') ||
            lower.includes('định dạng') ||
            lower.includes('mb')
          ) {
            setError('file', { message: msg })
            return
          }
        }
        setError('root.server', { message: msg })
        return
      }
      setError('root.server', {
        message: 'Không thể nộp phiếu theo dõi tiến độ. Vui lòng thử lại.',
      })
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose()
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[540px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-200">
        <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
            {isReUpload ? (
              <RotateCcw className="w-4 h-4 text-blue-600" />
            ) : (
              <FileUp className="w-4 h-4 text-blue-600" />
            )}
            <span>
              {isReUpload
                ? 'Cập nhật phiếu theo dõi tiến độ'
                : 'Nộp phiếu theo dõi tiến độ'}
            </span>
          </h3>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            aria-label="Đóng"
            className="text-slate-400 hover:text-slate-600 disabled:opacity-40 p-1.5 rounded-lg hover:bg-slate-200/60 cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-4 text-[13px] max-h-[76vh] overflow-y-auto">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-slate-500">Sinh viên:</span>{' '}
                  <b className="text-slate-900">
                    {item.name} ({item.mssv})
                  </b>
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
              <div className="text-[12px] text-slate-600">
                Đề tài: <b className="text-slate-800">{item.topic}</b>
              </div>
              {isReUpload && item.fileName && (
                <div className="text-[11.5px] text-amber-700 font-medium pt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span>File hiện tại:</span>
                  {isSafeProgressFileUrl(item.progressFileUrl) ? (
                    <a
                      href={item.progressFileUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono font-bold text-[#1565C0] hover:underline inline-flex items-center gap-1"
                    >
                      <span>{item.fileName}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="font-mono font-bold">{item.fileName}</span>
                  )}
                  <span>(Nộp file mới sẽ ghi đè file này)</span>
                </div>
              )}
            </div>

            <FormField
              label="Tệp phiếu theo dõi tiến độ"
              required
              error={errors.file?.message}
              hint="Định dạng hỗ trợ: .doc, .docx, .pdf (dung lượng nhỏ hơn 10 MB)"
            >
              <FileDropZone
                file={selectedFile ?? undefined}
                accept=".doc,.docx,.pdf"
                hint="Chỉ nhận .doc, .docx hoặc .pdf (< 10MB)"
                onSelect={(file) => {
                  setValue('file', file, { shouldValidate: true })
                }}
                onClear={() => {
                  setValue('file', null, { shouldValidate: true })
                }}
              />
            </FormField>

            <FormField
              label="Nhận xét tổng kết tiến độ của GVHD"
              error={errors.supervisorNote?.message}
              hint="Không bắt buộc. Ghi chú sẽ được lưu cùng phiếu theo dõi tiến độ."
            >
              <Textarea
                rows={3}
                placeholder="VD: Sinh viên hoàn thành đúng tiến độ các tuần, đủ điều kiện xét duyệt..."
                {...register('supervisorNote')}
              />
            </FormField>

            {errors.root?.server && (
              <p
                role="alert"
                className="text-sm font-semibold text-[#DC2626]"
              >
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
              disabled={isSubmitting}
              className="bg-[#1565C0] hover:bg-[#0D47A1] text-white"
            >
              {isSubmitting
                ? 'Đang tải lên...'
                : isReUpload
                  ? 'Xác nhận cập nhật'
                  : 'Xác nhận nộp file'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export const UploadTrackingModal: React.FC<UploadTrackingModalProps> = ({
  item,
  isSubmitting = false,
  onClose,
  onConfirm,
}) => {
  if (!item) return null
  return (
    <UploadTrackingModalContent
      key={item.topicPublicId}
      item={item}
      isSubmitting={isSubmitting}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  )
}

// ==========================================
// 2. MODAL BẢNG ĐIỂM RUBRIC CHẤM ĐIỂM HƯỚNG DẪN
// ==========================================
interface RubricGradingModalProps {
  item: GuidingEvaluationItem | null
  onClose: () => void
  onSave: (
    item: GuidingEvaluationItem,
    totalScore: number,
    rubricScores: RubricScores,
    isDraft: boolean,
  ) => void
}

export const RubricGradingModal: React.FC<RubricGradingModalProps> = ({
  item,
  onClose,
  onSave,
}) => {
  const [scores, setScores] = useState<RubricScores>(() =>
    getInitialRubricScores(item ?? { rubricScores: null }),
  )

  const summary = useMemo(() => computeRubricSummary(scores), [scores])

  if (!item) return null

  const handleScoreChange = (key: RubricCriterionKey, rawValue: string) => {
    const parsed = rawValue === '' ? 0 : parseFloat(rawValue)
    const clamped = clampRubricValue(parsed)
    setScores((prev) => ({ ...prev, [key]: clamped }))
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[940px] max-h-[92vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-200">
        {/* Modal Header */}
        <div className="px-7 py-4.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1565C0] flex items-center justify-center shrink-0 border border-blue-100/80">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-[15px] font-bold text-slate-800">
                  Bảng điểm:{' '}
                  <span className="text-[#1565C0]">{item.name}</span>
                </h3>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[11px] font-semibold">
                  MSV: {item.mssv}
                </span>
              </div>
              <p
                className="text-[12px] text-slate-500 mt-0.5 max-w-[620px] truncate"
                title={item.topic}
              >
                Đề tài: {item.topic}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3.5 py-1.5 rounded-xl bg-[#0D47A1] text-white flex items-baseline gap-1 shadow-xs">
              <span className="text-[17px] font-extrabold leading-none tracking-tight">
                {summary.totalScore.toFixed(1)}
              </span>
              <span className="text-[11.5px] font-semibold text-blue-200">
                /10.0
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Bảng tiêu chí chấm điểm 5 cột */}
        <div className="overflow-y-auto px-7 py-4 flex-1">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="text-slate-400 text-[11px] font-bold uppercase tracking-wider h-9 border-b border-slate-100 select-none">
                <th className="px-3 py-2 w-14 text-center">STT</th>
                <th className="px-4 py-2">TIÊU CHÍ CHẤM ĐIỂM</th>
                <th className="px-4 py-2 w-28 text-center">TRỌNG SỐ</th>
                <th className="px-4 py-2 w-36 text-center">ĐIỂM (THANG 10)</th>
                <th className="px-4 py-2 w-28 text-center">ĐIỂM TỔNG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {RUBRIC_GROUPS.map((grp) => (
                <React.Fragment key={grp.group}>
                  <tr className="bg-white hover:bg-slate-50/50 transition font-bold text-slate-800">
                    <td className="px-3 py-2.5 text-center">{grp.group}</td>
                    <td className="px-4 py-2.5">{grp.title}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11.5px] font-bold bg-blue-50 text-blue-700">
                        {grp.weight}%
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center text-slate-300 font-bold">
                      —
                    </td>
                    <td className="px-4 py-2.5 text-center font-bold text-blue-700 text-[13.5px]">
                      {summary.groupTotals[grp.group].toFixed(1)}
                    </td>
                  </tr>
                  {grp.criteria.map((crit) => (
                    <tr key={crit.key} className="hover:bg-slate-50/40 transition">
                      <td className="px-3 py-2 text-center text-slate-400 text-[12.5px]">
                        {crit.code}
                      </td>
                      <td className="px-4 py-2 text-slate-700">{crit.label}</td>
                      <td className="px-4 py-2 text-center text-slate-600 font-medium text-[12.5px]">
                        {crit.weight}%
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            max={10}
                            step={0.1}
                            value={scores[crit.key]}
                            onChange={(e) =>
                              handleScoreChange(crit.key, e.target.value)
                            }
                            className="w-16 h-8 text-center font-bold text-[13px] border border-slate-200 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100 bg-white transition shadow-2xs text-slate-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="text-slate-400 text-[12px] font-medium">
                            /10
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center font-bold text-emerald-600 text-[13px]">
                        {summary.criterionWeighted[crit.key].toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}

              {/* TỔNG CỘNG HÀNG CUỐI */}
              <tr className="bg-blue-50/30 border-t-2 border-slate-200">
                <td
                  colSpan={2}
                  className="px-4 py-3.5 text-center font-bold text-slate-800 uppercase tracking-wide text-[12.5px]"
                >
                  TỔNG CỘNG ĐIỂM HƯỚNG DẪN ĐỒ ÁN
                </td>
                <td className="px-4 py-3.5 text-center font-bold text-blue-700 text-[13px]">
                  100%
                </td>
                <td className="px-4 py-3.5 text-center text-slate-300 font-bold">
                  —
                </td>
                <td className="px-4 py-3.5 text-center font-extrabold text-blue-700 text-[16px]">
                  {summary.totalScore.toFixed(1)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="px-7 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onSave(item, summary.totalScore, scores, true)}
            className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-[13px] font-semibold hover:bg-slate-50 transition cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
          >
            <FileDown className="w-4 h-4 text-slate-500" />
            <span>Lưu nháp</span>
          </button>
          <button
            type="button"
            onClick={() => onSave(item, summary.totalScore, scores, false)}
            className="h-10 px-5 rounded-xl bg-[#0D47A1] hover:bg-blue-800 text-white text-[13px] font-bold transition cursor-pointer shadow-xs inline-flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Lưu bảng điểm</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// 3. MODAL XEM FILE PHIẾU THEO DÕI TIẾN ĐỘ THẬT TỪ BACKEND
// ==========================================
interface PreviewTrackingModalProps {
  item: GuidingEvaluationItem | null
  onClose: () => void
  onReUpload: (item: GuidingEvaluationItem) => void
  onDownload: (item: GuidingEvaluationItem) => void
  onOpenReportDetail?: (item: GuidingEvaluationItem) => void
}

export const PreviewTrackingModal: React.FC<PreviewTrackingModalProps> = ({
  item,
  onClose,
  onReUpload,
  onDownload,
  onOpenReportDetail,
}) => {
  const detailQuery = useSupervisorReportDetail(item?.publicId ?? undefined)

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
  const progress = detail?.progressReport ?? item.progressReport
  const progressUrl = progress?.progressFile ?? item.progressFileUrl
  const docTitle =
    (progressUrl
      ? extractProgressFileName(progressUrl, item.fileName || 'Phiếu theo dõi tiến độ')
      : item.fileName) || 'Phiếu theo dõi tiến độ'
  const extLabel = getProgressFileExtensionLabel(progressUrl)
  const canPreviewPdf = isSafeProgressFileUrl(progressUrl) && isPdfProgressFileUrl(progressUrl)
  const canUpdate = canLecturerSubmitProgressReport(item)
  const blockedReason = getProgressUploadBlockedReason(item)
  const supervisorName = progress?.supervisorName ?? item.supervisorName ?? item.lecturerName
  const submittedAt = progress?.submittedAt ?? item.submittedAt
  const supervisorNote = progress?.supervisorNote ?? item.supervisorNote

  return (
    <div className="fixed inset-0 z-50 bg-[#202124] flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* Top Bar */}
      <header className="h-14 sm:h-16 bg-[#202124] border-b border-[#3c4043] flex items-center justify-between px-3 sm:px-6 shrink-0 z-30 shadow-md gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="px-2 py-0.5 rounded bg-[#EA4335] text-white text-[11px] font-extrabold tracking-wider shrink-0 shadow-xs">
            {extLabel}
          </span>
          <div className="min-w-0">
            <h2
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
          {canUpdate && (
            <button
              type="button"
              onClick={() => {
                onClose()
                onReUpload(item)
              }}
              className="h-8.5 px-3 rounded-lg bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Cập nhật phiếu theo dõi tiến độ mới cho sinh viên này"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cập nhật phiếu theo dõi</span>
            </button>
          )}

          {isSafeProgressFileUrl(progressUrl) && (
            <>
              <a
                href={progressUrl!}
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
                onClick={() => onDownload(item)}
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
              {(detail?.lecturerName ?? item.lecturerName) && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">GVHD chính</span>
                  <span className="text-slate-100 text-right">
                    {detail?.lecturerName ?? item.lecturerName}
                  </span>
                </div>
              )}
              {(detail?.coLecturerName ?? item.coLecturerName) && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">Đồng hướng dẫn</span>
                  <span className="text-slate-100 text-right">
                    {detail?.coLecturerName ?? item.coLecturerName}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Phiếu theo dõi tiến độ
            </div>
            <div className="rounded-xl bg-[#303134] p-3.5 border border-[#3c4043] space-y-2">
              {progress ? (
                <>
                  <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Đã nộp phiếu theo dõi tiến độ</span>
                  </div>
                  {supervisorName && (
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-400">Người nộp</span>
                      <span className="text-slate-100 text-right">{supervisorName}</span>
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
                  <div className="pt-1 border-t border-[#3c4043]">
                    <div className="text-slate-400 mb-0.5">Nhận xét của GVHD</div>
                    {supervisorNote ? (
                      <p className="text-slate-100 leading-relaxed whitespace-pre-wrap">
                        {supervisorNote}
                      </p>
                    ) : (
                      <p className="text-slate-400 italic">Không có ghi chú</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-amber-300 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>Chưa có phiếu theo dõi tiến độ.</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Báo cáo Final của sinh viên
            </div>
            <div className="rounded-xl bg-[#303134] p-3.5 border border-[#3c4043] space-y-2">
              {item.publicId ? (
                <>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400">Trạng thái</span>
                    <span className="font-semibold text-amber-300 text-right">
                      {detail?.statusDescription ??
                        item.finalReportStatusDescription ??
                        'Đã nộp báo cáo'}
                    </span>
                  </div>
                  {(detail?.submittedAt ?? item.finalReportSubmittedAt) && (
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-400">Nộp báo cáo</span>
                      <span className="text-slate-100 text-right">
                        {formatDate(detail?.submittedAt ?? item.finalReportSubmittedAt, 'full')}
                      </span>
                    </div>
                  )}
                  {onOpenReportDetail && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        onOpenReportDetail(item)
                      }}
                      className="inline-flex items-center gap-1.5 text-blue-400 hover:underline font-semibold pt-1 cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>Xem chi tiết báo cáo & lịch sử nộp</span>
                    </button>
                  )}
                </>
              ) : (
                <span className="text-slate-400 italic">
                  Sinh viên chưa nộp báo cáo Final
                </span>
              )}
            </div>
          </div>

          {!canUpdate && blockedReason && (
            <div className="rounded-xl bg-amber-950/50 border border-amber-700/60 p-3 text-amber-200">
              {blockedReason}
            </div>
          )}
        </aside>

        {/* Main Viewer */}
        <main className="flex-1 min-h-0 p-4 flex items-center justify-center">
          {canPreviewPdf && progressUrl ? (
            <iframe
              src={progressUrl}
              title={docTitle}
              className="w-full h-full rounded-xl border border-[#3c4043] bg-white"
            />
          ) : isSafeProgressFileUrl(progressUrl) ? (
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
                  onClick={() => onDownload(item)}
                  className="bg-[#1565C0] hover:bg-[#0D47A1] text-white"
                >
                  <Download className="w-4 h-4" /> Tải xuống tệp
                </Button>
                <a
                  href={progressUrl!}
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
              Không có tệp phiếu theo dõi để hiển thị.
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

// ==========================================
// 4. MODAL CHI TIẾT BÁO CÁO FINAL & LỊCH SỬ NỘP (GET /report/{publicId})
// ==========================================
interface StudentReportDetailModalProps {
  item: GuidingEvaluationItem | null
  onClose: () => void
  onDownloadFinalReport: (item: GuidingEvaluationItem) => void
  onOpenProgressUpload: (item: GuidingEvaluationItem) => void
}

export const StudentReportDetailModal: React.FC<
  StudentReportDetailModalProps
> = ({ item, onClose, onDownloadFinalReport, onOpenProgressUpload }) => {
  const detailQuery = useSupervisorReportDetail(item?.publicId ?? undefined)

  useEffect(() => {
    if (!item) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [item, onClose])

  if (!item) return null

  const detail = detailQuery.data
  const histories = detail?.histories ?? []
  const finalReportUrl = detail?.finalReportFile ?? item.finalReportFile
  const finalReportName = finalReportUrl
    ? extractProgressFileName(finalReportUrl, item.finalReportFileName || 'Báo cáo Final')
    : item.finalReportFileName
  const progress = detail?.progressReport ?? item.progressReport
  const canUpload = canLecturerSubmitProgressReport(item)

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[88vh] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <History className="w-5 h-5 text-[#1565C0] shrink-0" />
            <div className="min-w-0">
              <h3 className="text-[15px] font-bold text-slate-900 truncate">
                Chi tiết Báo cáo Final & Phiếu tiến độ — {item.name} ({item.mssv})
              </h3>
              <p className="text-xs text-slate-500 truncate">{item.topic}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-[13px]">
          {detailQuery.isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          ) : detailQuery.isError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-center justify-between gap-3">
              <span>Không tải được chi tiết báo cáo từ máy chủ.</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void detailQuery.refetch()}
              >
                Thử lại
              </Button>
            </div>
          ) : (
            <>
              {/* Tổng quan báo cáo Final & Phiếu tiến độ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Báo cáo Final hiện tại
                  </div>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900">
                      {detail?.statusDescription ??
                        item.finalReportStatusDescription ??
                        'Đã nộp'}
                    </span>
                    {(detail?.submittedAt ?? item.finalReportSubmittedAt) && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(
                          detail?.submittedAt ?? item.finalReportSubmittedAt,
                          'full',
                        )}
                      </span>
                    )}
                  </div>
                  {finalReportUrl && isSafeProgressFileUrl(finalReportUrl) && (
                    <div className="flex items-center gap-3 flex-wrap pt-1">
                      <a
                        href={finalReportUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1565C0] hover:underline"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{finalReportName}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        type="button"
                        onClick={() => onDownloadFinalReport(item)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-[#1565C0] cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Tải xuống</span>
                      </button>
                    </div>
                  )}
                  {(detail?.supervisorFeedback ?? item.supervisorFeedback) && (
                    <p className="text-xs text-slate-700 pt-1 border-t border-slate-200">
                      <span className="font-semibold">Nhận xét báo cáo: </span>
                      {detail?.supervisorFeedback ?? item.supervisorFeedback}
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Phiếu theo dõi tiến độ
                    </span>
                    {canUpload && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose()
                          onOpenProgressUpload(item)
                        }}
                        className="text-xs font-bold text-[#1565C0] hover:underline cursor-pointer"
                      >
                        {progress ? 'Cập nhật phiếu' : 'Nộp phiếu ngay'}
                      </button>
                    )}
                  </div>
                  {progress ? (
                    <>
                      <div className="text-emerald-700 font-semibold flex items-center gap-1.5 text-xs">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Đã nộp phiếu theo dõi tiến độ</span>
                      </div>
                      {progress.submittedAt && (
                        <div className="text-xs text-slate-500">
                          Nộp lúc: {formatDate(progress.submittedAt, 'full')}
                        </div>
                      )}
                      {progress.supervisorNote && (
                        <p className="text-xs text-slate-700">
                          <span className="font-semibold">Ghi chú GVHD: </span>
                          {progress.supervisorNote}
                        </p>
                      )}
                      {isSafeProgressFileUrl(progress.progressFile) && (
                        <a
                          href={progress.progressFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#1565C0] hover:underline"
                        >
                          <span>
                            {extractProgressFileName(
                              progress.progressFile,
                              'Phiếu theo dõi tiến độ',
                            )}
                          </span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </>
                  ) : (
                    <div className="text-xs text-amber-700 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Chưa nộp phiếu theo dõi tiến độ.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Lịch sử nộp báo cáo Final */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Lịch sử các lần nộp Báo cáo Final ({histories.length})
                </h4>
                {histories.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    Chưa có lịch sử nộp báo cáo nào.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-[12.5px] border-collapse">
                      <thead className="bg-slate-50 text-slate-600 text-[11px] font-bold uppercase border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 text-center w-16">Lần</th>
                          <th className="px-4 py-3">Thời gian nộp</th>
                          <th className="px-4 py-3">Tệp báo cáo</th>
                          <th className="px-4 py-3">Đạo văn</th>
                          <th className="px-4 py-3 text-center">Trạng thái</th>
                          <th className="px-4 py-3">Nhận xét GVHD</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {histories.map((hist, index) => {
                          const badge = HISTORY_STATUS_BADGE[hist.status]
                          const submitNumber = histories.length - index
                          const histFileName = extractProgressFileName(
                            hist.finalHistoryFile,
                            `Báo cáo lần ${submitNumber}`,
                          )
                          return (
                            <tr
                              key={hist.publicId}
                              className="hover:bg-slate-50/70 transition-colors"
                            >
                              <td className="px-4 py-3 text-center font-bold text-slate-700">
                                Lần {submitNumber}
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {formatDate(hist.submittedAt, 'full')}
                              </td>
                              <td className="px-4 py-3">
                                {isSafeProgressFileUrl(hist.finalHistoryFile) ? (
                                  <a
                                    href={hist.finalHistoryFile}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 font-semibold text-[#1565C0] hover:underline break-all"
                                  >
                                    <FileText className="w-3.5 h-3.5 shrink-0" />
                                    <span>{histFileName}</span>
                                  </a>
                                ) : (
                                  <span>{histFileName}</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {hist.plagiarismRate !== null ? (
                                  <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800">
                                    {hist.plagiarismRate}%
                                  </span>
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
            </>
          )}
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <Button type="button" variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  )
}
