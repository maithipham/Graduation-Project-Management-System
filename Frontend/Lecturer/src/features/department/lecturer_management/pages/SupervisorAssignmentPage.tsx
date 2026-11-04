import { useState, useMemo, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/shared/components/feedback'
import { useMajors } from '@/features/department/student_management'
import {
  supervisorService,
  toSupervisorStudentFromWorkspace,
  toSupervisorLecturerFromWorkspace,
} from '../services/supervisor.service'
import type { SupervisorLecturer } from '../types'
import { SupervisorOverviewView } from '../components/SupervisorOverviewView'
import { SupervisorWorkspaceView } from '../components/SupervisorWorkspaceView'
import { useSemesterScope } from '../hooks/useSemesterScope'
import { useManagedMajor } from '../hooks/useTeachers'

export default function SupervisorAssignmentPage() {
  const [view, setView] = useState<'overview' | 'workspace'>('overview')
  const {
    academicYears,
    termsOfYear,
    selectedYear,
    selectedSemesterId,
    activeSemesterId,
    activeSemester,
    isLoading: semestersLoading,
    onYearChange,
    onSemesterChange,
  } = useSemesterScope()

  const { data: majors } = useMajors()
  const { data: managedMajor } = useManagedMajor()
  const queryClient = useQueryClient()

  const effectiveSemesterId = useMemo(() => {
    if (selectedSemesterId && selectedSemesterId !== 'all') {
      return selectedSemesterId
    }
    if (activeSemesterId && activeSemesterId !== 'all') {
      return activeSemesterId
    }
    const matchedInYear = termsOfYear.find(
      (t) =>
        t.publicId &&
        t.publicId !== 'all' &&
        (selectedYear === 'all' || t.academicYear === selectedYear),
    )
    if (matchedInYear?.publicId) {
      return matchedInYear.publicId
    }
    return activeSemester?.publicId || ''
  }, [selectedSemesterId, activeSemesterId, termsOfYear, selectedYear, activeSemester])

  const currentTerm = useMemo(() => {
    return (
      termsOfYear.find(
        (t) =>
          t.publicId === effectiveSemesterId ||
          String(t.id) === effectiveSemesterId ||
          t.publicId === selectedSemesterId,
      ) ?? activeSemester
    )
  }, [termsOfYear, effectiveSemesterId, selectedSemesterId, activeSemester])

  const termName = currentTerm
    ? currentTerm.term || currentTerm.name
    : selectedSemesterId === 'all'
      ? 'Tất cả học kỳ'
      : 'HK2'

  // Query Workspace từ backend theo học kỳ cụ thể của kỳ này
  const {
    data: workspace,
    isLoading: workspaceLoading,
  } = useQuery({
    queryKey: ['advisor-workspace', effectiveSemesterId],
    queryFn: () => supervisorService.getWorkspace(effectiveSemesterId),
    enabled: !!effectiveSemesterId,
    retry: false,
  })

  // Fallback nếu workspace chưa có dữ liệu (chỉ lấy GVHD được phân công trong kỳ này)
  const { data: remoteLecturers = [], isLoading: lecturersLoading } = useQuery({
    queryKey: ['supervisors', effectiveSemesterId, managedMajor?.name],
    queryFn: () => supervisorService.getSupervisors(effectiveSemesterId, undefined, managedMajor?.name),
    enabled: !workspace && !!effectiveSemesterId,
    retry: false,
  })

  const { data: fallbackStudents = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['supervisor-students', effectiveSemesterId],
    queryFn: () => supervisorService.getStudents(effectiveSemesterId),
    enabled: !workspace && !!effectiveSemesterId,
    retry: false,
  })

  const [quotaOverrides, setQuotaOverrides] = useState<Record<string, number>>({})

  // Danh sách giảng viên
  const lecturers = useMemo(() => {
    let list: SupervisorLecturer[] = []
    if (workspace && Array.isArray(workspace.lecturers) && workspace.lecturers.length > 0) {
      list = workspace.lecturers.map((l) =>
        toSupervisorLecturerFromWorkspace(l, termName, selectedYear, managedMajor?.name),
      )
    } else {
      list = remoteLecturers
    }

    return list.map((l) => ({
      ...l,
      quota: quotaOverrides[l.id] ?? l.quota,
    }))
  }, [workspace, remoteLecturers, quotaOverrides, termName, selectedYear, managedMajor?.name])

  // Danh sách sinh viên
  const students = useMemo(() => {
    if (workspace && Array.isArray(workspace.students)) {
      return workspace.students.map((s) =>
        toSupervisorStudentFromWorkspace(s, termName, selectedYear),
      )
    }
    return fallbackStudents
  }, [workspace, fallbackStudents, termName, selectedYear])

  // Storage key cho trạng thái khóa của kỳ / năm học hiện tại
  const lockStorageKey = useMemo(() => {
    return `tbm_assignment_locked_${selectedYear}_${selectedSemesterId || 'current'}`
  }, [selectedYear, selectedSemesterId])

  // Trạng thái khóa cục bộ kết hợp với localStorage và dữ liệu backend
  const [localLockOverride, setLocalLockOverride] = useState<boolean | null>(() => {
    try {
      const saved = localStorage.getItem(`tbm_assignment_locked_${selectedYear}_${selectedSemesterId || 'current'}`)
      return saved !== null ? saved === 'true' : null
    } catch {
      return null
    }
  })

  const [localLockedAt, setLocalLockedAt] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`tbm_assignment_locked_at_${selectedYear}_${selectedSemesterId || 'current'}`)
    } catch {
      return null
    }
  })

  const [localLockedBy, setLocalLockedBy] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`tbm_assignment_locked_by_${selectedYear}_${selectedSemesterId || 'current'}`)
    } catch {
      return null
    }
  })

  // Cập nhật local state khi người dùng đổi năm hoặc kỳ
  useEffect(() => {
    try {
      const saved = localStorage.getItem(lockStorageKey)
      setLocalLockOverride(saved !== null ? saved === 'true' : null)
      setLocalLockedAt(
        localStorage.getItem(`tbm_assignment_locked_at_${selectedYear}_${selectedSemesterId || 'current'}`),
      )
      setLocalLockedBy(
        localStorage.getItem(`tbm_assignment_locked_by_${selectedYear}_${selectedSemesterId || 'current'}`),
      )
    } catch {
      setLocalLockOverride(null)
      setLocalLockedAt(null)
      setLocalLockedBy(null)
    }
  }, [lockStorageKey, selectedYear, selectedSemesterId])

  // Khi dữ liệu backend workspace trả về
  useEffect(() => {
    if (workspace && typeof workspace.isLocked === 'boolean' && localLockOverride === null) {
      setLocalLockOverride(workspace.isLocked)
      if (workspace.lockedAt) setLocalLockedAt(workspace.lockedAt)
      if (workspace.lockedByName) setLocalLockedBy(workspace.lockedByName)
    }
  }, [workspace, localLockOverride])

  const isLocked = localLockOverride ?? workspace?.isLocked ?? false
  const lockedAt = localLockedAt ?? workspace?.lockedAt ?? null
  const lockedByName = localLockedBy ?? workspace?.lockedByName ?? null
  const counts = workspace?.counts

  const handleUpdateQuota = async (id: string, quota: number) => {
    const target = lecturers.find((l) => l.id === id)
    const targetIdentifier =
      target?.teacherId ??
      target?.advisorId ??
      target?.teacherCode ??
      target?.teacherPublicId ??
      id

    setQuotaOverrides((prev) => ({ ...prev, [id]: quota }))
    try {
      await supervisorService.updateLecturerQuota({
        teacherOrAdvisorId: targetIdentifier,
        quota,
        semesterId: effectiveSemesterId,
      })
      toast.success('Cập nhật chỉ tiêu thành công')
      queryClient.invalidateQueries({ queryKey: ['advisor-workspace'] })
      queryClient.invalidateQueries({ queryKey: ['supervisors'] })
    } catch {
      setQuotaOverrides((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      toast.error('Không thể cập nhật hạn mức giáo viên hướng dẫn')
    }
  }

  const handleRemoveLecturer = (_id: string) => {
    toast.info('Chức năng hủy phân công GVHD đang chờ Backend hoàn thiện endpoint xóa.')
  }

  const handleAssignStudents = async (studentIds: string[], supervisor: SupervisorLecturer) => {
    const targetTeacherId = supervisor.teacherPublicId || supervisor.id
    try {
      await supervisorService.assignAdvisor(effectiveSemesterId, studentIds, targetTeacherId)
      toast.success(`Đã phân công ${studentIds.length} sinh viên cho ${supervisor.name} thành công!`)
      queryClient.invalidateQueries({ queryKey: ['advisor-workspace'] })
      queryClient.invalidateQueries({ queryKey: ['supervisors'] })
      queryClient.invalidateQueries({ queryKey: ['supervisor-students'] })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Không thể phân công sinh viên cho giảng viên'
      toast.error(msg)
    }
  }

  const handleApproveRegistrations = async (registrationPublicIds: string[]) => {
    try {
      await supervisorService.approveRegistrations(effectiveSemesterId, registrationPublicIds)
      toast.success(`Đã phê duyệt thành công ${registrationPublicIds.length} sinh viên!`)
      queryClient.invalidateQueries({ queryKey: ['advisor-workspace'] })
      queryClient.invalidateQueries({ queryKey: ['supervisors'] })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Không thể phê duyệt đơn phân công'
      toast.error(msg)
    }
  }

  const handleRejectRegistrations = async (registrationPublicIds: string[]) => {
    try {
      await supervisorService.rejectRegistrations(effectiveSemesterId, registrationPublicIds)
      toast.info(`Đã từ chối ${registrationPublicIds.length} sinh viên và đưa về danh mục Chưa nhận GV.`)
      queryClient.invalidateQueries({ queryKey: ['advisor-workspace'] })
      queryClient.invalidateQueries({ queryKey: ['supervisors'] })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Không thể từ chối đơn phân công'
      toast.error(msg)
    }
  }

  const handleChangeSupervisor = async (studentId: string, newSupervisor: SupervisorLecturer) => {
    const newTeacherId = newSupervisor.teacherPublicId || newSupervisor.id
    try {
      await supervisorService.changeSupervisor(effectiveSemesterId, studentId, newTeacherId)
      toast.success(`Đã đổi GVHD 1 sang ${newSupervisor.name} thành công!`)
      queryClient.invalidateQueries({ queryKey: ['advisor-workspace'] })
      queryClient.invalidateQueries({ queryKey: ['supervisors'] })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Không thể thay đổi giảng viên hướng dẫn'
      toast.error(msg)
    }
  }

  const handleChangeCoSupervisor = async (
    studentId: string,
    coSupervisor: SupervisorLecturer | null,
  ) => {
    const coTeacherId = coSupervisor ? coSupervisor.teacherPublicId || coSupervisor.id : null
    try {
      await supervisorService.changeCoSupervisor(effectiveSemesterId, studentId, coTeacherId)
      if (coSupervisor) {
        toast.success(`Đã gán ${coSupervisor.name} làm GVHD 2 thành công!`)
      } else {
        toast.info('Đã gỡ bỏ GVHD 2 của sinh viên thành công.')
      }
      queryClient.invalidateQueries({ queryKey: ['advisor-workspace'] })
      queryClient.invalidateQueries({ queryKey: ['supervisors'] })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Không thể cập nhật giảng viên đồng hướng dẫn'
      toast.error(msg)
    }
  }

  const handleToggleLock = async (nextLockState: boolean) => {
    const nowStr = new Date().toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

    setLocalLockOverride(nextLockState)
    if (nextLockState) {
      setLocalLockedAt(nowStr)
      setLocalLockedBy('Trưởng bộ môn')
      try {
        localStorage.setItem(lockStorageKey, 'true')
        localStorage.setItem(
          `tbm_assignment_locked_at_${selectedYear}_${selectedSemesterId || 'current'}`,
          nowStr,
        )
        localStorage.setItem(
          `tbm_assignment_locked_by_${selectedYear}_${selectedSemesterId || 'current'}`,
          'Trưởng bộ môn',
        )
      } catch {}
      toast.success('Đã khóa danh sách phân công GVHD thành công!')
    } else {
      setLocalLockedAt(null)
      setLocalLockedBy(null)
      try {
        localStorage.setItem(lockStorageKey, 'false')
        localStorage.removeItem(
          `tbm_assignment_locked_at_${selectedYear}_${selectedSemesterId || 'current'}`,
        )
        localStorage.removeItem(
          `tbm_assignment_locked_by_${selectedYear}_${selectedSemesterId || 'current'}`,
        )
      } catch {}
      toast.info('Đã mở khóa danh sách phân công. Bạn có thể chỉnh sửa GVHD 1 và 2.')
    }

    try {
      await supervisorService.toggleLockAssignment(effectiveSemesterId, nextLockState)
      queryClient.invalidateQueries({ queryKey: ['advisor-workspace'] })
    } catch (err: unknown) {
      console.warn('Backend toggleLockAssignment warning:', err)
    }
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {view === 'overview' ? (
        <SupervisorOverviewView
          lecturers={lecturers}
          students={students}
          majors={majors}
          selectedYear={selectedYear}
          selectedSemesterId={selectedSemesterId}
          academicYears={academicYears}
          termsOfYear={termsOfYear}
          isLoading={semestersLoading || workspaceLoading || lecturersLoading || studentsLoading}
          onYearChange={onYearChange}
          onSemesterChange={onSemesterChange}
          onUpdateQuota={handleUpdateQuota}
          onRemoveLecturer={handleRemoveLecturer}
          onOpenWorkspace={() => {
            if (selectedSemesterId === 'all' && effectiveSemesterId) {
              onSemesterChange(effectiveSemesterId)
            }
            setView('workspace')
          }}
        />
      ) : (
        <SupervisorWorkspaceView
          lecturers={lecturers}
          students={students}
          year={selectedYear}
          semesterName={termName}
          selectedSemesterId={selectedSemesterId === 'all' ? effectiveSemesterId : selectedSemesterId}
          academicYears={academicYears}
          termsOfYear={termsOfYear}
          onYearChange={onYearChange}
          onSemesterChange={onSemesterChange}
          isLocked={isLocked}
          lockedAt={lockedAt}
          lockedByName={lockedByName}
          counts={counts}
          isLoading={workspaceLoading}
          onBack={() => setView('overview')}
          onAssignStudents={handleAssignStudents}
          onApproveRegistrations={handleApproveRegistrations}
          onRejectRegistrations={handleRejectRegistrations}
          onChangeSupervisor={handleChangeSupervisor}
          onChangeCoSupervisor={handleChangeCoSupervisor}
          onToggleLock={handleToggleLock}
        />
      )}
    </div>
  )
}
