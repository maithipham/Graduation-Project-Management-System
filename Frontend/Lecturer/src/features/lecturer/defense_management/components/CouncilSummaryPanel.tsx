import React, { useMemo, useState } from 'react'
import { CheckCircle2, Download, FileSignature, Lock, Radio } from 'lucide-react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton,
} from '@/shared/components/ui'
import { toast } from '@/shared/components/feedback/toast.store'
import {
  useCompleteDefense,
  useCouncilScoreSummary,
  useDefenseScoreRealtime,
} from '../hooks/useDefenseEvaluation'
import type {
  CouncilMember,
  CouncilScoreSummaryItem,
  DefenseScoreEntry,
  RevisionStatus,
} from '../types'
import { resultBadge, ScoreCell } from './DefenseScoreBoardCard'
import { RevisionReviewDialog } from './RevisionReviewDialog'
import { StudentMinutesDialog } from './StudentMinutesDialog'

interface CouncilSummaryPanelProps {
  councilPublicId: string
  councilCode: string
  members: CouncilMember[]
  // Chủ tịch / Thư ký (vai trò có COMPLETE_DEFENSE / VIEW_COUNCIL_FINAL_SCORES)
  isManager: boolean
}

const ROLE_LABEL: Record<CouncilMember['role'], string> = {
  CHAIRPERSON: 'Chủ tịch',
  SECRETARY: 'Thư ký',
  COUNCIL_MEMBER: 'Ủy viên',
}

const REVISION_LABEL: Record<RevisionStatus, { label: string; cls: string }> = {
  REQUIRED: { label: 'Chờ nộp', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  SUBMITTED: { label: 'Đã nộp – chờ duyệt', cls: 'bg-blue-50 text-[#1565C0] border-blue-200' },
  APPROVED: { label: 'Đã duyệt', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  RETURNED: { label: 'Bị trả lại', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  OVERDUE: { label: 'Quá hạn', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
}

const ROLE_ORDER = ['CHAIRPERSON', 'SECRETARY', 'COUNCIL_MEMBER']

// Sinh viên đủ điều kiện bấm "Hoàn tất bảo vệ" (BE vẫn kiểm tra lại đầy đủ)
function canComplete(item: CouncilScoreSummaryItem): boolean {
  const b = item.board
  return (
    b.defenseStatus !== 'COMPLETED' &&
    b.result !== null &&
    b.result !== 'PENDING' &&
    !b.allInvalidGroup &&
    item.minutesStatus === 'FINALIZED'
  )
}

function csvScore(entry: DefenseScoreEntry | null | undefined): string {
  return entry && typeof entry.score === 'number' ? entry.score.toFixed(1) : ''
}

/**
 * BƯỚC 14 – Pha 1c + 3: Tổng hợp kết quả bảo vệ của Hội đồng (Chủ tịch / Thư ký).
 * Điểm GVHD, 2 GVPB, 5 thành viên (điểm bị loại gạch đỏ), điểm TB HĐ, điểm tổng kết, kết quả,
 * biên bản, chỉnh sửa sau bảo vệ; "Hoàn tất bảo vệ" từng sinh viên hoặc tất cả sinh viên đủ điều kiện.
 */
export const CouncilSummaryPanel: React.FC<CouncilSummaryPanelProps> = ({
  councilPublicId,
  councilCode,
  members,
  isManager,
}) => {
  const { data: items, isPending, isError } = useCouncilScoreSummary(councilPublicId)
  const completeMutation = useCompleteDefense()
  const [confirmTarget, setConfirmTarget] = useState<CouncilScoreSummaryItem[] | null>(null)
  const [isBulkRunning, setIsBulkRunning] = useState(false)
  const [revisionTarget, setRevisionTarget] = useState<string | null>(null)
  const [minutesTarget, setMinutesTarget] = useState<string | null>(null)

  const ids = useMemo(() => (items ?? []).map((i) => i.defenseAssignmentPublicId), [items])
  useDefenseScoreRealtime(ids, isManager, councilPublicId)

  // Cột 5 thành viên Hội đồng: CT → TK → UV
  const memberColumns = useMemo(
    () =>
      [...members].sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role)),
    [members],
  )

  if (isPending) {
    return <Skeleton className="h-[580px] w-full rounded-2xl" />
  }
  if (isError || !items) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-6 rounded-2xl">
        Không tải được bảng điểm tổng hợp của Hội đồng.
      </div>
    )
  }

  const eligible = items.filter(canComplete)
  const completedCount = items.filter((i) => i.board.defenseStatus === 'COMPLETED').length

  // Ô điểm của thành viên: ghép theo tên giảng viên (BE trả CT → TK → UV), không thấy thì theo vị trí
  const memberEntry = (item: CouncilScoreSummaryItem, idx: number) =>
    item.board.council.find((e) => e.teacherName === memberColumns[idx]?.fullName) ?? item.board.council[idx]

  const handleExport = () => {
    const header = [
      'STT', 'MSSV', 'Ho ten', 'Ten de tai', 'Diem GVHD', 'Diem GVPB 1', 'Diem GVPB 2',
      ...memberColumns.map((m) => `"Diem HD (${ROLE_LABEL[m.role]} - ${m.fullName})"`),
      'Diem TB HD', 'Diem tong ket', 'Ket qua',
    ].join(',')
    const rows = items.map((it, i) =>
      [
        i + 1,
        it.studentCode,
        `"${it.studentName}"`,
        `"${(it.topicName ?? '').replace(/"/g, '""')}"`,
        csvScore(it.board.advisor),
        csvScore(it.board.examiners[0]),
        csvScore(it.board.examiners[1]),
        ...memberColumns.map((_, idx) => csvScore(memberEntry(it, idx))),
        it.board.councilScore?.toFixed(1) ?? '',
        it.board.finalScore?.toFixed(1) ?? '',
        it.board.result === 'PASSED' ? 'Dat' : it.board.result === 'FAILED' ? 'Khong dat' : '',
      ].join(','),
    )
    const blob = new Blob(['﻿' + [header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Bang_diem_${councilCode.replace(/\s+/g, '_')}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Đã xuất file bảng điểm CSV.')
  }

  // Hoàn tất lần lượt từng sinh viên; sinh viên lỗi thì interceptor hiện lỗi và chạy tiếp
  const runComplete = async (targets: CouncilScoreSummaryItem[]) => {
    setIsBulkRunning(true)
    let ok = 0
    for (const t of targets) {
      try {
        await completeMutation.mutateAsync(t.defenseAssignmentPublicId)
        ok += 1
      } catch {
        // đã có toast lỗi
      }
    }
    setIsBulkRunning(false)
    setConfirmTarget(null)
    if (ok > 0) toast.success(`Đã hoàn tất bảo vệ cho ${ok}/${targets.length} sinh viên.`)
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col h-full min-h-[580px] overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-extrabold text-[14.5px] text-slate-900">Tổng hợp kết quả bảo vệ — {councilCode}</h4>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
              <Radio className="w-3.5 h-3.5" /> Trực tiếp
            </span>
            {items.length > 0 && completedCount === items.length && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Đã hoàn tất toàn bộ
              </span>
            )}
          </div>
          <p className="text-[11.5px] text-slate-500 mt-0.5">
            Điểm GVHD, 2 GVPB và 5 thành viên Hội đồng. Điểm gạch đỏ là điểm không hợp lệ (lệch ≥ 1,5) bị loại khỏi điểm
            trung bình (rê chuột để xem độ lệch).
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExport}
            className="h-9 px-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Xuất bảng điểm</span>
          </button>
          {isManager && (
            <button
              type="button"
              disabled={eligible.length === 0 || isBulkRunning}
              onClick={() => setConfirmTarget(eligible)}
              title="Hoàn tất bảo vệ cho mọi sinh viên đã đủ 5/5 phiếu, đủ điểm và biên bản đã nộp"
              className="h-9 px-4 rounded-xl text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-xs bg-[#1565C0] hover:bg-[#0D47A1] disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              <Lock className="w-4 h-4" />
              <span>Chốt kết quả hội đồng ({eligible.length})</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 text-slate-600 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10">
            <tr>
              <th className="py-3 px-3 w-10 text-center">STT</th>
              <th className="py-3 px-3 min-w-[160px]">Sinh viên</th>
              <th className="py-3 px-3 min-w-[200px]">Đề tài & GVHD</th>
              <th className="py-3 px-2 text-center bg-blue-50/70 text-[#1565C0] min-w-[70px]">Điểm HD</th>
              <th className="py-3 px-2 text-center bg-purple-50/70 text-purple-700 min-w-[80px]">Điểm PB 1</th>
              <th className="py-3 px-2 text-center bg-purple-50/70 text-purple-700 min-w-[80px]">Điểm PB 2</th>
              {memberColumns.map((m) => (
                <th key={m.memberPublicId} className="py-3 px-2 text-center bg-amber-50/50 text-amber-900 min-w-[80px]" title={m.fullName}>
                  <div>{ROLE_LABEL[m.role]}</div>
                  <div className="text-[10px] font-normal text-slate-500 normal-case truncate max-w-[90px] mx-auto">
                    {m.fullName.split(' ').slice(-2).join(' ')}
                  </div>
                </th>
              ))}
              <th className="py-3 px-2 text-center bg-blue-50/70 text-[#1565C0] min-w-[80px]">Điểm TB HĐ</th>
              <th className="py-3 px-2 text-center bg-emerald-50/80 text-emerald-900 min-w-[85px]">Điểm tổng kết</th>
              <th className="py-3 px-2 text-center min-w-[110px]">Kết quả</th>
              <th className="py-3 px-2 text-center min-w-[90px]">Biên bản</th>
              <th className="py-3 px-2 text-center min-w-[120px]">Chỉnh sửa sau BV</th>
              {isManager && <th className="py-3 px-2 text-center min-w-[100px]">Thao tác</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 && (
              <tr>
                <td colSpan={14 + memberColumns.length} className="py-12 text-center text-slate-400">
                  Hội đồng chưa có sinh viên đạt phản biện.
                </td>
              </tr>
            )}
            {items.map((it, i) => {
              const b = it.board
              const revision = it.revisionStatus ? REVISION_LABEL[it.revisionStatus] : null
              return (
                <tr key={it.defenseAssignmentPublicId} className="hover:bg-slate-50/70">
                  <td className="py-3 px-3 text-center font-semibold text-slate-400">{i + 1}</td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{it.studentName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {it.studentCode}
                      {it.className ? ` · ${it.className}` : ''}
                    </div>
                  </td>
                  <td className="py-3 px-3 max-w-[260px]">
                    <div className="font-medium text-slate-800 line-clamp-1" title={it.topicName ?? ''}>
                      {it.topicName || '—'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      GVHD: <b>{it.supervisorName || '—'}</b>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center text-blue-700 bg-blue-50/30">
                    <ScoreCell entry={b.advisor} />
                  </td>
                  {[0, 1].map((idx) => (
                    <td key={idx} className="py-3 px-2 text-center bg-purple-50/30 text-purple-900">
                      <ScoreCell entry={b.examiners[idx]} />
                      <div className="text-[10px] text-slate-400 truncate max-w-[80px] mx-auto">
                        {b.examiners[idx]?.teacherName.split(' ').slice(-2).join(' ')}
                      </div>
                    </td>
                  ))}
                  {memberColumns.map((m, idx) => (
                    <td key={m.memberPublicId} className="py-3 px-2 text-center text-slate-700">
                      <ScoreCell entry={memberEntry(it, idx)} />
                    </td>
                  ))}
                  <td className="py-3 px-2 text-center font-extrabold text-[#1565C0] bg-blue-50/30">
                    {b.councilScore !== null ? b.councilScore.toFixed(1) : <span className="text-slate-400 font-normal">—</span>}
                  </td>
                  <td className="py-3 px-2 text-center font-extrabold text-emerald-800 bg-emerald-50/40">
                    {b.finalScore !== null ? b.finalScore.toFixed(1) : <span className="text-slate-400 font-normal">—</span>}
                  </td>
                  <td className="py-3 px-2 text-center">
                    {b.defenseStatus === 'COMPLETED' ? (
                      <div className="space-y-1">
                        {resultBadge(b)}
                        <div className="text-[10px] text-slate-500">Đã hoàn tất</div>
                      </div>
                    ) : (
                      resultBadge(b)
                    )}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => setMinutesTarget(it.defenseAssignmentPublicId)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1565C0] hover:underline cursor-pointer"
                    >
                      <FileSignature className="w-3.5 h-3.5" />
                      {it.minutesStatus === 'FINALIZED' ? 'Đã nộp' : it.minutesStatus === 'DRAFT' ? 'Nháp' : 'Chưa lập'}
                    </button>
                  </td>
                  <td className="py-3 px-2 text-center">
                    {revision && it.revisionPublicId ? (
                      <button
                        type="button"
                        onClick={() => setRevisionTarget(it.revisionPublicId)}
                        className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold border cursor-pointer ${revision.cls}`}
                      >
                        {revision.label}
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        {it.revisionRequired && b.defenseStatus !== 'COMPLETED' ? 'Sẽ yêu cầu' : 'Không yêu cầu'}
                      </span>
                    )}
                  </td>
                  {isManager && (
                    <td className="py-3 px-2 text-center">
                      {b.defenseStatus === 'COMPLETED' ? (
                        <span className="text-[11px] text-emerald-700 font-bold">✓ Hoàn tất</span>
                      ) : (
                        <button
                          type="button"
                          disabled={!canComplete(it) || isBulkRunning}
                          onClick={() => setConfirmTarget([it])}
                          title={
                            canComplete(it)
                              ? 'Hoàn tất bảo vệ cho sinh viên này'
                              : 'Cần đủ 5/5 phiếu Hội đồng, đủ điểm HD/PB, không có nhóm điểm bị loại hết và biên bản đã nộp'
                          }
                          className="h-7 px-2.5 rounded-lg bg-[#1565C0] hover:bg-[#0D47A1] text-white text-[11px] font-bold cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                        >
                          Hoàn tất
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={confirmTarget !== null} onOpenChange={(v) => !v && !isBulkRunning && setConfirmTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Xác nhận hoàn tất bảo vệ</DialogTitle>
          </DialogHeader>
          <div className="text-xs text-slate-600 space-y-2">
            <p>
              Chốt kết quả bảo vệ cho <b className="text-slate-900">{confirmTarget?.length ?? 0}</b> sinh viên. Sau khi
              hoàn tất, điểm bị khóa và kết quả được gửi tới sinh viên, GVHD:
            </p>
            <ul className="list-disc pl-5 space-y-0.5 max-h-40 overflow-y-auto">
              {confirmTarget?.map((t) => (
                <li key={t.defenseAssignmentPublicId}>
                  {t.studentName} ({t.studentCode}) –{' '}
                  {t.board.result === 'PASSED'
                    ? `Đạt, ${t.board.finalScore?.toFixed(1)} điểm${t.revisionRequired ? ', phải nộp lại báo cáo' : ''}`
                    : 'Không đạt'}
                </li>
              ))}
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" disabled={isBulkRunning} onClick={() => setConfirmTarget(null)}>
              Hủy
            </Button>
            <Button
              size="sm"
              disabled={isBulkRunning}
              onClick={() => confirmTarget && void runComplete(confirmTarget)}
              className="bg-[#1565C0] hover:bg-[#0D47A1] text-white"
            >
              {isBulkRunning ? 'Đang hoàn tất...' : 'Xác nhận hoàn tất'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RevisionReviewDialog revisionPublicId={revisionTarget} onClose={() => setRevisionTarget(null)} />
      <StudentMinutesDialog
        defenseAssignmentPublicId={minutesTarget}
        members={members}
        onClose={() => setMinutesTarget(null)}
      />
    </div>
  )
}

export default CouncilSummaryPanel
