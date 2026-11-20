import { cn } from '@/shared/utils/cn'
import { toScoreRows } from '../services/score.service'
import type { StudentScoreResponse } from '../types/score.types'

interface ScoreResultCardProps {
  item: StudentScoreResponse
}

const formatScore = (score: number | null) => (score === null ? null : score.toFixed(1))

export function ScoreResultCard({ item }: ScoreResultCardProps) {
  const rows = toScoreRows(item)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-xl font-bold text-slate-900">Đồ án tốt nghiệp</h2>
        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#1565C0] border border-blue-200">
          {item.semesterName}
        </span>
      </div>

      <div className="text-sm text-slate-500 font-medium">
        Đề tài:{' '}
        {item.topicName ? (
          <span className="text-slate-800 font-semibold">{item.topicName}</span>
        ) : (
          <span className="italic text-slate-400">Chưa có tên đề tài</span>
        )}
      </div>

      {/* Điểm tổng kết: luôn lấy finalScore của BE, không tự tính */}
      <div className="pt-1">
        {item.finalScore !== null ? (
          <div className="text-sm font-medium text-slate-600">
            Điểm tổng kết:{' '}
            <span className="text-2xl font-bold text-[#1565C0]">{item.finalScore.toFixed(1)}</span>
          </div>
        ) : (
          <div className="space-y-0.5">
            <div className="text-sm font-semibold text-slate-700">Chưa có điểm tổng kết</div>
            <div className="text-xs italic text-slate-500">
              {/* Điểm tổng kết tính theo QĐ1305 khi có kết quả bảo vệ (không có trọng số) */}
              Chờ đủ điểm Hướng dẫn, Phản biện và Hội đồng.
            </div>
          </div>
        )}
      </div>

      {/* Bảng điểm 3 nhóm */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 mt-4">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-700 font-semibold">
            <tr>
              <th className="py-3 px-4">Loại điểm</th>
              <th className="py-3 px-4 w-56">Điểm</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {rows.map((row) => (
              <tr key={row.key} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3.5 px-4 font-semibold text-slate-800">{row.label}</td>
                <td className="py-3.5 px-4 font-bold text-slate-900">
                  <div className="flex items-center gap-2 flex-wrap">
                    {formatScore(row.score) ?? (
                      <span className="font-normal italic text-slate-400">Chưa có điểm</span>
                    )}
                    {row.passed != null && (
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border',
                          row.passed
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200',
                        )}
                      >
                        {row.passed ? 'PB ≥ 5.0' : 'PB < 5.0'}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
