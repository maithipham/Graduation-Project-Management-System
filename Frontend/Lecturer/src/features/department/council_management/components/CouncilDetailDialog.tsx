import { Award, AlertTriangle, CheckCircle2, FilePen, Shield, ShieldCheck, Star } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Dialog, DialogContent, DialogTitle } from '@/shared/components/ui/dialog'
import type { DefenseCouncil } from '../types'
import { useEligibleStudents } from '../hooks/useDefenseCouncils'
import {
  formatDefenseDateRange,
  getMemberCount,
  isCouncilMembersComplete,
  membersToSlots,
  type MemberSlotKey,
} from '../utils/councilFormatters'

interface CouncilDetailDialogProps {
  council: DefenseCouncil | null
  semesterId: number | string
  majorId: number | string
  open: boolean
  onOpenChange: (open: boolean) => void
  onManageMembers: (councilId: string) => void
  onManageStudents: (councilId: string) => void
}

const SLOT_ROWS: Array<{ slot: MemberSlotKey; label: string; icon: LucideIcon }> = [
  { slot: 'chair', label: 'Chủ tịch', icon: Star },
  { slot: 'secretary', label: 'Thư ký', icon: FilePen },
  { slot: 'm1', label: 'Ủy viên 1', icon: Shield },
  { slot: 'm2', label: 'Ủy viên 2', icon: Shield },
  { slot: 'm3', label: 'Ủy viên 3', icon: Shield },
]

export function CouncilDetailDialog({
  council,
  semesterId,
  majorId,
  open,
  onOpenChange,
  onManageMembers,
  onManageStudents,
}: CouncilDetailDialogProps) {
  // Lấy danh sách SV đã gán rồi lọc theo hội đồng đang xem
  const { data: assignedPage, isPending: studentsLoading } = useEligibleStudents(
    { semesterId, majorId, assigned: true, page: 0, size: 500 },
    open && Boolean(council),
  )

  if (!council) return null

  const members = council.members || []
  const slots = membersToSlots(members)
  const memberById = new Map(members.map((m) => [m.teacherId, m]))
  const councilStudents = (assignedPage?.content || []).filter(
    (s) => s.councilName && (s.councilName === council.name || s.councilName === council.code),
  )

  const isPublished = council.status === 'PUBLISHED'
  const isReady = isCouncilMembersComplete(council) && council.studentCount > 0

  const banner = isPublished
    ? {
        cls: 'bg-emerald-50 border-emerald-200 text-emerald-900',
        icon: ShieldCheck,
        title: 'Hội đồng đã công bố:',
        text: 'Chủ tịch/Thư ký có thể tiến hành phân công phản biện và xếp lịch bảo vệ.',
      }
    : isReady
      ? {
          cls: 'bg-sky-50 border-sky-200 text-sky-900',
          icon: CheckCircle2,
          title: 'Đã hoàn tất cấu hình:',
          text: 'Đủ 5/5 thành viên và đã gán sinh viên.',
        }
      : {
          cls: 'bg-amber-50 border-amber-200 text-amber-900',
          icon: AlertTriangle,
          title: 'Đang hoàn thiện:',
          text: 'Cần phân công đủ 5 thành viên và gán sinh viên cho hội đồng.',
        }
  const BannerIcon = banner.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[780px] p-0 gap-0 overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xl max-h-[calc(100vh-48px)] flex flex-col">
        <div className="px-6 pt-5 pb-4 border-b border-slate-200 flex items-start gap-3 pr-12">
          <div className="w-10 h-10 rounded-xl bg-[#E3F2FD] text-[#1565C0] flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <DialogTitle className="text-[16px] font-bold tracking-tight text-slate-800">
              Chi tiết {council.name || council.code}
            </DialogTitle>
            <p className="text-[12.5px] text-slate-500 mt-1">
              {formatDefenseDateRange(council.defenseStartTime, council.defenseEndTime)} ·{' '}
              {council.location || 'Chưa xếp phòng'}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-left">
          <div className={`p-3.5 rounded-xl border ${banner.cls} flex items-center gap-2 text-[12.5px]`}>
            <BannerIcon className="w-4 h-4 shrink-0" />
            <span>
              <b>{banner.title}</b> {banner.text}
            </span>
          </div>

          {/* Thành viên */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[11px] font-extrabold tracking-widest text-slate-400 uppercase">
                Danh sách thành viên hội đồng ({getMemberCount(council)}/5)
              </h4>
              <button
                type="button"
                onClick={() => onManageMembers(council.publicId)}
                className="text-[12px] font-semibold text-[#1565C0] hover:underline cursor-pointer"
              >
                Quản lý thành viên →
              </button>
            </div>
            <div className="border border-slate-200 rounded-xl px-4 bg-white shadow-sm">
              {SLOT_ROWS.map(({ slot, label, icon: Icon }) => {
                const teacherId = slots[slot]
                const m = teacherId !== null ? memberById.get(teacherId) : undefined
                return (
                  <div
                    key={slot}
                    className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0"
                  >
                    <span className="w-7 h-7 rounded-lg bg-[#E3F2FD] text-[#1565C0] flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-[12px] font-semibold text-slate-500 w-[80px] shrink-0">
                      {label}
                    </span>
                    <span
                      className={`text-[13px] font-semibold flex-1 truncate ${m ? 'text-slate-800' : 'text-amber-600 italic'}`}
                    >
                      {m
                        ? `${m.academicTitle ? `${m.academicTitle} ` : ''}${m.fullName} · ${m.departmentName}`
                        : 'Chưa phân công'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Sinh viên */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[11px] font-extrabold tracking-widest text-slate-400 uppercase">
                Danh sách sinh viên bảo vệ ({council.studentCount})
              </h4>
              <button
                type="button"
                onClick={() => onManageStudents(council.publicId)}
                className="text-[12px] font-semibold text-[#1565C0] hover:underline cursor-pointer"
              >
                Gán sinh viên →
              </button>
            </div>
            {studentsLoading ? (
              <div className="space-y-2 mt-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : councilStudents.length > 0 ? (
              <div className="space-y-2 mt-2">
                {councilStudents.map((s, i) => (
                  <div
                    key={s.thesisTopicPublicId}
                    className="flex items-center gap-3 px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-[13px]"
                  >
                    <span className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-500 shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 truncate">
                        {s.studentName}{' '}
                        <span className="font-mono font-normal text-slate-500 ml-1">
                          · {s.studentCode}
                        </span>
                      </div>
                      <div className="text-[11.5px] text-slate-500 truncate">
                        {s.topicTitle || 'Chưa có đề tài'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 mt-2 rounded-lg border-2 border-dashed border-slate-200 text-center text-[12.5px] font-medium text-slate-500">
                Chưa có sinh viên nào được gán vào hội đồng này
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/70 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 px-5 rounded-lg bg-white border border-slate-300 text-slate-700 text-[13px] font-semibold hover:bg-slate-50"
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
