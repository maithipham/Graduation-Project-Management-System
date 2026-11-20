import React, { useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  Award,
  CheckCircle2,
  Download,
  FileText,
  Lock,
  Save,
  Send,
  Upload,
  XCircle,
} from 'lucide-react'
import { isApiError } from '@/shared/types'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton,
} from '@/shared/components/ui'
import { formatDate } from '@/shared/utils'
import {
  useExaminerEvaluation,
  useSaveExaminerEvaluation,
  useUploadReviewFile,
} from '../hooks/useExaminerReview'
import type { ExaminerEvaluation, ExaminerEvaluationRequest } from '../types'

const SCORE_REGEX = /^(10(\.0)?|[0-9](\.[0-9])?)$/

interface ExaminerGradingFormProps {
  evaluation: ExaminerEvaluation
  isLocked: boolean
}

const ExaminerGradingForm: React.FC<ExaminerGradingFormProps> = ({
  evaluation,
  isLocked,
}) => {
  const saveMutation = useSaveExaminerEvaluation(
    evaluation.examinerAssignmentPublicId,
  )
  const uploadMutation = useUploadReviewFile(
    evaluation.examinerAssignmentPublicId,
  )

  // Initialize form state directly from evaluation prop
  const [criteriaScores, setCriteriaScores] = useState<Record<string, string>>(
    () => {
      const initial: Record<string, string> = {}
      evaluation.sheet.groups.forEach((g) => {
        g.criteria.forEach((c) => {
          initial[c.criteriaPublicId] =
            c.score !== null && c.score !== undefined ? String(c.score) : ''
        })
      })
      return initial
    },
  )

  const [scoreErrors, setScoreErrors] = useState<Record<string, string>>({})
  const [generalComment, setGeneralComment] = useState(
    () => evaluation.sheet.generalComment ?? '',
  )
  const [question1, setQuestion1] = useState(() => evaluation.question1 ?? '')
  const [question2, setQuestion2] = useState(() => evaluation.question2 ?? '')
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED' | null>(
    () =>
      evaluation.decision === 'APPROVED' || evaluation.decision === 'REJECTED'
        ? evaluation.decision
        : null,
  )
  const [serverError, setServerError] = useState<string | null>(null)

  // File upload
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  // Confirm dialog for reverting SUBMITTED to DRAFT
  const [confirmDraftOpen, setConfirmDraftOpen] = useState(false)

  // Live calculation of preview score
  const calculatedTotal = useMemo(() => {
    let total = 0

    evaluation.sheet.groups.forEach((g) => {
      g.criteria.forEach((c) => {
        const valStr = criteriaScores[c.criteriaPublicId]?.trim()
        if (valStr && SCORE_REGEX.test(valStr)) {
          const num = parseFloat(valStr)
          total += (num * c.weight) / 100
        }
      })
    })

    return Math.round(total * 10) / 10
  }, [evaluation, criteriaScores])

  const handleScoreChange = (criteriaId: string, val: string) => {
    setCriteriaScores((prev) => ({ ...prev, [criteriaId]: val }))
    if (scoreErrors[criteriaId]) {
      setScoreErrors((prev) => {
        const next = { ...prev }
        delete next[criteriaId]
        return next
      })
    }
    if (serverError) setServerError(null)
  }

  const validateScores = (requireAll: boolean): boolean => {
    const errors: Record<string, string> = {}
    let isValid = true

    evaluation.sheet.groups.forEach((g) => {
      g.criteria.forEach((c) => {
        const valStr = criteriaScores[c.criteriaPublicId]?.trim() ?? ''
        if (!valStr) {
          if (requireAll) {
            errors[c.criteriaPublicId] = 'Vui lòng chấm điểm tiêu chí này'
            isValid = false
          }
        } else if (!SCORE_REGEX.test(valStr)) {
          errors[c.criteriaPublicId] = 'Điểm từ 0 đến 10, tối đa 1 số thập phân'
          isValid = false
        } else {
          const num = parseFloat(valStr)
          if (num < 0 || num > 10) {
            errors[c.criteriaPublicId] = 'Điểm phải trong khoảng 0 – 10'
            isValid = false
          }
        }
      })
    })

    setScoreErrors(errors)
    return isValid
  }

  const doSubmit = (submit: boolean) => {
    setServerError(null)

    if (!validateScores(submit)) {
      setServerError(
        submit
          ? 'Vui lòng chấm điểm đầy đủ và hợp lệ cho tất cả các tiêu chí trước khi nộp phiếu.'
          : 'Có một số điểm tiêu chí chưa hợp lệ. Vui lòng kiểm tra lại.',
      )
      return
    }

    const payload: ExaminerEvaluationRequest = {
      criteriaScores: Object.entries(criteriaScores).map(([id, val]) => ({
        criteriaPublicId: id,
        score: val.trim() !== '' ? parseFloat(val.trim()) : null,
      })),
      generalComment: generalComment.trim() || null,
      question1: question1.trim() || null,
      question2: question2.trim() || null,
      decision,
      submit,
    }

    saveMutation.mutate(payload, {
      onError: (err) => {
        if (isApiError(err)) {
          setServerError(
            err.message || 'Không thể lưu phiếu phản biện. Vui lòng thử lại.',
          )
        } else {
          setServerError('Có lỗi xảy ra, vui lòng thử lại.')
        }
      },
    })
  }

  const handleSaveDraftClick = () => {
    if (evaluation.sheet.status === 'SUBMITTED') {
      setConfirmDraftOpen(true)
    } else {
      doSubmit(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileError(null)
    const allowedExtensions = ['.pdf', '.doc', '.docx']
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    if (!allowedExtensions.includes(ext)) {
      setFileError('File nhận xét phải có định dạng .pdf, .doc hoặc .docx')
      return
    }

    uploadMutation.mutate(file, {
      onError: (err) => {
        if (isApiError(err)) {
          setFileError(err.message || 'Không thể tải lên file nhận xét')
        } else {
          setFileError('Lỗi tải file, vui lòng thử lại')
        }
      },
    })
  }

  return (
    <>
      {/* 1. Rubric Evaluation Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-[#1565C0]" />
              Tiêu chí chấm điểm phản biện (Rubric)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Thang điểm 10 cho từng tiêu chí, lẻ tối đa 1 chữ số thập phân (VD: 8.5).
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 text-xs shrink-0">
            <span className="text-slate-600 font-medium">Tổng tạm tính:</span>
            <span className="text-base font-bold text-[#1565C0]">
              {calculatedTotal.toFixed(1)} / 10
            </span>
            <span className="text-[11px] text-slate-400">
              (tự động quy đổi theo trọng số)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4 min-w-[280px]">Nội dung đánh giá</th>
                <th className="py-3 px-4 w-28 text-center">Trọng số (%)</th>
                <th className="py-3 px-4 w-36 text-center">Điểm chấm (0–10)</th>
              </tr>
            </thead>
            <tbody>
              {evaluation.sheet.groups.map((group, gIdx) => (
                <React.Fragment key={group.groupPublicId}>
                  <tr className="bg-slate-100/70 border-y border-slate-200">
                    <td
                      colSpan={4}
                      className="py-2.5 px-4 font-bold text-slate-800 text-xs"
                    >
                      {gIdx + 1}. {group.name}
                    </td>
                  </tr>

                  {group.criteria.map((c, cIdx) => {
                    const errorMsg = scoreErrors[c.criteriaPublicId]
                    return (
                      <tr
                        key={c.criteriaPublicId}
                        className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="py-3 px-4 text-center font-medium text-slate-400 text-xs">
                          {gIdx + 1}.{cIdx + 1}
                        </td>

                        <td className="py-3 px-4 text-slate-800 leading-relaxed font-medium">
                          {c.name}
                        </td>

                        <td className="py-3 px-4 text-center font-semibold text-slate-600">
                          {c.weight}%
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <input
                              type="text"
                              inputMode="decimal"
                              disabled={isLocked}
                              value={criteriaScores[c.criteriaPublicId] ?? ''}
                              onChange={(e) =>
                                handleScoreChange(
                                  c.criteriaPublicId,
                                  e.target.value,
                                )
                              }
                              placeholder="0 – 10"
                              className={`w-20 text-center text-xs font-bold py-1.5 px-2 rounded-lg border transition ${
                                errorMsg
                                  ? 'border-[#DC2626] bg-rose-50 text-[#DC2626]'
                                  : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0]'
                              } disabled:opacity-60 disabled:cursor-not-allowed`}
                            />
                            {errorMsg && (
                              <span className="text-[10px] font-semibold text-[#DC2626] mt-1">
                                {errorMsg}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Questions & General Comments */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#1565C0]" />
          Nhận xét & Câu hỏi cho sinh viên
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nhận xét chung về khóa luận
            </label>
            <textarea
              rows={3}
              disabled={isLocked}
              value={generalComment}
              onChange={(e) => setGeneralComment(e.target.value)}
              placeholder="Nhập ưu điểm, nhược điểm, mức độ hoàn thành nội dung đồ án..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0] transition disabled:opacity-60"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Câu hỏi phản biện 1
              </label>
              <textarea
                rows={2}
                disabled={isLocked}
                value={question1}
                onChange={(e) => setQuestion1(e.target.value)}
                placeholder="Câu hỏi chuyên môn thứ nhất..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0] transition disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Câu hỏi phản biện 2
              </label>
              <textarea
                rows={2}
                disabled={isLocked}
                value={question2}
                onChange={(e) => setQuestion2(e.target.value)}
                placeholder="Câu hỏi chuyên môn thứ hai..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0] transition disabled:opacity-60"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Decision & File Upload */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div>
          <h2 className="text-sm font-bold text-slate-900 mb-2">
            Đề xuất điều kiện ra bảo vệ trước Hội đồng
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Quyết định của GVPB là điều kiện bắt buộc để sinh viên được xét duyệt ra Hội đồng bảo vệ.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
            <button
              type="button"
              disabled={isLocked}
              onClick={() => setDecision('APPROVED')}
              className={`p-4 rounded-xl border-2 text-left transition flex items-center justify-between cursor-pointer disabled:cursor-not-allowed ${
                decision === 'APPROVED'
                  ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700'
              }`}
            >
              <div>
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <CheckCircle2
                    className={`w-4 h-4 ${decision === 'APPROVED' ? 'text-emerald-600' : 'text-slate-400'}`}
                  />
                  Đủ điều kiện bảo vệ
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Đồng ý cho sinh viên ra bảo vệ trước Hội đồng.
                </div>
              </div>
            </button>

            <button
              type="button"
              disabled={isLocked}
              onClick={() => setDecision('REJECTED')}
              className={`p-4 rounded-xl border-2 text-left transition flex items-center justify-between cursor-pointer disabled:cursor-not-allowed ${
                decision === 'REJECTED'
                  ? 'border-rose-600 bg-rose-50/60 text-rose-900 ring-2 ring-rose-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700'
              }`}
            >
              <div>
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <XCircle
                    className={`w-4 h-4 ${decision === 'REJECTED' ? 'text-rose-600' : 'text-slate-400'}`}
                  />
                  Không đủ điều kiện bảo vệ
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Đồ án chưa đạt yêu cầu, không cho ra bảo vệ.
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Upload File Nhận Xét */}
        <div className="pt-4 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            File nhận xét phản biện (tùy chọn)
          </label>
          <p className="text-[11px] text-slate-500 mb-3">
            Tải lên bản nhận xét chi tiết định dạng PDF hoặc DOC/DOCX.
          </p>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.doc,.docx"
            className="hidden"
          />

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              type="button"
              variant="outline"
              disabled={isLocked || uploadMutation.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              {uploadMutation.isPending ? 'Đang tải lên...' : 'Tải file nhận xét'}
            </Button>

            {evaluation.reviewFileName && evaluation.reviewFileUrl ? (
              <a
                href={evaluation.reviewFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1565C0] hover:underline bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{evaluation.reviewFileName}</span>
              </a>
            ) : (
              <span className="text-xs text-slate-400 italic">
                Chưa có file nhận xét
              </span>
            )}
          </div>

          {fileError && (
            <p className="text-xs font-semibold text-[#DC2626] mt-2">
              {fileError}
            </p>
          )}
        </div>
      </div>

      {/* Server Error Alert */}
      {serverError && (
        <div
          role="alert"
          className="bg-rose-50 border border-rose-200 text-[#DC2626] text-xs font-semibold p-4 rounded-xl flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Action Footer */}
      {!isLocked && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-4 sticky bottom-4 z-10">
          <Link
            to="/lecturer/defense/reviews"
            className="text-xs text-slate-500 hover:text-slate-700 font-medium"
          >
            Hủy và quay lại
          </Link>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={saveMutation.isPending}
              onClick={handleSaveDraftClick}
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              Lưu nháp
            </Button>

            <Button
              type="button"
              disabled={saveMutation.isPending}
              onClick={() => doSubmit(true)}
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              {saveMutation.isPending ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </div>
        </div>
      )}

      {/* Confirm Dialog when saving Draft on a SUBMITTED sheet */}
      <Dialog open={confirmDraftOpen} onOpenChange={setConfirmDraftOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận chuyển về bản nháp</DialogTitle>
            <DialogDescription>
              Phiếu phản biện này đã được nộp chính thức. Việc lưu nháp sẽ chuyển
              phiếu về trạng thái <strong>Nháp</strong> và điểm sẽ không còn
              được tính cho sinh viên cho đến khi nộp lại.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-3">
            <Button
              variant="outline"
              onClick={() => setConfirmDraftOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmDraftOpen(false)
                doSubmit(false)
              }}
            >
              Xác nhận chuyển về nháp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export const ExaminerGradingPage: React.FC = () => {
  const { examinerAssignmentPublicId } = useParams<{
    examinerAssignmentPublicId: string
  }>()

  const {
    data: evaluation,
    isPending,
    isError,
  } = useExaminerEvaluation(examinerAssignmentPublicId)

  if (isPending) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-6 w-48 rounded" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    )
  }

  if (isError || !evaluation) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Link
          to="/lecturer/defense/reviews"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1565C0] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách phản biện
        </Link>
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-6 rounded-2xl">
          Không tìm thấy thông tin phiếu chấm phản biện hoặc bạn không có quyền
          truy cập.
        </div>
      </div>
    )
  }

  const isLocked = !evaluation.editable || !evaluation.gradingOpen

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Back Link */}
      <div>
        <Link
          to="/lecturer/defense/reviews"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1565C0] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách sinh viên phản biện</span>
        </Link>
      </div>

      {/* Lock Banner */}
      {isLocked && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold">
              Phiếu chấm phản biện đang ở chế độ chỉ đọc:
            </span>
            <p>
              {!evaluation.editable
                ? 'Sinh viên đã được xếp ca bảo vệ hoặc hoàn tất quá trình bảo vệ — không thể chỉnh sửa phản biện.'
                : `Chỉ được chấm từ ${evaluation.gradingStartAt ? formatDate(evaluation.gradingStartAt, 'short') : 'mốc mở'} đến trước ${evaluation.gradingCloseAt ? formatDate(evaluation.gradingCloseAt, 'short') : 'mốc đóng'}.`}
            </p>
          </div>
        </div>
      )}

      {/* Header Info Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-[#1565C0] border border-blue-200">
                PB {evaluation.examinerOrder}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                Hội đồng: {evaluation.councilCode}
              </span>
              {evaluation.sheet.status === 'SUBMITTED' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Đã nộp phiếu (
                  {evaluation.sheet.roundedTotalScore !== null
                    ? `${evaluation.sheet.roundedTotalScore.toFixed(1)}đ`
                    : '—'}
                  )
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Bản nháp
                </span>
              )}
            </div>

            <h1 className="text-xl font-bold text-slate-900">
              {evaluation.studentName}
            </h1>
            <div className="text-xs text-slate-500 flex items-center gap-2 font-mono">
              <span>MSSV: {evaluation.studentCode}</span>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs shrink-0 space-y-1">
            <div>
              <span className="text-slate-500">Điểm TB 2 GVPB:</span>{' '}
              <strong className="text-slate-900 font-bold">
                {evaluation.examinerScore !== null
                  ? `${evaluation.examinerScore.toFixed(1)} / 10`
                  : 'Chưa đủ 2 phiếu'}
              </strong>
            </div>
            <div>
              <span className="text-slate-500">Kết quả phản biện:</span>{' '}
              {evaluation.examinerPassed === true && (
                <span className="text-emerald-700 font-bold">Đạt điều kiện</span>
              )}
              {evaluation.examinerPassed === false && (
                <span className="text-rose-700 font-bold">Không đạt</span>
              )}
              {evaluation.examinerPassed === null && (
                <span className="text-slate-400">Chưa có kết quả</span>
              )}
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-700">
          <span className="text-slate-500">Tên đề tài:</span>{' '}
          <strong className="text-slate-900 font-semibold">
            {evaluation.topicName ?? 'Chưa có tên đề tài'}
          </strong>
        </div>
      </div>

      <ExaminerGradingForm
        key={
          evaluation.examinerAssignmentPublicId +
          (evaluation.sheet.updatedAt ?? '') +
          (evaluation.sheet.status ?? '')
        }
        evaluation={evaluation}
        isLocked={isLocked}
      />
    </div>
  )
}

export default ExaminerGradingPage
