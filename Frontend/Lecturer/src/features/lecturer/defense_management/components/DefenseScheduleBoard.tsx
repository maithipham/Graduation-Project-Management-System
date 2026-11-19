import React, { useMemo, useState } from 'react'
import {
  Calendar,
  CalendarDays,
  Clock,
  CloudSun,
  Inbox,
  Lock,
  MapPin,
  Moon,
  Pencil,
  PlusCircle,
  RotateCcw,
  Sun,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  Input,
  Skeleton,
} from '@/shared/components/ui'
import {
  useCouncilDefenseSchedule,
  useBatchScheduleDefenseSlots,
  useUnscheduleDefenseSlot,
  useResetCouncilSchedule,
} from '../hooks/useDefenseSchedule'
import type { DefenseSlot, ScheduleBlockedReason } from '../types'
import {
  addMinutesToDateTime,
  combineDateAndTime,
  formatDateSlash,
  formatDayOfWeekDate,
  formatTimeSlot,
  parseIsoParts,
} from '../utils/defenseDateUtils'
import { ScheduleDefenseSlotDialog } from './ScheduleDefenseSlotDialog'

// Câu thông báo cho từng lý do không xếp được ca (scheduleBlockedReason từ backend)
const BLOCKED_REASON_MESSAGE: Record<ScheduleBlockedReason, string> = {
  NO_PERMISSION:
    'Vai trò của bạn trong Hội đồng không có quyền xếp, sửa và gỡ ca bảo vệ.',
  COUNCIL_NOT_PUBLISHED:
    'Hội đồng chưa được công bố (chưa đủ 5 thành viên), chưa thể xếp ca bảo vệ.',
  DEADLINE_NOT_CONFIGURED:
    'Ngành chưa thiết lập mốc "Thời gian tổ chức Hội đồng bảo vệ" cho học kỳ này, chưa thể xếp ca bảo vệ. Vui lòng liên hệ Trưởng ngành.',
}

export interface DefenseShift {
  id: string
  name: string
  date: string // YYYY-MM-DD
  startTime: string // HH:mm
  endTime: string // HH:mm
  iconType: 'sun' | 'cloud-sun' | 'moon' | 'clock'
  isCustom?: boolean
}

interface DefenseScheduleBoardProps {
  councilPublicId: string
}

export const DefenseScheduleBoard: React.FC<DefenseScheduleBoardProps> = ({
  councilPublicId,
}) => {
  const {
    data: scheduleData,
    isPending,
    isError,
  } = useCouncilDefenseSchedule(councilPublicId)

  // Mutations
  const batchScheduleMutation = useBatchScheduleDefenseSlots(councilPublicId)
  const unscheduleMutation = useUnscheduleDefenseSlot(councilPublicId)
  const resetScheduleMutation = useResetCouncilSchedule(councilPublicId)

  // State
  const [filterType, setFilterType] = useState<'all' | 'unassigned' | 'assigned'>('all')
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set())
  const [draggedStudentId, setDraggedStudentId] = useState<string | null>(null)
  const [dragOverShiftId, setDragOverShiftId] = useState<string | null>(null)

  // Dialog state
  const [editingStudent, setEditingStudent] = useState<DefenseSlot | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateShiftOpen, setIsCreateShiftOpen] = useState(false)
  const [newShiftName, setNewShiftName] = useState('')
  const [newShiftDate, setNewShiftDate] = useState('')
  const [newShiftStartTime, setNewShiftStartTime] = useState('08:00')
  const [newShiftEndTime, setNewShiftEndTime] = useState('11:30')

  // Xác định ngày mặc định của Hội đồng
  const defaultCouncilDate = useMemo(() => {
    // Chưa tải xong dữ liệu thì chưa xác định ngày (tránh tạo ca theo ngày hôm nay rồi giữ luôn)
    if (!scheduleData) return ''
    if (scheduleData.defenseStartTime) {
      return parseIsoParts(scheduleData.defenseStartTime)?.date ?? ''
    }
    if (scheduleData.deadlineStartAt) {
      return parseIsoParts(scheduleData.deadlineStartAt)?.date ?? ''
    }
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }, [scheduleData])

  // Danh sách các Ca bảo vệ mặc định (hoặc được tạo thêm)
  const [shifts, setShifts] = useState<DefenseShift[]>([])

  // Ngày đã dùng để tạo các ca mặc định lần trước
  const lastDefaultDateRef = React.useRef<string | null>(null)

  // Khởi tạo các Ca mặc định khi có ngày hội đồng.
  // Ngày hội đồng đổi (đổi Hội đồng / dữ liệu tải lại) thì chuyển các ca đang ở ngày cũ sang ngày mới.
  React.useEffect(() => {
    if (!defaultCouncilDate) return
    const oldDate = lastDefaultDateRef.current
    lastDefaultDateRef.current = defaultCouncilDate

    setShifts((prev) => {
      if (prev.length > 0) {
        if (oldDate && oldDate !== defaultCouncilDate) {
          return prev.map((shift) =>
            shift.date === oldDate ? { ...shift, date: defaultCouncilDate } : shift,
          )
        }
        return prev
      }
      return [
        {
          id: 'shift_sang',
          name: 'Ca Sáng',
          date: defaultCouncilDate,
          startTime: '08:00',
          endTime: '11:20',
          iconType: 'sun',
        },
        {
          id: 'shift_chieu',
          name: 'Ca Chiều',
          date: defaultCouncilDate,
          startTime: '13:30',
          endTime: '17:00',
          iconType: 'cloud-sun',
        },
        {
          id: 'shift_toi',
          name: 'Ca Tối',
          date: defaultCouncilDate,
          startTime: '18:00',
          endTime: '21:00',
          iconType: 'moon',
        },
      ]
    })
  }, [defaultCouncilDate])

  // Phân loại sinh viên theo ca
  // Hàm kiểm tra sinh viên có thuộc về ca nào
  const getStudentShiftId = (student: DefenseSlot): string | null => {
    if (!student.defenseStartTime) return null
    const parts = parseIsoParts(student.defenseStartTime)
    if (!parts) return null

    // 1. Tìm ca có cùng ngày và khoảng giờ bao gồm
    for (const shift of shifts) {
      if (shift.date === parts.date) {
        if (parts.time >= shift.startTime && parts.time < shift.endTime) {
          return shift.id
        }
      }
    }

    // 2. Phân loại theo buổi nếu cùng ngày
    for (const shift of shifts) {
      if (shift.date === parts.date) {
        if (shift.iconType === 'sun' && parts.hours < 12) return shift.id
        if (shift.iconType === 'cloud-sun' && parts.hours >= 12 && parts.hours < 18)
          return shift.id
        if (shift.iconType === 'moon' && parts.hours >= 18) return shift.id
      }
    }

    return null
  }

  // Tự động bổ sung ca nếu có sinh viên xếp ở ngày khác chưa có ca
  React.useEffect(() => {
    if (!scheduleData?.students) return
    const extraDates = new Set<string>()

    scheduleData.students.forEach((s) => {
      if (s.defenseStartTime) {
        const parts = parseIsoParts(s.defenseStartTime)
        if (parts && parts.date) {
          extraDates.add(parts.date)
        }
      }
    })

    setShifts((currentShifts) => {
      const existingDates = new Set(currentShifts.map((s) => s.date))
      const toAdd: DefenseShift[] = []

      extraDates.forEach((d) => {
        if (!existingDates.has(d)) {
          toAdd.push(
            {
              id: `shift_sang_${d}`,
              name: `Ca Sáng (${formatDateSlash(d)})`,
              date: d,
              startTime: '08:00',
              endTime: '11:20',
              iconType: 'sun',
            },
            {
              id: `shift_chieu_${d}`,
              name: `Ca Chiều (${formatDateSlash(d)})`,
              date: d,
              startTime: '13:30',
              endTime: '17:00',
              iconType: 'cloud-sun',
            },
          )
        }
      })

      return toAdd.length > 0 ? [...currentShifts, ...toAdd] : currentShifts
    })
  }, [scheduleData?.students])

  // Thống kê sinh viên
  const allStudents = scheduleData?.students ?? []
  const unassignedStudents = allStudents.filter((s) => !s.defenseStartTime)
  const assignedStudents = allStudents.filter((s) => Boolean(s.defenseStartTime))

  // Danh sách sinh viên hiển thị theo bộ lọc
  const filteredStudents = useMemo(() => {
    if (filterType === 'unassigned') return unassignedStudents
    if (filterType === 'assigned') return assignedStudents
    return allStudents
  }, [filterType, allStudents, unassignedStudents, assignedStudents])

  const isAllChecked =
    filteredStudents.length > 0 &&
    filteredStudents.every((s) => selectedStudentIds.has(s.defenseAssignmentPublicId))

  // Toggle chọn tất cả
  const handleToggleSelectAll = () => {
    if (isAllChecked) {
      setSelectedStudentIds((prev) => {
        const next = new Set(prev)
        filteredStudents.forEach((s) => next.delete(s.defenseAssignmentPublicId))
        return next
      })
    } else {
      setSelectedStudentIds((prev) => {
        const next = new Set(prev)
        filteredStudents.forEach((s) => next.add(s.defenseAssignmentPublicId))
        return next
      })
    }
  }

  // Toggle chọn 1 sinh viên
  const handleToggleStudent = (id: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Thuật toán tính giờ nối tiếp & xếp ca tuần tự
  const handleAssignStudentsToShift = (
    targetStudentIds: string[],
    shift: DefenseShift,
  ) => {
    if (targetStudentIds.length === 0) return

    // 1. Lấy danh sách SV trong ca này hiện tại (đã sắp xếp theo defenseStartTime)
    const studentsInShift = allStudents
      .filter((s) => getStudentShiftId(s) === shift.id)
      .sort((a, b) => {
        if (!a.defenseStartTime) return 1
        if (!b.defenseStartTime) return -1
        return a.defenseStartTime.localeCompare(b.defenseStartTime)
      })

    // 2. Xác định mốc giờ bắt đầu nối tiếp
    // Nếu ca đã có sinh viên: lấy defenseEndTime của sinh viên cuối cùng
    // Nếu ca chưa có sinh viên: lấy shift.startTime của ngày shift.date
    let curDate = shift.date
    let curTime = shift.startTime

    if (studentsInShift.length > 0) {
      const lastStudent = studentsInShift[studentsInShift.length - 1]
      if (lastStudent.defenseEndTime) {
        const endParts = parseIsoParts(lastStudent.defenseEndTime)
        if (endParts) {
          curDate = endParts.date
          curTime = endParts.time
        }
      }
    }

    // 3. Tìm tập hợp các slotOrder đã sử dụng trong toàn bộ Hội đồng
    const usedOrders = new Set<number>()
    allStudents.forEach((s) => {
      if (s.slotOrder && !targetStudentIds.includes(s.defenseAssignmentPublicId)) {
        usedOrders.add(s.slotOrder)
      }
    })

    let candidateOrder = 1

    // 4. Sinh danh sách ca cho từng sinh viên với thời lượng 30 phút nối tiếp
    const itemsToSchedule: Array<{
      defenseAssignmentPublicId: string
      data: {
        slotOrder: number
        defenseStartTime: string
        defenseEndTime: string
        room?: string | null
      }
    }> = []

    for (const studentId of targetStudentIds) {
      // Tìm slotOrder nhỏ nhất chưa ai dùng
      while (usedOrders.has(candidateOrder)) {
        candidateOrder++
      }
      usedOrders.add(candidateOrder)

      const startIso = combineDateAndTime(curDate, curTime)
      const nextSlot = addMinutesToDateTime(curDate, curTime, 30)

      itemsToSchedule.push({
        defenseAssignmentPublicId: studentId,
        data: {
          slotOrder: candidateOrder,
          defenseStartTime: startIso,
          defenseEndTime: nextSlot.iso,
          room: scheduleData?.location || null,
        },
      })

      // Bước tiếp theo lấy mốc kết thúc của ca vừa rồi
      curDate = nextSlot.dateStr
      curTime = nextSlot.timeStr
      candidateOrder++
    }

    // 5. Gọi mutation xếp ca tuần tự
    batchScheduleMutation.mutate(itemsToSchedule, {
      onSuccess: () => {
        setSelectedStudentIds((prev) => {
          const next = new Set(prev)
          targetStudentIds.forEach((id) => next.delete(id))
          return next
        })
      },
    })
  }

  // Thao tác Drag & Drop
  const handleDragStart = (
    e: React.DragEvent,
    defenseAssignmentPublicId: string,
  ) => {
    setDraggedStudentId(defenseAssignmentPublicId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', defenseAssignmentPublicId)
  }

  const handleDragOver = (e: React.DragEvent, shiftId: string) => {
    e.preventDefault()
    setDragOverShiftId(shiftId)
  }

  const handleDragLeave = () => {
    setDragOverShiftId(null)
  }

  const handleDrop = (e: React.DragEvent, shift: DefenseShift) => {
    e.preventDefault()
    setDragOverShiftId(null)

    const droppedId =
      e.dataTransfer.getData('text/plain') || draggedStudentId
    if (!droppedId) return

    // Nếu người dùng đang chọn nhiều sinh viên và kéo 1 trong số đó: gán tất cả sinh viên được chọn
    // Ngược lại: chỉ gán sinh viên được kéo
    const targetIds =
      selectedStudentIds.has(droppedId) && selectedStudentIds.size > 0
        ? Array.from(selectedStudentIds)
        : [droppedId]

    handleAssignStudentsToShift(targetIds, shift)
    setDraggedStudentId(null)
  }

  // Gỡ 1 sinh viên khỏi ca
  const handleRemoveStudentFromShift = (student: DefenseSlot) => {
    if (!scheduleData?.canSchedule || !student.canUnschedule) return
    if (
      confirm(
        `Xác nhận gỡ ca bảo vệ của sinh viên ${student.studentName} (${student.studentCode})?`,
      )
    ) {
      unscheduleMutation.mutate(student.defenseAssignmentPublicId)
    }
  }

  // Đặt lại toàn bộ lịch bảo vệ
  const handleResetAllSchedule = () => {
    if (!scheduleData?.canSchedule) return
    const scheduledIds = allStudents
      .filter((s) => s.defenseStartTime && s.canUnschedule)
      .map((s) => s.defenseAssignmentPublicId)

    if (scheduledIds.length === 0) return

    if (
      confirm(
        `Đặt lại toàn bộ lịch bảo vệ của ${scheduleData.code}? Tất cả ${scheduledIds.length} sinh viên đã xếp ca sẽ trở về trạng thái Chưa xếp ca.`,
      )
    ) {
      resetScheduleMutation.mutate(scheduledIds, {
        onSuccess: () => {
          setSelectedStudentIds(new Set())
        },
      })
    }
  }

  // Thêm ca bảo vệ mới
  const handleConfirmCreateShift = () => {
    const name = newShiftName.trim()
    if (!name) return

    const newShift: DefenseShift = {
      id: `shift_${Date.now()}`,
      name,
      date: newShiftDate.trim() || defaultCouncilDate,
      startTime: newShiftStartTime.trim() || '08:00',
      endTime: newShiftEndTime.trim() || '11:20',
      iconType: name.toLowerCase().includes('tối')
        ? 'moon'
        : name.toLowerCase().includes('chiều')
          ? 'cloud-sun'
          : 'sun',
      isCustom: true,
    }

    setShifts((prev) => [...prev, newShift])
    setIsCreateShiftOpen(false)
    setNewShiftName('')
  }

  // Xóa ca tự tạo
  const handleDeleteShift = (shiftId: string) => {
    const shift = shifts.find((s) => s.id === shiftId)
    if (!shift) return

    const studentsInThisShift = allStudents.filter(
      (s) => getStudentShiftId(s) === shiftId,
    )

    if (studentsInThisShift.length > 0) {
      if (
        !confirm(
          `Ca "${shift.name}" đang có ${studentsInThisShift.length} sinh viên đã xếp. Bạn có muốn gỡ tất cả sinh viên này về Chưa xếp ca và xóa ca không?`,
        )
      ) {
        return
      }
      // Gỡ sinh viên trong ca
      const idsToUnschedule = studentsInThisShift.map(
        (s) => s.defenseAssignmentPublicId,
      )
      resetScheduleMutation.mutate(idsToUnschedule)
    }

    setShifts((prev) => prev.filter((s) => s.id !== shiftId))
  }

  // Loading skeleton
  if (isPending) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4 xl:col-span-3.5 bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
          <Skeleton className="h-8 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
        <div className="lg:col-span-8 xl:col-span-8.5 bg-white border border-slate-200 rounded-2xl p-4 space-y-4">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  if (isError || !scheduleData) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-6 rounded-2xl">
        Không thể tải thông tin lịch bảo vệ của Hội đồng. Vui lòng kiểm tra lại quyền hạn hoặc thử lại sau.
      </div>
    )
  }

  const canEdit = scheduleData.canSchedule
  const isOperating =
    batchScheduleMutation.isPending ||
    unscheduleMutation.isPending ||
    resetScheduleMutation.isPending

  return (
    <div className="space-y-4">
      {/* Banner chỉ xem: hiện đúng lý do backend trả về */}
      {!canEdit && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Chế độ chỉ xem:</strong>{' '}
            {BLOCKED_REASON_MESSAGE[scheduleData.scheduleBlockedReason ?? 'NO_PERMISSION']}
          </span>
        </div>
      )}

      {/* Grid 2 Cột chuẩn mock hoiDong.js */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full min-h-0">
        {/* ========================================== */}
        {/* CỘT TRÁI: Danh sách sinh viên & Bộ lọc     */}
        {/* ========================================== */}
        <div className="lg:col-span-4 xl:col-span-3.5 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col overflow-hidden min-h-[560px]">
          {/* Top Filter Bar & Chọn tất cả */}
          <div className="px-3.5 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2 shrink-0">
            {/* 3 Tab Lọc */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-[#1565C0] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả ({allStudents.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('unassigned')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  filterType === 'unassigned'
                    ? 'bg-[#1565C0] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Chưa xếp ({unassignedStudents.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('assigned')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  filterType === 'assigned'
                    ? 'bg-[#1565C0] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Đã xếp ({assignedStudents.length})
              </button>
            </div>

            {/* Checkbox Chọn tất cả */}
            {canEdit && (
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer select-none shrink-0">
                <span>Chọn tất cả</span>
                <input
                  type="checkbox"
                  checked={isAllChecked}
                  onChange={handleToggleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 text-[#1565C0] focus:ring-[#1565C0] cursor-pointer"
                />
              </label>
            )}
          </div>

          {/* Danh sách thẻ Sinh viên (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y-0 min-h-0 max-h-[720px] scrollbar-thin scrollbar-thumb-slate-200">
            {filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs italic">
                Không có sinh viên nào trong mục này.
              </div>
            ) : (
              filteredStudents.map((sv) => {
                const isChecked = selectedStudentIds.has(
                  sv.defenseAssignmentPublicId,
                )
                const isAssigned = Boolean(sv.defenseStartTime)
                const timeParts = parseIsoParts(sv.defenseStartTime)
                const endTimeParts = parseIsoParts(sv.defenseEndTime)

                return (
                  <div
                    key={sv.defenseAssignmentPublicId}
                    draggable={canEdit && sv.canSchedule}
                    onDragStart={(e) =>
                      handleDragStart(e, sv.defenseAssignmentPublicId)
                    }
                    className={`bg-white border rounded-xl p-3 shadow-2xs transition space-y-1.5 relative group ${
                      canEdit && sv.canSchedule
                        ? 'cursor-grab active:cursor-grabbing'
                        : 'cursor-default'
                    } ${
                      isChecked
                        ? 'border-[#1565C0] bg-blue-50/30 ring-1 ring-[#1565C0]/40'
                        : 'border-slate-200 hover:border-[#1565C0]/70'
                    }`}
                  >
                    {/* Dòng 1: Tên SV, MSSV và Checkbox */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-extrabold text-[13px] text-slate-900 truncate">
                          {sv.studentName}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400 font-semibold shrink-0">
                          {sv.studentCode}
                        </span>
                      </div>
                      {canEdit && (
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() =>
                            handleToggleStudent(sv.defenseAssignmentPublicId)
                          }
                          className="w-4 h-4 rounded border-slate-300 text-[#1565C0] focus:ring-[#1565C0] cursor-pointer shrink-0"
                        />
                      )}
                    </div>

                    {/* Dòng 2: Tên đề tài */}
                    <div
                      className="text-[11.5px] text-slate-600 font-medium line-clamp-1 leading-snug"
                      title={sv.topicName ?? ''}
                    >
                      {sv.topicName || 'Chưa có tên đề tài'}
                    </div>

                    {/* Dòng 3: GVHD và Badge Trạng thái ca */}
                    <div className="flex items-center justify-between gap-2 pt-0.5 text-[11px]">
                      <div className="text-slate-500 truncate">
                        GVHD:{' '}
                        <b className="text-slate-700">
                          {sv.supervisorName || '—'}
                        </b>
                      </div>
                      <div>
                        {isAssigned ? (
                          <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                            {timeParts && endTimeParts
                              ? `${formatTimeSlot(timeParts.time)} - ${formatTimeSlot(endTimeParts.time)}`
                              : 'Đã xếp ca'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10.5px] font-medium bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                            Chưa xếp ca
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ========================================== */}
        {/* CỘT PHẢI: Quản lý Ca & Danh sách SV theo Ca*/}
        {/* ========================================== */}
        <div className="lg:col-span-8 xl:col-span-8.5 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col overflow-hidden min-h-[560px]">
          {/* Header Cột Phải: Thông tin Hội đồng + Nút Đặt lại + Nút Tạo ca */}
          <div className="px-5 py-3.5 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Thông tin HĐ */}
            <div className="flex items-center flex-wrap gap-2 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 font-extrabold text-slate-900 text-[13px]">
                <Calendar className="w-4 h-4 text-[#1565C0]" />
                <span>{scheduleData.code}</span>
              </div>
              <span className="text-slate-300">·</span>
              <div className="flex items-center gap-1 font-semibold text-slate-600">
                <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {formatDateSlash(scheduleData.defenseStartTime)} -{' '}
                  {formatDateSlash(scheduleData.defenseEndTime) ||
                    formatDateSlash(scheduleData.deadlineEndAt) ||
                    '28/06/2026'}
                </span>
              </div>
              <span className="text-slate-300">·</span>
              <div className="flex items-center gap-1 font-semibold text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>
                  {scheduleData.location || 'Phòng Hội thảo 302 - Nhà T45'}
                </span>
              </div>
            </div>

            {/* Actions: Đặt lại & Tạo ca bảo vệ */}
            {canEdit && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetAllSchedule}
                  disabled={isOperating || assignedStudents.length === 0}
                  className="h-8.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 transition shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Đặt lại</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewShiftName('')
                    setNewShiftDate(defaultCouncilDate)
                    setNewShiftStartTime('08:00')
                    setNewShiftEndTime('11:20')
                    setIsCreateShiftOpen(true)
                  }}
                  disabled={isOperating}
                  className="h-8.5 px-3.5 rounded-xl bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Tạo ca bảo vệ</span>
                </button>
              </div>
            )}
          </div>

          {/* Danh sách các Ca bảo vệ (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 min-h-0 max-h-[720px] scrollbar-thin scrollbar-thumb-slate-200">
            {shifts.map((shift) => {
              const shiftStudents = allStudents
                .filter((s) => getStudentShiftId(s) === shift.id)
                .sort((a, b) => {
                  if (!a.defenseStartTime) return 1
                  if (!b.defenseStartTime) return -1
                  return a.defenseStartTime.localeCompare(b.defenseStartTime)
                })

              const isOver = dragOverShiftId === shift.id

              const iconEl =
                shift.iconType === 'sun' ? (
                  <Sun className="w-4.5 h-4.5 text-amber-600" />
                ) : shift.iconType === 'cloud-sun' ? (
                  <CloudSun className="w-4.5 h-4.5 text-[#1565C0]" />
                ) : shift.iconType === 'moon' ? (
                  <Moon className="w-4.5 h-4.5 text-purple-600" />
                ) : (
                  <Clock className="w-4.5 h-4.5 text-slate-600" />
                )

              const iconBgClass =
                shift.iconType === 'sun'
                  ? 'bg-amber-50 border-amber-200'
                  : shift.iconType === 'cloud-sun'
                    ? 'bg-sky-50 border-sky-200'
                    : shift.iconType === 'moon'
                      ? 'bg-purple-50 border-purple-200'
                      : 'bg-slate-100 border-slate-200'

              return (
                <div
                  key={shift.id}
                  className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden transition"
                >
                  {/* Top bar của Ca */}
                  <div className="px-4 sm:px-5 py-3.5 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    {/* Icon + Tên Ca + Đang xếp X SV */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl border ${iconBgClass} flex items-center justify-center font-bold text-sm shrink-0`}
                      >
                        {iconEl}
                      </div>
                      <div>
                        <div className="font-extrabold text-[13.5px] text-slate-900">
                          {shift.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          Đang xếp: <b>{shiftStudents.length} SV</b>
                        </div>
                      </div>
                    </div>

                    {/* Ngày & Khung giờ */}
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDayOfWeekDate(shift.date)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400 font-mono text-xs">
                        <span className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold">
                          {formatTimeSlot(shift.startTime)}
                        </span>
                        <span>-</span>
                        <span className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold">
                          {formatTimeSlot(shift.endTime)}
                        </span>
                      </div>
                    </div>

                    {/* Hành động: Nút Gán vào Ca & Nút Xóa ca */}
                    {canEdit && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedStudentIds.size === 0) {
                              alert(
                                'Vui lòng tích chọn ít nhất 1 sinh viên bên cột trái trước khi gán ca.',
                              )
                              return
                            }
                            handleAssignStudentsToShift(
                              Array.from(selectedStudentIds),
                              shift,
                            )
                          }}
                          disabled={isOperating || selectedStudentIds.size === 0}
                          className="h-8.5 px-3.5 rounded-xl bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 transition shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Gán vào {shift.name}</span>
                        </button>
                        {shift.isCustom && (
                          <button
                            type="button"
                            onClick={() => handleDeleteShift(shift.id)}
                            className="w-8.5 h-8.5 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center cursor-pointer transition"
                            title="Xóa ca này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Drop Zone chứa danh sách sinh viên của Ca */}
                  <div
                    onDragOver={(e) => handleDragOver(e, shift.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, shift)}
                    className={`p-3.5 sm:p-4 min-h-[90px] transition ${
                      isOver
                        ? 'bg-blue-50/70 ring-2 ring-[#1565C0]/40 rounded-b-2xl'
                        : ''
                    }`}
                  >
                    {shiftStudents.length === 0 ? (
                      <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                        <Inbox className="w-4 h-4 text-slate-300" />
                        <span>
                          Chưa có SV nào. Tích chọn SV bên trái rồi bấm{' '}
                          <b>[Gán vào {shift.name}]</b> hoặc kéo thả vào đây.
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {shiftStudents.map((sv, sIdx) => {
                          const startParts = parseIsoParts(sv.defenseStartTime)
                          const endParts = parseIsoParts(sv.defenseEndTime)

                          return (
                            <div
                              key={sv.defenseAssignmentPublicId}
                              draggable={canEdit && sv.canSchedule}
                              onDragStart={(e) =>
                                handleDragStart(
                                  e,
                                  sv.defenseAssignmentPublicId,
                                )
                              }
                              className={`bg-slate-50 border border-slate-200/90 rounded-xl p-3 flex items-center justify-between gap-3 hover:bg-white hover:border-[#1565C0] hover:shadow-2xs transition group ${
                                canEdit && sv.canSchedule
                                  ? 'cursor-grab active:cursor-grabbing'
                                  : 'cursor-default'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="w-6 h-6 rounded-lg bg-blue-100 text-[#1565C0] text-xs font-extrabold flex items-center justify-center shrink-0">
                                  {sv.slotOrder ?? sIdx + 1}
                                </span>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-extrabold text-[13px] text-slate-900 truncate">
                                      {sv.studentName}
                                    </span>
                                    <span className="font-mono text-xs text-slate-500 shrink-0">
                                      ({sv.studentCode})
                                    </span>
                                    {startParts && endParts && (
                                      <span className="px-2 py-0.5 rounded bg-blue-50 text-[#1565C0] font-mono text-[11px] font-bold border border-blue-200 shrink-0">
                                        {formatTimeSlot(startParts.time)} -{' '}
                                        {formatTimeSlot(endParts.time)}
                                      </span>
                                    )}
                                    {sv.room && (
                                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10.5px] border border-slate-200">
                                        {sv.room}
                                      </span>
                                    )}
                                  </div>
                                  <div
                                    className="text-[11.5px] text-slate-600 truncate mt-0.5"
                                    title={sv.topicName ?? ''}
                                  >
                                    {sv.topicName || 'Chưa có tên đề tài'}{' '}
                                    <span className="text-slate-400">
                                      · GVHD: {sv.supervisorName || '—'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Hành động sửa ca & gỡ ca */}
                              {canEdit && (
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingStudent(sv)
                                      setIsEditDialogOpen(true)
                                    }}
                                    className="w-7 h-7 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-[#1565C0] flex items-center justify-center cursor-pointer transition"
                                    title="Sửa ca bảo vệ"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  {sv.canUnschedule && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRemoveStudentFromShift(sv)
                                      }
                                      className="w-7 h-7 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 flex items-center justify-center cursor-pointer transition"
                                      title="Gỡ khỏi ca"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Modal Sửa ca bảo vệ cho sinh viên */}
      <ScheduleDefenseSlotDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        councilPublicId={councilPublicId}
        student={editingStudent}
        defaultRoom={scheduleData.location}
        councilStartTime={scheduleData.defenseStartTime}
        councilEndTime={scheduleData.defenseEndTime}
        deadlineStartAt={scheduleData.deadlineStartAt}
        deadlineEndAt={scheduleData.deadlineEndAt}
      />

      {/* Modal Tạo ca bảo vệ mới */}
      <Dialog open={isCreateShiftOpen} onOpenChange={setIsCreateShiftOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-[#1565C0]" />
              <span>Tạo ca bảo vệ mới</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Thêm khối ca bảo vệ vào Hội đồng để phân công sinh viên.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 pt-1">
            <FormField label="Tên ca bảo vệ" required>
              <Input
                type="text"
                value={newShiftName}
                onChange={(e) => setNewShiftName(e.target.value)}
                placeholder="Ví dụ: Ca Tối, Ca Sáng ngày 2..."
                className="w-full text-xs"
              />
            </FormField>

            <FormField label="Ngày diễn ra" required>
              <Input
                type="date"
                value={newShiftDate}
                onChange={(e) => setNewShiftDate(e.target.value)}
                className="w-full text-xs"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Giờ bắt đầu" required>
                <Input
                  type="time"
                  value={newShiftStartTime}
                  onChange={(e) => setNewShiftStartTime(e.target.value)}
                  className="w-full text-xs"
                />
              </FormField>
              <FormField label="Giờ kết thúc" required>
                <Input
                  type="time"
                  value={newShiftEndTime}
                  onChange={(e) => setNewShiftEndTime(e.target.value)}
                  className="w-full text-xs"
                />
              </FormField>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateShiftOpen(false)}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleConfirmCreateShift}
              disabled={!newShiftName.trim()}
              className="text-xs bg-[#1565C0] hover:bg-[#0D47A1] text-white"
            >
              Tạo ca
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
