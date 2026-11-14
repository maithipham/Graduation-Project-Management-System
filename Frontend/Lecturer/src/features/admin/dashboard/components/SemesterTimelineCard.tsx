import React from 'react'
import { Link } from 'react-router-dom'
import { Calendar, ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card'
import { formatDate } from '@/shared/utils/formatDate'
import type { Semester } from '@/features/admin/semester_management'

interface SemesterTimelineCardProps {
  semesters: Semester[]
}

export const SemesterTimelineCard: React.FC<SemesterTimelineCardProps> = ({
  semesters,
}) => {
  const getStatusText = (status: Semester['status']) => {
    switch (status) {
      case 'active':
        return <span className="text-emerald-700 font-semibold">Đang diễn ra</span>
      case 'upcoming':
        return <span className="text-amber-700 font-semibold">Chưa bắt đầu</span>
      case 'ended':
        return <span className="text-slate-400 font-medium">Đã kết thúc</span>
    }
  }

  return (
    <Card className="border-slate-200/90 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-600" />
          <CardTitle className="text-base font-bold text-slate-900">
            Tình trạng các học kỳ
          </CardTitle>
        </div>
        <Link
          to="/admin/semesters"
          className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
        >
          <span>Chi tiết</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>

      <CardContent className="pt-4 space-y-2.5">
        {semesters.map((s) => {
          const isCurrent = s.status === 'active'
          return (
            <div
              key={s.id}
              className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                isCurrent
                  ? 'bg-blue-50/60 border-blue-200'
                  : 'bg-slate-50/50 border-slate-100'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-bold ${
                      isCurrent ? 'text-blue-800' : 'text-slate-800'
                    }`}
                  >
                    {s.name}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                      Hiện tại
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {formatDate(s.startDate)} — {formatDate(s.endDate)}
                </div>
              </div>

              <div className="text-xs text-right">{getStatusText(s.status)}</div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
