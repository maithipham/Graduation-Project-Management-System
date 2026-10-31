import { useState, useMemo } from 'react'
import {
  ArrowLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Clock,
  Edit3,
  Search,
  UserCheck,
  Users,
} from 'lucide-react'
import { Button } from '@/shared/components/ui'
import { toast } from '@/shared/components/feedback'
import { cn } from '@/shared/utils/cn'
import { getAvatarInitials, getAvatarColor } from '../utils/teacherDisplay'
import type { SupervisorLecturer, SupervisorStudent } from '../types'

interface SupervisorWorkspaceViewProps {
  lecturers: SupervisorLecturer[]
  students: SupervisorStudent[]
  onBack: () => void
  onAssignStudents: (studentIds: string[], supervisor: SupervisorLecturer) => void
  onChangeSupervisor: (studentId: string, newSupervisor: SupervisorLecturer, slot?: 1 | 2) => void
}

export function SupervisorWorkspaceView({
  lecturers,
  students,
  onBack,
  onAssignStudents,
  onChangeSupervisor,
}: SupervisorWorkspaceViewProps) {
  const [currentTab, setCurrentTab] = useState<'received' | 'unassigned' | 'approved'>('unassigned')
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set())

  const [selectedLecturerId, setSelectedLecturerId] = useState<string | null>(null)
  const [lecturerSearch, setLecturerSearch] = useState('')
  const [lecturerCategory, setLecturerCategory] = useState<'all' | 'internal' | 'dept_ext' | 'univ_ext'>('all')
  const [lecturerSort, setLecturerSort] = useState<'default' | 'asc' | 'desc'>('default')

  // Modal đổi GVHD
  const [changingStudent, setChangingStudent] = useState<SupervisorStudent | null>(null)
  const [changingSlot, setChangingSlot] = useState<1 | 2>(1)

  // Đếm sinh viên theo 3 tab
  const countReceived = useMemo(() => students.filter((s) => s.status === 'received').length, [students])
  const countUnassigned = useMemo(() => students.filter((s) => s.status === 'unassigned').length, [students])
  const countApproved = useMemo(() => students.filter((s) => s.status === 'approved').length, [students])

  // Lọc danh sách sinh viên
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (s.status !== currentTab) return false
      if (studentSearch.trim()) {
        const q = studentSearch.trim().toLowerCase()
        const mName = s.name.toLowerCase().includes(q)
        const mCode = s.code.toLowerCase().includes(q)
        const mClass = s.className.toLowerCase().includes(q)
        const mTopic = (s.topic || '').toLowerCase().includes(q)
        if (!mName && !mCode && !mClass && !mTopic) return false
      }
      return true
    })
  }, [students, currentTab, studentSearch])

  // Lọc và sắp xếp danh sách giảng viên
  const filteredLecturers = useMemo(() => {
    let list = lecturers.filter((l) => {
      if (lecturerCategory !== 'all' && l.category !== lecturerCategory) return false
      if (lecturerSearch.trim()) {
        const q = lecturerSearch.trim().toLowerCase()
        const mName = l.name.toLowerCase().includes(q)
        const mDept = l.department.toLowerCase().includes(q)
        if (!mName && !mDept) return false
      }
      return true
    })

    if (lecturerSort === 'asc') {
      list = [...list].sort((a, b) => (a.assigned || 0) - (b.assigned || 0))
    } else if (lecturerSort === 'desc') {
      list = [...list].sort((a, b) => (b.assigned || 0) - (a.assigned || 0))
    } else {
      // Ưu tiên trong bộ môn lên trước
      const rank = { internal: 1, dept_ext: 2, univ_ext: 3 }
      list = [...list].sort((a, b) => (rank[a.category] || 99) - (rank[b.category] || 99))
    }

    return list
  }, [lecturers, lecturerCategory, lecturerSearch, lecturerSort])

  // Mặc định chọn giảng viên đầu tiên còn chỉ tiêu khi ở tab Chưa nhận GV
  const activeLecturer = useMemo(() => {
    if (!selectedLecturerId) {
      const firstAvailable = filteredLecturers.find((l) => (l.assigned || 0) < l.quota)
      return firstAvailable || filteredLecturers[0] || null
    }
    return lecturers.find((l) => l.id === selectedLecturerId) || null
  }, [selectedLecturerId, filteredLecturers, lecturers])

  const toggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAllStudents = () => {
    const pageIds = filteredStudents.map((s) => s.id)
    setSelectedStudentIds((prev) => {
      const allSelected = pageIds.length > 0 && pageIds.every((id) => prev.has(id))
      const next = new Set(prev)
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id))
      } else {
        pageIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const handleAssignSelected = () => {
    if (!activeLecturer) {
      toast.warning('Vui lòng chọn một giảng viên ở cột bên phải để gán!')
      return
    }
    if (selectedStudentIds.size === 0) {
      toast.warning('Vui lòng tích chọn ít nhất 1 sinh viên!')
      return
    }

    const availableSlots = activeLecturer.quota - (activeLecturer.assigned || 0)
    if (selectedStudentIds.size > availableSlots) {
      toast.warning(
        `Giảng viên ${activeLecturer.name} chỉ còn nhận thêm được ${availableSlots} SV (bạn đang chọn ${selectedStudentIds.size} SV)!`,
      )
      return
    }

    onAssignStudents(Array.from(selectedStudentIds), activeLecturer)
    toast.success(`Đã phân công ${selectedStudentIds.size} sinh viên cho ${activeLecturer.name} thành công!`)
    setSelectedStudentIds(new Set())
  }

  const handleTabChange = (tab: 'received' | 'unassigned' | 'approved') => {
    setCurrentTab(tab)
    setSelectedStudentIds(new Set())
  }

  const isAllStudentsSelected =
    filteredStudents.length > 0 && filteredStudents.every((s) => selectedStudentIds.has(s.id))

  return (
    <div className="space-y-4">
      {/* 1. Header Workspace */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="h-9 px-3 text-xs font-semibold text-slate-700 shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Danh sách GVHD
          </Button>

          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Phân công Giảng viên Hướng dẫn
            </h2>
            <p className="text-xs text-slate-500">
              Chọn sinh viên ở cột trái và chỉ định giảng viên hướng dẫn ở cột phải
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Đang mở phân công
          </span>
        </div>
      </div>

      {/* 2. Layout 2 cột */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ================= CỘT TRÁI: SINH VIÊN (7/12) ================= */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="flex items-center border-b border-slate-200 bg-slate-50/70 p-1.5 gap-1 shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => handleTabChange('received')}
              className={cn(
                'flex-1 min-w-[130px] h-8.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5',
                currentTab === 'received'
                  ? 'bg-white text-[#1565C0] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Đã nhận GV ({countReceived})</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('unassigned')}
              className={cn(
                'flex-1 min-w-[130px] h-8.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5',
                currentTab === 'unassigned'
                  ? 'bg-white text-[#1565C0] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
              )}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Chưa nhận GV ({countUnassigned})</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('approved')}
              className={cn(
                'flex-1 min-w-[130px] h-8.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5',
                currentTab === 'approved'
                  ? 'bg-white text-[#1565C0] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
              )}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đã phân công ({countApproved})</span>
            </button>
          </div>

          {/* Search bar sinh viên */}
          <div className="p-3 border-b border-slate-200 bg-white">
            <div className="flex items-center gap-2 h-8.5 px-3 bg-white border border-slate-300 rounded-lg focus-within:border-[#1565C0] focus-within:ring-2 focus-within:ring-blue-100 transition shadow-2xs">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Tìm MSSV, tên SV, lớp, đề tài..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="flex-1 bg-transparent outline-none text-xs text-slate-800 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Table sinh viên */}
          <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px] sticky top-0 z-10">
                <tr>
                  {currentTab !== 'approved' && (
                    <th className="py-2.5 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllStudentsSelected}
                        onChange={toggleSelectAllStudents}
                        className="h-4 w-4 rounded border-slate-300 text-[#1565C0] focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="py-2.5 px-3 w-24">MSSV</th>
                  <th className="py-2.5 px-3.5 min-w-[140px]">Họ và tên</th>
                  <th className="py-2.5 px-3.5 min-w-[180px]">Đề tài tốt nghiệp</th>
                  {currentTab === 'approved' && (
                    <th className="py-2.5 px-3.5 min-w-[150px]">GVHD được phân công</th>
                  )}
                  {currentTab === 'received' && (
                    <th className="py-2.5 px-3.5 min-w-[140px]">GV đã liên hệ</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[12.5px]">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={currentTab === 'approved' ? 4 : 5} className="py-12 text-center text-slate-400">
                      Không có sinh viên nào trong mục này.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => {
                    const isChecked = selectedStudentIds.has(s.id)

                    return (
                      <tr
                        key={s.id}
                        onClick={() => currentTab !== 'approved' && toggleSelectStudent(s.id)}
                        className={cn(
                          'hover:bg-slate-50/70 transition',
                          currentTab !== 'approved' && 'cursor-pointer',
                          isChecked && 'bg-blue-50/60',
                        )}
                      >
                        {currentTab !== 'approved' && (
                          <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelectStudent(s.id)}
                              className="h-4 w-4 rounded border-slate-300 text-[#1565C0] focus:ring-blue-500 cursor-pointer"
                            />
                          </td>
                        )}

                        <td className="py-3 px-3 font-mono font-bold text-slate-700">
                          {s.code || s.id}
                        </td>

                        <td className="py-3 px-3.5">
                          <div className="font-bold text-slate-900">{s.name}</div>
                          <div className="text-[11px] text-slate-400 font-medium">{s.className}</div>
                        </td>

                        <td className="py-3 px-3.5">
                          {s.topic ? (
                            <span className="line-clamp-2 text-slate-700">{s.topic}</span>
                          ) : (
                            <span className="italic text-slate-400">(Chưa đăng ký đề tài)</span>
                          )}
                        </td>

                        {currentTab === 'approved' && (
                          <td className="py-3 px-3.5" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between gap-1.5 p-1.5 px-2 rounded-lg bg-blue-50 border border-blue-200">
                              <span className="font-bold text-blue-900 text-xs truncate">
                                {s.supervisorName}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setChangingStudent(s)
                                  setChangingSlot(1)
                                }}
                                title="Đổi giảng viên hướng dẫn"
                                className="p-1 rounded text-[#1565C0] hover:bg-white transition cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}

                        {currentTab === 'received' && (
                          <td className="py-3 px-3.5">
                            <span className="font-semibold text-slate-700 text-xs">
                              {s.supervisorName || '—'}
                            </span>
                          </td>
                        )}
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Bar gán khi có chọn */}
          {currentTab !== 'approved' && selectedStudentIds.size > 0 && (
            <div className="p-3 border-t border-slate-200 bg-blue-50/80 flex items-center justify-between gap-3 flex-wrap">
              <span className="text-xs font-semibold text-blue-900">
                Đã chọn <strong>{selectedStudentIds.size}</strong> sinh viên
              </span>

              <Button
                type="button"
                onClick={handleAssignSelected}
                className="h-8.5 px-4 bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-semibold shadow-xs"
              >
                <UserCheck className="w-4 h-4 mr-1.5" />
                Gán cho {activeLecturer ? activeLecturer.name : 'giảng viên đang chọn'}
              </Button>
            </div>
          )}
        </div>

        {/* ================= CỘT PHẢI: GIẢNG VIÊN TIẾP NHẬN (5/12) ================= */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2 shrink-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-[#1565C0]" />
              Giảng viên tiếp nhận
            </h3>

            {/* Sắp xếp */}
            <button
              type="button"
              onClick={() => {
                setLecturerSort((prev) => (prev === 'default' ? 'asc' : prev === 'asc' ? 'desc' : 'default'))
              }}
              title="Sắp xếp theo số lượng sinh viên"
              className="h-7 px-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-600 flex items-center gap-1 transition cursor-pointer"
            >
              {lecturerSort === 'asc' ? (
                <>
                  <ArrowUp className="w-3 h-3 text-[#1565C0]" />
                  <span>Tăng dần</span>
                </>
              ) : lecturerSort === 'desc' ? (
                <>
                  <ArrowDown className="w-3 h-3 text-[#1565C0]" />
                  <span>Giảm dần</span>
                </>
              ) : (
                <>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  <span>Sắp xếp</span>
                </>
              )}
            </button>
          </div>

          {/* Phân loại category tabs & Search */}
          <div className="p-3 border-b border-slate-200 space-y-2 bg-white">
            <div className="flex items-center gap-1 overflow-x-auto text-xs">
              <button
                type="button"
                onClick={() => setLecturerCategory('all')}
                className={cn(
                  'h-7 px-2.5 rounded-md font-semibold transition cursor-pointer',
                  lecturerCategory === 'all'
                    ? 'bg-[#1565C0] text-white'
                    : 'text-slate-600 hover:bg-slate-100',
                )}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setLecturerCategory('internal')}
                className={cn(
                  'h-7 px-2.5 rounded-md font-semibold transition cursor-pointer',
                  lecturerCategory === 'internal'
                    ? 'bg-[#1565C0] text-white'
                    : 'text-slate-600 hover:bg-slate-100',
                )}
              >
                Trong bộ môn
              </button>
              <button
                type="button"
                onClick={() => setLecturerCategory('dept_ext')}
                className={cn(
                  'h-7 px-2.5 rounded-md font-semibold transition cursor-pointer',
                  lecturerCategory === 'dept_ext'
                    ? 'bg-[#1565C0] text-white'
                    : 'text-slate-600 hover:bg-slate-100',
                )}
              >
                Ngoài bộ môn
              </button>
              <button
                type="button"
                onClick={() => setLecturerCategory('univ_ext')}
                className={cn(
                  'h-7 px-2.5 rounded-md font-semibold transition cursor-pointer',
                  lecturerCategory === 'univ_ext'
                    ? 'bg-[#1565C0] text-white'
                    : 'text-slate-600 hover:bg-slate-100',
                )}
              >
                Ngoài trường
              </button>
            </div>

            <div className="flex items-center gap-2 h-8 px-2.5 bg-white border border-slate-300 rounded-lg focus-within:border-[#1565C0] focus-within:ring-2 focus-within:ring-blue-100 transition shadow-2xs">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Tìm giảng viên..."
                value={lecturerSearch}
                onChange={(e) => setLecturerSearch(e.target.value)}
                className="flex-1 bg-transparent outline-none text-xs text-slate-800 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Danh sách thẻ giảng viên */}
          <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto">
            {filteredLecturers.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                Không tìm thấy giảng viên nào.
              </div>
            ) : (
              filteredLecturers.map((l) => {
                const isSelected = activeLecturer?.id === l.id
                const isFull = (l.assigned || 0) >= l.quota
                const remaining = Math.max(0, l.quota - (l.assigned || 0))
                const pct = Math.min(100, Math.round(((l.assigned || 0) / l.quota) * 100))
                const initials = getAvatarInitials(l.name)
                const avatarColor = getAvatarColor(l.name)

                return (
                  <div
                    key={l.id}
                    onClick={() => setSelectedLecturerId(l.id)}
                    className={cn(
                      'p-3 rounded-xl border transition cursor-pointer select-none',
                      isSelected
                        ? 'border-[#1565C0] bg-blue-50/70 ring-2 ring-blue-100 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 bg-white',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs',
                            avatarColor,
                          )}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-xs truncate">
                            {l.name}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {l.department}
                          </div>
                        </div>
                      </div>

                      <span
                        className={cn(
                          'text-[10.5px] px-2 py-0.5 rounded-full font-semibold shrink-0 border',
                          isFull
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200',
                        )}
                      >
                        {isFull ? 'Đã đủ' : `Còn nhận ${remaining} SV`}
                      </span>
                    </div>

                    <div className="mt-2.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                        <span>Đang nhận: {l.assigned || 0}/{l.quota} SV</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-300',
                            isFull ? 'bg-amber-500' : (l.assigned || 0) > 0 ? 'bg-emerald-500' : 'bg-slate-300',
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal Đổi GVHD */}
      {changingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-[540px] overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                Đổi Giảng viên Hướng dẫn cho {changingStudent.name}
              </h3>
              <button
                type="button"
                onClick={() => setChangingStudent(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 max-h-[380px] overflow-y-auto space-y-2">
              <p className="text-xs text-slate-500 mb-2">
                Chọn giảng viên mới tiếp nhận sinh viên này:
              </p>
              {lecturers.map((l) => {
                const isCurrent = l.name === changingStudent.supervisorName
                const isFull = (l.assigned || 0) >= l.quota && !isCurrent

                return (
                  <button
                    key={l.id}
                    type="button"
                    disabled={isCurrent || isFull}
                    onClick={() => {
                      onChangeSupervisor(changingStudent.id, l, changingSlot)
                      toast.success(`Đã đổi GVHD của ${changingStudent.name} sang ${l.name}!`)
                      setChangingStudent(null)
                    }}
                    className={cn(
                      'w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer',
                      isCurrent
                        ? 'border-blue-300 bg-blue-50/50 opacity-60 cursor-not-allowed'
                        : isFull
                          ? 'border-slate-200 opacity-40 cursor-not-allowed'
                          : 'border-slate-200 hover:border-[#1565C0] hover:bg-blue-50/40',
                    )}
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-800">{l.name}</div>
                      <div className="text-[11px] text-slate-500">{l.department} · {l.assigned}/{l.quota} SV</div>
                    </div>
                    {isCurrent ? (
                      <span className="text-[11px] font-semibold text-blue-600">Hiện tại</span>
                    ) : isFull ? (
                      <span className="text-[11px] font-semibold text-slate-400">Đã đủ</span>
                    ) : (
                      <span className="text-[11px] font-bold text-[#1565C0]">Chọn</span>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="p-3 border-t border-slate-100 flex justify-end bg-slate-50">
              <Button
                type="button"
                variant="outline"
                onClick={() => setChangingStudent(null)}
                className="text-xs"
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

