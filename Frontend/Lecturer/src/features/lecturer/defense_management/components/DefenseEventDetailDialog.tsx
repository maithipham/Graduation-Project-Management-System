import React from 'react'
import { Link } from 'react-router-dom'
import {
  Award,
  Calendar,
  ClipboardCheck,
  Clock,
  GraduationCap,
  MapPin,
  User,
  Users,
  Video,
} from 'lucide-react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui'

export interface ScheduleEvent {
  id: string
  type: 'council' | 'review'
  councilId?: string
  code: string
  title: string
  subTitle: string
  role: string
  dateIso: string // YYYY-MM-DD
  timeRange: string
  startTime: string
  endTime: string
  room: string
  mode: string
  studentCount?: number
  students?: Array<{
    id?: string
    name: string
    mssv: string
    slotTime: string
    slotEnd?: string
    topic: string
    supervisor?: string
  }>
  members?: Array<{
    name: string
    role: string
    department?: string
  }>
  status: 'upcoming' | 'completed'
  studentName?: string
  studentMssv?: string
  topic?: string
  supervisor?: string
  score?: number | null
  eligible?: boolean | null
  note?: string
}

interface DefenseEventDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: ScheduleEvent | null
}

export const DefenseEventDetailDialog: React.FC<
  DefenseEventDetailDialogProps
> = ({ open, onOpenChange, event }) => {
  if (!event) return null

  const isCouncil = event.type === 'council'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                isCouncil
                  ? 'bg-blue-100 text-[#1565C0] border border-blue-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              {isCouncil ? 'Phiên Hội đồng bảo vệ' : 'Ca phản biện cá nhân'}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                event.status === 'completed'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {event.status === 'completed' ? 'Đã hoàn thành' : 'Sắp diễn ra'}
            </span>
          </div>
          <DialogTitle className="text-base font-bold text-slate-900 leading-snug">
            {event.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {event.subTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2 text-xs">
          {/* Thông tin thời gian, địa điểm, vai trò */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2 text-slate-700">
              <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Ngày:{' '}
                <strong className="text-slate-900">{event.dateIso}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                Khung giờ:{' '}
                <strong className="text-slate-900">{event.timeRange}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              {event.mode.includes('tuyến') ? (
                <Video className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
              )}
              <span>
                Địa điểm:{' '}
                <strong className="text-slate-900">{event.room}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <User className="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                Vai trò của bạn:{' '}
                <strong className="text-slate-900">{event.role}</strong>
              </span>
            </div>
          </div>

          {/* Nếu là Hội đồng: danh sách thành viên & sinh viên */}
          {isCouncil && (
            <>
              {event.members && event.members.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>Thành viên Hội đồng ({event.members.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {event.members.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{m.name}</div>
                          {m.department && (
                            <div className="text-[11px] text-slate-400">
                              {m.department}
                            </div>
                          )}
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {m.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {event.students && event.students.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-[#1565C0]" />
                    <span>Danh sách sinh viên ca bảo vệ ({event.students.length})</span>
                  </h4>
                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                    {event.students.map((s, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-start justify-between gap-3"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-blue-100 text-[#1565C0] font-bold flex items-center justify-center text-[10.5px] shrink-0">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-slate-900 truncate">
                              {s.name}
                            </span>
                            <span className="text-slate-400 font-mono text-[11px]">
                              ({s.mssv})
                            </span>
                            <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10.5px] font-semibold text-slate-700 shrink-0">
                              {s.slotTime} {s.slotEnd ? `- ${s.slotEnd}` : ''}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 pl-7 line-clamp-1" title={s.topic}>
                            {s.topic}
                          </div>
                        </div>
                        {s.supervisor && (
                          <span className="text-[11px] text-slate-400 shrink-0">
                            GVHD: {s.supervisor}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Nếu là Phản biện: thông tin sinh viên & đề tài */}
          {!isCouncil && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500 uppercase text-[10px]">
                  Hồ sơ sinh viên phản biện
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[11px]">
                  {event.role}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-900 text-sm">
                  {event.studentName}
                </span>
                <span className="text-slate-500"> · MSSV: {event.studentMssv}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Tên đề tài đồ án:</span>
                <p className="font-bold text-slate-800 text-xs mt-0.5">
                  {event.topic}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-[11.5px]">
                <div>
                  GVHD: <b className="text-slate-800">{event.supervisor || '—'}</b>
                </div>
                <div>
                  Hội đồng: <b className="text-slate-800">{event.code}</b>
                </div>
              </div>
              {event.score !== null && event.score !== undefined && (
                <div className="pt-1 flex items-center gap-2 text-[11.5px]">
                  <span>Điểm phản biện:</span>
                  <span className="font-bold text-emerald-700">
                    {event.score.toFixed(1)} / 10
                  </span>
                  {event.eligible !== null && event.eligible !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10.5px] font-bold ${
                        event.eligible
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {event.eligible ? 'Đạt' : 'Không đạt'}
                    </span>
                  )}
                </div>
              )}
              {event.note && (
                <div className="text-amber-800 italic text-[11px] pt-1">
                  Ghi chú: {event.note}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="pt-3 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Đóng
          </Button>

          {isCouncil && event.councilId && (
            <Link
              to={`/lecturer/defense/councils/${event.councilId}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-bold transition shadow-xs"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Chuyển tới Hội đồng này</span>
            </Link>
          )}

          {!isCouncil && (
            <Link
              to="/lecturer/defense/reviews"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Đến trang Đánh giá phản biện</span>
            </Link>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
