import React from 'react'
import {
  Award,
  Calendar,
  Clock,
  ExternalLink,
  MapPin,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { useDefenseManagement } from '../hooks/useDefenseManagement'

export const DefenseCouncilPage: React.FC = () => {
  const { defenseCouncils } = useDefenseManagement()

  return (
    <div className="space-y-6">
      {/* Banner thông tin hội đồng */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#1565C0] flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Lịch hội đồng chấm bảo vệ đồ án
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Danh sách các hội đồng bảo vệ khóa luận tốt nghiệp mà giảng viên được phân công tham gia trong học kỳ.
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-50 border border-blue-200 text-[#1565C0] text-xs font-semibold shrink-0">
          <Users className="w-4 h-4 shrink-0" />
          <span>Đang tham gia: {defenseCouncils.length} hội đồng</span>
        </div>
      </div>

      {/* Danh sách thẻ hội đồng */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {defenseCouncils.map((council) => {
          const isPurple = council.badgeVariant === 'purple'
          const isAmberSession = council.sessionVariant === 'amber'

          return (
            <div
              key={council.id}
              className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col"
            >
              {/* Header của thẻ hội đồng */}
              <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wide ${
                        isPurple
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-blue-50 text-[#1565C0] border border-blue-200'
                      }`}
                    >
                      {council.codeBadge}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${
                        isAmberSession
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {council.sessionLabel}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 leading-snug">
                    {council.title}
                  </h2>
                </div>
              </div>

              {/* Thông tin chi tiết địa điểm, thời gian */}
              <div className="p-5 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50/50">
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-medium">{council.timeRange}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-medium">{council.location}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    Vai trò:{' '}
                    <strong className="text-slate-900 font-bold">
                      {council.lecturerRole}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Users className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate" title={council.committeeSummary}>
                    {council.committeeSummary}
                  </span>
                </div>
              </div>

              {/* Bảng danh sách sinh viên bảo vệ */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Danh sách sinh viên bảo vệ ({council.students.length})
                  </div>
                  <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
                    {council.students.map((st) => (
                      <div
                        key={st.mssv}
                        className="px-3.5 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 transition"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[11px] font-bold shrink-0">
                            {st.order}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900">
                              {st.name}
                            </span>
                            <span className="text-slate-400 mx-1.5">·</span>
                            <span className="font-mono text-slate-500 text-[11px]">
                              {st.mssv}
                            </span>
                          </div>
                        </div>
                        <span className="text-slate-500 font-medium inline-flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {st.timeSlot}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Nút hành động */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-end">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#1565C0] text-white hover:bg-[#0D47A1] transition shadow-xs cursor-pointer active:scale-95"
                  >
                    <span>{council.actionLabel}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default DefenseCouncilPage
