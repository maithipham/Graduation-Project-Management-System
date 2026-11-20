import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/shared/components/ui/dialog'
import type { CandidateTeacher, CouncilMember, DefenseCouncil } from '../types'
import {
  MEMBER_SLOT_KEYS,
  membersToSlots,
  slotLabel,
  type MemberSlotKey,
} from '../utils/councilFormatters'

interface ReplaceWhenFullDialogProps {
  council: DefenseCouncil | null
  incoming: CandidateTeacher | null
  isPending?: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (slot: MemberSlotKey) => void
}

const SLOT_BADGE: Record<string, string> = {
  chair: 'bg-blue-50 text-[#1565C0] border border-blue-200',
  secretary: 'bg-purple-50 text-purple-700 border border-purple-200',
  member: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
}

/** Gán giảng viên mới vào hội đồng đã đủ 5/5: chọn 1 thành viên hiện tại để thay thế */
export function ReplaceWhenFullDialog(props: ReplaceWhenFullDialogProps) {
  const open = Boolean(props.council && props.incoming)
  return (
    <Dialog open={open} onOpenChange={props.onOpenChange}>
      {open && (
        <ReplaceWhenFullContent
          key={`${props.council?.publicId}-${props.incoming?.teacherId}`}
          {...props}
        />
      )}
    </Dialog>
  )
}

function ReplaceWhenFullContent({
  council,
  incoming,
  isPending,
  onOpenChange,
  onConfirm,
}: ReplaceWhenFullDialogProps) {
  const members = council?.members || []
  const slots = membersToSlots(members)
  const memberById = new Map<number, CouncilMember>(members.map((m) => [m.teacherId, m]))
  const filledSlots = MEMBER_SLOT_KEYS.filter((k) => slots[k] !== null)
  const [chosen, setChosen] = useState<MemberSlotKey | null>(filledSlots[0] ?? null)

  if (!council || !incoming) return null
  const chosenMember = chosen && slots[chosen] !== null ? memberById.get(slots[chosen]!) : undefined

  return (
    <DialogContent className="max-w-[540px] p-0 gap-0 overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xl max-h-[calc(100vh-48px)] flex flex-col">
      <div className="px-6 py-4 border-b border-slate-200 flex items-start gap-3 bg-slate-50/80 pr-12">
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <DialogTitle className="text-[16px] font-bold text-slate-800">
            {council.name || council.code} đã đủ 5 thành viên
          </DialogTitle>
          <p className="text-[12.5px] text-slate-500 mt-0.5">
            Chọn 1 thành viên hiện tại cần thay thế bằng giảng viên mới
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 text-left">
        <div className="space-y-1.5">
          <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wide">Người mới</div>
          <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="font-bold text-[13.5px] text-slate-800">{incoming.fullName}</div>
              <div className="text-[12px] text-slate-600 truncate">{incoming.departmentName}</div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
              Chưa gán HĐ
            </span>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <div className="text-[12.5px] font-bold text-slate-700">
            Chọn thành viên cần thay thế trong {council.name || council.code}:
          </div>
          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
            {filledSlots.map((k) => {
              const m = memberById.get(slots[k]!)
              const isSelected = chosen === k
              const badgeKey = k === 'chair' || k === 'secretary' ? k : 'member'
              return (
                <label
                  key={k}
                  className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'border-[#1565C0] bg-blue-50/60 shadow-2xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <input
                      type="radio"
                      name="replace-full-slot"
                      checked={isSelected}
                      onChange={() => setChosen(k)}
                      className="w-4 h-4 cursor-pointer accent-[#1565C0]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-[13px] text-slate-800 truncate">
                        {m?.fullName || `Giảng viên #${slots[k]}`}
                      </div>
                      <div className="text-[11.5px] text-slate-500 truncate">{m?.departmentName}</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold shrink-0 ${SLOT_BADGE[badgeKey]}`}>
                    {slotLabel(k)}
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Xem trước kết quả
          </div>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className="font-bold text-[13px] text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
              {chosenMember?.fullName || 'Chưa chọn'} {chosen ? `(${slotLabel(chosen)})` : ''}
            </span>
            <span className="text-slate-400 font-bold text-[16px]">↓</span>
            <span className="font-bold text-[13px] text-[#1565C0] bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 shadow-2xs">
              {incoming.fullName}
            </span>
          </div>
        </div>
      </div>

      <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/70 flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="h-9 px-4 rounded-lg bg-white border border-slate-300 text-slate-700 text-[13px] font-semibold hover:bg-slate-50"
        >
          Hủy
        </Button>
        <Button
          type="button"
          disabled={!chosen || isPending}
          onClick={() => chosen && onConfirm(chosen)}
          className="h-9 px-4 rounded-lg bg-[#1565C0] text-white text-[13px] font-semibold hover:bg-[#0D47A1] shadow-sm"
        >
          {isPending ? 'Đang lưu...' : 'Thay thế'}
        </Button>
      </div>
    </DialogContent>
  )
}
