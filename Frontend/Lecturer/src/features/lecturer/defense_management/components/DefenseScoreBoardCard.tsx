import React from 'react'
import { Radio } from 'lucide-react'
import type { DefenseScoreBoard, DefenseScoreEntry, DefenseScoreGroup } from '../types'

const ROLE_LABEL: Record<string, string> = {
  CHAIRPERSON: 'Chủ tịch',
  SECRETARY: 'Thư ký',
  COUNCIL_MEMBER: 'Ủy viên',
}

const STEP_LABEL: Record<DefenseScoreGroup, string> = {
  COUNCIL: 'Bước 1 – lệch so với TB 5 điểm Hội đồng',
  EXAMINER: 'Bước 2 – lệch so với TB điểm Hội đồng hợp lệ',
  ADVISOR: 'Bước 3 – lệch so với TB điểm PB + HĐ hợp lệ',
}

const GROUP_LABEL: Record<DefenseScoreGroup, string> = {
  COUNCIL: 'Hội đồng',
  EXAMINER: 'Phản biện',
  ADVISOR: 'Hướng dẫn',
}

/** Ô điểm: điểm (gạch đỏ nếu bị loại) hoặc trạng thái khi chưa nộp / bị ẩn */
export const ScoreCell: React.FC<{ entry: DefenseScoreEntry | null | undefined }> = ({ entry }) => {
  if (!entry) return <span className="text-slate-300">—</span>
  if (typeof entry.score === 'number') {
    const invalid = entry.validForFinal === false
    return (
      <span
        className={invalid ? 'line-through text-[#DC2626] font-bold' : 'font-extrabold'}
        title={
          invalid
            ? `Bị loại: lệch ${entry.deviation?.toFixed(2)} điểm${entry.invalidStep ? ` (${STEP_LABEL[entry.invalidStep]})` : ''}`
            : entry.deviation !== undefined
              ? `Hợp lệ, lệch ${entry.deviation.toFixed(2)} điểm`
              : undefined
        }
      >
        {entry.score.toFixed(1)}
      </span>
    )
  }
  if (entry.status === 'SUBMITTED') return <span className="text-emerald-600 text-[11px] font-bold">Đã nộp</span>
  if (entry.status === 'DRAFT') return <span className="text-amber-600 text-[11px] font-bold">Nháp</span>
  return <span className="text-slate-400 text-[11px]">Chưa chấm</span>
}

export function resultBadge(board: DefenseScoreBoard): React.ReactNode {
  if (board.allInvalidGroup) {
    return (
      <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
        Nhóm {GROUP_LABEL[board.allInvalidGroup]} bị loại hết – cần chấm lại
      </span>
    )
  }
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
export const DefenseScoreBoardCard: React.FC<{ board: DefenseScoreBoard | undefined }> = ({ board }) => {
  if (!board) return null
  const rows: { label: string; sub?: string; entry: DefenseScoreEntry | null | undefined }[] = [
    { label: 'GVHD', sub: board.advisor?.teacherName, entry: board.advisor },
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
          Điểm của thành viên khác được hiển thị khi đủ 5/5 phiếu Hội đồng đã nộp.
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
    </div>
  )
}

export default DefenseScoreBoardCard
