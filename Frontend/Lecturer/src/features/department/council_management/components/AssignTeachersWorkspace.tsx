import { useState, useEffect, useMemo } from 'react'
import { Search, Check, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { useDebounce } from '@/shared/hooks'
import { toast } from '@/shared/components/feedback/toast.store'
import type { DefenseCouncil, CouncilRole, TeacherScope } from '../types'
import { useCandidateTeachers, useUpdateCouncilMembers } from '../hooks/useDefenseCouncils'

interface AssignTeachersWorkspaceProps {
  semesterId: number | string
  majorId: number | string
  councils: DefenseCouncil[]
  selectedCouncilId: string
  onSelectCouncil: (councilId: string) => void
}

export function AssignTeachersWorkspace({
  semesterId,
  majorId,
  councils,
  selectedCouncilId,
  onSelectCouncil,
}: AssignTeachersWorkspaceProps) {
  const [subTab, setSubTab] = useState<'unassigned' | 'assigned'>('unassigned')
  const [scope, setScope] = useState<TeacherScope>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedKeyword = useDebounce(searchTerm.trim(), 350)

  // Draft members map for current council: teacherId => CouncilRole
  const [draftMembers, setDraftMembers] = useState<Map<number, CouncilRole>>(new Map())

  const updateMembersMutation = useUpdateCouncilMembers()

  const activeCouncil = useMemo(
    () => councils.find((c) => c.publicId === selectedCouncilId) || councils[0],
    [councils, selectedCouncilId],
  )

  // Sync draftMembers whenever activeCouncil changes
  useEffect(() => {
    if (activeCouncil) {
      const map = new Map<number, CouncilRole>()
      ;(activeCouncil.members || []).forEach((m) => {
        map.set(m.teacherId, m.role)
      })
      setDraftMembers(map)
    }
  }, [activeCouncil])

  // Query candidate teachers
  const { data: teachers = [], isPending: teachersLoading } = useCandidateTeachers(
    {
      semesterId,
      majorId,
      scope,
      assignedOnly: subTab === 'assigned',
      keyword: debouncedKeyword,
    },
    Boolean(semesterId && majorId),
  )

  // Calculations for limits
  const draftRoles = Array.from(draftMembers.values())
  const hasChairperson = draftRoles.includes('CHAIRPERSON')
  const hasSecretary = draftRoles.includes('SECRETARY')
  const memberCount = draftRoles.filter((r) => r === 'COUNCIL_MEMBER').length
  const totalCount = draftMembers.size

  // Handle role click
  const handleRoleClick = (teacherId: number, role: CouncilRole) => {
    if (!activeCouncil) return

    setDraftMembers((prev) => {
      const next = new Map(prev)
      const currentRole = next.get(teacherId)

      // Toggle off if already has this role
      if (currentRole === role) {
        next.delete(teacherId)
        return next
      }

      // Check limits
      const isNew = !currentRole
      if (isNew && next.size >= 5) {
        toast.warning('Hội đồng đã đủ tối đa 5 thành viên!')
        return prev
      }

      if (role === 'CHAIRPERSON' && hasChairperson && currentRole !== 'CHAIRPERSON') {
        toast.warning('Hội đồng đã có 1 Chủ tịch!')
        return prev
      }

      if (role === 'SECRETARY' && hasSecretary && currentRole !== 'SECRETARY') {
        toast.warning('Hội đồng đã có 1 Thư ký!')
        return prev
      }

      if (role === 'COUNCIL_MEMBER' && memberCount >= 3 && currentRole !== 'COUNCIL_MEMBER') {
        toast.warning('Hội đồng đã đủ tối đa 3 Ủy viên!')
        return prev
      }

      next.set(teacherId, role)
      return next
    })
  }

  // Handle checkbox change
  const handleCheckboxChange = (teacherId: number, checked: boolean) => {
    if (!activeCouncil) return

    setDraftMembers((prev) => {
      const next = new Map(prev)
      if (!checked) {
        next.delete(teacherId)
        return next
      }

      // Auto assign first available role
      if (next.size >= 5) {
        toast.warning('Hội đồng đã đủ tối đa 5 thành viên!')
        return prev
      }

      const roles = Array.from(next.values())
      if (!roles.includes('CHAIRPERSON')) {
        next.set(teacherId, 'CHAIRPERSON')
      } else if (!roles.includes('SECRETARY')) {
        next.set(teacherId, 'SECRETARY')
      } else {
        const mCount = roles.filter((r) => r === 'COUNCIL_MEMBER').length
        if (mCount < 3) {
          next.set(teacherId, 'COUNCIL_MEMBER')
        } else {
          toast.warning('Hội đồng đã đủ 5 thành viên quy chuẩn!')
          return prev
        }
      }
      return next
    })
  }

  // Check all top teachers
  const handleCheckAll = (checked: boolean) => {
    if (!activeCouncil) return

    if (!checked) {
      setDraftMembers(new Map())
      return
    }

    const next = new Map<number, CouncilRole>()
    const topTeachers = teachers.slice(0, 5)
    topTeachers.forEach((t, i) => {
      if (i === 0) next.set(t.teacherId, 'CHAIRPERSON')
      else if (i === 1) next.set(t.teacherId, 'SECRETARY')
      else next.set(t.teacherId, 'COUNCIL_MEMBER')
    })
    setDraftMembers(next)
    toast.info(`Đã gán nhanh ${topTeachers.length} giảng viên vào hội đồng.`)
  }

  const handleSaveMembers = () => {
    if (!activeCouncil) return

    const membersPayload = Array.from(draftMembers.entries()).map(([teacherId, role]) => ({
      teacherId,
      role,
    }))

    updateMembersMutation.mutate({
      councilPublicId: activeCouncil.publicId,
      data: { members: membersPayload },
    })
  }

  const isAllChecked =
    teachers.length > 0 &&
    teachers.slice(0, 5).every((t) => draftMembers.has(t.teacherId)) &&
    draftMembers.size > 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
      {/* CỘT TRÁI: DANH SÁCH GIẢNG VIÊN (8 CỘT) */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col min-h-[560px]">
        {/* Sub-tabs + Filter pills */}
        <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 space-y-3">
          {/* Sub-tab: Chưa gán HĐ / Đã gán HĐ */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="grid grid-cols-2 bg-slate-200/70 p-1 rounded-xl gap-1 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setSubTab('unassigned')}
                className={`h-8 px-4 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  subTab === 'unassigned'
                    ? 'bg-white text-[#1565C0] font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                <span>Chưa gán HĐ</span>
              </button>
              <button
                type="button"
                onClick={() => setSubTab('assigned')}
                className={`h-8 px-4 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  subTab === 'assigned'
                    ? 'bg-white text-[#1565C0] font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                <span>Đã gán HĐ</span>
              </button>
            </div>

            {/* Check all */}
            {subTab === 'unassigned' && (
              <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700 hover:text-[#1565C0]">
                <span>Tích tất cả (Gán nhanh 5 TV)</span>
                <input
                  type="checkbox"
                  checked={isAllChecked}
                  onChange={(e) => handleCheckAll(e.target.checked)}
                  className="w-4 h-4 cursor-pointer rounded border-slate-300 text-[#1565C0]"
                />
              </label>
            )}
          </div>

          {/* Scope Pills + Search input */}
          <div className="flex items-center justify-between gap-3 flex-wrap pt-0.5">
            <div className="inline-flex rounded-lg bg-slate-200/70 p-1 gap-1 text-xs font-semibold shrink-0">
              <button
                type="button"
                onClick={() => setScope('ALL')}
                className={`h-7 px-2.5 rounded-md inline-flex items-center transition cursor-pointer ${
                  scope === 'ALL'
                    ? 'bg-white text-[#1565C0] font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setScope('IN_MAJOR')}
                className={`h-7 px-2.5 rounded-md inline-flex items-center transition cursor-pointer ${
                  scope === 'IN_MAJOR'
                    ? 'bg-white text-[#1565C0] font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                Trong bộ môn
              </button>
              <button
                type="button"
                onClick={() => setScope('OUT_MAJOR')}
                className={`h-7 px-2.5 rounded-md inline-flex items-center transition cursor-pointer ${
                  scope === 'OUT_MAJOR'
                    ? 'bg-white text-[#1565C0] font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                Ngoài bộ môn
              </button>
              <button
                type="button"
                onClick={() => setScope('EXTERNAL')}
                className={`h-7 px-2.5 rounded-md inline-flex items-center transition cursor-pointer ${
                  scope === 'EXTERNAL'
                    ? 'bg-white text-[#1565C0] font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                Ngoài trường
              </button>
            </div>

            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm giảng viên..."
                className="w-full h-8 pl-8 pr-2.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#1565C0] bg-white transition"
              />
            </div>
          </div>
        </div>

        {/* Rule hint banner */}
        <div className="px-4 py-2 bg-blue-50/70 border-b border-blue-200/60 text-[11.5px] text-[#0D47A1] flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>
              Quy chuẩn 5 TV: <strong>1 Chủ tịch</strong>, <strong>1 Thư ký</strong>, tối đa{' '}
              <strong>3 Ủy viên</strong>.
            </span>
          </span>
          <span className="text-slate-500 text-[11px]">Tự động disable vai trò khi đã đủ số lượng</span>
        </div>

        {/* Teachers List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[580px]">
          {teachersLoading ? (
            <div className="py-16 text-center text-xs text-slate-400 font-semibold">
              <div className="w-5 h-5 border-2 border-[#1565C0] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>Đang tải danh sách giảng viên...</span>
            </div>
          ) : teachers.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              Không tìm thấy giảng viên nào phù hợp bộ lọc.
            </div>
          ) : (
            teachers.map((t) => {
              const assignedRole = draftMembers.get(t.teacherId)
              const isChecked = Boolean(assignedRole)
              const isOtherCouncil =
                t.assignedCouncilName &&
                activeCouncil &&
                t.assignedCouncilName !== activeCouncil.code

              // Limit disable rules
              const disableChair = !isChecked && (hasChairperson || totalCount >= 5)
              const disableSec = !isChecked && (hasSecretary || totalCount >= 5)
              const disableMem = !isChecked && (memberCount >= 3 || totalCount >= 5)

              const roleBtnBase =
                'h-7 px-2.5 rounded-md text-[11.5px] font-semibold transition whitespace-nowrap'

              return (
                <div
                  key={t.teacherId}
                  className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap ${
                    isChecked
                      ? 'border-[#1565C0]/60 bg-blue-50/40 shadow-2xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <label
                    htmlFor={`lec-chk-${t.teacherId}`}
                    className="min-w-0 flex-1 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[13px] text-slate-800">{t.fullName}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-600 font-medium">
                        {t.academicTitle || 'GV'} • {t.departmentName}
                      </span>
                      {t.scope === 'IN_MAJOR' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Trong bộ môn
                        </span>
                      )}
                      {t.scope === 'OUT_MAJOR' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Ngoài bộ môn
                        </span>
                      )}
                      {t.scope === 'EXTERNAL' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          Ngoài trường
                        </span>
                      )}
                    </div>
                    {isOtherCouncil && (
                      <div className="mt-1 text-[11px] font-medium text-amber-700">
                        Đang thuộc hội đồng: <strong>{t.assignedCouncilName}</strong>
                      </div>
                    )}
                  </label>

                  {/* 3 Role buttons + Checkbox */}
                  <div className="flex items-center gap-2 shrink-0 ml-auto">
                    <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 gap-0.5">
                      <button
                        type="button"
                        onClick={() => handleRoleClick(t.teacherId, 'CHAIRPERSON')}
                        disabled={disableChair && assignedRole !== 'CHAIRPERSON'}
                        className={`${roleBtnBase} ${
                          assignedRole === 'CHAIRPERSON'
                            ? 'bg-[#1565C0] text-white shadow-xs'
                            : disableChair
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-slate-600 hover:text-[#1565C0] hover:bg-white cursor-pointer'
                        }`}
                        title="Chủ tịch (Tối đa 1)"
                      >
                        Chủ tịch
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRoleClick(t.teacherId, 'SECRETARY')}
                        disabled={disableSec && assignedRole !== 'SECRETARY'}
                        className={`${roleBtnBase} ${
                          assignedRole === 'SECRETARY'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : disableSec
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-slate-600 hover:text-purple-700 hover:bg-white cursor-pointer'
                        }`}
                        title="Thư ký (Tối đa 1)"
                      >
                        Thư ký
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRoleClick(t.teacherId, 'COUNCIL_MEMBER')}
                        disabled={disableMem && assignedRole !== 'COUNCIL_MEMBER'}
                        className={`${roleBtnBase} ${
                          assignedRole === 'COUNCIL_MEMBER'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : disableMem
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-slate-600 hover:text-emerald-700 hover:bg-white cursor-pointer'
                        }`}
                        title="Ủy viên (Tối đa 3)"
                      >
                        Ủy viên
                      </button>
                    </div>

                    <input
                      id={`lec-chk-${t.teacherId}`}
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => handleCheckboxChange(t.teacherId, e.target.checked)}
                      className="w-4 h-4 cursor-pointer rounded border-slate-300 text-[#1565C0]"
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* CỘT PHẢI: DANH SÁCH HỘI ĐỒNG (4 CỘT) */}
      <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col min-h-[560px]">
        <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2 shrink-0">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Danh sách hội đồng
          </div>

          <Button
            type="button"
            size="sm"
            onClick={handleSaveMembers}
            disabled={!activeCouncil || updateMembersMutation.isPending}
            className="h-8 px-3 rounded-lg bg-[#1565C0] text-white text-xs font-semibold hover:bg-[#0D47A1] inline-flex items-center gap-1.5 shrink-0"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Gán ({draftMembers.size}/5)</span>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[580px]">
          {councils.map((c) => {
            const isSel = c.publicId === activeCouncil?.publicId
            const cnt = (c.members || []).length
            const isFull = cnt >= 5

            return (
              <div
                key={c.publicId}
                onClick={() => onSelectCouncil(c.publicId)}
                className={`p-3.5 rounded-xl border-2 transition cursor-pointer select-none ${
                  isSel
                    ? 'border-[#1565C0] bg-blue-50/40 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-[#1565C0]/60 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span
                    className={`font-bold text-sm truncate ${
                      isSel ? 'text-[#0D47A1]' : 'text-slate-800'
                    }`}
                  >
                    {c.code} — {c.name || `Hội đồng ${c.code}`}
                  </span>
                  {isFull ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      5/5 TV
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      {cnt}/5 TV
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{c.location || 'Chưa xếp phòng'}</span>
                  <span>•</span>
                  <span>{c.studentCount} SV</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
