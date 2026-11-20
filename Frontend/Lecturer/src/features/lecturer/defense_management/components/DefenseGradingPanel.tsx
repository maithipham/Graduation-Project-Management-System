import React, { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  FileEdit,
  FileSignature,
  FileText,
  Lock,
  Save,
} from 'lucide-react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton,
} from '@/shared/components/ui'
import { formatDate } from '@/shared/utils'
import {
  useCouncilEvaluation,
  useCouncilGradingBoard,
  useDefenseScoreBoard,
  useDefenseScoreRealtime,
  useSaveCouncilEvaluation,
} from '../hooks/useDefenseEvaluation'
import type {
  CouncilEvaluation,
  CouncilGradingBoard,
  CouncilGradingItem,
  CouncilMember,
  DefenseScoreBoard,
} from '../types'
import { DefenseScoreBoardCard } from './DefenseScoreBoardCard'
import { StudentMinutesDialog } from './StudentMinutesDialog'

interface DefenseGradingPanelProps {
  councilPublicId: string
  members: CouncilMember[]
}

type GradingFilter = 'all' | 'ungraded' | 'graded'

const SCORE_REGEX = /^(10(\.0)?|[0-9](\.[0-9])?)$/
const OUTLIER_DEVIATION = 1.5

const ROLE_LABEL: Record<CouncilMember['role'], string> = {
  CHAIRPERSON: 'Chủ tịch',
  SECRETARY: 'Thư ký',
  COUNCIL_MEMBER: 'Ủy viên',
}

/**
 * BƯỚC 14 – Pha 1: Thành viên Hội đồng chấm phiếu COUNCIL theo Rubric của học kỳ.
 * Cột trái: danh sách sinh viên + trạng thái phiếu của tôi; cột phải: phiếu chấm + bảng điểm realtime.
 */
export const DefenseGradingPanel: React.FC<DefenseGradingPanelProps> = ({
  councilPublicId,
  members,
}) => {
  const { data: board, isPending, isError } = useCouncilGradingBoard(councilPublicId)
  const [filter, setFilter] = useState<GradingFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [minutesTarget, setMinutesTarget] = useState<string | null>(null)

  const students = useMemo(() => board?.students ?? [], [board])
  const isGraded = (s: CouncilGradingItem) => s.mySheetStatus === 'SUBMITTED'
  const filtered = students.filter((s) =>
    filter === 'graded' ? isGraded(s) : filter === 'ungraded' ? !isGraded(s) : true,
  )
  const active =
    students.find((s) => s.defenseAssignmentPublicId === selectedId) ?? filtered[0] ?? students[0]

  // Bảng điểm realtime của sinh viên đang chấm
  const activeIds = useMemo(
    () => (active ? [active.defenseAssignmentPublicId] : []),
    [active],
  )
  useDefenseScoreRealtime(activeIds, Boolean(board?.canViewAllScores))

  if (isPending) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Skeleton className="lg:col-span-4 h-[560px] rounded-2xl" />
        <Skeleton className="lg:col-span-8 h-[560px] rounded-2xl" />
      </div>
    )
  }
  if (isError || !board) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-6 rounded-2xl">
        Không tải được danh sách chấm điểm hoặc vai trò của bạn trong Hội đồng không có quyền chấm điểm.
      </div>
    )
  }

  const countGraded = students.filter(isGraded).length
  const filterButton = (value: GradingFilter, label: string, count: number, activeClass: string) => (
    <button
      type="button"
      onClick={() => setFilter(value)}
      className={`h-8 rounded-lg transition cursor-pointer text-xs ${
        filter === value ? `bg-white shadow-2xs font-extrabold ${activeClass}` : 'text-slate-600 hover:text-slate-900 font-bold'
      }`}
    >
      {label}{' '}
      <span className="ml-0.5 px-1.5 rounded-full text-[10.5px] bg-slate-200 text-slate-600">{count}</span>
    </button>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full min-h-0">
      {/* CỘT TRÁI: Lọc & danh sách sinh viên */}
      <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col overflow-hidden min-h-[580px]">
        <div className="p-2 border-b border-slate-100 bg-slate-50/70">
          <div className="grid grid-cols-3 gap-1 bg-slate-200/60 p-1 rounded-xl">
            {filterButton('all', 'Tất cả', students.length, 'text-[#1565C0]')}
            {filterButton('ungraded', 'Chưa chấm', students.length - countGraded, 'text-amber-700')}
            {filterButton('graded', 'Đã chấm', countGraded, 'text-emerald-700')}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              {students.length === 0
                ? 'Hội đồng chưa có sinh viên đạt phản biện để chấm bảo vệ.'
                : 'Không có sinh viên nào trong mục này.'}
            </div>
          ) : (
            filtered.map((sv) => {
              const isSel = sv.defenseAssignmentPublicId === active?.defenseAssignmentPublicId
              return (
                <button
                  key={sv.defenseAssignmentPublicId}
                  type="button"
                  onClick={() => setSelectedId(sv.defenseAssignmentPublicId)}
                  className={`w-full text-left px-4 py-3 transition cursor-pointer ${
                    isSel ? 'bg-blue-50/70 border-l-4 border-l-[#1565C0]' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-extrabold text-[13px] text-slate-900 truncate">{sv.studentName}</span>
                    {sv.mySheetStatus === 'SUBMITTED' ? (
                      <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        Đã chấm · {sv.myScore?.toFixed(1)}
                      </span>
                    ) : sv.mySheetStatus === 'DRAFT' ? (
                      <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                        Lưu nháp
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                        Chưa chấm
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {sv.studentCode} · {board.councilCode}
                    {sv.slotOrder !== null && ` · Ca ${sv.slotOrder}`}
                  </div>
                  <div className="text-[11.5px] text-slate-600 truncate mt-1" title={sv.topicName ?? ''}>
                    {sv.topicName || 'Chưa cập nhật tên đề tài'}
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Biên bản: Thư ký nộp */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-1.5 text-slate-600">
            <FileSignature className="w-4 h-4 text-[#1565C0]" />
            <span>
              Biên bản: <b>{active?.minutesStatus === 'FINALIZED' ? 'Đã nộp' : 'Thư ký nộp'}</b>
            </span>
          </div>
          {board.canViewMinutes && active && (
            <button
              type="button"
              onClick={() => setMinutesTarget(active.defenseAssignmentPublicId)}
              className="h-7.5 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-[11.5px] font-bold cursor-pointer inline-flex items-center gap-1 shadow-2xs"
            >
              <FileEdit className="w-3.5 h-3.5 text-[#1565C0]" />
              <span>
                {board.canEditMinutes && active.minutesStatus !== 'FINALIZED'
                  ? 'Lập & Nộp biên bản'
                  : 'Xem biên bản'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* CỘT PHẢI: Phiếu chấm Rubric */}
      <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col overflow-hidden min-h-[580px]">
        {!active ? (
          <div className="p-12 text-center text-slate-400 text-sm">Vui lòng chọn sinh viên để tiến hành chấm điểm.</div>
        ) : (
          <EvaluationSection key={active.defenseAssignmentPublicId} board={board} item={active} />
        )}
      </div>

      <StudentMinutesDialog
        defenseAssignmentPublicId={minutesTarget}
        members={members}
        onClose={() => setMinutesTarget(null)}
      />
    </div>
  )
}

const EvaluationSection: React.FC<{ board: CouncilGradingBoard; item: CouncilGradingItem }> = ({
  board,
  item,
}) => {
  const { data: evaluation, isPending, isError } = useCouncilEvaluation(item.defenseAssignmentPublicId)
  const { data: scoreBoard } = useDefenseScoreBoard(item.defenseAssignmentPublicId)

  if (isPending) {
    return (
      <div className="p-6 space-y-3">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }
  if (isError || !evaluation) {
    return (
      <div className="m-6 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-4 rounded-xl">
        Không tải được phiếu chấm. Học kỳ có thể chưa cấu hình Rubric phiếu Hội đồng.
      </div>
    )
  }
  return (
    <EvaluationForm
      // Phiếu thay đổi trên server → khởi tạo lại form
      key={`${evaluation.sheet.sheetPublicId ?? 'new'}-${evaluation.sheet.updatedAt ?? ''}-${evaluation.sheet.status ?? ''}`}
      board={board}
      item={item}
      evaluation={evaluation}
      scoreBoard={scoreBoard}
    />
  )
}

interface EvaluationFormProps {
  board: CouncilGradingBoard
  item: CouncilGradingItem
  evaluation: CouncilEvaluation
  scoreBoard: DefenseScoreBoard | undefined
}

// Điểm tham chiếu để cảnh báo điểm lệch (chỉ cảnh báo, không bắt buộc lý do):
// TB các thành viên khác đã nộp; chưa ai nộp thì TB 2 GVPB. Ủy viên chưa đủ 5/5 không thấy điểm → không cảnh báo.
function outlierReference(board: DefenseScoreBoard | undefined): { avg: number; title: string } | null {
  if (!board || board.scoreHidden) return null
  const others = board.council
    .filter((e) => !e.mine && e.status === 'SUBMITTED' && typeof e.score === 'number')
    .map((e) => e.score as number)
  if (others.length > 0) {
    return {
      avg: others.reduce((a, b) => a + b, 0) / others.length,
      title: `Điểm trung bình ${others.length} thành viên khác trong Hội đồng đã chấm`,
    }
  }
  const examiners = board.examiners
    .filter((e) => typeof e.score === 'number')
    .map((e) => e.score as number)
  if (examiners.length > 0) {
    return {
      avg: examiners.reduce((a, b) => a + b, 0) / examiners.length,
      title: 'Điểm trung bình của Giảng viên phản biện',
    }
  }
  return null
}

const EvaluationForm: React.FC<EvaluationFormProps> = ({ board, item, evaluation, scoreBoard }) => {
  const saveMutation = useSaveCouncilEvaluation(item.defenseAssignmentPublicId)
  const locked = !evaluation.editable || !evaluation.gradingOpen
  const criteria = evaluation.sheet.groups.flatMap((g) => g.criteria)

  const [scores, setScores] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      criteria.map((c) => [c.criteriaPublicId, c.score !== null && c.score !== undefined ? String(c.score) : '']),
    ),
  )
  const [comment, setComment] = useState(evaluation.sheet.generalComment ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [commentError, setCommentError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Tổng điểm tạm tính = Σ điểm × trọng số / 100 (giống BE), làm tròn 1 chữ số
  const total = useMemo(() => {
    let sum = 0
    criteria.forEach((c) => {
      const v = Number(scores[c.criteriaPublicId])
      if (scores[c.criteriaPublicId] !== '' && !Number.isNaN(v)) sum += (v * c.weight) / 100
    })
    return Math.round(sum * 10) / 10
  }, [criteria, scores])

  const validate = (submit: boolean): boolean => {
    const next: Record<string, string> = {}
    criteria.forEach((c) => {
      const v = scores[c.criteriaPublicId]?.trim() ?? ''
      if (v === '') {
        if (submit) next[c.criteriaPublicId] = 'Bắt buộc'
      } else if (!SCORE_REGEX.test(v)) {
        next[c.criteriaPublicId] = '0–10, 1 số lẻ'
      }
    })
    setErrors(next)
    const missingComment = submit && !comment.trim()
    setCommentError(missingComment ? 'Vui lòng nhập nhận xét đánh giá đồ án trước khi gửi điểm' : null)
    return Object.keys(next).length === 0 && !missingComment
  }

  const save = (submit: boolean) => {
    saveMutation.mutate(
      {
        criteriaScores: criteria.map((c) => {
          const v = scores[c.criteriaPublicId]?.trim()
          return { criteriaPublicId: c.criteriaPublicId, score: v ? Number(v) : null }
        }),
        generalComment: comment.trim() || null,
        submit,
      },
      { onSettled: () => setConfirmOpen(false) },
    )
  }

  const reference = outlierReference(scoreBoard)
  const deviation = reference ? Math.abs(total - reference.avg) : 0
  const isOutlier = reference !== null && deviation >= OUTLIER_DEVIATION

  return (
    <>
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
        <h3 className="text-[13.5px] font-black uppercase text-[#0D47A1] tracking-wide">
          RUBRIC ĐÁNH GIÁ ĐỒ ÁN TỐT NGHIỆP DÀNH CHO THÀNH VIÊN HỘI ĐỒNG
        </h3>
        <button
          type="button"
          disabled={!item.reportFileUrl}
          onClick={() => item.reportFileUrl && window.open(item.reportFileUrl, '_blank', 'noopener')}
          title={item.reportFileUrl ? 'Mở báo cáo toàn văn của sinh viên' : 'Sinh viên chưa có báo cáo Final'}
          className="h-8.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileText className="w-4 h-4 text-[#1565C0]" />
          <span>Báo cáo sinh viên</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {locked && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-start gap-2">
            <Lock className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              {!evaluation.editable
                ? 'Sinh viên đã hoàn tất bảo vệ hoặc không còn ở trạng thái được Hội đồng chấm điểm – phiếu chỉ xem.'
                : `Ngoài thời gian tổ chức Hội đồng bảo vệ${
                    evaluation.gradingStartAt && evaluation.gradingEndAt
                      ? ` (${formatDate(evaluation.gradingStartAt, 'full')} – ${formatDate(evaluation.gradingEndAt, 'full')})`
                      : ''
                  } – không thể lưu phiếu.`}
            </span>
          </div>
        )}

        <div className="space-y-1.5 text-xs text-slate-700 leading-relaxed border-b border-slate-100 pb-4">
          <div>
            <b>Họ và tên cán bộ chấm:</b> {board.myName} ({ROLE_LABEL[board.myRole]})
          </div>
          <div>
            <b>Đơn vị công tác:</b> {board.majorName} – Trường Đại học Thủy lợi
          </div>
          <div>
            <b>Họ và tên sinh viên:</b> <span className="font-bold text-slate-900">{item.studentName}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <div>
              <b>Mã sinh viên:</b> <span className="font-mono">{item.studentCode}</span>
            </div>
            <div>
              <b>Ngành học:</b> {board.majorName}
            </div>
            <div>
              <b>Lớp:</b> {item.className || '—'}
            </div>
          </div>
          <div>
            <b>Tên đề tài:</b> <span className="font-bold text-slate-900">{item.topicName || '—'}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-900">
            Nhận xét: <span className="text-rose-600 font-extrabold">*</span>
          </label>
          <div className="text-[11.5px] text-slate-400 italic">
            Nêu rõ ưu, nhược điểm và những nội dung cần chỉnh sửa trong đồ án, câu hỏi (nếu có).
          </div>
          <textarea
            rows={3}
            disabled={locked}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className={`w-full p-3 rounded-xl border text-xs text-slate-800 outline-none focus:border-[#1565C0] bg-white disabled:bg-slate-50 ${
              commentError ? 'border-[#DC2626]' : 'border-slate-300'
            }`}
          />
          {commentError && <p className="text-xs font-bold text-[#DC2626]">{commentError}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-bold text-xs text-slate-900">
              Bảng tiêu chí đánh giá <span className="text-rose-600 font-extrabold">*</span>
            </div>
            <div className="text-[11.5px] text-slate-400">Nhập điểm đánh giá theo thang 10</div>
          </div>
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold">
                  <th className="p-3">Tiêu chí đánh giá</th>
                  <th className="p-3 text-center w-20">Trọng số</th>
                  <th className="p-3 text-center w-24">Điểm tối đa</th>
                  <th className="p-3 text-center w-36">Điểm đánh giá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {evaluation.sheet.groups.map((group, gIdx) => {
                  const groupWeight = group.criteria.reduce((s, c) => s + c.weight, 0)
                  const single = group.criteria.length === 1 && group.criteria[0].name === group.name
                  return (
                    <React.Fragment key={group.groupPublicId}>
                      {!single && (
                        <tr className="bg-slate-50/80 border-t border-slate-200 font-extrabold text-slate-900">
                          <td className="p-3">
                            {gIdx + 1}. {group.name}
                          </td>
                          <td className="p-3 text-center text-slate-700">{groupWeight}%</td>
                          <td className="p-3 text-center text-slate-700">{(groupWeight / 10).toFixed(1).replace('.', ',')}</td>
                          <td className="p-3 text-center text-slate-400 font-medium">—</td>
                        </tr>
                      )}
                      {group.criteria.map((c, cIdx) => (
                        <tr key={c.criteriaPublicId} className="hover:bg-slate-50/50">
                          <td className={`p-3 ${single ? 'font-bold text-slate-900' : 'pl-7 text-slate-700 font-medium'}`}>
                            {single ? `${gIdx + 1}. ${c.name}` : `${gIdx + 1}.${cIdx + 1} ${c.name}`}
                          </td>
                          <td className="p-3 text-center text-slate-500 font-semibold">{c.weight}%</td>
                          <td className="p-3 text-center text-slate-600 font-semibold">
                            {(c.weight / 10).toFixed(1).replace('.', ',')}
                          </td>
                          <td className="p-3 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <input
                                type="number"
                                min={0}
                                max={10}
                                step={0.1}
                                disabled={locked}
                                value={scores[c.criteriaPublicId] ?? ''}
                                onChange={(e) =>
                                  setScores((prev) => ({ ...prev, [c.criteriaPublicId]: e.target.value }))
                                }
                                className={`w-16 h-8 px-2 rounded-lg border font-extrabold text-center text-[#1565C0] text-xs outline-none focus:border-[#1565C0] bg-white disabled:bg-slate-50 ${
                                  errors[c.criteriaPublicId] ? 'border-[#DC2626]' : 'border-slate-300'
                                }`}
                              />
                              <span className="text-slate-400 font-semibold">/ 10</span>
                            </div>
                            {errors[c.criteriaPublicId] && (
                              <div className="text-[10.5px] font-bold text-[#DC2626] mt-0.5">{errors[c.criteriaPublicId]}</div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bảng điểm Hội đồng realtime */}
        <DefenseScoreBoardCard board={scoreBoard} canTrial={Boolean(board?.canViewAllScores)} />
      </div>

      <div className="px-6 py-3.5 border-t border-slate-200 flex items-center justify-between gap-4 shrink-0">
        <div>
          <span className="text-[10.5px] font-extrabold uppercase text-slate-400 tracking-wider block">Tổng điểm đánh giá</span>
          <div className="text-2xl font-black text-[#1565C0] leading-none mt-1">
            {total.toFixed(1)} <span className="text-xs font-bold text-slate-400">/ 10</span>
          </div>
          {evaluation.sheet.status && (
            <div className="text-[11px] text-slate-500 mt-1">
              {evaluation.sheet.status === 'SUBMITTED'
                ? `Đã gửi chính thức${evaluation.sheet.submittedAt ? ` lúc ${formatDate(evaluation.sheet.submittedAt, 'full')}` : ''}`
                : 'Đang lưu nháp'}
            </div>
          )}
        </div>
        {!locked && (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={saveMutation.isPending}
              onClick={() => validate(false) && save(false)}
              className="h-10 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-60"
            >
              <Save className="w-4 h-4 text-slate-500" />
              <span>{saveMutation.isPending ? 'Đang lưu...' : 'Lưu nháp'}</span>
            </button>
            <button
              type="button"
              disabled={saveMutation.isPending}
              onClick={() => validate(true) && setConfirmOpen(true)}
              className="h-10 px-5 rounded-xl bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-bold cursor-pointer inline-flex items-center gap-2 disabled:opacity-60"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Lưu & Gửi điểm chính thức</span>
            </button>
          </div>
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Xác nhận gửi điểm bảo vệ</DialogTitle>
          </DialogHeader>
          <div className="text-xs text-slate-600 space-y-2.5">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold">Sinh viên:</span>
                <b className="text-slate-900">
                  {item.studentName} ({item.studentCode})
                </b>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Hội đồng bảo vệ:</span>
                <b className="text-slate-800">
                  {board.councilCode} · {ROLE_LABEL[board.myRole]}
                </b>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Điểm bạn chấm:</span>
                <span className="text-xl font-black text-[#1565C0]">
                  {total.toFixed(1)} <span className="text-xs text-slate-400">/ 10</span>
                </span>
              </div>
              {reference && (
                <div className="flex justify-between text-slate-500">
                  <span>{reference.title}:</span>
                  <b className="text-slate-700">{reference.avg.toFixed(1)} điểm</b>
                </div>
              )}
            </div>
            {isOutlier && reference && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  Điểm bạn chấm (<b>{total.toFixed(1)}</b>) lệch <b>{deviation.toFixed(1)} điểm</b> so với{' '}
                  {reference.title.toLowerCase()} (<b>{reference.avg.toFixed(1)}</b>). Khi đủ 5/5 phiếu, điểm lệch từ 1,5
                  trở lên sẽ bị loại khỏi điểm trung bình (QĐ 1305 – Điều 9). Hãy kiểm tra lại trước khi gửi.
                </span>
              </div>
            )}
            <p className="text-[11px] text-slate-500 italic">
              Điểm được tổng hợp tự động vào bảng điểm chung của Hội đồng. Trong thời gian tổ chức bảo vệ bạn vẫn có
              thể sửa và gửi lại.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConfirmOpen(false)} disabled={saveMutation.isPending}>
              Xem lại
            </Button>
            <Button
              size="sm"
              onClick={() => save(true)}
              disabled={saveMutation.isPending}
              className="bg-[#1565C0] hover:bg-[#0D47A1] text-white"
            >
              {saveMutation.isPending ? 'Đang gửi...' : 'Xác nhận gửi điểm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default DefenseGradingPanel
