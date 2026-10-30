import React from 'react'
import type { StudentSemesterScoreCard, StudentScoreRow } from '../types/score.types'

interface ScoreResultCardProps {
  item: StudentSemesterScoreCard
}

export const ScoreResultCard: React.FC<ScoreResultCardProps> = ({ item }) => {
  const totalScore = item.rows.reduce(
    (acc: number, row: StudentScoreRow) => acc + (row.weight * row.score) / 100,
    0,
  )
  const isPassed = totalScore >= 5.0

  const typeCounts: Record<string, number> = {}
  item.rows.forEach((row: StudentScoreRow) => {
    typeCounts[row.type] = (typeCounts[row.type] || 0) + 1
  })
  const seenTypes: Record<string, boolean> = {}

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-xl font-bold text-slate-900">{item.courseName}</h2>
        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#1565C0] border border-blue-200">
          {item.semesterKey}
        </span>
      </div>

      <div className="text-sm text-slate-500 font-medium">
        Lớp: <span className="text-slate-800 font-semibold">{item.className}</span>
      </div>

      <div className="flex items-center gap-4 pt-1 flex-wrap">
        <div className="text-sm font-medium text-slate-600">
          Điểm trung bình:{' '}
          <span className="text-2xl font-bold text-[#1565C0]">
            {totalScore.toFixed(1)}
          </span>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            isPassed
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {isPassed ? 'Đạt' : 'Chưa đạt'}
        </span>
      </div>

      {/* Bảng chi tiết điểm */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 mt-4">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-700 font-semibold">
            <tr>
              <th className="py-3 px-4 w-32">Loại điểm</th>
              <th className="py-3 px-4 w-48">Điểm thành phần</th>
              <th className="py-3 px-4 w-28">Trọng số</th>
              <th className="py-3 px-4 w-28">Điểm số</th>
              <th className="py-3 px-4">Nhận xét</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {item.rows.map((row: StudentScoreRow) => {
              const isFirstOfType = !seenTypes[row.type]
              if (isFirstOfType) {
                seenTypes[row.type] = true
              }

              return (
                <tr
                  key={row.component}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  {isFirstOfType && (
                    <td
                      rowSpan={typeCounts[row.type]}
                      className="py-3.5 px-4 font-semibold text-slate-800 align-top border-r border-slate-100 bg-slate-50/30"
                    >
                      {row.type}
                    </td>
                  )}
                  <td className="py-3.5 px-4 font-medium text-slate-800">
                    {row.component}
                  </td>
                  <td className="py-3.5 px-4 font-medium">{row.weight}%</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {row.score.toFixed(1)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 leading-relaxed">
                    {row.comment}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
