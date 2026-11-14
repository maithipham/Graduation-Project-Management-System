import { Award, Calendar, MapPin, Users } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import type { DefenseCouncil } from '../types'
import { formatDefenseDateRange, ROLE_CONFIG } from '../utils/councilFormatters'

interface CouncilDetailDialogProps {
  council: DefenseCouncil | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CouncilDetailDialog({ council, open, onOpenChange }: CouncilDetailDialogProps) {
  if (!council) return null

  const members = council.members || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[620px] p-0 overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xl">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-200/90 flex flex-row items-start gap-3 bg-slate-50/70">
          <div className="w-10 h-10 rounded-xl bg-[#E3F2FD] text-[#1565C0] flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-[#1565C0]">
                {council.code}
              </span>
              <DialogTitle className="text-base font-bold tracking-tight text-slate-800">
                {council.name || `Hội đồng ${council.code}`}
              </DialogTitle>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Chi tiết thành viên và thời gian địa điểm bảo vệ
            </p>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4 text-left">
          {/* Quick info cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Phòng bảo vệ
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {council.location || 'Chưa xếp phòng'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Thời gian bảo vệ
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {formatDefenseDateRange(council.defenseStartTime, council.defenseEndTime)}
                </span>
              </div>
            </div>
          </div>

          {/* Members list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Thành viên hội đồng ({members.length}/5)</span>
              </h4>
            </div>

            {members.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400 italic">
                Chưa có giảng viên nào được gán vào hội đồng này.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {members.map((m) => {
                  const roleConfig = ROLE_CONFIG[m.role] || {
                    label: m.role,
                    badgeClass: 'bg-slate-100 text-slate-700',
                  }
                  return (
                    <div
                      key={m.teacherId}
                      className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 truncate">
                          {m.fullName}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {m.academicTitle} • {m.departmentName}
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded text-[11px] font-bold border shrink-0 ${roleConfig.badgeClass}`}
                      >
                        {roleConfig.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/70 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-9 px-4 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
