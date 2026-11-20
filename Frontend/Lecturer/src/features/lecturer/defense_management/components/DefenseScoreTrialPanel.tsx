import React, { useMemo, useState } from 'react'
import { Calculator, RotateCcw } from 'lucide-react'
import { isApiError } from '@/shared/types'
import { useDefenseScoreTrial } from '../hooks/useDefenseEvaluation'
import type { DefenseScoreBoard, DefenseScoreEntry, DefenseScoreTrialEntry } from '../types'

const ROLE_LABEL: Record<string, string> = {
  CHAIRPERSON: 'Chủ tịch',
  SECRETARY: 'Thư ký',
  COUNCIL_MEMBER: 'Ủy viên',
}

// Tối thiểu số điểm Hội đồng để tính (thành viên vắng để trống), khớp DefenseScoreCalculator.MIN_COUNCIL_COUNT
const MIN_COUNCIL = 3

type Group = 'advisors' | 'examiners' | 'council'

interface TrialRow {
  group: Group
  index: number
  label: string
  teacherName: string
}

function initialValue(entry: DefenseScoreEntry | null | undefined): string {
  return entry && typeof entry.score === 'number' ? entry.score.toFixed(1) : ''
}

/**
 * Bảng thử điểm (Chủ tịch / Thư ký): nhập điểm giả định cho từng người để xem điểm TB Hội đồng,
 * điểm Tổng kết, Đạt / Không đạt và cảnh báo lệch thay đổi ra sao. Chỉ tính, KHÔNG lưu:
 * muốn đổi điểm thật thì người chấm (HĐ / GVHD / GVPB) tự sửa phiếu của mình trước khi Hoàn tất bảo vệ.
 */
export const DefenseScoreTrialPanel: React.FC<{ board: DefenseScoreBoard }> = ({ board }) => {
  const trial = useDefenseScoreTrial(board.defenseAssignmentPublicId)

  const rows = useMemo<TrialRow[]>(() => {
    const advisors = [board.advisor, board.coAdvisor].filter((e): e is DefenseScoreEntry => !!e)
    return [
      ...advisors.map((e, i) => ({
        group: 'advisors' as const,
        index: i,
        label: advisors.length > 1 ? `GVHD ${i + 1}` : 'GVHD',
        teacherName: e.teacherName,
      })),
      ...board.examiners.map((e, i) => ({
        group: 'examiners' as const,
        index: i,
        label: `GVPB ${e.order ?? i + 1}`,
        teacherName: e.teacherName,
      })),
      ...board.council.map((e, i) => ({
        group: 'council' as const,
        index: i,
        label: e.role ? ROLE_LABEL[e.role] : 'Thành viên',
        teacherName: e.teacherName,
      })),
    ]
  }, [board])

  const initial = useMemo<Record<string, string>>(() => {
    const advisors = [board.advisor, board.coAdvisor].filter(Boolean)
    const values: Record<string, string> = {}
    advisors.forEach((e, i) => (values[`advisors-${i}`] = initialValue(e)))
    board.examiners.forEach((e, i) => (values[`examiners-${i}`] = initialValue(e)))
    board.council.forEach((e, i) => (values[`council-${i}`] = initialValue(e)))
    return values
  }, [board])

  const [values, setValues] = useState<Record<string, string>>(initial)
  const [inputError, setInputError] = useState<string | null>(null)

  // undefined = ô trống; null = nhập sai (không phải số 0 - 10)
  const parsed = (key: string): number | null | undefined => {
    const raw = (values[key] ?? '').replace(',', '.').trim()
    if (raw === '') return undefined
    const n = Number(raw)
    return Number.isFinite(n) && n >= 0 && n <= 10 ? n : null
  }

  // Vị trí (index trong board.council) của các thành viên Hội đồng có điểm ở lần tính gần nhất
  const [presentCouncil, setPresentCouncil] = useState<number[]>([])

  const handleCalculate = () => {
    const pick = (group: Group) =>
      rows.filter((r) => r.group === group).map((r) => ({ index: r.index, score: parsed(`${group}-${r.index}`) }))
    const advisors = pick('advisors')
    const examiners = pick('examiners')
    // Thành viên Hội đồng để trống = vắng, không tính điểm
    const council = pick('council').filter((c) => c.score !== undefined)
    if ([...advisors, ...examiners].some((s) => s.score === undefined || s.score === null)
        || council.some((c) => c.score === null)) {
      setInputError('Nhập đủ điểm GVHD, GVPB; mỗi điểm từ 0 đến 10. Thành viên Hội đồng vắng thì để trống.')
      return
    }
    if (council.length < MIN_COUNCIL) {
      setInputError(`Cần tối thiểu ${MIN_COUNCIL} điểm thành viên Hội đồng.`)
      return
    }
    setInputError(null)
    setPresentCouncil(council.map((c) => c.index))
    trial.mutate({
      advisorScores: advisors.map((s) => s.score as number),
      examinerScores: examiners.map((s) => s.score as number),
      councilScores: council.map((c) => c.score as number),
    })
  }

  const handleReset = () => {
    setValues(initial)
    setInputError(null)
    setPresentCouncil([])
    trial.reset()
  }

  const resultEntry = (row: TrialRow): DefenseScoreTrialEntry | undefined => {
    if (row.group !== 'council') return trial.data?.[row.group]?.[row.index]
    // Kết quả Hội đồng chỉ gồm người có mặt, giữ thứ tự gửi lên
    const pos = presentCouncil.indexOf(row.index)
    return pos >= 0 ? trial.data?.council?.[pos] : undefined
  }

  const apiError = trial.error
    ? isApiError(trial.error)
      ? trial.error.message
      : 'Không tính thử được điểm, vui lòng thử lại.'
    : null

  return (
    <div className="border border-amber-200 rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-xs font-bold text-amber-900 inline-flex items-center gap-1.5 w-full">
        <Calculator className="w-3.5 h-3.5" />
        Bảng thử điểm (chỉ tính thử, không lưu)
      </div>
      <div className="px-4 py-2 text-[11px] text-slate-600 border-b border-slate-100">
        Sửa điểm giả định để xem kết quả thay đổi; thành viên Hội đồng vắng thì để trống (cần tối thiểu 3). Muốn đổi điểm thật, người chấm tự sửa và nộp lại phiếu của
        mình trước khi Hoàn tất bảo vệ.
      </div>
      <table className="w-full text-xs">
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => {
            const key = `${r.group}-${r.index}`
            const res = resultEntry(r)
            return (
              <tr key={key} className={res?.deviated ? 'bg-amber-50/60' : undefined}>
                <td className="px-4 py-1.5 font-semibold text-slate-700 w-28">{r.label}</td>
                <td className="px-2 py-1.5 text-slate-500 truncate">{r.teacherName}</td>
                <td className="px-2 py-1.5 w-24">
                  <input
                    aria-label={`Điểm thử ${r.label} ${r.teacherName}`}
                    inputMode="decimal"
                    value={values[key] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                    className="w-20 rounded-md border border-slate-300 px-2 py-1 text-right text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </td>
                <td className="px-4 py-1.5 text-right w-32 text-[11px]">
                  {res?.deviated ? (
                    <span className="font-bold text-amber-700">Lệch {res.deviation?.toFixed(2)}</span>
                  ) : res ? (
                    <span className="text-slate-400">Lệch {res.deviation?.toFixed(2)}</span>
                  ) : null}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {(inputError || apiError) && (
        <div className="px-4 py-2 text-[11px] font-semibold text-rose-700 bg-rose-50 border-t border-rose-100">
          {inputError ?? apiError}
        </div>
      )}

      {trial.data && (
        <div className="px-4 py-2.5 border-t border-slate-200 bg-blue-50/40 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          <div>
            Điểm HD: <b>{trial.data.advisorScore.toFixed(1)}</b>
          </div>
          <div>
            Điểm PB: <b>{trial.data.examinerScore.toFixed(1)}</b>
          </div>
          <div>
            TB Hội đồng: <b>{trial.data.councilScore.toFixed(1)}</b>
          </div>
          <div>
            Tổng kết: <b className="text-[#1565C0]">{trial.data.finalScore.toFixed(1)}</b>{' '}
            <span className={trial.data.result === 'PASSED' ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
              ({trial.data.result === 'PASSED' ? 'Đạt' : 'Không đạt'})
            </span>
          </div>
        </div>
      )}

      <div className="px-4 py-2.5 border-t border-slate-200 flex justify-end gap-2">
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Về điểm hiện tại
        </button>
        <button
          type="button"
          onClick={handleCalculate}
          disabled={trial.isPending}
          className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-60"
        >
          <Calculator className="w-3.5 h-3.5" /> {trial.isPending ? 'Đang tính...' : 'Tính thử'}
        </button>
      </div>
    </div>
  )
}

export default DefenseScoreTrialPanel
