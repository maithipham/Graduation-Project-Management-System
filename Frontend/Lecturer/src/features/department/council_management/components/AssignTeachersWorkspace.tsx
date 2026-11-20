import { useState, useEffect, useMemo } from 'react'
import { Search, Check, AlertCircle, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { useDebounce } from '@/shared/hooks'
import { toast } from '@/shared/components/feedback/toast.store'
import type { DefenseCouncil, CouncilRole, TeacherScope } from '../types'
import { useCandidateTeachers, useUpdateCouncilMembers } from '../hooks/useDefenseCouncils'
import { ROLE_CONFIG } from '../utils/councilFormatters'

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
  // State phục vụ thay thế thành viên khi hội đồng PUBLISHED
  const [replacingTeacherId, setReplacingTeacherId] = useState<number | null>(null)

  const updateMembersMutation = useUpdateCouncilMembers()

  const activeCouncil = useMemo(
    () => councils.find((c) => c.publicId === selectedCouncilId) || councils[0],
    [councils, selectedCouncilId],
  )

  const isPublished = activeCouncil?.status === 'PUBLISHED'

  // Sync draftMembers whenever activeCouncil changes
  useEffect(() => {
    if (activeCouncil) {
      const map = new Map<number, CouncilRole>()
        ; (activeCouncil.members || []).forEach((m) => {
          map.set(m.teacherId, m.role)
        })
      setDraftMembers(map)
      setReplacingTeacherId(null)
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

  // Helper to replace a member
  const performReplace = (oldTeacherId: number, newTeacherId: number, role: CouncilRole) => {
    setDraftMembers((prev) => {
      const next = new Map(prev)
      next.delete(oldTeacherId)
      next.set(newTeacherId, role)
      return next
    })
    setReplacingTeacherId(null)
    const target = teachers.find((t) => t.teacherId === newTeacherId)
    toast.success(`Đã thay thế vị trí ${ROLE_CONFIG[role].label} bằng ${target?.fullName || 'giảng viên mới'}!`)
  }

  // Handle role click
  const handleRoleClick = (teacherId: number, role: CouncilRole) => {
    if (!activeCouncil) return

    // Đang ở chế độ thay thế 1 thành viên cụ thể
    if (replacingTeacherId && replacingTeacherId !== teacherId) {
      const oldRole = draftMembers.get(replacingTeacherId)
      if (oldRole) {
        performReplace(replacingTeacherId, teacherId, oldRole)
        return
      }
    }

    setDraftMembers((prev) => {
      const next = new Map(prev)
      const currentRole = next.get(teacherId)

      // Toggle off if already has this role
      if (currentRole === role) {
        // Nghiệp vụ 3115: Hội đồng đã công bố không cho xóa trống một vị trí
        if (isPublished) {
          toast.warning(
            'Hội đồng đã công bố không được để trống vị trí. Bạn chỉ có thể chọn giảng viên khác để thay thế.',
          )
          return prev
        }
        next.delete(teacherId)
        return next
      }

      // Khi hội đồng đã PUBLISHED: Cho phép thay thế trực tiếp
      if (isPublished) {
        if (role === 'CHAIRPERSON' && hasChairperson && currentRole !== 'CHAIRPERSON') {
          // Thay thế Chủ tịch hiện tại
          for (const [id, r] of next.entries()) {
            if (r === 'CHAIRPERSON') {
              next.delete(id)
              break
            }
          }
          next.set(teacherId, 'CHAIRPERSON')
          toast.info('Đã thay thế vị trí Chủ tịch.')
          return next
        }

        if (role === 'SECRETARY' && hasSecretary && currentRole !== 'SECRETARY') {
          // Thay thế Thư ký hiện tại
          for (const [id, r] of next.entries()) {
            if (r === 'SECRETARY') {
              next.delete(id)
              break
            }
          }
          next.set(teacherId, 'SECRETARY')
          toast.info('Đã thay thế vị trí Thư ký.')
          return next
        }

        if (role === 'COUNCIL_MEMBER' && memberCount >= 3 && currentRole !== 'COUNCIL_MEMBER') {
          toast.info(
            'Vui lòng bấm nút "Thay thế" bên cạnh Ủy viên bạn muốn đổi ở danh sách thành viên bên phải.',
          )
          return prev
        }

        if (!currentRole && next.size >= 5) {
          toast.warning(
            'Hội đồng đã công bố có đủ 5 thành viên. Vui lòng bấm "Thay thế" ở danh sách bên phải để đổi giảng viên.',
          )
          return prev
        }
      }

      // Check limits cho hội đồng bình thường (DRAFT)
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

    if (replacingTeacherId && replacingTeacherId !== teacherId && checked) {
      const oldRole = draftMembers.get(replacingTeacherId)
      if (oldRole) {
        performReplace(replacingTeacherId, teacherId, oldRole)
        return
      }
    }

    setDraftMembers((prev) => {
      const next = new Map(prev)
      if (!checked) {
        // Nghiệp vụ 3115: Hội đồng đã công bố không cho xóa trống một vị trí
        if (isPublished) {
          toast.warning(
            'Hội đồng đã công bố không được để trống vị trí. Bạn chỉ có thể chọn giảng viên khác để thay thế.',
          )
          return prev
        }
        next.delete(teacherId)
        return next
      }

      if (isPublished && next.size >= 5) {
        toast.warning(
          'Hội đồng đã công bố có đủ 5 thành viên. Vui lòng bấm "Thay thế" ở danh sách bên phải để đổi giảng viên.',
        )
        return prev
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
      if (isPublished) {
        toast.warning('Hội đồng đã công bố không thể xóa trống vị trí.')
        return
      }
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

    const roles = Array.from(draftMembers.values())
    const chairCount = roles.filter((r) => r === 'CHAIRPERSON').length
    const secCount = roles.filter((r) => r === 'SECRETARY').length
    const memCount = roles.filter((r) => r === 'COUNCIL_MEMBER').length

    // Nghiệp vụ 3115: Hội đồng đã công bố chỉ được thay thế thành viên, phải gửi đủ 5 người (1 CT, 1 TK, 3 UV)
    if (isPublished) {
      if (draftMembers.size !== 5 || chairCount !== 1 || secCount !== 1 || memCount !== 3) {
        toast.warning(
          'Hội đồng đã công bố chỉ được thay thế thành viên, phải gửi đủ 5 người (1 CHAIRPERSON, 1 SECRETARY, 3 COUNCIL_MEMBER).',
        )
        return
      }
    }

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

  const isSaveDisabled =
    !activeCouncil ||
    updateMembersMutation.isPending ||
    (isPublished && (draftMembers.size !== 5 || !hasChairperson || !hasSecretary || memberCount !== 3))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
      {/* CỘT TRÁI: DANH SÁCH GIẢNG VIÊN (8 CỘT) */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col min-h-[560px]">
        {/* Banner thay thế nếu đang chọn */}
        {replacingTeacherId && (
          <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-amber-600 animate-spin" />
              <span>
                Đang thay thế vị trí{' '}
                <strong className="text-amber-800">
                  {ROLE_CONFIG[draftMembers.get(replacingTeacherId) || 'COUNCIL_MEMBER']?.label}
                </strong>
                . Hãy click vào giảng viên bên dưới để chọn thay thế.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setReplacingTeacherId(null)}
              className="px-2.5 py-1 bg-white border border-amber-300 rounded-md text-[11px] font-bold text-amber-800 hover:bg-amber-100 cursor-pointer shadow-2xs"
            >
              Hủy thay thế
            </button>
          </div>
        )}

        {/* Sub-tabs + Filter pills */}
        <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 space-y-3">
          {/* Sub-tab: Chưa gán HĐ / Đã gán HĐ */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="grid grid-cols-2 bg-slate-200/70 p-1 rounded-xl gap-1 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setSubTab('unassigned')}
                className={`h-8 px-4 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition cursor-pointer ${subTab === 'unassigned'
                    ? 'bg-white text-[#1565C0] font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
              >
                <span>Chưa gán HĐ</span>
              </button>
              <button
                type="button"
                onClick={() => setSubTab('assigned')}
                className={`h-8 px-4 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition cursor-pointer ${subTab === 'assigned'
                    ? 'bg-white text-[#1565C0] font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
              >
                <span>Đã gán HĐ</span>
              </button>
            </div>

            {/* Check all */}
            {subTab === 'unassigned' && !isPublished && (
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
                className={`h-7 px-2.5 rounded-md inline-flex items-center transition cursor-pointer ${scope === 'ALL'
                    ? 'bg-white text-[#1565C0] font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setScope('IN_MAJOR')}
                className={`h-7 px-2.5 rounded-md inline-flex items-center transition cursor-pointer ${scope === 'IN_MAJOR'
                    ? 'bg-white text-[#1565C0] font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
              >
                Trong bộ môn
              </button>
              <button
                type="button"
                onClick={() => setScope('OUT_MAJOR')}
                className={`h-7 px-2.5 rounded-md inline-flex items-center transition cursor-pointer ${scope === 'OUT_MAJOR'
                    ? 'bg-white text-[#1565C0] font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
              >
                Ngoài bộ môn
              </button>
              <button
                type="button"
                onClick={() => setScope('EXTERNAL')}
                className={`h-7 px-2.5 rounded-md inline-flex items-center transition cursor-pointer ${scope === 'EXTERNAL'
                    ? 'bg-white text-[#1565C0] font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
              >
                Ngoài trường
              </button>
            </div>

            {/* Search */}
            <div className="relative flex-1 sm:w-64 sm:flex-initial">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tên, bộ môn..."
                className="w-full h-8 pl-8 pr-3 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="px-3.5 py-2 bg-blue-50/50 border-b border-blue-100/60 flex items-center justify-between text-xs font-semibold text-[#1565C0] flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            <span>
              Quy chuẩn 5 thành viên:{' '}
              <strong className={hasChairperson ? 'text-emerald-700' : 'text-slate-500'}>
                1 Chủ tịch
              </strong>{' '}
              •{' '}
              <strong className={hasSecretary ? 'text-emerald-700' : 'text-slate-500'}>
                1 Thư ký
              </strong>{' '}
              •{' '}
              <strong className={memberCount === 3 ? 'text-emerald-700' : 'text-slate-500'}>
                {memberCount}/3 Ủy viên
              </strong>
            </span>
          </span>
          {isPublished && (
            <span className="text-amber-700 font-semibold text-[11px] bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200">
              Hội đồng đã công bố: chỉ được thay thế thành viên
            </span>
          )}
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

              // Limit disable rules: Cho phép click thay thế nếu đang chọn replacingTeacherId hoặc council đã PUBLISHED
              const disableChair =
                !isChecked && !isPublished && (hasChairperson || totalCount >= 5)
              const disableSec =
                !isChecked && !isPublished && (hasSecretary || totalCount >= 5)
              const disableMem =
                !isChecked &&
                !isPublished &&
                (memberCount >= 3 || totalCount >= 5) &&
                (!replacingTeacherId || draftMembers.get(replacingTeacherId) !== 'COUNCIL_MEMBER')

              const roleBtnBase =
                'h-7 px-2.5 rounded-md text-[11.5px] font-semibold transition whitespace-nowrap'

              return (
                <div
                  key={t.teacherId}
                  className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap ${isChecked
                      ? 'border-[#1565C0]/60 bg-blue-50/40 shadow-2xs'
                      : replacingTeacherId
                        ? 'border-amber-300 bg-amber-50/30 hover:border-amber-400 hover:bg-amber-50/60'
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
                        className={`${roleBtnBase} ${assignedRole === 'CHAIRPERSON'
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
                        className={`${roleBtnBase} ${assignedRole === 'SECRETARY'
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
                        className={`${roleBtnBase} ${assignedRole === 'COUNCIL_MEMBER'
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
            disabled={isSaveDisabled}
            title={
              isPublished && draftMembers.size !== 5
                ? 'Hội đồng đã công bố yêu cầu đủ 5 thành viên (1 Chủ tịch, 1 Thư ký, 3 Ủy viên)'
                : undefined
            }
            className="h-8 px-3 rounded-lg bg-[#1565C0] text-white text-xs font-semibold hover:bg-[#0D47A1] inline-flex items-center gap-1.5 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Gán ({draftMembers.size}/5)</span>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[580px]">
          {councils.map((c) => {
            const isSel = c.publicId === activeCouncil?.publicId
            const cnt = isSel ? draftMembers.size : (c.members || []).length
            const isFull = cnt >= 5
            const councilIsPublished = c.status === 'PUBLISHED'

            return (
              <div
                key={c.publicId}
                onClick={() => onSelectCouncil(c.publicId)}
                className={`p-3.5 rounded-xl border-2 transition cursor-pointer select-none ${isSel
                    ? 'border-[#1565C0] bg-blue-50/40 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-[#1565C0]/60 hover:bg-slate-50/60'
                  }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span
                    className={`font-bold text-sm truncate ${isSel ? 'text-[#0D47A1]' : 'text-slate-800'
                      }`}
                  >
                    {c.code} — {c.name || c.code}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {councilIsPublished && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ĐÃ CÔNG BỐ
                      </span>
                    )}
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
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{c.location || 'Chưa xếp phòng'}</span>
                  <span>•</span>
                  <span>{c.studentCount} SV</span>
                </div>

                {/* Danh sách thành viên chi tiết cho hội đồng đang chọn */}
                {isSel && draftMembers.size > 0 && (
                  <div
                    className="mt-3 pt-2.5 border-t border-blue-200/60 space-y-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                      <span>Thành viên hiện tại</span>
                      {councilIsPublished && (
                        <span className="text-[10px] font-medium text-slate-500">
                          Bấm "Thay thế" để đổi GV
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {Array.from(draftMembers.entries()).map(([tId, role]) => {
                        const memInfo =
                          activeCouncil.members?.find((m) => m.teacherId === tId) ||
                          teachers.find((t) => t.teacherId === tId)
                        const isReplacing = replacingTeacherId === tId
                        const roleCfg = ROLE_CONFIG[role] || {
                          label: role,
                          badgeClass: 'bg-slate-100 text-slate-700',
                        }

                        return (
                          <div
                            key={tId}
                            className={`p-1.5 rounded-lg border text-xs flex items-center justify-between gap-1.5 ${isReplacing
                                ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200'
                                : 'bg-white/80 border-slate-200'
                              }`}
                          >
                            <div className="min-w-0 flex-1 truncate">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border mr-1.5 ${roleCfg.badgeClass}`}
                              >
                                {roleCfg.label}
                              </span>
                              <span className="font-semibold text-slate-800 text-[11.5px]">
                                {memInfo?.fullName || `Giảng viên #${tId}`}
                              </span>
                            </div>
                            {councilIsPublished && (
                              <button
                                type="button"
                                onClick={() =>
                                  setReplacingTeacherId(isReplacing ? null : tId)
                                }
                                className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition shrink-0 cursor-pointer ${isReplacing
                                    ? 'bg-amber-600 text-white shadow-2xs'
                                    : 'bg-slate-100 hover:bg-[#1565C0] hover:text-white text-slate-700 border border-slate-200'
                                  }`}
                              >
                                {isReplacing ? 'Hủy' : 'Thay thế'}
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
