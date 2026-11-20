import React from 'react'
import { AlertTriangle, Radio } from 'lucide-react'
import type { DefenseScoreBoard, DefenseScoreEntry, DefenseScoreGroup } from '../types'
import { DefenseScoreTrialPanel } from './DefenseScoreTrialPanel'

const ROLE_LABEL: Record<string, string> = {
  CHAIRPERSON: 'Chủ tịch',
  SECRETARY: 'Thư ký',
  COUNCIL_MEMBER: 'Ủy viên',
}

const STEP_LABEL: Record<DefenseScoreGroup, string> = {
  COUNCIL: 'Bước 1 – lệch so với TB 5 điểm Hội đồng',
  EXAMINER: 'Bước 2 – lệch so với TB 5 điểm Hội đồng',
  ADVISOR: 'Bước 3 – lệch so với TB điểm PB + HĐ',
}

/** Ô điểm: điểm (tô cam + biểu tượng cảnh báo nếu lệch >= 1.5, vẫn được tính) hoặc trạng thái khi chưa nộp / bị ẩn */
export const ScoreCell: React.FC<{ entry: DefenseScoreEntry | null | undefined }> = ({ entry }) => {
  if (!entry) return <span className="text-slate-300">—</span>
  if (typeof entry.score === 'number') {
    const deviated = entry.deviated === true
    return (
      <span
        className={deviated ? 'inline-flex items-center gap-0.5 text-amber-700 font-extrabold' : 'font-extrabold'}
        title={
          deviated
            ? `Cảnh báo: lệch ${entry.deviation?.toFixed(2)} điểm${entry.deviationStep ? ` (${STEP_LABEL[entry.deviationStep]})` : ''} – vẫn được tính, người chấm có thể tự sửa phiếu`
            : entry.deviation !== undefined
              ? `Lệch ${entry.deviation.toFixed(2)} điểm`
              : undefined
        }
      >
        {deviated && <AlertTriangle className="w-3 h-3" aria-label="Điểm lệch" />}
        {entry.score.toFixed(1)}
      </span>
    )
  }
  if (entry.status === 'SUBMITTED') return <span className="text-emerald-600 text-[11px] font-bold">Đã nộp</span>
  if (entry.status === 'DRAFT') return <span className="text-amber-600 text-[11px] font-bold">Nháp</span>
  return <span className="text-slate-400 text-[11px]">Chưa chấm</span>
}

export function resultBadge(board: DefenseScoreBoard): React.ReactNode {
  if (board.result === 'PASSED') {
    return (
      <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        Đạt
      </span>
    )
  }
  if (board.result === 'FAILED') {
    return (
      <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
        Không đạt
      </span>
    )
  }
  return (
    <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
      Chưa đủ điểm
    </span>
  )
}

/**
 * BƯỚC 14 – Pha 1c: Bảng điểm Hội đồng của 1 sinh viên, cập nhật realtime qua WebSocket.
 * Điểm bị ẩn theo quy tắc (Ủy viên chưa đủ 5/5 phiếu) do BE quyết định.
 */
export const DefenseScoreBoardCard: React.FC<{
  board: DefenseScoreBoard | undefined
  // Chủ tịch / Thư ký (xem được mọi điểm): hiện bảng thử điểm
  canTrial?: boolean
}> = ({ board, canTrial = false }) => {
  if (!board) return null
  const rows: { label: string; sub?: string; entry: DefenseScoreEntry | null | undefined }[] = [
    { label: board.coAdvisor ? 'GVHD 1' : 'GVHD', sub: board.advisor?.teacherName, entry: board.advisor },
    ...(board.coAdvisor ? [{ label: 'GVHD 2', sub: board.coAdvisor.teacherName, entry: board.coAdvisor }] : []),
    ...board.examiners.map((e) => ({ label: `GVPB ${e.order ?? ''}`, sub: e.teacherName, entry: e })),
    ...board.council.map((e) => ({
      label: `${e.role ? ROLE_LABEL[e.role] : 'Thành viên'}${e.mine ? ' (Bạn)' : ''}`,
      sub: e.teacherName,
      entry: e,
    })),
  ]

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
        <div className="text-xs font-bold text-slate-800 inline-flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-emerald-600" />
          Bảng điểm Hội đồng (trực tiếp) · {board.submittedCouncilCount}/5 phiếu đã nộp
        </div>
        {resultBadge(board)}
      </div>
      {board.scoreHidden && (
        <div className="px-4 py-2 text-[11px] text-slate-500 bg-amber-50/50 border-b border-slate-100">
          Điểm của thành viên khác được hiển thị khi đủ 5/5 phiếu Hội đồng đã nộp hoặc khi bảo vệ đã hoàn tất.
        </div>
      )}
      {board.hasDeviation && (
        <div className="px-4 py-2 text-[11px] text-amber-800 bg-amber-50 border-b border-amber-100 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Có điểm lệch từ 1,5 điểm trở lên (đánh dấu cam). Điểm lệch vẫn được tính; người chấm có thể tự sửa và
            nộp lại phiếu của mình trước khi Hoàn tất bảo vệ.
          </span>
        </div>
      )}
      <table className="w-full text-xs">
        <tbody className="divide-y divide-slate-100">
          {rows.map((r, idx) => (
            <tr key={idx}>
              <td className="px-4 py-1.5 font-semibold text-slate-700 w-36">{r.label}</td>
              <td className="px-2 py-1.5 text-slate-500 truncate">{r.sub}</td>
              <td className="px-4 py-1.5 text-right w-24">
                <ScoreCell entry={r.entry} />
              </td>
            </tr>
          ))}
          <tr className="bg-blue-50/40">
            <td className="px-4 py-2 font-bold text-[#1565C0]" colSpan={2}>
              Điểm TB Hội đồng / Điểm tổng kết
            </td>
            <td className="px-4 py-2 text-right font-black text-[#1565C0]">
              {board.councilScore !== null ? board.councilScore.toFixed(1) : '—'} /{' '}
              {board.finalScore !== null ? board.finalScore.toFixed(1) : '—'}
            </td>
          </tr>
        </tbody>
      </table>
      {/* Bảng thử điểm: khi đã đủ điểm và bảo vệ chưa hoàn tất; key theo version để nạp lại điểm mới nhất */}
      {canTrial && board.result !== null && board.result !== 'PENDING' && board.defenseStatus !== 'COMPLETED' && (
        <div className="p-3 border-t border-slate-200">
          <DefenseScoreTrialPanel key={board.version} board={board} />
        </div>
      )}
    </div>
  )
}

export default DefenseScoreBoardCard
