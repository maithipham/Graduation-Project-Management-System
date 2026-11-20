import { Fragment, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, FileDown, FileSpreadsheet, Info, Lock, Send } from 'lucide-react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Skeleton,
  Textarea,
} from '@/shared/components/ui'
import { isApiError } from '@/shared/types'
import { cn } from '@/shared/utils/cn'
import { useAdvisorGradeSheet, useSaveAdvisorGradeDraft, useSubmitAdvisorGradeSheet } from '../hooks/useAdvisorGrade'
import type { AdvisorGradeDeadline, AdvisorGradeSheet, AdvisorGradeTopic } from '../types/advisorGrade.types'
import {
  canOpenAdvisorGradeSheet,
  computeAdvisorGradePreview,
  formatAdvisorGradeDateTime,
  getAdvisorGradeReadonlyMessage,
  getInitialScoreInputs,
  getSubmitBlockers,
  isAdvisorGradeLockingError,
  parseScoreInput,
  toAdvisorGradeSheetBody,
  type AdvisorGradeScores,
} from '../utils/advisorGrade.utils'

// Popup phiếu chấm điểm hướng dẫn: mở phiếu (C2/C3), lưu nháp (C4), nộp phiếu (C5).
// Lỗi C4/C5 hiện ngay trong popup (request có skipErrorToast), không dùng toast.error.

interface AdvisorGradingDialogProps {
  /** Dòng C1 đang mở; `null` = popup đóng */
  topic: AdvisorGradeTopic | null
  /** Hạn chấm ở C1, dùng khi phiếu chưa tải xong */
  deadline: AdvisorGradeDeadline | null
  onClose: () => void
}

export function AdvisorGradingDialog({ topic, deadline, onClose }: AdvisorGradingDialogProps) {
  if (!topic || !canOpenAdvisorGradeSheet(topic)) return null
  // key: đổi đề tài → làm mới toàn bộ state của popup
  return <AdvisorGradingDialogBody key={topic.topicPublicId} topic={topic} deadline={deadline} onClose={onClose} />
}

interface Notice {
  tone: 'error' | 'success'
  text: string
}

const SCORE_INPUT_ERROR = 'Điểm phải là số từ 0 đến 10, tối đa 1 chữ số thập phân'

function AdvisorGradingDialogBody({ topic, deadline, onClose }: Required<AdvisorGradingDialogProps> & { topic: AdvisorGradeTopic }) {
  const sheetQuery = useAdvisorGradeSheet({
    topicPublicId: topic.topicPublicId,
    sheetPublicId: topic.sheetPublicId,
  })
  const saveDraft = useSaveAdvisorGradeDraft()
  const submitSheet = useSubmitAdvisorGradeSheet()
  const sheet = sheetQuery.data

  // ---- State của form ----
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [comment, setComment] = useState('')
  const [dirty, setDirty] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)

  // Nạp lại form khi có phiếu mới / phiếu đổi trạng thái (vừa nộp, vừa bị khóa).
  // Lưu nháp xong BE trả cùng trạng thái → giữ nguyên những gì đang nhập.
  const formKey = sheet ? `${sheet.sheetPublicId}:${sheet.status}:${sheet.canEdit}` : null
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  if (sheet && formKey !== loadedKey) {
    setLoadedKey(formKey)
    setInputs(getInitialScoreInputs(sheet))
    setComment(sheet.generalComment ?? '')
    setDirty(false)
    setSubmitAttempted(false)
    setConfirmSubmit(false)
    setConfirmClose(false)
  }

  const groups = useMemo(() => sheet?.groups ?? [], [sheet])

  const { scores, invalidIds } = useMemo(() => {
    const result: AdvisorGradeScores = {}
    const invalid = new Set<string>()
    for (const group of groups) {
      for (const criteria of group.criteria) {
        const parsed = parseScoreInput(inputs[criteria.publicId])
        if (parsed.ok) result[criteria.publicId] = parsed.value
        else {
          result[criteria.publicId] = null
          invalid.add(criteria.publicId)
        }
      }
    }
    return { scores: result, invalidIds: invalid }
  }, [groups, inputs])

  const preview = useMemo(() => computeAdvisorGradePreview(groups, scores), [groups, scores])
  const blockers = useMemo(() => getSubmitBlockers(groups, scores, comment), [groups, scores, comment])
  const missingIds = useMemo(() => new Set(blockers.missingCriteriaIds), [blockers])

  const canEdit = sheet?.canEdit === true
  const isBusy = saveDraft.isPending || submitSheet.isPending

  // ---- Xử lý ----
  function requestClose() {
    if (isBusy) return
    if (canEdit && dirty) {
      setConfirmClose(true)
      return
    }
    onClose()
  }

  function handleMutationError(error: unknown) {
    const message = isApiError(error) ? error.message : 'Không lưu được phiếu chấm. Vui lòng thử lại.'
    setNotice({
      tone: 'error',
      text: isAdvisorGradeLockingError(error) ? `${message} Phiếu đã chuyển sang chế độ chỉ xem.` : message,
    })
  }

  function buildVariables(current: AdvisorGradeSheet) {
    return {
      topicPublicId: topic.topicPublicId,
      sheetPublicId: current.sheetPublicId,
      body: toAdvisorGradeSheetBody(groups, scores, comment),
    }
  }

  function handleSaveDraft() {
    if (!sheet) return
    if (invalidIds.size > 0) {
      setNotice({ tone: 'error', text: 'Có điểm chưa hợp lệ, vui lòng sửa trước khi lưu.' })
      return
    }
    setNotice(null)
    saveDraft.mutate(buildVariables(sheet), {
      onSuccess: () => {
        setDirty(false)
        setNotice({ tone: 'success', text: 'Đã lưu nháp phiếu chấm.' })
      },
      onError: handleMutationError,
    })
  }

  function handleSubmitClick() {
    setSubmitAttempted(true)
    setNotice(null)
    if (invalidIds.size > 0 || blockers.missingCriteriaIds.length > 0 || blockers.missingComment) return
    setConfirmSubmit(true)
  }

  function handleConfirmSubmit() {
    if (!sheet) return
    submitSheet.mutate(buildVariables(sheet), {
      onSuccess: () => setNotice({ tone: 'success', text: 'Đã nộp phiếu chấm. Phiếu đã được khóa.' }),
      onError: (error) => {
        setConfirmSubmit(false)
        handleMutationError(error)
      },
    })
  }

  function handleScoreChange(criteriaId: string, value: string) {
    setInputs((prev) => ({ ...prev, [criteriaId]: value }))
    setDirty(true)
    setConfirmSubmit(false)
  }

  // ---- Hiển thị ----
  const sheetDeadline = sheet?.deadline ?? deadline
  const readonlyMessage = sheet && !sheet.canEdit ? getAdvisorGradeReadonlyMessage(sheet.readonlyReason, sheetDeadline) : null
  const isSubmitted = sheet?.status === 'SUBMITTED'
  const headerScore = isSubmitted ? sheet?.advisorScore ?? null : preview.advisorScore
  const studentName = sheet?.student?.fullName ?? topic.studentName
  const studentCode = sheet?.student?.studentCode ?? topic.studentCode

  return (
    <Dialog open onOpenChange={(open) => !open && requestClose()}>
      <DialogContent className="flex max-h-[92vh] w-full max-w-[960px] flex-col gap-0 overflow-hidden rounded-2xl p-0">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 py-4 pl-7 pr-14">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-100/80 bg-blue-50 text-[#1565C0]">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-[15px] font-bold text-slate-800">
                  Phiếu chấm hướng dẫn: <span className="text-[#1565C0]">{studentName ?? '—'}</span>
                </DialogTitle>
                {studentCode && (
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                    MSV: {studentCode}
                  </span>
                )}
              </div>
              <DialogDescription className="mt-0.5 max-w-[620px] truncate text-[12px]" title={topic.topicName}>
                Đề tài: {topic.topicName}
              </DialogDescription>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end">
            <div className="flex items-baseline gap-1 rounded-xl bg-[#0D47A1] px-3.5 py-1.5 text-white shadow-xs">
              <span className="text-[17px] font-extrabold leading-none tracking-tight" data-testid="advisor-grade-score">
                {headerScore === null ? '—' : headerScore.toFixed(1)}
              </span>
              <span className="text-[11.5px] font-semibold text-blue-200">/10.0</span>
            </div>
            <span className="mt-1 text-[11px] text-slate-400">{isSubmitted ? 'Điểm chính thức' : 'Điểm tạm tính'}</span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-7 py-4">
          {sheetQuery.isPending ? (
            <div className="space-y-2" aria-label="Đang tải phiếu chấm">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : sheetQuery.isError || !sheet ? (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-[#DC2626]">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Không mở được phiếu chấm.
                {isApiError(sheetQuery.error) && ` ${sheetQuery.error.message}`}
              </span>
            </div>
          ) : (
            <>
              {readonlyMessage && (
                <div className="mb-3 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-[12.5px] text-slate-600">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span>
                    {readonlyMessage}
                    {isSubmitted && sheet.submittedAt && ` Nộp lúc ${formatAdvisorGradeDateTime(sheet.submittedAt)}.`}
                  </span>
                </div>
              )}
              {canEdit && sheetDeadline && (
                <div className="mb-3 flex items-center gap-2 text-[12px] text-slate-500">
                  <Info className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    Hạn chấm: {formatAdvisorGradeDateTime(sheetDeadline.startDate)} –{' '}
                    {formatAdvisorGradeDateTime(sheetDeadline.endDate)}. Điểm chỉ được ghi nhận khi nộp phiếu.
                  </span>
                </div>
              )}

              <table className="w-full border-collapse text-left text-[13px]">
                <thead>
                  <tr className="h-9 select-none border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="w-14 px-3 py-2 text-center">STT</th>
                    <th className="px-4 py-2">Tiêu chí chấm điểm</th>
                    <th className="w-24 px-4 py-2 text-center">Trọng số</th>
                    <th className="w-44 px-4 py-2 text-center">Điểm (thang 10)</th>
                    <th className="w-24 px-4 py-2 text-center">Quy đổi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {groups.map((group, groupIndex) => (
                    <Fragment key={group.publicId}>
                      <tr className="font-bold text-slate-800">
                        <td className="px-3 py-2.5 text-center">{groupIndex + 1}</td>
                        <td className="px-4 py-2.5">{group.name}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className="inline-flex items-center rounded bg-blue-50 px-2 py-0.5 text-[11.5px] font-bold text-blue-700">
                            {group.weight}%
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center font-bold text-slate-300">—</td>
                        <td className="px-4 py-2.5 text-center text-[13.5px] font-bold text-blue-700">
                          {(preview.groupTotals[group.publicId] ?? 0).toFixed(2)}
                        </td>
                      </tr>
                      {group.criteria.map((criteria, criteriaIndex) => {
                        const value = inputs[criteria.publicId] ?? ''
                        const invalid = invalidIds.has(criteria.publicId)
                        const missing = submitAttempted && missingIds.has(criteria.publicId) && !invalid
                        const score = scores[criteria.publicId]
                        return (
                          <tr key={criteria.publicId} className="align-top">
                            <td className="px-3 py-2 text-center text-[12.5px] text-slate-400">
                              {groupIndex + 1}.{criteriaIndex + 1}
                            </td>
                            <td className="px-4 py-2 text-slate-700">{criteria.name}</td>
                            <td className="px-4 py-2 text-center text-[12.5px] font-medium text-slate-600">
                              {criteria.weight}%
                            </td>
                            <td className="px-4 py-2 text-center">
                              <div className="inline-flex items-center justify-center gap-1.5">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={value}
                                  disabled={!canEdit || isBusy}
                                  aria-label={`Điểm ${criteria.name}`}
                                  aria-invalid={invalid || missing}
                                  placeholder="—"
                                  onChange={(e) => handleScoreChange(criteria.publicId, e.target.value)}
                                  className={cn(
                                    'h-8 w-16 rounded-lg border border-slate-200 bg-white text-center text-[13px] font-bold text-slate-800 shadow-2xs outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-600',
                                    (invalid || missing) && 'border-[#DC2626] focus:border-[#DC2626] focus:ring-red-100',
                                  )}
                                />
                                <span className="text-[12px] font-medium text-slate-400">/10</span>
                              </div>
                              {invalid && (
                                <p className="mt-1 text-[11px] font-semibold leading-snug text-[#DC2626]">
                                  {SCORE_INPUT_ERROR}
                                </p>
                              )}
                              {missing && (
                                <p className="mt-1 text-[11px] font-semibold text-[#DC2626]">Chưa nhập điểm</p>
                              )}
                            </td>
                            <td className="px-4 py-2 text-center text-[13px] font-bold text-emerald-600">
                              {score === null || score === undefined ? '—' : ((score * criteria.weight) / 100).toFixed(2)}
                            </td>
                          </tr>
                        )
                      })}
                    </Fragment>
                  ))}
                  <tr className="border-t-2 border-slate-200 bg-blue-50/30">
                    <td colSpan={2} className="px-4 py-3.5 text-center text-[12.5px] font-bold uppercase tracking-wide text-slate-800">
                      Tổng điểm hướng dẫn ({preview.gradedCount}/{preview.totalCriteria} tiêu chí)
                    </td>
                    <td className="px-4 py-3.5 text-center text-[13px] font-bold text-blue-700">100%</td>
                    <td className="px-4 py-3.5 text-center font-bold text-slate-300">—</td>
                    <td className="px-4 py-3.5 text-center text-[16px] font-extrabold text-blue-700">
                      {headerScore === null ? '—' : headerScore.toFixed(1)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="mt-4">
                <label htmlFor="advisor-grade-comment" className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                  Nhận xét chung {canEdit && <span className="text-[#DC2626]">*</span>}
                </label>
                <Textarea
                  id="advisor-grade-comment"
                  value={comment}
                  disabled={!canEdit || isBusy}
                  aria-invalid={submitAttempted && blockers.missingComment}
                  placeholder={canEdit ? 'Nhận xét về quá trình thực hiện đồ án của sinh viên (bắt buộc khi nộp)' : 'Chưa có nhận xét'}
                  onChange={(e) => {
                    setComment(e.target.value)
                    setDirty(true)
                    setConfirmSubmit(false)
                  }}
                  className="min-h-[90px] text-[13px]"
                />
                {submitAttempted && blockers.missingComment && (
                  <p className="mt-1 text-[12px] font-semibold text-[#DC2626]">Vui lòng nhập nhận xét chung trước khi nộp</p>
                )}
              </div>

              {submitAttempted && blockers.missingCriteriaIds.length > 0 && (
                <p className="mt-3 text-[12.5px] font-semibold text-[#DC2626]">
                  Còn {blockers.missingCriteriaIds.length} tiêu chí chưa có điểm, cần chấm đủ trước khi nộp.
                </p>
              )}
            </>
          )}

          {notice && (
            <div
              role={notice.tone === 'error' ? 'alert' : 'status'}
              className={cn(
                'mt-3 flex items-start gap-2 rounded-lg border px-4 py-2.5 text-[12.5px]',
                notice.tone === 'error'
                  ? 'border-red-200 bg-red-50 text-[#DC2626]'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700',
              )}
            >
              {notice.tone === 'error' ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span>{notice.text}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-7 py-3.5">
          {confirmClose ? (
            <>
              <span className="mr-auto text-[12.5px] font-semibold text-amber-700">
                Có thay đổi chưa lưu. Đóng sẽ mất các thay đổi này.
              </span>
              <Button variant="outline" onClick={() => setConfirmClose(false)}>
                Ở lại
              </Button>
              <Button variant="destructive" onClick={onClose}>
                Đóng không lưu
              </Button>
            </>
          ) : confirmSubmit && canEdit ? (
            <>
              <span className="mr-auto text-[12.5px] font-semibold text-amber-700">
                Sau khi nộp sẽ không thể sửa phiếu. Xác nhận nộp?
              </span>
              <Button variant="outline" disabled={submitSheet.isPending} onClick={() => setConfirmSubmit(false)}>
                Quay lại
              </Button>
              <Button disabled={submitSheet.isPending} onClick={handleConfirmSubmit}>
                <Send />
                {submitSheet.isPending ? 'Đang nộp...' : 'Xác nhận nộp'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" disabled={isBusy} onClick={requestClose}>
                Đóng
              </Button>
              {canEdit && (
                <>
                  <Button variant="outline" disabled={isBusy} onClick={handleSaveDraft}>
                    <FileDown />
                    {saveDraft.isPending ? 'Đang lưu...' : 'Lưu nháp'}
                  </Button>
                  <Button disabled={isBusy} onClick={handleSubmitClick}>
                    <Send />
                    Nộp phiếu
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
