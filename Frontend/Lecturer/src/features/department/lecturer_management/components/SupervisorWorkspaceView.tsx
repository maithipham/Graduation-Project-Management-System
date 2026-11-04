import { useState, useMemo, useEffect } from 'react'
import {
  ArrowLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit3,
  Lock,
  Unlock,
  Plus,
  Search,
  X,
  AlertTriangle,
} from 'lucide-react'
import { toast } from '@/shared/components/feedback'
import { cn } from '@/shared/utils/cn'
import type { SemesterOption } from '@/features/department/student_management'
import type { SupervisorLecturer, SupervisorStudent } from '../types'

interface SupervisorWorkspaceViewProps {
  lecturers: SupervisorLecturer[]
  students: SupervisorStudent[]
  year: string
  semesterName: string
  selectedSemesterId?: string
  academicYears?: string[]
  termsOfYear?: SemesterOption[]
  onYearChange?: (year: string) => void
  onSemesterChange?: (semesterId: string) => void
  isLocked: boolean
  lockedAt?: string | null
  lockedByName?: string | null
  counts?: { received: number; unassigned: number; approved: number }
  isLoading?: boolean
  onBack: () => void
  onAssignStudents: (studentIds: string[], supervisor: SupervisorLecturer) => void
  onApproveRegistrations: (registrationPublicIds: string[]) => void
  onRejectRegistrations: (registrationPublicIds: string[]) => void
  onChangeSupervisor: (studentId: string, newSupervisor: SupervisorLecturer) => void | Promise<void>
  onChangeCoSupervisor: (studentId: string, coSupervisor: SupervisorLecturer | null) => void
  onToggleLock: (isLocked: boolean) => void
}

export function SupervisorWorkspaceView({
  lecturers,
  students,
  year,
  semesterName,
  selectedSemesterId,
  academicYears,
  termsOfYear,
  onYearChange,
  onSemesterChange,
  isLocked: propIsLocked,
  lockedAt: propLockedAt,
  lockedByName: propLockedByName,
  counts,
  onBack,
  onAssignStudents,
  onApproveRegistrations,
  onRejectRegistrations,
  onChangeSupervisor,
  onChangeCoSupervisor,
  onToggleLock,
}: SupervisorWorkspaceViewProps) {
  // Trạng thái khóa nội bộ phản ứng tức thì (optimistic)
  const [isLocked, setIsLocked] = useState(propIsLocked)
  const [lockedAt, setLockedAt] = useState(propLockedAt)
  const [lockedByName, setLockedByName] = useState(propLockedByName)

  useEffect(() => {
    setIsLocked(propIsLocked)
  }, [propIsLocked])

  useEffect(() => {
    setLockedAt(propLockedAt)
  }, [propLockedAt])

  useEffect(() => {
    setLockedByName(propLockedByName)
  }, [propLockedByName])
  // Tabs: 1. "received" (Đã nhận GV) | 2. "unassigned" (Chưa nhận GV) | 3. "approved" (Đã phân công)
  // Mặc định chọn tab "received" nếu có đơn cần duyệt, nếu không chọn "unassigned"
  const [currentTab, setCurrentTab] = useState<'received' | 'unassigned' | 'approved'>(() => {
    if (counts && counts.received > 0) return 'received'
    if (counts && counts.unassigned > 0) return 'unassigned'
    const recCount = students.filter((s) => s.status === 'received').length
    const unCount = students.filter((s) => s.status === 'unassigned').length
    if (recCount > 0) return 'received'
    if (unCount > 0) return 'unassigned'
    return 'unassigned'
  })
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set())

  // Giảng viên bên phải: mặc định tab "internal" (Trong bộ môn) như hình ảnh mẫu
  const [selectedLecturerId, setSelectedLecturerId] = useState<string | null>(null)
  const [lecturerSearch, setLecturerSearch] = useState('')
  const [lecturerCategory, setLecturerCategory] = useState<'all' | 'internal' | 'dept_ext' | 'univ_ext'>('internal')
  const [lecturerSort, setLecturerSort] = useState<'default' | 'asc' | 'desc'>('default')

  // Modals
  const [lockModalOpen, setLockModalOpen] = useState(false)
  const [unlockModalOpen, setUnlockModalOpen] = useState(false)

  // Đối tượng sinh viên đang được chọn để gán/đổi GVHD (chọn ở bảng phải rồi nhấn Gán, không dùng popup)
  const [editingTarget, setEditingTarget] = useState<{
    student: SupervisorStudent
    slot: 1 | 2
  } | null>(null)

  // Đếm sinh viên theo 3 tab (ưu tiên prop counts từ backend, nếu không tính từ mảng students)
  const countReceived = useMemo(
    () => counts?.received ?? students.filter((s) => s.status === 'received').length,
    [counts, students],
  )
  const countUnassigned = useMemo(
    () => counts?.unassigned ?? students.filter((s) => s.status === 'unassigned').length,
    [counts, students],
  )
  const countApproved = useMemo(
    () => counts?.approved ?? students.filter((s) => s.status === 'approved').length,
    [counts, students],
  )

  // Lọc sinh viên theo tab & tìm kiếm
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (s.status !== currentTab) return false
      if (studentSearch.trim()) {
        const q = studentSearch.trim().toLowerCase()
        const mName = s.name.toLowerCase().includes(q)
        const mCode = s.code.toLowerCase().includes(q)
        const mClass = (s.className || '').toLowerCase().includes(q)
        const mTopic = (s.topic || '').toLowerCase().includes(q)
        if (!mName && !mCode && !mClass && !mTopic) return false
      }
      return true
    })
  }, [students, currentTab, studentSearch])

  // Lọc và chia danh sách giảng viên: còn chỉ tiêu & đã đủ chỉ tiêu
  const { availableLecturers, unavailableLecturers } = useMemo(() => {
    const filterLec = (list: SupervisorLecturer[]) => {
      let res = list
      if (lecturerCategory !== 'all') {
        res = res.filter((l) => l.category === lecturerCategory)
      }
      if (lecturerSearch.trim()) {
        const q = lecturerSearch.trim().toLowerCase()
        res = res.filter(
          (l) => l.name.toLowerCase().includes(q) || (l.department || '').toLowerCase().includes(q),
        )
      }
      return res
    }

    const available = filterLec(lecturers.filter((l) => (l.assigned || 0) < l.quota))
    const unavailable = filterLec(lecturers.filter((l) => (l.assigned || 0) >= l.quota))

    const sortFn = (a: SupervisorLecturer, b: SupervisorLecturer) => {
      if (lecturerSort === 'asc') {
        return (a.assigned || 0) - (b.assigned || 0) || a.name.localeCompare(b.name, 'vi')
      }
      if (lecturerSort === 'desc') {
        return (b.assigned || 0) - (a.assigned || 0) || a.name.localeCompare(b.name, 'vi')
      }
      // default: ưu tiên internal -> dept_ext -> univ_ext
      const rank: Record<string, number> = { internal: 1, dept_ext: 2, univ_ext: 3 }
      const rA = rank[a.category] || 99
      const rB = rank[b.category] || 99
      if (rA !== rB) return rA - rB
      return a.name.localeCompare(b.name, 'vi')
    }

    available.sort(sortFn)
    unavailable.sort(sortFn)

    return { availableLecturers: available, unavailableLecturers: unavailable }
  }, [lecturers, lecturerCategory, lecturerSearch, lecturerSort])

  // Tự động chọn GV khi ở tab Chưa nhận GV hoặc Đã phân công / Đang sửa
  const effectiveSelectedLecturerId = useMemo(() => {
    if (
      selectedLecturerId &&
      (availableLecturers.some((l) => l.id === selectedLecturerId) ||
        unavailableLecturers.some((l) => l.id === selectedLecturerId))
    ) {
      return selectedLecturerId
    }
    if (currentTab === 'unassigned' || currentTab === 'approved' || editingTarget !== null) {
      return availableLecturers.length > 0 ? availableLecturers[0].id : null
    }
    return null
  }, [currentTab, selectedLecturerId, availableLecturers, unavailableLecturers, editingTarget])

  const selectedLecturer = useMemo(() => {
    return lecturers.find((l) => l.id === effectiveSelectedLecturerId) || null
  }, [lecturers, effectiveSelectedLecturerId])

  // Checkbox toggle sinh viên
  const toggleSelectStudent = (id: string) => {
    if (isLocked) return
    setSelectedStudentIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAllStudents = () => {
    if (isLocked) return
    const currentTabIds = filteredStudents.map((s) => s.id)
    const isAllSelected =
      currentTabIds.length > 0 && currentTabIds.every((id) => selectedStudentIds.has(id))
    setSelectedStudentIds((prev) => {
      const next = new Set(prev)
      if (isAllSelected) {
        currentTabIds.forEach((id) => next.delete(id))
      } else {
        currentTabIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  // Chuyển tab
  const handleTabChange = (tab: 'received' | 'unassigned' | 'approved') => {
    setCurrentTab(tab)
    setSelectedStudentIds(new Set())
    setEditingTarget(null)
  }

  // Hành động Gán GVHD (Gán mới hoặc Đổi GVHD trực tiếp từ bảng phải, không qua popup)
  const handleAssignAction = async () => {
    if (isLocked) {
      toast.warning('Danh sách phân công đã được khóa! Vui lòng mở khóa để chỉnh sửa.')
      return
    }

    const targetStudentIds = Array.from(selectedStudentIds)
    if (targetStudentIds.length === 0 && !editingTarget) {
      toast.warning('Vui lòng chọn ít nhất 1 sinh viên bên bảng trái để gán!')
      return
    }

    if (!selectedLecturer) {
      toast.warning('Vui lòng chọn 1 giảng viên bên bảng phải để gán!')
      return
    }

    // 1. Trường hợp: Gán / Đổi GVHD 2 (Đồng hướng dẫn) ở tab Đã phân công
    if (editingTarget?.slot === 2) {
      const student = editingTarget.student
      if (student.supervisorId === selectedLecturer.id) {
        toast.error(
          `Giảng viên ${selectedLecturer.name} đang là GVHD 1 của sinh viên này! GVHD 2 phải là giảng viên khác.`,
        )
        return
      }

      const remaining = selectedLecturer.quota - (selectedLecturer.assigned || 0)
      const isAlreadySupervisor2 = student.supervisor2Id === selectedLecturer.id
      if (remaining <= 0 && !isAlreadySupervisor2) {
        toast.error(
          `Giảng viên ${selectedLecturer.name} đã đủ chỉ tiêu (${selectedLecturer.assigned}/${selectedLecturer.quota} SV)!`,
        )
        return
      }

      onChangeCoSupervisor(student.id, selectedLecturer)
      toast.success(
        `Đã gán ${selectedLecturer.name} làm GVHD 2 cho sinh viên ${student.name} thành công!`,
      )
      setEditingTarget(null)
      setSelectedStudentIds(new Set())
      return
    }

    // 2. Trường hợp: Đổi GVHD 1 ở tab Đã phân công
    if (currentTab === 'approved' || editingTarget?.slot === 1) {
      const targetIds = editingTarget ? [editingTarget.student.id] : targetStudentIds
      const remaining = selectedLecturer.quota - (selectedLecturer.assigned || 0)

      const needAssignCount = targetIds.filter((sId) => {
        const s = students.find((item) => item.id === sId)
        return s?.supervisorId !== selectedLecturer.id
      }).length

      if (needAssignCount === 0) {
        toast.info(`Giảng viên ${selectedLecturer.name} đã là GVHD của sinh viên được chọn.`)
        setEditingTarget(null)
        setSelectedStudentIds(new Set())
        return
      }

      if (needAssignCount > remaining) {
        toast.error(
          `Giảng viên ${selectedLecturer.name} hiện đang nhận ${selectedLecturer.assigned}/${selectedLecturer.quota} SV. Chỉ có thể nhận thêm tối đa ${remaining} SV!`,
        )
        return
      }

      try {
        for (const sId of targetIds) {
          await onChangeSupervisor(sId, selectedLecturer)
        }
      } catch {
        // Lỗi đã được thông báo qua toast ở handler
      } finally {
        setEditingTarget(null)
        setSelectedStudentIds(new Set())
      }
      return
    }

    // 3. Trường hợp mặc định: Gán sinh viên ở tab Chưa nhận GV
    const remaining = selectedLecturer.quota - (selectedLecturer.assigned || 0)
    const numSelected = targetStudentIds.length
    if (numSelected > remaining) {
      toast.error(
        `Giảng viên ${selectedLecturer.name} hiện đang nhận ${selectedLecturer.assigned}/${selectedLecturer.quota} SV. Chỉ có thể nhận thêm tối đa ${remaining} SV (bạn đang chọn ${numSelected} sinh viên)!`,
      )
      return
    }

    onAssignStudents(targetStudentIds, selectedLecturer)
    setSelectedStudentIds(new Set())
    setEditingTarget(null)
  }

  // Hành động Phê duyệt (tab Đã nhận GV)
  const handleApproveAction = () => {
    if (isLocked) {
      toast.warning('Danh sách phân công đã được khóa! Vui lòng mở khóa để chỉnh sửa.')
      return
    }
    if (selectedStudentIds.size === 0) return

    const regIds: string[] = []
    selectedStudentIds.forEach((sId) => {
      const stu = students.find((s) => s.id === sId)
      if (stu?.registrationPublicId) {
        regIds.push(stu.registrationPublicId)
      } else if (stu?.id) {
        regIds.push(stu.id)
      }
    })

    if (regIds.length === 0) {
      toast.warning('Không tìm thấy thông tin đơn đăng ký cần phê duyệt!')
      return
    }

    onApproveRegistrations(regIds)
    setSelectedStudentIds(new Set())
  }

  // Hành động Từ chối (tab Đã nhận GV)
  const handleRejectAction = () => {
    if (isLocked) {
      toast.warning('Danh sách phân công đã được khóa! Vui lòng mở khóa để chỉnh sửa.')
      return
    }
    if (selectedStudentIds.size === 0) return

    const regIds: string[] = []
    selectedStudentIds.forEach((sId) => {
      const stu = students.find((s) => s.id === sId)
      if (stu?.registrationPublicId) {
        regIds.push(stu.registrationPublicId)
      } else if (stu?.id) {
        regIds.push(stu.id)
      }
    })

    if (regIds.length === 0) {
      toast.warning('Không tìm thấy thông tin đơn đăng ký cần từ chối!')
      return
    }

    onRejectRegistrations(regIds)
    setSelectedStudentIds(new Set())
  }

  const selectedCount = selectedStudentIds.size
  const isAllStudentsSelected =
    filteredStudents.length > 0 && filteredStudents.every((s) => selectedStudentIds.has(s.id))

  const sortIcon =
    lecturerSort === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5" />
    ) : lecturerSort === 'desc' ? (
      <ArrowDown className="w-3.5 h-3.5" />
    ) : (
      <ArrowUpDown className="w-3.5 h-3.5" />
    )

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col overflow-hidden space-y-2">
      {/* 1. Header Workspace: Nút Quay lại, Năm học, Học kỳ và Nút Khóa danh sách */}
      <div className="flex items-center justify-between gap-3 flex-wrap shrink-0 pb-1">
        <div className="flex items-center gap-3 flex-wrap min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="h-9 px-3.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[13px] font-semibold transition inline-flex items-center gap-2 cursor-pointer shadow-xs shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Quay lại</span>
          </button>

          <div className="inline-flex items-center gap-2">
            <select
              aria-label="Chọn năm học"
              value={year}
              onChange={(e) => onYearChange?.(e.target.value)}
              className="h-9 px-3.5 pr-8 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-[13px] font-semibold text-slate-800 outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100 transition appearance-none cursor-pointer shadow-xs"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='M6 9l6 6 6-6'/%3e%3c/svg%3e")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center',
              }}
            >
              {(academicYears && academicYears.length > 0 ? academicYears : [year]).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <select
              aria-label="Chọn học kỳ"
              value={selectedSemesterId}
              onChange={(e) => onSemesterChange?.(e.target.value)}
              className="h-9 px-3.5 pr-8 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-[13px] font-semibold text-slate-800 outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100 transition appearance-none cursor-pointer shadow-xs"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='M6 9l6 6 6-6'/%3e%3c/svg%3e")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center',
              }}
            >
              {(termsOfYear && termsOfYear.length > 0
                ? termsOfYear
                : [
                    {
                      publicId: selectedSemesterId || '',
                      term: semesterName,
                      name: semesterName,
                    } as SemesterOption,
                  ]
              ).map((t) => {
                const termId = t.publicId || (t as any).id || ''
                const termLabel = t.term || t.name
                return (
                  <option key={termId} value={termId}>
                    {termLabel}
                  </option>
                )
              })}
            </select>
          </div>
        </div>

        {/* Nút Khóa / Mở khóa danh sách */}
        <div className="flex items-center gap-2.5 shrink-0">
          {isLocked ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-[11.5px] font-semibold text-slate-700">
                  Trạng thái: Đã khóa {lockedByName ? `(${lockedByName})` : ''}
                </div>
                <div className="text-[10.5px] text-slate-500 font-medium">
                  {lockedAt || '20:15 26/10/2026'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUnlockModalOpen(true)}
                className="h-9 px-4 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
              >
                <Unlock className="w-4 h-4 text-slate-500" />
                <span>Mở khóa để sửa</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setLockModalOpen(true)}
              className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs shadow-emerald-600/25 shrink-0"
            >
              <Lock className="w-4 h-4" />
              <span>Khóa danh sách</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. KHU VỰC CHÍNH 2 CỘT: CẢ 2 CỘT CUỘN ĐỘC LẬP */}
      <div className="flex-1 min-h-0 flex flex-row items-stretch gap-3.5 w-full">
        {/* === CỘT TRÁI (SINH VIÊN): Ô tìm kiếm + 3 tabs + Bảng sinh viên cuộn riêng === */}
        <div className="flex-1 min-w-0 flex flex-col h-full">
          {/* Ô tìm kiếm sinh viên & Nút Phê duyệt / Từ chối */}
          <div className="flex items-center gap-2 mb-1">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Tìm theo tên sinh viên, MSSV, lớp..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3.5 bg-white border border-slate-300 rounded-lg text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100 transition shadow-xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            {currentTab === 'received' && (
              <>
                <button
                  type="button"
                  onClick={handleApproveAction}
                  disabled={selectedCount === 0 || isLocked}
                  className="h-9 px-3.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white text-[13px] font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs flex items-center justify-center shrink-0"
                  title={isLocked ? 'Danh sách đã khóa, không thể phê duyệt' : ''}
                >
                  <span>Phê duyệt ({selectedCount})</span>
                </button>
                <button
                  type="button"
                  onClick={handleRejectAction}
                  disabled={selectedCount === 0 || isLocked}
                  className="h-9 px-3 rounded-lg bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 hover:border-rose-300 text-[13px] font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs shrink-0"
                  title={isLocked ? 'Danh sách đã khóa, không thể từ chối' : ''}
                >
                  <span>Từ chối</span>
                </button>
              </>
            )}
          </div>

          {/* 3 Tabs phân loại: 1. Đã nhận GV -> 2. Chưa nhận GV -> 3. Đã phân công */}
          <div className="h-9 bg-slate-200/70 p-0.5 rounded-lg flex items-center gap-1 mb-1 text-[12px] font-semibold overflow-x-auto shadow-2xs">
            <button
              type="button"
              onClick={() => handleTabChange('received')}
              className={cn(
                'flex-1 h-8 px-2 rounded-md flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap',
                currentTab === 'received'
                  ? 'bg-white text-blue-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              <span>Đã nhận giảng viên</span>
              <span
                className={cn(
                  'px-1.5 py-0.5 text-[11px] font-bold rounded-full',
                  currentTab === 'received'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-200/80 text-slate-600',
                )}
              >
                {countReceived}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('unassigned')}
              className={cn(
                'flex-1 h-8 px-2 rounded-md flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap',
                currentTab === 'unassigned'
                  ? 'bg-white text-blue-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              <span>Chưa nhận giảng viên</span>
              <span
                className={cn(
                  'px-1.5 py-0.5 text-[11px] font-bold rounded-full',
                  currentTab === 'unassigned'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-200/80 text-slate-600',
                )}
              >
                {countUnassigned}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('approved')}
              className={cn(
                'flex-1 h-8 px-2 rounded-md flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap',
                currentTab === 'approved'
                  ? 'bg-white text-blue-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              <span>Đã phân công</span>
              <span
                className={cn(
                  'px-1.5 py-0.5 text-[11px] font-bold rounded-full',
                  currentTab === 'approved'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-200/80 text-slate-600',
                )}
              >
                {countApproved}
              </span>
            </button>
          </div>

          {/* Khung Bảng Sinh viên hoàn chỉnh (Header cố định + Body cuộn độc lập) */}
          <div className="flex-1 min-h-0 flex flex-col bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            {/* Header cố định */}
            <div className="shrink-0 bg-slate-100 border-b border-slate-200">
              <table className="w-full text-left text-sm border-collapse table-fixed">
                <colgroup>
                  <col className={currentTab === 'approved' ? 'w-[26%]' : 'w-[30%]'} />
                  <col className={currentTab === 'approved' ? 'w-[32%]' : 'w-[38%]'} />
                  <col className={currentTab === 'approved' ? 'w-[21%]' : 'w-[26%]'} />
                  <col className={currentTab === 'approved' ? 'w-[21%]' : 'w-10'} />
                </colgroup>
                <thead>
                  <tr className="text-[11px] font-bold text-slate-700 uppercase tracking-wider h-11">
                    <th className="py-0 px-2.5 align-middle">SINH VIÊN</th>
                    <th className="py-0 px-2.5 align-middle">ĐỀ TÀI</th>
                    <th className="py-0 px-2.5 align-middle">
                      {currentTab === 'approved' ? 'GVHD 1' : 'GIẢNG VIÊN HƯỚNG DẪN'}
                    </th>
                    {currentTab === 'approved' ? (
                      <th className="py-0 px-2.5 text-blue-900 font-extrabold align-middle">GVHD 2</th>
                    ) : (
                      <th className="py-0 px-1 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={isAllStudentsSelected}
                          onChange={toggleSelectAllStudents}
                          disabled={isLocked}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed align-middle"
                          title="Chọn tất cả sinh viên trong tab"
                        />
                      </th>
                    )}
                  </tr>
                </thead>
              </table>
            </div>

            {/* Thân bảng sinh viên cuộn độc lập */}
            <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-gutter:stable]">
              <table className="w-full text-left text-sm border-collapse table-fixed">
                <colgroup>
                  <col className={currentTab === 'approved' ? 'w-[26%]' : 'w-[30%]'} />
                  <col className={currentTab === 'approved' ? 'w-[32%]' : 'w-[38%]'} />
                  <col className={currentTab === 'approved' ? 'w-[21%]' : 'w-[26%]'} />
                  <col className={currentTab === 'approved' ? 'w-[21%]' : 'w-10'} />
                </colgroup>
                <tbody className="divide-y divide-slate-100 text-[12.5px]">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400 text-sm">
                      Không có sinh viên nào trong danh mục này.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => {
                    const isChecked = selectedStudentIds.has(s.id)
                    const isApprovedTab = currentTab === 'approved'
                    const isEditingThis1 =
                      editingTarget?.student.id === s.id && editingTarget.slot === 1
                    const isEditingThis2 =
                      editingTarget?.student.id === s.id && editingTarget.slot === 2
                    const isRowSelected = isChecked || editingTarget?.student.id === s.id

                    return (
                      <tr
                        key={s.id}
                        onClick={() => {
                          if (isApprovedTab && !isLocked) {
                            if (editingTarget?.student.id === s.id && editingTarget.slot === 1) {
                              setEditingTarget(null)
                              setSelectedStudentIds(new Set())
                            } else {
                              setEditingTarget({ student: s, slot: 1 })
                              setSelectedStudentIds(new Set([s.id]))
                              if (s.supervisorId) setSelectedLecturerId(s.supervisorId)
                            }
                          }
                        }}
                        className={cn(
                          'transition-colors',
                          isRowSelected
                            ? 'bg-blue-50/80 ring-1 ring-blue-300'
                            : isChecked
                              ? 'bg-blue-50/60 hover:bg-blue-50/80'
                              : 'hover:bg-slate-50/70',
                          isApprovedTab && !isLocked && 'cursor-pointer',
                        )}
                      >
                        {/* Cột 1: Tên & MSSV */}
                        <td className="py-2.5 px-2.5">
                          <strong className="text-slate-900 font-semibold leading-tight block text-[13px] truncate">
                            {s.name}
                          </strong>
                          <span className="text-slate-500 font-mono text-[11.5px] block mt-0.5">
                            {s.code}
                          </span>
                        </td>

                        {/* Cột 2: Đề tài */}
                        <td className="py-2.5 px-2.5">
                          {currentTab === 'unassigned' ? (
                            <span className="text-slate-400 italic text-[11.5px]">—</span>
                          ) : s.topic ? (
                            <span
                              className="text-[12px] text-slate-700 line-clamp-2 leading-snug"
                              title={s.topic}
                            >
                              {s.topic}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11.5px]">
                              (chưa đăng ký)
                            </span>
                          )}
                        </td>

                        {/* Cột 3: GVHD 1 (Chính) */}
                        <td className="py-2.5 px-2.5">
                          {isApprovedTab ? (
                            s.supervisorName ? (
                              <div
                                className={cn(
                                  'flex items-center justify-between gap-1 p-1 px-2 rounded-md transition border',
                                  isEditingThis1
                                    ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                                    : 'bg-blue-50/70 border-blue-200 group',
                                )}
                              >
                                <span
                                  className={cn(
                                    'font-bold text-[12px] block truncate leading-tight',
                                    isEditingThis1 ? 'text-white' : 'text-blue-900',
                                  )}
                                >
                                  {s.supervisorName}
                                </span>
                                {!isLocked && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (isLocked) return
                                      if (isEditingThis1) {
                                        setEditingTarget(null)
                                        setSelectedStudentIds(new Set())
                                      } else {
                                        setEditingTarget({ student: s, slot: 1 })
                                        setSelectedStudentIds(new Set([s.id]))
                                        if (s.supervisorId) setSelectedLecturerId(s.supervisorId)
                                        toast.info(
                                          `Đã chọn SV ${s.name} để đổi GVHD 1. Hãy chọn giảng viên ở bảng bên phải rồi nhấn "Gán".`,
                                        )
                                      }
                                    }}
                                    className={cn(
                                      'p-0.5 rounded transition cursor-pointer shrink-0',
                                      isEditingThis1
                                        ? 'bg-white/20 text-white hover:bg-white/30'
                                        : 'text-blue-600 hover:text-blue-800 hover:bg-white',
                                    )}
                                    title={
                                      isEditingThis1
                                        ? 'Đang chọn đổi GVHD 1 (nhấn để hủy)'
                                        : 'Chọn sinh viên này để đổi GVHD 1'
                                    }
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                Chưa có GVHD
                              </span>
                            )
                          ) : s.supervisorName ? (
                            <span className="font-bold text-slate-800 text-[12.5px] block truncate">
                              {s.supervisorName}
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Chưa có GVHD
                            </span>
                          )}
                        </td>

                        {/* Cột 4: GVHD 2 (ở tab approved) hoặc Checkbox (ở tab khác) */}
                        {isApprovedTab ? (
                          <td className="py-2.5 px-2.5">
                            {s.supervisor2Name ? (
                              <div
                                className={cn(
                                  'flex items-center justify-between gap-1 p-1 px-2 rounded-md transition border',
                                  isEditingThis2
                                    ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                                    : 'bg-purple-50/70 border-purple-200 group',
                                )}
                              >
                                <span
                                  className={cn(
                                    'font-bold text-[12px] block truncate leading-tight',
                                    isEditingThis2 ? 'text-white' : 'text-purple-900',
                                  )}
                                >
                                  {s.supervisor2Name}
                                </span>
                                {!isLocked && (
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        if (isLocked) return
                                        if (isEditingThis2) {
                                          setEditingTarget(null)
                                          setSelectedStudentIds(new Set())
                                        } else {
                                          setEditingTarget({ student: s, slot: 2 })
                                          setSelectedStudentIds(new Set([s.id]))
                                          if (s.supervisor2Id) setSelectedLecturerId(s.supervisor2Id)
                                          toast.info(
                                            `Đã chọn SV ${s.name} để đổi GVHD 2. Hãy chọn giảng viên ở bảng bên phải rồi nhấn "Gán".`,
                                          )
                                        }
                                      }}
                                      className={cn(
                                        'p-0.5 rounded transition cursor-pointer',
                                        isEditingThis2
                                          ? 'bg-white/20 text-white hover:bg-white/30'
                                          : 'text-purple-600 hover:text-purple-800 hover:bg-white',
                                      )}
                                      title={
                                        isEditingThis2
                                          ? 'Đang chọn đổi GVHD 2 (nhấn để hủy)'
                                          : 'Chọn sinh viên này để đổi GVHD 2'
                                      }
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        if (isLocked) return
                                        if (
                                          confirm(
                                            `Gỡ bỏ GVHD 2 (${s.supervisor2Name}) của sinh viên ${s.name}?`,
                                          )
                                        ) {
                                          onChangeCoSupervisor(s.id, null)
                                        }
                                      }}
                                      className={cn(
                                        'p-0.5 rounded transition cursor-pointer',
                                        isEditingThis2
                                          ? 'text-white/80 hover:text-white'
                                          : 'text-slate-400 hover:text-rose-600 hover:bg-white',
                                      )}
                                      title="Gỡ bỏ GVHD 2"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : !isLocked ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (isLocked) return
                                  if (isEditingThis2) {
                                    setEditingTarget(null)
                                    setSelectedStudentIds(new Set())
                                  } else {
                                    setEditingTarget({ student: s, slot: 2 })
                                    setSelectedStudentIds(new Set([s.id]))
                                    setSelectedLecturerId(null)
                                    toast.info(
                                      `Đang chọn ${s.name} để gán GVHD 2. Hãy chọn giảng viên ở bảng bên phải rồi nhấn "Gán".`,
                                    )
                                  }
                                }}
                                className={cn(
                                  'h-7 px-2.5 rounded-md border border-dashed transition flex items-center justify-center gap-1 cursor-pointer text-[11.5px] font-semibold',
                                  isEditingThis2
                                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                                    : 'border-purple-300 hover:border-purple-500 bg-white hover:bg-purple-50 text-purple-700 shadow-2xs',
                                )}
                                title="Chỉ định GVHD 2"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Thêm GVHD 2</span>
                              </button>
                            ) : (
                              <span className="text-slate-400 italic text-[11px] pl-1">
                                — Không có —
                              </span>
                            )}
                          </td>
                        ) : (
                          <td className="py-2.5 px-1 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelectStudent(s.id)}
                              disabled={isLocked}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            />
                          </td>
                        )}
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* === CỘT PHẢI (GIẢNG VIÊN): Ô tìm kiếm + 4 tabs lọc + Danh sách GV cuộn riêng === */}
      <div className="w-[390px] xl:w-[430px] shrink-0 flex flex-col h-full">
        {/* Ô tìm kiếm giảng viên & Nút Gán */}
        <div className="shrink-0 flex items-center gap-2 mb-1.5">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Tìm theo tên giảng viên, học hàm, bộ..."
              value={lecturerSearch}
              onChange={(e) => setLecturerSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3.5 bg-white border border-slate-300 rounded-lg text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100 transition shadow-xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <button
            type="button"
            onClick={handleAssignAction}
            disabled={
              isLocked ||
              !selectedLecturer ||
              (currentTab === 'unassigned' && selectedCount === 0) ||
              (currentTab === 'approved' && selectedCount === 0 && !editingTarget) ||
              currentTab === 'received'
            }
            className="h-9 px-4 rounded-lg bg-[#1565C0] hover:bg-[#0D47A1] text-white text-[13px] font-semibold transition cursor-pointer shadow-xs flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              isLocked
                ? 'Danh sách đã khóa'
                : currentTab === 'received'
                  ? 'Tab Đã nhận GV dùng nút Phê duyệt / Từ chối'
                  : 'Gán giảng viên cho sinh viên'
            }
          >
            <span>
              {currentTab === 'approved' && editingTarget?.slot === 2
                ? 'Gán GVHD 2'
                : currentTab === 'approved' && (editingTarget || selectedCount > 0)
                  ? `Đổi GVHD (${selectedCount || 1} SV)`
                  : `Gán (${selectedCount} SV)`}
            </span>
          </button>
        </div>

        {/* Tab Bar Lọc Nhanh Đơn Vị */}
        <div className="shrink-0 h-9 bg-slate-200/70 p-0.5 rounded-lg flex items-center gap-1 mb-1.5 text-[12px] font-semibold overflow-x-auto shadow-2xs">
          <button
            type="button"
            onClick={() => setLecturerCategory('all')}
            className={cn(
              'flex-1 h-8 px-2 rounded-md flex items-center justify-center transition text-center cursor-pointer whitespace-nowrap',
              lecturerCategory === 'all'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setLecturerCategory('internal')}
            className={cn(
              'flex-1 h-8 px-2 rounded-md flex items-center justify-center transition text-center cursor-pointer whitespace-nowrap',
              lecturerCategory === 'internal'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            Trong bộ môn
          </button>
          <button
            type="button"
            onClick={() => setLecturerCategory('dept_ext')}
            className={cn(
              'flex-1 h-8 px-2 rounded-md flex items-center justify-center transition text-center cursor-pointer whitespace-nowrap',
              lecturerCategory === 'dept_ext'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            Ngoài bộ môn
          </button>
          <button
            type="button"
            onClick={() => setLecturerCategory('univ_ext')}
            className={cn(
              'flex-1 h-8 px-2 rounded-md flex items-center justify-center transition text-center cursor-pointer whitespace-nowrap',
              lecturerCategory === 'univ_ext'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            Ngoài trường
          </button>
        </div>

        {/* Khung Danh sách Giảng viên (Header cố định + Body cuộn độc lập) */}
        <div className="flex-1 min-h-0 flex flex-col bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden text-left text-sm">
          {/* Tiêu đề bảng Giảng viên (cố định trên cùng) */}
          <div className="shrink-0 grid grid-cols-12 bg-slate-100 text-[11px] font-bold text-slate-700 uppercase tracking-wider h-11 px-3.5 border-b border-slate-200 items-center">
            <div className="col-span-2 text-center">CHỌN</div>
            <div className="col-span-6">TÊN GIẢNG VIÊN</div>
            <div className="col-span-4 flex items-center justify-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setLecturerSort((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                }
                className={cn(
                  'p-1 rounded hover:bg-slate-200/80 transition cursor-pointer flex items-center justify-center',
                  lecturerSort !== 'default'
                    ? 'text-blue-600 bg-blue-100 font-bold'
                    : 'text-slate-400 hover:text-slate-600',
                )}
                title={
                  lecturerSort === 'asc'
                    ? 'Sắp xếp: Số SV tăng dần'
                    : 'Sắp xếp: Số SV giảm dần'
                }
              >
                {sortIcon}
              </button>
              <span
                className="cursor-pointer select-none"
                onClick={() =>
                  setLecturerSort((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                }
              >
                ĐANG NHẬN
              </span>
            </div>
          </div>

          {/* Thân danh sách GV: CUỘN ĐỘC LẬP MƯỢT MÀ */}
          <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-gutter:stable] divide-y divide-slate-100">
              {/* Nhóm Giảng viên còn chỉ tiêu */}
              {availableLecturers.map((l) => {
                const isSelected = effectiveSelectedLecturerId === l.id
                const assignedCount = l.assigned || 0
                const badgeColor =
                  assignedCount >= l.quota
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : assignedCount > 0
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-slate-100 text-slate-600'
                const canSelect =
                  !isLocked &&
                  (currentTab === 'unassigned' ||
                    currentTab === 'approved' ||
                    editingTarget !== null)

                return (
                  <label
                    key={l.id}
                    onClick={() => {
                      if (canSelect) {
                        setSelectedLecturerId(l.id)
                      }
                    }}
                    className={cn(
                      'grid grid-cols-12 items-center py-3 px-3 transition-colors',
                      canSelect ? 'hover:bg-blue-50/40 cursor-pointer' : 'cursor-default',
                      isSelected ? 'bg-blue-50/60' : '',
                    )}
                  >
                    <div className="col-span-2 flex items-center justify-center">
                      <input
                        type="radio"
                        name="lecturerSelect"
                        value={l.id}
                        checked={isSelected}
                        onChange={() => {
                          if (canSelect) {
                            setSelectedLecturerId(l.id)
                          }
                        }}
                        disabled={!canSelect}
                        className={cn(
                          'w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed',
                          !canSelect && 'opacity-40',
                        )}
                      />
                    </div>

                    <div className="col-span-6 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-slate-900 text-[13.5px]">
                          {l.name}
                        </span>
                        {isSelected && (
                          <span className="text-blue-600 text-xs font-bold">●</span>
                        )}
                      </div>
                      <div className="text-[11.5px] text-slate-400 mt-0.5">
                        <span className="inline-block px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[11px] font-medium mr-1">
                          {l.categoryLabel}
                        </span>
                        <span>{l.department}</span>
                      </div>
                    </div>

                    {/* Cột Đang nhận */}
                    <div className="col-span-4 text-center">
                      <span className={cn('inline-block px-2.5 py-1 rounded-full text-xs font-bold', badgeColor)}>
                        {assignedCount}/{l.quota} SV
                      </span>
                    </div>
                  </label>
                )
              })}

              {/* Nhóm Giảng viên ĐÃ ĐỦ CHỈ TIÊU */}
              {unavailableLecturers.length > 0 && (
                <>
                  <div className="p-2.5 bg-slate-100/90 text-[11.5px] font-bold text-slate-500 uppercase tracking-wider border-t border-b border-slate-200 flex items-center gap-1.5">
                    <span className="text-slate-400 font-bold">✓✓</span>
                    <span>
                      Giảng viên đã đủ chỉ tiêu tối đa ({unavailableLecturers.length})
                    </span>
                  </div>

                  {unavailableLecturers.map((l) => (
                    <label
                      key={l.id}
                      className="grid grid-cols-12 items-center py-2.5 px-3 bg-slate-50/50 hover:bg-slate-100/50 transition-colors opacity-75"
                    >
                      <div className="col-span-2 flex items-center justify-center">
                        <input
                          type="radio"
                          name="lecturerSelect"
                          value={l.id}
                          disabled
                          className="w-4 h-4 text-slate-300 focus:ring-0 cursor-not-allowed"
                        />
                      </div>
                      <div className="col-span-6 pr-2">
                        <span className="font-medium text-slate-600 text-[13px]">
                          {l.name}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {l.department}
                        </div>
                      </div>
                      <div className="col-span-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          {l.assigned}/{l.quota} SV
                        </span>
                      </div>
                    </label>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 4. MODAL XÁC NHẬN KHÓA DANH SÁCH                                  */}
      {/* ================================================================= */}
      {lockModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-[480px] max-h-[calc(100vh-48px)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-900 leading-snug">
                    Khóa danh sách phân công
                  </h3>
                  <p className="text-[12px] text-slate-500 mt-0.5">
                    Năm học {year} ({semesterName})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLockModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer hover:bg-slate-200/50 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-slate-600 overflow-y-auto">
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl">
                  <div className="text-[18px] font-bold text-blue-700">{countApproved}</div>
                  <div className="text-[11.5px] text-blue-600 font-semibold mt-0.5">
                    Đã phân công
                  </div>
                </div>
                <div className="p-2.5 bg-amber-50/70 border border-amber-100 rounded-xl">
                  <div className="text-[18px] font-bold text-amber-700">{countReceived}</div>
                  <div className="text-[11.5px] text-amber-600 font-semibold mt-0.5">
                    Đang nhận
                  </div>
                </div>
                <div className="p-2.5 bg-slate-100/70 border border-slate-200 rounded-xl">
                  <div className="text-[18px] font-bold text-slate-700">{countUnassigned}</div>
                  <div className="text-[11.5px] text-slate-500 font-semibold mt-0.5">
                    Chưa nhận
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50/90 border border-amber-200/80 rounded-xl text-amber-900 leading-relaxed text-[12.5px]">
                <p className="font-bold flex items-center gap-1.5 text-amber-800 mb-1 text-[13px]">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 inline-block" />
                  Lưu ý khi khóa danh sách:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-700 text-[12px]">
                  <li>Không cho phép sửa đổi GVHD 1 và GVHD 2 của sinh viên.</li>
                  <li>Không cho phép gán thêm sinh viên mới cho các giảng viên.</li>
                  <li>
                    Danh sách sẽ được dùng làm căn cứ chính thức gửi Ban Chủ nhiệm Khoa ban hành
                    quyết định.
                  </li>
                </ul>
              </div>
              <p className="text-slate-500 text-[11.5px] italic">
                Trưởng bộ môn vẫn có thể mở khóa lại để điều chỉnh nếu có phát sinh.
              </p>
            </div>

            <div className="p-3.5 px-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setLockModalOpen(false)}
                className="h-9 px-4 rounded-xl bg-white border border-slate-300 text-slate-700 text-[13px] font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  const nowStr = new Date().toLocaleString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })
                  setIsLocked(true)
                  setLockedAt(nowStr)
                  setLockedByName('Trưởng bộ môn')
                  setLockModalOpen(false)
                  onToggleLock(true)
                }}
                className="h-9 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold transition flex items-center justify-center cursor-pointer shadow-xs"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 5. MODAL XÁC NHẬN MỞ KHÓA DANH SÁCH                              */}
      {/* ================================================================= */}
      {unlockModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-[460px] max-h-[calc(100vh-48px)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-2xs">
                  <Unlock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-900 leading-snug">
                    Mở khóa danh sách phân công
                  </h3>
                  <p className="text-[12px] text-slate-500 mt-0.5">
                    Cho phép chỉnh sửa lại GVHD 1, 2 và gán sinh viên
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUnlockModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer hover:bg-slate-200/50 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 text-[13px] text-slate-600 leading-relaxed space-y-3 overflow-y-auto">
              <p>
                Bạn có chắc chắn muốn <b>mở khóa danh sách phân công GVHD</b>?
              </p>
              <div className="p-3 bg-blue-50/70 border border-blue-200/70 rounded-xl text-blue-900 text-[12.5px]">
                Sau khi mở khóa, Trưởng bộ môn có thể tiếp tục chỉnh sửa GVHD 1, GVHD 2 của sinh viên
                hoặc tiếp tục gán sinh viên cho giảng viên.
              </div>
            </div>

            <div className="p-3.5 px-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setUnlockModalOpen(false)}
                className="h-9 px-4 rounded-xl bg-white border border-slate-300 text-slate-700 text-[13px] font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLocked(false)
                  setLockedAt(null)
                  setLockedByName(null)
                  setUnlockModalOpen(false)
                  onToggleLock(false)
                }}
                className="h-9 px-5 rounded-xl bg-[#1565C0] hover:bg-[#0D47A1] text-white text-[13px] font-bold transition flex items-center justify-center cursor-pointer shadow-xs"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
