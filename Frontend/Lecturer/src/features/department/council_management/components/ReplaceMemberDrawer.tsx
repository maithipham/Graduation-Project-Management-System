import { useEffect, useMemo, useState } from 'react'
import { ArrowLeftRight, Check, Search, X } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import type { CandidateTeacher, CouncilMember, DefenseCouncil } from '../types'
import { slotLabel, type MemberSlotKey } from '../utils/councilFormatters'
import { matchTeacherScope, type TeacherScopeFilter, TEACHER_SCOPE_OPTIONS } from '../utils/teacherScope'

interface ReplaceMemberDrawerProps {
  council: DefenseCouncil
  slot: MemberSlotKey
  current: CouncilMember | null
  teachers: CandidateTeacher[]
  /** teacherId → tên hội đồng đang tham gia */
  busyMap: Map<number, string>
  isPending?: boolean
  onClose: () => void
  onConfirm: (teacherId: number) => void
}

/** Drawer bên phải: thay thế (hoặc gán) 1 vị trí trong hội đồng */
export function ReplaceMemberDrawer({
  council,
  slot,
  current,
  teachers,
  busyMap,
  isPending,
  onClose,
  onConfirm,
}: ReplaceMemberDrawerProps) {
  const [search, setSearch] = useState('')
  const [scope, setScope] = useState<TeacherScopeFilter>('ALL')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const isAssignNew = !current
  const roleName = slotLabel(slot)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const councilMemberIds = useMemo(
    () => new Set((council.members || []).map((m) => m.teacherId)),
    [council.members],
  )

  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase()
    return teachers.filter((t) => {
      if (councilMemberIds.has(t.teacherId)) return false
      if (!matchTeacherScope(t, scope)) return false
      if (!q) return true
      return (
        t.fullName.toLowerCase().includes(q) || (t.departmentName || '').toLowerCase().includes(q)
      )
    })
  }, [teachers, councilMemberIds, scope, search])

  const selected = teachers.find((t) => t.teacherId === selectedId)

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="replace-member-title"
        className="w-full max-w-[460px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
      >
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1565C0] flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 id="replace-member-title" className="text-[15px] font-bold text-slate-800">
                {isAssignNew ? `Gán ${roleName}` : 'Thay thế thành viên'}
              </h3>
              <p className="text-[12px] text-slate-500">Hội đồng: {council.name || council.code}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="space-y-2">
            <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wide">
              {isAssignNew ? 'Vị trí cần gán' : 'Thành viên hiện tại'}
            </div>
            <div
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                isAssignNew ? 'border-dashed border-slate-300 bg-slate-50/70' : 'border-blue-200 bg-blue-50/50'
              }`}
            >
              <div className="min-w-0 flex-1">
                {isAssignNew ? (
                  <>
                    <div className="font-bold text-[13.5px] text-slate-700">{roleName} (còn trống)</div>
                    <div className="text-[12px] text-slate-500">Chưa có giảng viên đảm nhiệm</div>
                  </>
                ) : (
                  <>
                    <div className="font-bold text-[13.5px] text-slate-800 truncate">{current.fullName}</div>
                    <div className="text-[12px] text-slate-600 truncate">{current.departmentName}</div>
                  </>
                )}
              </div>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-white text-[#1565C0] border border-blue-200 shrink-0">
                {roleName}
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <label htmlFor="replace-member-search" className="text-[12.5px] font-bold text-slate-700 block">
              {isAssignNew ? 'Chọn giảng viên' : 'Tìm người thay thế'}
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                id="replace-member-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên, bộ môn giảng viên..."
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50/50 text-[13px] focus:outline-none focus:border-[#1565C0] focus:bg-white transition"
              />
            </div>
            <div className="inline-flex rounded-lg bg-slate-200/70 p-0.5 gap-0.5 text-[11.5px] font-semibold w-full">
              {TEACHER_SCOPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setScope(opt.value)}
                  className={`flex-1 h-7 rounded text-center transition cursor-pointer ${
                    scope === opt.value
                      ? 'bg-white text-[#1565C0] font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-[12px] font-semibold text-slate-500">
              Giảng viên khả dụng ({candidates.length})
            </div>
            <div className="max-h-[380px] overflow-y-auto space-y-1.5 pr-1">
              {candidates.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-[12.5px]">
                  Không tìm thấy giảng viên phù hợp
                </div>
              ) : (
                candidates.map((t) => {
                  const busyIn = busyMap.get(t.teacherId)
                  const isSelected = selectedId === t.teacherId
                  return (
                    <button
                      key={t.teacherId}
                      type="button"
                      onClick={() => setSelectedId(t.teacherId)}
                      className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'border-[#1565C0] bg-blue-50/80 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-[13px] text-slate-800 truncate">{t.fullName}</div>
                        <div className="text-[11.5px] text-slate-500 truncate">
                          {t.departmentName}
                          {busyIn && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10.5px] font-semibold bg-blue-50 text-[#1565C0] border border-blue-200">
                              HĐ: {busyIn}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        {isSelected ? (
                          <span className="w-6 h-6 rounded-full bg-[#1565C0] text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="text-[12px] text-slate-400 font-medium">Chọn</span>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/90 shrink-0">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {isAssignNew ? 'Xem trước phân công' : 'Xem trước thay thế'}
            </div>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <span className="font-bold text-[13px] text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                {isAssignNew ? `${roleName} (còn trống)` : current.fullName}
              </span>
              <span className="text-slate-400 font-bold text-[16px]">↓</span>
              <span
                className={`font-bold text-[13px] px-3 py-1.5 rounded-lg border shadow-2xs ${
                  selected
                    ? 'text-[#1565C0] bg-blue-50 border-[#1565C0]/40'
                    : 'text-slate-400 bg-white border-dashed border-slate-300'
                }`}
              >
                {selected ? selected.fullName : 'Chọn giảng viên...'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-end gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-9 px-4 rounded-lg bg-white border border-slate-300 text-slate-700 text-[13px] font-semibold hover:bg-slate-50"
          >
            Hủy
          </Button>
          <Button
            type="button"
            disabled={selectedId === null || isPending}
            onClick={() => selectedId !== null && onConfirm(selectedId)}
            className="h-9 px-4 rounded-lg bg-[#1565C0] text-white text-[13px] font-semibold hover:bg-[#0D47A1] shadow-sm"
          >
            {isPending ? 'Đang lưu...' : isAssignNew ? 'Gán vào HĐ' : 'Thay thế'}
          </Button>
        </div>
      </div>
    </div>
  )
}
