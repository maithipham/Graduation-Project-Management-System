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
  Clock,
  CheckCircle,
  Check,
  UserCheck,
  Loader2,
} from 'lucide-react'
import { toast } from '@/shared/components/feedback'
import { cn } from '@/shared/utils/cn'
import type { SemesterOption } from '@/features/department/student_management'
import type { SupervisorLecturer, SupervisorStudent, RegistrationDeadlineInfo } from '../types'

function formatDeadlineDateTime(val?: string | null): string {
  if (!val) return ''
  const d = new Date(val)
  if (Number.isNaN(d.getTime())) return val
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const yr = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${yr} ${hours}:${minutes}`
}

function calculateTimeRemaining(targetDateStr?: string | null) {
  if (!targetDateStr) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true, formattedText: '' }
  }
  const end = new Date(targetDateStr).getTime()
  if (Number.isNaN(end)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true, formattedText: '' }
  }
  const diff = end - Date.now()
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true, formattedText: 'Đã hết hạn' }
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  let text = ''
  if (days > 0) {
    text = `Còn ${days} ngày ${hours} giờ`
  } else if (hours > 0) {
    text = `Còn ${hours} giờ ${minutes} phút`
  } else {
    text = `Còn ${minutes} phút ${seconds} giây`
  }
  return { days, hours, minutes, seconds, isPast: false, formattedText: text }
}

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
  registrationDeadline?: RegistrationDeadlineInfo | null
  counts?: { received: number; unassigned: number; approved: number }
  isLoading?: boolean
  onBack: () => void
  onAssignStudents: (studentIds: string[], supervisor: SupervisorLecturer) => void
  onApproveRegistrations: (registrationPublicIds: string[]) => void
  onRejectRegistrations: (registrationPublicIds: string[]) => void
  onChangeSupervisor: (studentId: string, newSupervisor: SupervisorLecturer) => void | Promise<void>
  onChangeCoSupervisor: (studentId: string, coSupervisor: SupervisorLecturer | null) => void
  onToggleLock: (isLocked: boolean) => Promise<boolean | void> | void
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
  registrationDeadline,
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

  // Danh sách sinh viên nội bộ phản ứng tức thì (optimistic state)
  const [localStudents, setLocalStudents] = useState<SupervisorStudent[]>(students)

  useEffect(() => {
    setLocalStudents(students)
  }, [students])

  // Trạng thái đếm ngược thời hạn đăng ký
  const [countdown, setCountdown] = useState(() =>
    calculateTimeRemaining(registrationDeadline?.endDate),
  )

  useEffect(() => {
    if (!registrationDeadline?.endDate) return
    setCountdown(calculateTimeRemaining(registrationDeadline.endDate))
    const timer = setInterval(() => {
      setCountdown(calculateTimeRemaining(registrationDeadline.endDate))
    }, 1000)
    return () => clearInterval(timer)
  }, [registrationDeadline?.endDate])

  const isDeadlineEnded =
    Boolean(registrationDeadline?.isEnded) ||
    registrationDeadline?.status === 'CLOSED' ||
    (registrationDeadline?.endDate ? countdown.isPast : false)

  const isDeadlineOpen = registrationDeadline?.status === 'OPEN' && !isDeadlineEnded
  const deadlineEndDateFormatted = formatDeadlineDateTime(registrationDeadline?.endDate)

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

  // Đếm sinh viên theo 3 tab (tính trực tiếp từ localStudents để phản ứng tức thì khi duyệt/từ chối/gán)
  const countReceived = useMemo(
    () =>
      localStudents.length > 0
        ? localStudents.filter((s) => s.status === 'received').length
        : (counts?.received ?? 0),
    [counts, localStudents],
  )
  const countUnassigned = useMemo(
    () =>
      localStudents.length > 0
        ? localStudents.filter((s) => s.status === 'unassigned').length
        : (counts?.unassigned ?? 0),
    [counts, localStudents],
  )
  const countApproved = useMemo(
    () =>
      localStudents.length > 0
        ? localStudents.filter((s) => s.status === 'approved').length
        : (counts?.approved ?? 0),
    [counts, localStudents],
  )

  // Điều kiện để được phép khóa danh sách:
  // 1. Phải hết hạn đăng ký (!isDeadlineOpen)
  // 2. Không còn đơn ở trạng thái TEACHER_APPROVED chờ duyệt (tab Đã nhận: countReceived === 0)
  // 3. Không còn sinh viên chưa có GVHD (tab Chưa nhận: countUnassigned === 0)
  // 4. 100% sinh viên làm đồ án đều đã ở trạng thái HOD_APPROVED hoặc ASSIGNED_BY_HOD
  const canLock =
    !isDeadlineOpen &&
    countReceived === 0 &&
    countUnassigned === 0 &&
    localStudents.length > 0 &&
    localStudents.every(
      (s) =>
        s.status === 'approved' &&
        (s.registrationStatus === 'HOD_APPROVED' ||
          s.registrationStatus === 'ASSIGNED_BY_HOD' ||
          !!s.supervisorId),
    )

  let lockDisabledReason = ''
  if (isDeadlineOpen) {
    lockDisabledReason = 'Thao tác này chỉ khả dụng sau khi thời hạn đăng ký của sinh viên kết thúc.'
  } else if (countReceived > 0 && countUnassigned > 0) {
    lockDisabledReason = `Còn ${countReceived} đơn đang ở trạng thái GV chấp thuận (chưa duyệt) và ${countUnassigned} sinh viên chưa có GVHD. Cần phê duyệt và phân công đủ 100% trước khi khóa.`
  } else if (countReceived > 0) {
    lockDisabledReason = `Còn ${countReceived} đơn đăng ký đang ở trạng thái GV chấp thuận (TEACHER_APPROVED). TBM cần phê duyệt hoặc từ chối hết các đơn này trước khi khóa danh sách.`
  } else if (countUnassigned > 0) {
    lockDisabledReason = `Còn ${countUnassigned} sinh viên chưa có GVHD. Cần phân công đủ 100% sinh viên trước khi khóa danh sách.`
  }

  const [isSubmittingLock, setIsSubmittingLock] = useState(false)
  const [isSubmittingUnlock, setIsSubmittingUnlock] = useState(false)

  const handleConfirmLock = async () => {
    setIsSubmittingLock(true)
    try {
      const res = await onToggleLock(true)
      if (res !== false) {
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
      }
    } finally {
      setIsSubmittingLock(false)
    }
  }

  const handleConfirmUnlock = async () => {
    setIsSubmittingUnlock(true)
    try {
      const res = await onToggleLock(false)
      if (res !== false) {
        setIsLocked(false)
        setLockedAt(null)
        setLockedByName(null)
        setUnlockModalOpen(false)
      }
    } finally {
      setIsSubmittingUnlock(false)
    }
  }

  // Lọc sinh viên theo tab & tìm kiếm
  const filteredStudents = useMemo(() => {
    return localStudents.filter((s) => {
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
  }, [localStudents, currentTab, studentSearch])

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
    if (isLocked || isDeadlineOpen) return
    setSelectedStudentIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAllStudents = () => {
    if (isLocked || isDeadlineOpen) return
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
    if (isDeadlineOpen) {
      toast.warning('Thao tác này chỉ khả dụng sau khi thời hạn đăng ký của sinh viên kết thúc.')
      return
    }
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
      setLocalStudents((prev) =>
        prev.map((item) =>
          item.id === student.id
            ? {
              ...item,
              supervisor2Id: selectedLecturer.id,
              supervisor2Name: selectedLecturer.name,
            }
            : item,
        ),
      )
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
        const s = localStudents.find((item) => item.id === sId)
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
        setLocalStudents((prev) =>
          prev.map((item) =>
            targetIds.includes(item.id)
              ? {
                ...item,
                supervisorId: selectedLecturer.id,
                supervisorName: selectedLecturer.name,
              }
              : item,
          ),
        )
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
    setLocalStudents((prev) =>
      prev.map((item) =>
        targetStudentIds.includes(item.id)
          ? {
            ...item,
            status: 'approved',
            supervisorId: selectedLecturer.id,
            supervisorName: selectedLecturer.name,
          }
          : item,
      ),
    )
    setSelectedStudentIds(new Set())
    setEditingTarget(null)
  }

  // Hành động Phê duyệt (tab Đã nhận GV)
  const handleApproveAction = async () => {
    if (isDeadlineOpen) {
      toast.warning('Thao tác này chỉ khả dụng sau khi thời hạn đăng ký của sinh viên kết thúc.')
      return
    }
    if (isLocked) {
      toast.warning('Danh sách phân công đã được khóa! Vui lòng mở khóa để chỉnh sửa.')
      return
    }
    if (selectedStudentIds.size === 0) return

    const selectedIdsArray = Array.from(selectedStudentIds)
    const regIds: string[] = []
    selectedIdsArray.forEach((sId) => {
      const stu = localStudents.find((s) => s.id === sId)
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

    // Chuyển sinh viên sang tab "Đã phân công" (approved) và cập nhật badge thành HOD_APPROVED
    setLocalStudents((prev) =>
      prev.map((s) => {
        if (selectedStudentIds.has(s.id)) {
          return { ...s, status: 'approved', registrationStatus: 'HOD_APPROVED' }
        }
        return s
      }),
    )
    setSelectedStudentIds(new Set())

    try {
      await onApproveRegistrations(regIds)
    } catch {
      setLocalStudents(students)
    }
  }

  // Hành động Từ chối (tab Đã nhận GV)
  const handleRejectAction = async () => {
    if (isDeadlineOpen) {
      toast.warning('Thao tác này chỉ khả dụng sau khi thời hạn đăng ký của sinh viên kết thúc.')
      return
    }
    if (isLocked) {
      toast.warning('Danh sách phân công đã được khóa! Vui lòng mở khóa để chỉnh sửa.')
      return
    }
    if (selectedStudentIds.size === 0) return

    const selectedIdsArray = Array.from(selectedStudentIds)
    const confirmReject = confirm(
      `Bạn có chắc chắn muốn từ chối ${selectedIdsArray.length} đơn đăng ký đã chọn? Sinh viên sẽ được chuyển về danh mục Chưa nhận GV (Chưa có GVHD).`,
    )
    if (!confirmReject) return

    const regIds: string[] = []
    selectedIdsArray.forEach((sId) => {
      const stu = localStudents.find((s) => s.id === sId)
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

    // Chuyển sinh viên sang tab "Chưa nhận GV" (unassigned) và xóa thông tin GVHD
    setLocalStudents((prev) =>
      prev.map((s) => {
        if (selectedStudentIds.has(s.id)) {
          return {
            ...s,
            status: 'unassigned',
            supervisorId: null,
            supervisorName: null,
            supervisor2Id: null,
            supervisor2Name: null,
          }
        }
        return s
      }),
    )
    setSelectedStudentIds(new Set())

    try {
      await onRejectRegistrations(regIds)
    } catch {
      setLocalStudents(students)
    }
  }

  const selectedCount = selectedStudentIds.size
  const isAllStudentsSelected =
    filteredStudents.length > 0 && filteredStudents.every((s) => selectedStudentIds.has(s.id))

  // Điều kiện để được phép nhấn nút Gán
  const canAssign =
    !isLocked &&
    !isDeadlineOpen &&
    selectedLecturer !== null &&
    ((currentTab === 'unassigned' && selectedCount > 0) ||
      (currentTab === 'approved' && (selectedCount > 0 || editingTarget !== null)))

  let assignDisabledReason = ''
  if (isDeadlineOpen) {
    assignDisabledReason = 'Thao tác này chỉ khả dụng sau khi thời hạn đăng ký của sinh viên kết thúc.'
  } else if (isLocked) {
    assignDisabledReason = 'Danh sách phân công đã được khóa! Vui lòng mở khóa để chỉnh sửa.'
  } else if (currentTab === 'received') {
    assignDisabledReason = 'Tab Đã nhận GV dùng nút Phê duyệt / Từ chối'
  } else if (!selectedLecturer) {
    assignDisabledReason = 'Vui lòng chọn 1 giảng viên bên bảng phải để gán!'
  } else if (selectedCount === 0 && !editingTarget) {
    assignDisabledReason = 'Vui lòng chọn ít nhất 1 sinh viên bên bảng trái để gán!'
  }

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

          {/* Chip hiển thị đếm ngược / Trạng thái Thời hạn bên cạnh bộ chọn Học kỳ/Năm học */}
          {isDeadlineOpen ? (
            <div
              className="h-9 px-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs shrink-0"
              title={
                deadlineEndDateFormatted
                  ? `Hạn chót đăng ký GVHD: ${deadlineEndDateFormatted}`
                  : 'Đang trong thời gian đăng ký GVHD'
              }
            >
              <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse shrink-0" />
              <span>{countdown.formattedText || 'Đang mở đăng ký'}</span>
            </div>
          ) : isDeadlineEnded ? (
            <div
              className="h-9 px-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs shrink-0"
              title={
                deadlineEndDateFormatted
                  ? `Đã hết hạn vào: ${deadlineEndDateFormatted}`
                  : 'Đã hết hạn đăng ký GVHD'
              }
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Hết hạn đăng ký</span>
            </div>
          ) : null}
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
            <div
              className="inline-block"
              title={canLock ? 'Khóa danh sách phân công' : lockDisabledReason}
            >
              <button
                type="button"
                disabled={!canLock}
                onClick={() => {
                  if (!canLock) {
                    toast.warning(lockDisabledReason)
                    return
                  }
                  setLockModalOpen(true)
                }}
                className={cn(
                  'h-9 px-4 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs shrink-0',
                  canLock
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-emerald-600/25'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 pointer-events-none',
                )}
              >
                <Lock className="w-4 h-4" />
                <span>Khóa danh sách</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Banner Cảnh báo Trạng thái Thời hạn Đăng ký */}
      {isDeadlineOpen && (
        <div className="shrink-0 p-3 px-4 rounded-xl bg-amber-50 border border-amber-300/80 text-amber-900 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
            <div className="text-[13px] leading-snug">
              <span className="font-bold text-amber-900">
                Đang trong thời gian đăng ký GVHD
                {deadlineEndDateFormatted ? ` (Hạn chót: ${deadlineEndDateFormatted})` : ''}.
              </span>{' '}
              <span className="text-amber-800">
                Trưởng bộ môn chỉ được thực hiện gán, đổi giảng viên và chốt danh sách sau khi thời hạn đăng ký kết thúc.
              </span>
            </div>
          </div>
          {countdown.formattedText && (
            <div className="shrink-0 px-3 py-1 rounded-lg bg-amber-100/90 border border-amber-300 text-amber-800 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap">
              <Clock className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
              <span>{countdown.formattedText}</span>
            </div>
          )}
        </div>
      )}

      {isDeadlineEnded && !isLocked && (
        <div className="shrink-0 p-3 px-4 rounded-xl bg-emerald-50 border border-emerald-300/80 text-emerald-900 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4.5 h-4.5" />
            </div>
            <div className="text-[13px] leading-snug text-emerald-800">
              <span className="font-bold text-emerald-950">Đã hết hạn đăng ký GVHD</span>
              {deadlineEndDateFormatted ? ` (Hạn chót: ${deadlineEndDateFormatted})` : ''}. Sẵn sàng thực hiện rà soát, phân công và khóa danh sách.
            </div>
          </div>
          <span className="shrink-0 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300 tracking-wide uppercase">
            Hết hạn đăng ký
          </span>
        </div>
      )}

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
                <div
                  className="inline-block shrink-0"
                  title={
                    isDeadlineOpen
                      ? 'Thao tác này chỉ khả dụng sau khi thời hạn đăng ký của sinh viên kết thúc.'
                      : isLocked
                        ? 'Danh sách đã khóa, không thể phê duyệt'
                        : selectedCount === 0
                          ? 'Vui lòng chọn đơn đăng ký để phê duyệt'
                          : 'Phê duyệt đơn đăng ký đã chọn'
                  }
                >
                  <button
                    type="button"
                    onClick={handleApproveAction}
                    disabled={selectedCount === 0 || isLocked || isDeadlineOpen}
                    className={cn(
                      'h-9 px-3.5 rounded-lg text-white text-[13px] font-semibold transition shadow-xs flex items-center justify-center gap-1.5 shrink-0',
                      selectedCount > 0 && !isLocked && !isDeadlineOpen
                        ? 'bg-[#10B981] hover:bg-[#059669] cursor-pointer'
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed pointer-events-none',
                    )}
                  >
                    <Check className="w-4 h-4" />
                    <span>Phê duyệt đơn đã chọn{selectedCount > 0 ? ` (${selectedCount})` : ''}</span>
                  </button>
                </div>

                <div
                  className="inline-block shrink-0"
                  title={
                    isDeadlineOpen
                      ? 'Thao tác này chỉ khả dụng sau khi thời hạn đăng ký của sinh viên kết thúc.'
                      : isLocked
                        ? 'Danh sách đã khóa, không thể từ chối'
                        : selectedCount === 0
                          ? 'Vui lòng chọn sinh viên để từ chối'
                          : 'Từ chối đơn đăng ký'
                  }
                >
                  <button
                    type="button"
                    onClick={handleRejectAction}
                    disabled={selectedCount === 0 || isLocked || isDeadlineOpen}
                    className={cn(
                      'h-9 px-3 rounded-lg border text-[13px] font-semibold transition shadow-xs shrink-0',
                      selectedCount > 0 && !isLocked && !isDeadlineOpen
                        ? 'bg-white border-rose-200 text-rose-500 hover:bg-rose-50 hover:border-rose-300 cursor-pointer'
                        : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed pointer-events-none',
                    )}
                  >
                    <span>Từ chối</span>
                  </button>
                </div>
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
                          disabled={isLocked || isDeadlineOpen}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed align-middle"
                          title={
                            isDeadlineOpen
                              ? 'Thao tác này chỉ khả dụng sau khi thời hạn đăng ký của sinh viên kết thúc.'
                              : isLocked
                                ? 'Danh sách đã khóa'
                                : 'Chọn tất cả sinh viên trong tab'
                          }
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
                            if (isApprovedTab && !isLocked && !isDeadlineOpen) {
                              if (editingTarget?.student.id === s.id && editingTarget.slot === 1) {
                                setEditingTarget(null)
                                setSelectedStudentIds(new Set())
                              } else {
                                setEditingTarget({ student: s, slot: 1 })
                                setSelectedStudentIds(new Set([s.id]))
                                if (s.supervisorId) setSelectedLecturerId(s.supervisorId)
                              }
                            } else if (!isApprovedTab && !isLocked && !isDeadlineOpen) {
                              toggleSelectStudent(s.id)
                            }
                          }}
                          className={cn(
                            'transition-colors',
                            isRowSelected
                              ? 'bg-blue-50/80 ring-1 ring-blue-300'
                              : isChecked
                                ? 'bg-blue-50/60 hover:bg-blue-50/80'
                                : 'hover:bg-slate-50/70',
                            !isLocked && !isDeadlineOpen && 'cursor-pointer',
                          )}
                        >
                          {/* Cột 1: Tên & MSSV & Badge Trạng Thái */}
                          <td className="py-2.5 px-2.5">
                            <strong className="text-slate-900 font-semibold leading-tight block text-[13px] truncate">
                              {s.name}
                            </strong>
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              <span className="text-slate-500 font-mono text-[11.5px]">
                                {s.code}
                              </span>
                              {/* Badge trạng thái đơn đăng ký */}
                              {currentTab === 'received' && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10.5px] font-medium bg-amber-50 text-amber-700 border border-amber-200" title="Giảng viên hướng dẫn đã chấp thuận sơ bộ">
                                  GV đã duyệt
                                </span>
                              )}
                              {currentTab === 'approved' && (
                                s.registrationStatus === 'ASSIGNED_BY_HOD' ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10.5px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200" title="Trưởng bộ môn chỉ định trực tiếp">
                                    <UserCheck className="w-3 h-3 text-indigo-600" />
                                    TBM phân công
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200" title="Trưởng bộ môn đã phê duyệt chính thức">
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    TBM đã duyệt
                                  </span>
                                )
                              )}
                            </div>
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
                                      disabled={isDeadlineOpen}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        if (isLocked || isDeadlineOpen) return
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
                                        'p-0.5 rounded transition shrink-0',
                                        isDeadlineOpen
                                          ? 'text-slate-400 cursor-not-allowed opacity-40'
                                          : isEditingThis1
                                            ? 'bg-white/20 text-white hover:bg-white/30 cursor-pointer'
                                            : 'text-blue-600 hover:text-blue-800 hover:bg-white cursor-pointer',
                                      )}
                                      title={
                                        isDeadlineOpen
                                          ? 'Thao tác này chỉ khả dụng sau khi thời hạn đăng ký của sinh viên kết thúc.'
                                          : isEditingThis1
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
                                        disabled={isDeadlineOpen}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          if (isLocked || isDeadlineOpen) return
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
                                          'p-0.5 rounded transition',
                                          isDeadlineOpen
                                            ? 'text-slate-400 cursor-not-allowed opacity-40'
                                            : isEditingThis2
                                              ? 'bg-white/20 text-white hover:bg-white/30 cursor-pointer'
                                              : 'text-purple-600 hover:text-purple-800 hover:bg-white cursor-pointer',
                                        )}
                                        title={
                                          isDeadlineOpen
                                            ? 'Thao tác này chỉ khả dụng sau khi thời hạn đăng ký của sinh viên kết thúc.'
                                            : isEditingThis2
                                              ? 'Đang chọn đổi GVHD 2 (nhấn để hủy)'
                                              : 'Chọn sinh viên này để đổi GVHD 2'
                                        }
                                      >
                                        <Edit3 className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={isDeadlineOpen}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          if (isLocked || isDeadlineOpen) return
                                          if (
                                            confirm(
                                              `Gỡ bỏ GVHD 2 (${s.supervisor2Name}) của sinh viên ${s.name}?`,
                                            )
                                          ) {
                                            onChangeCoSupervisor(s.id, null)
                                            setLocalStudents((prev) =>
                                              prev.map((item) =>
                                                item.id === s.id
                                                  ? {
                                                    ...item,
                                                    supervisor2Id: null,
                                                    supervisor2Name: null,
                                                  }
                                                  : item,
                                              ),
                                            )
                                          }
                                        }}
                                        className={cn(
                                          'p-0.5 rounded transition',
                                          isDeadlineOpen
                                            ? 'text-slate-400 cursor-not-allowed opacity-40'
                                            : isEditingThis2
                                              ? 'text-white/80 hover:text-white cursor-pointer'
                                              : 'text-slate-400 hover:text-rose-600 hover:bg-white cursor-pointer',
                                        )}
                                        title={
                                          isDeadlineOpen
                                            ? 'Thao tác này chỉ khả dụng sau khi thời hạn đăng ký của sinh viên kết thúc.'
                                            : 'Gỡ bỏ GVHD 2'
                                        }
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ) : !isLocked ? (
                                <button
                                  type="button"
                                  disabled={isDeadlineOpen}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (isLocked || isDeadlineOpen) return
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
                                    'h-7 px-2.5 rounded-md border border-dashed transition flex items-center justify-center gap-1 text-[11.5px] font-semibold',
                                    isDeadlineOpen
                                      ? 'opacity-40 cursor-not-allowed border-slate-300 text-slate-400 bg-slate-50'
                                      : isEditingThis2
                                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs cursor-pointer'
                                        : 'border-purple-300 hover:border-purple-500 bg-white hover:bg-purple-50 text-purple-700 shadow-2xs cursor-pointer',
                                  )}
                                  title={
                                    isDeadlineOpen
                                      ? 'Thao tác này chỉ khả dụng sau khi thời hạn đăng ký của sinh viên kết thúc.'
                                      : 'Chỉ định GVHD 2'
                                  }
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
                            <td className="py-2.5 px-1 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSelectStudent(s.id)}
                                disabled={isLocked || isDeadlineOpen}
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                title={
                                  isDeadlineOpen
                                    ? 'Thao tác này chỉ khả dụng sau khi thời hạn đăng ký của sinh viên kết thúc.'
                                    : isLocked
                                      ? 'Danh sách đã khóa'
                                      : undefined
                                }
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

            <div
              className="inline-block shrink-0"
              title={canAssign ? 'Gán giảng viên cho sinh viên' : assignDisabledReason}
            >
              <button
                type="button"
                onClick={handleAssignAction}
                disabled={!canAssign}
                className={cn(
                  'h-9 px-4 rounded-lg text-white text-[13px] font-semibold transition shadow-xs flex items-center justify-center shrink-0',
                  canAssign
                    ? 'bg-[#1565C0] hover:bg-[#0D47A1] cursor-pointer'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed pointer-events-none',
                )}
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
                  !isDeadlineOpen &&
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-[500px] max-h-[calc(100vh-48px)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-900 leading-snug">
                    Xác nhận Khóa danh sách & Công bố chính thức
                  </h3>
                  <p className="text-[12px] text-slate-500 mt-0.5">
                    Năm học {year} ({semesterName})
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isSubmittingLock}
                onClick={() => setLockModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer hover:bg-slate-200/50 transition disabled:opacity-50"
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

              <div className="p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-emerald-950 text-[13px] leading-relaxed">
                Sau khi khóa danh sách, toàn bộ đơn duyệt hợp lệ sẽ được chuyển sang trạng thái chính thức, thông tin GVHD được cập nhật vào đề tài và hệ thống sẽ gửi thông báo đến toàn bộ sinh viên, giảng viên liên quan. Bạn có chắc chắn muốn thực hiện?
              </div>

              <div className="p-3 bg-amber-50/90 border border-amber-200/80 rounded-xl text-amber-900 leading-relaxed text-[12px]">
                <p className="font-bold flex items-center gap-1.5 text-amber-800 mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 inline-block" />
                  Lưu ý sau khi khóa:
                </p>
                <ul className="list-disc pl-5 space-y-0.5 text-slate-700 text-[11.5px]">
                  <li>Toàn bộ đơn đã được duyệt sẽ chuyển sang trạng thái chính thức.</li>
                  <li>Cập nhật GVHD vào đề tài và chuyển đề tài sang giai đoạn đã phân công GVHD.</li>
                  <li>Hệ thống gửi thông báo phân công chính thức đến sinh viên và giảng viên.</li>
                </ul>
              </div>
            </div>

            <div className="p-3.5 px-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isSubmittingLock}
                onClick={() => setLockModalOpen(false)}
                className="h-9 px-4 rounded-xl bg-white border border-slate-300 text-slate-700 text-[13px] font-semibold hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isSubmittingLock}
                onClick={handleConfirmLock}
                className="h-9 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmittingLock && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isSubmittingLock ? 'Đang khóa danh sách...' : 'Xác nhận khóa'}</span>
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
                disabled={isSubmittingUnlock}
                onClick={() => setUnlockModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer hover:bg-slate-200/50 transition disabled:opacity-50"
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
                disabled={isSubmittingUnlock}
                onClick={() => setUnlockModalOpen(false)}
                className="h-9 px-4 rounded-xl bg-white border border-slate-300 text-slate-700 text-[13px] font-semibold hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={isSubmittingUnlock}
                onClick={handleConfirmUnlock}
                className="h-9 px-5 rounded-xl bg-[#1565C0] hover:bg-[#0D47A1] text-white text-[13px] font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmittingUnlock && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isSubmittingUnlock ? 'Đang mở khóa...' : 'Xác nhận'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
