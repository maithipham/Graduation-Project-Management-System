import React, { useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  Save,
  Send,
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
import { useMyInfo } from '@/features/auth'
import {
  useExaminerEvaluation,
  useSaveExaminerEvaluation,
} from '../hooks/useExaminerReview'
import { examinerReviewService } from '../services/examinerReview.service'
import { MeetingLocation } from './MeetingLocation'
import { RubricSheetExportActions } from './RubricSheetExportActions'
import type {
  ExaminerEvaluation,
  ExaminerEvaluationRequest,
  MyExaminerAssignment,
} from '../types'

const SCORE_REGEX = /^(10(\.0)?|[0-9](\.[0-9])?)$/

interface RubricGradingFormProps {
  evaluation: ExaminerEvaluation
  assignment: MyExaminerAssignment
  lecturerName: string
}

const RubricGradingForm: React.FC<RubricGradingFormProps> = ({
  evaluation,
  assignment,
  lecturerName,
}) => {
  const saveMutation = useSaveExaminerEvaluation(
    evaluation.examinerAssignmentPublicId,
  )

  const isLocked = !evaluation.editable || !evaluation.gradingOpen
  // Trong buổi bảo vệ (điểm bị lệch): chỉ sửa điểm, nhận xét và nộp lại phiếu tới khi Hoàn tất bảo vệ
  const defenseOnly = evaluation.defenseEditing

  // Form states
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


  // Confirm dialog
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
            errors[c.criteriaPublicId] = 'Vui lòng nhập điểm'
            isValid = false
          }
        } else if (!SCORE_REGEX.test(valStr)) {
          errors[c.criteriaPublicId] = 'Điểm từ 0 đến 10, lẻ 1 chữ số'
          isValid = false
        } else {
          const num = parseFloat(valStr)
          if (num < 0 || num > 10) {
            errors[c.criteriaPublicId] = 'Điểm từ 0 – 10'
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
          : 'Có một số điểm tiêu chí chưa đúng định dạng. Vui lòng kiểm tra lại.',
      )
      return
    }

    // Nộp phiếu (không áp dụng cho lưu nháp và sửa điểm trong buổi bảo vệ): bắt buộc nhận xét + 2 câu hỏi
    if (submit && !defenseOnly) {
      const missing = [
        !generalComment.trim() && 'Nhận xét',
        !question1.trim() && 'Câu hỏi 1',
        !question2.trim() && 'Câu hỏi 2',
      ].filter(Boolean)
      if (missing.length > 0) {
        setServerError(`Vui lòng nhập ${missing.join(', ')} trước khi nộp phiếu.`)
        return
      }
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

  const coExaminerName = assignment.coExaminer
    ? `${assignment.coExaminer.academicTitle ? `${assignment.coExaminer.academicTitle} ` : ''}${assignment.coExaminer.fullName}`
    : 'Chưa phân công'

  const coExaminerSchedule = assignment.coExaminer?.reviewDate && assignment.coExaminer?.reviewStartTime
    ? `${formatDate(assignment.coExaminer.reviewDate, 'short')} ${assignment.coExaminer.reviewStartTime}${assignment.coExaminer.reviewEndTime ? `–${assignment.coExaminer.reviewEndTime}` : ''}${assignment.coExaminer.reviewLocation ? ` · ${assignment.coExaminer.reviewLocation}` : ''}`
    : 'Chưa có lịch'

  const scheduleDisplay =
    assignment.reviewDate && assignment.reviewStartTime
      ? `${formatDate(assignment.reviewDate, 'short')} - ${assignment.reviewStartTime}`
      : 'Chưa có lịch'

  return (
    <div className="space-y-6">
      {/* 1. Header Title & Report Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-[#1565C0] tracking-tight uppercase">
            Rubric đánh giá đồ án tốt nghiệp dành cho cán bộ đọc phản biện
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-500 font-mono">
              Phân công: PB {assignment.examinerOrder} · Hội đồng {assignment.councilCode}
            </span>
            {evaluation.sheet.status === 'SUBMITTED' ? (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Đã nộp ({evaluation.sheet.roundedTotalScore?.toFixed(1) ?? '—'}đ)
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                Bản nháp
              </span>
            )}
          </div>
        </div>

        {/* Không còn bước tải file nhận xét: phiếu chấm sau khi bấm Nộp chính là bản nhận xét phản biện */}
      </div>

      {/* Lock Banner if locked */}
      {isLocked && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3.5 flex items-start gap-2.5 text-xs">
          <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Phiếu phản biện đang khóa: </span>
            <span>
              {!evaluation.editable
                ? 'Sinh viên đã được xếp ca bảo vệ hoặc hoàn tất.'
                : `Chỉ chấm từ ${evaluation.gradingStartAt ? formatDate(evaluation.gradingStartAt, 'short') : ''} đến trước ${evaluation.gradingCloseAt ? formatDate(evaluation.gradingCloseAt, 'short') : ''}.`}
            </span>
          </div>
        </div>
      )}

      {defenseOnly && !isLocked && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <span className="font-bold">Đang trong buổi bảo vệ: </span>
            chỉ sửa điểm, nhận xét và nộp lại phiếu (khi điểm bị lệch), được sửa tới khi Chủ tịch bấm Hoàn tất bảo vệ.
            Không đổi được quyết định phản biện, câu hỏi hay file nhận xét.
          </span>
        </div>
      )}

      {/* 2. Three Info Cards matching Image 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Card 1: GV Hướng Dẫn */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            GV Hướng dẫn
          </div>
          <div className="font-bold text-xs text-slate-900 truncate">
            {assignment.topicName ? 'TS. Vũ Thị Lan' : 'Đang cập nhật'}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <span>Điểm HD: <strong className="text-slate-800 font-semibold">9.0</strong></span>
            <span>·</span>
            <span>Tỷ lệ trùng lặp: <strong className="text-emerald-700 font-semibold">8%</strong></span>
          </div>
        </div>

        {/* Card 2: Cặp GVPB */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Cặp GVPB (Cặp {assignment.examinerOrder})
          </div>
          <div className="text-xs text-slate-700 truncate">
            Đồng PB: <strong className="text-slate-900 font-bold">{coExaminerName}</strong>
          </div>
          <div className="text-[11px] text-slate-500 truncate" title={`Lịch phản biện của đồng PB: ${coExaminerSchedule}`}>
            Lịch đồng PB: <span className="text-slate-700 font-medium">{coExaminerSchedule}</span>
          </div>
        </div>

        {/* Card 3: Lịch Phản Biện của tôi */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Lịch phản biện của tôi
          </div>
          <div className="font-bold text-xs text-slate-900">
            {scheduleDisplay}
          </div>
          <div className="text-[11px] text-slate-500 truncate">
            <MeetingLocation location={assignment.reviewLocation} fallback="Chưa xếp phòng" />
          </div>
        </div>
      </div>

      {/* 3. Personnel & Student Info Details matching Image 1 */}
      <div className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-4 text-xs space-y-2 leading-relaxed">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
          <div>
            <span className="text-slate-500">Họ và tên cán bộ phản biện: </span>
            <strong className="text-slate-900 font-bold">{lecturerName}</strong>
          </div>
          <div>
            <span className="text-slate-500">Đơn vị công tác: </span>
            <strong className="text-slate-900 font-semibold">Khoa Công nghệ Thông tin – Đại học Thủy Lợi</strong>
          </div>
        </div>

        <div className="border-t border-slate-200/60 pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-700">
          <div>
            <span className="text-slate-500">Họ và tên sinh viên: </span>
            <strong className="text-slate-900 font-bold">{assignment.studentName}</strong>
          </div>
          <div>
            <span className="text-slate-500">Mã sinh viên: </span>
            <strong className="text-slate-900 font-mono font-bold">{assignment.studentCode}</strong>
          </div>
          <div>
            <span className="text-slate-500">Lớp: </span>
            <strong className="text-slate-900 font-semibold">{assignment.className || '—'}</strong>
          </div>
        </div>

        <div className="border-t border-slate-200/60 pt-2 text-slate-700">
          <span className="text-slate-500">Tên đề tài: </span>
          <strong className="text-slate-900 font-bold">{assignment.topicName || 'Chưa có tên đề tài'}</strong>
        </div>
      </div>

      {/* 4. Nhận xét textarea */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-900">
            Nhận xét <span className="text-rose-500">*</span>
          </label>
          <span className="text-[11px] text-slate-400">
            Nêu rõ ưu, nhược điểm và những nội dung cần chỉnh sửa trong đồ án, câu hỏi (nếu có).
          </span>
        </div>
        <textarea
          rows={3}
          disabled={isLocked}
          value={generalComment}
          onChange={(e) => setGeneralComment(e.target.value)}
          placeholder="Ưu điểm, nhược điểm, mức độ hoàn thiện của đồ án..."
          className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:bg-white focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0] transition disabled:opacity-60"
        />
      </div>

      {/* 5. Câu hỏi 1 & Câu hỏi 2 */}
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-900">
            Câu hỏi 1 <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={2}
            disabled={isLocked || defenseOnly}
            value={question1}
            onChange={(e) => setQuestion1(e.target.value)}
            placeholder="Câu hỏi phản biện thứ nhất dành cho sinh viên..."
            className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:bg-white focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0] transition disabled:opacity-60"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-900">
            Câu hỏi 2 <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={2}
            disabled={isLocked || defenseOnly}
            value={question2}
            onChange={(e) => setQuestion2(e.target.value)}
            placeholder="Câu hỏi phản biện thứ hai dành cho sinh viên..."
            className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:bg-white focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0] transition disabled:opacity-60"
          />
        </div>
      </div>

      {/* 6. Bảng tiêu chí đánh giá (Rubric) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-900">
            Bảng tiêu chí đánh giá <span className="text-rose-500">*</span>
          </label>
          <span className="text-[11px] text-slate-400">
            Nhập điểm đánh giá theo thang 10
          </span>
        </div>

        {/* Panel chấm điểm hẹp (nằm cạnh danh sách SV): cột tiêu chí tự xuống dòng, cột điểm luôn hiện;
            màn quá hẹp thì cuộn ngang thay vì cắt mất ô nhập điểm */}
        <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3.5 min-w-[140px]">Tiêu chí đánh giá</th>
                <th className="py-2.5 px-2 w-16 text-center whitespace-nowrap">Trọng số</th>
                <th className="py-2.5 px-2 w-16 text-center whitespace-nowrap">Quy đổi</th>
                <th className="py-2.5 px-2 w-28 text-center whitespace-nowrap">Điểm (0–10)</th>
              </tr>
            </thead>
            <tbody>
              {evaluation.sheet.groups.map((group, gIdx) => (
                <React.Fragment key={group.groupPublicId}>
                  <tr className="bg-slate-100/70 border-y border-slate-200 font-bold text-slate-800 text-[11.5px]">
                    <td colSpan={4} className="py-2 px-3.5">
                      {gIdx + 1}. {group.name}
                    </td>
                  </tr>

                  {group.criteria.map((c, cIdx) => {
                    const scoreStr = criteriaScores[c.criteriaPublicId]?.trim()
                    const scoreVal = scoreStr && SCORE_REGEX.test(scoreStr) ? parseFloat(scoreStr) : null
                    const converted = scoreVal !== null ? ((scoreVal * c.weight) / 100).toFixed(1) : '—'
                    const errorMsg = scoreErrors[c.criteriaPublicId]

                    return (
                      <tr
                        key={c.criteriaPublicId}
                        className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="py-2.5 px-3.5 text-slate-800 leading-snug font-medium">
                          {gIdx + 1}.{cIdx + 1} {c.name}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-500 font-medium">
                          {c.weight}%
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-600">
                          {converted}
                        </td>
                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="text"
                              inputMode="decimal"
                              disabled={isLocked}
                              value={criteriaScores[c.criteriaPublicId] ?? ''}
                              onChange={(e) =>
                                handleScoreChange(c.criteriaPublicId, e.target.value)
                              }
                              placeholder="0"
                              className={`w-14 text-center text-xs font-bold py-1 px-1 rounded-lg border transition ${errorMsg
                                  ? 'border-[#DC2626] bg-rose-50 text-[#DC2626]'
                                  : 'border-slate-200 bg-white focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0]'
                                }`}
                            />
                            <span className="text-[11px] text-slate-400">/ 10</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </React.Fragment>
              ))}

              {/* Row TỔNG */}
              <tr className="bg-blue-50/50 font-bold border-t-2 border-slate-200 text-xs">
                <td className="py-3 px-3.5 text-[#1565C0] uppercase tracking-wide">
                  TỔNG
                </td>
                <td className="py-3 px-3 text-center text-slate-700">100%</td>
                <td className="py-3 px-3 text-center font-mono text-[#1565C0]">
                  {calculatedTotal.toFixed(1)}
                </td>
                <td className="py-3 px-2 text-center text-sm font-bold text-[#1565C0] whitespace-nowrap">
                  {calculatedTotal.toFixed(1)} / 10
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. Đề xuất điều kiện bảo vệ * */}
      <div className="space-y-2 pt-1">
        <label className="text-xs font-bold text-slate-900 block">
          Đề xuất điều kiện bảo vệ <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
          <button
            type="button"
            disabled={isLocked || defenseOnly}
            onClick={() => setDecision('APPROVED')}
            className={`p-3 rounded-xl border-2 text-left transition flex items-center justify-between cursor-pointer disabled:cursor-not-allowed ${decision === 'APPROVED'
                ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
              }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2
                className={`w-4 h-4 ${decision === 'APPROVED' ? 'text-emerald-600' : 'text-slate-400'}`}
              />
              <span className="font-bold text-xs">Đủ điều kiện bảo vệ</span>
            </div>
          </button>

          <button
            type="button"
            disabled={isLocked || defenseOnly}
            onClick={() => setDecision('REJECTED')}
            className={`p-3 rounded-xl border-2 text-left transition flex items-center justify-between cursor-pointer disabled:cursor-not-allowed ${decision === 'REJECTED'
                ? 'border-rose-600 bg-rose-50 text-rose-900 ring-2 ring-rose-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
              }`}
          >
            <div className="flex items-center gap-2">
              <XCircle
                className={`w-4 h-4 ${decision === 'REJECTED' ? 'text-rose-600' : 'text-slate-400'}`}
              />
              <span className="font-bold text-xs">Không đủ điều kiện bảo vệ</span>
            </div>
          </button>
        </div>
      </div>


      {/* Server Error Alert */}
      {serverError && (
        <div
          role="alert"
          className="bg-rose-50 border border-rose-200 text-[#DC2626] text-xs font-semibold p-3.5 rounded-xl flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Footer Buttons */}
      <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <RubricSheetExportActions
          download={() => examinerReviewService.exportEvaluation(evaluation.examinerAssignmentPublicId)}
          savedFileUrl={evaluation.sheet.sheetFileUrl}
          savedFileName={evaluation.sheet.sheetFileName}
        />
      {!isLocked && (
        <div className="flex items-center justify-end gap-3">
          {/* Trong buổi bảo vệ không lưu nháp: phiếu nháp sẽ không được tính điểm */}
          {!defenseOnly && (
            <Button
              type="button"
              variant="outline"
              disabled={saveMutation.isPending}
              onClick={handleSaveDraftClick}
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              Lưu nháp
            </Button>
          )}

          <Button
            type="button"
            disabled={saveMutation.isPending}
            onClick={() => doSubmit(true)}
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            {saveMutation.isPending ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </div>
      )}
      </div>

      {/* Confirm Dialog when converting SUBMITTED to DRAFT */}
      <Dialog open={confirmDraftOpen} onOpenChange={setConfirmDraftOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chuyển về bản nháp?</DialogTitle>
            <DialogDescription>
              Phiếu phản biện này đã nộp chính thức. Bấm lưu nháp sẽ chuyển phiếu về
              trạng thái <strong>Nháp</strong> và không còn được tính điểm cho sinh viên.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setConfirmDraftOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmDraftOpen(false)
                doSubmit(false)
              }}
            >
              Chuyển về nháp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface RubricGradingPanelProps {
  assignment: MyExaminerAssignment
}

export const RubricGradingPanel: React.FC<RubricGradingPanelProps> = ({
  assignment,
}) => {
  const { data: myInfo } = useMyInfo()
  const { data: evaluation, isPending, isError } = useExaminerEvaluation(
    assignment.examinerAssignmentPublicId,
  )

  const lecturerName = myInfo?.name || 'Giảng viên phản biện'

  if (isPending) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-7 w-2/3" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (isError || !evaluation) {
    return (
      <div className="p-12 text-center text-xs text-rose-600">
        Không thể tải phiếu chấm phản biện của sinh viên này. Vui lòng thử lại.
      </div>
    )
  }

  return (
    <RubricGradingForm
      key={
        evaluation.examinerAssignmentPublicId +
        (evaluation.sheet.updatedAt ?? '') +
        (evaluation.sheet.status ?? '')
      }
      evaluation={evaluation}
      assignment={assignment}
      lecturerName={lecturerName}
    />
  )
}
