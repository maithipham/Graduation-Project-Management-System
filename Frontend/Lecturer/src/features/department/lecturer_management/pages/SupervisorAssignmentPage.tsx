import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/shared/components/feedback'
import { useMajors } from '@/features/department/student_management'
import { supervisorService } from '../services/supervisor.service'
import type { SupervisorLecturer } from '../types'
import { SupervisorOverviewView } from '../components/SupervisorOverviewView'
import { SupervisorWorkspaceView } from '../components/SupervisorWorkspaceView'
import { useSemesterScope } from '../hooks/useSemesterScope'

export default function SupervisorAssignmentPage() {
  const [view, setView] = useState<'overview' | 'workspace'>('overview')
  const {
    academicYears,
    termsOfYear,
    selectedYear,
    selectedSemesterId,
    activeSemesterId,
    isLoading: semestersLoading,
    onYearChange,
    onSemesterChange,
  } = useSemesterScope()

  const { data: majors } = useMajors()
  const queryClient = useQueryClient()

  const querySemesterId =
    selectedSemesterId === 'all' || selectedYear === 'all'
      ? undefined
      : (selectedSemesterId || activeSemesterId)

  const { data: remoteLecturers = [], isLoading: lecturersLoading } = useQuery({
    queryKey: ['supervisors', querySemesterId],
    queryFn: () => supervisorService.getSupervisors(querySemesterId),
    retry: false,
  })

  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['supervisor-students', querySemesterId],
    queryFn: () => supervisorService.getStudents(querySemesterId),
    enabled: !!querySemesterId,
    retry: false,
  })

  const [quotaOverrides, setQuotaOverrides] = useState<Record<string, number>>({})

  const lecturers = useMemo(() => {
    return remoteLecturers.map((l) => ({
      ...l,
      quota: quotaOverrides[l.id] ?? l.quota,
    }))
  }, [remoteLecturers, quotaOverrides])

  const handleUpdateQuota = async (id: string, quota: number) => {
    const target = lecturers.find((l) => l.id === id)
    const targetIdentifier =
      target?.teacherId ??
      target?.advisorId ??
      target?.teacherCode ??
      target?.teacherPublicId ??
      id
    const effectiveSemesterId = querySemesterId || activeSemesterId

    setQuotaOverrides((prev) => ({ ...prev, [id]: quota }))
    try {
      await supervisorService.updateLecturerQuota({
        teacherOrAdvisorId: targetIdentifier,
        quota,
        semesterId: effectiveSemesterId,
      })
      toast.success('Cập nhật chỉ tiêu thành công')
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
    toast.info('Chức năng hủy phân công GVHD đang chờ Backend cung cấp API.')
  }

  const handleAssignStudents = (
    _studentIds: string[],
    _supervisor: SupervisorLecturer,
  ) => {
    toast.info('Chức năng phân công sinh viên cho GVHD đang chờ Backend cung cấp API.')
  }

  const handleChangeSupervisor = (
    _studentId: string,
    _newSupervisor: SupervisorLecturer,
    _slot: 1 | 2 = 1,
  ) => {
    toast.info('Chức năng đổi GVHD đang chờ Backend cung cấp API.')
  }

  return (
    <div className="space-y-4">
      {view === 'overview' ? (
        <SupervisorOverviewView
          lecturers={lecturers}
          students={students}
          majors={majors}
          selectedYear={selectedYear}
          selectedSemesterId={selectedSemesterId}
          academicYears={academicYears}
          termsOfYear={termsOfYear}
          isLoading={semestersLoading || lecturersLoading || studentsLoading}
          onYearChange={onYearChange}
          onSemesterChange={onSemesterChange}
          onUpdateQuota={handleUpdateQuota}
          onRemoveLecturer={handleRemoveLecturer}
          onOpenWorkspace={() => setView('workspace')}
        />
      ) : (
        <SupervisorWorkspaceView
          lecturers={lecturers}
          students={students}
          onBack={() => setView('overview')}
          onAssignStudents={handleAssignStudents}
          onChangeSupervisor={handleChangeSupervisor}
        />
      )}
    </div>
  )
}

