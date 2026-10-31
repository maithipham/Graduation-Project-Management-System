import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from '@/shared/components/feedback'
import { useMajors, useBatches } from '@/features/department/student_management'
import { reviewerService } from '../services/reviewer.service'
import type { ReviewerFilters } from '../types'
import { ReviewerToolbar } from '../components/ReviewerToolbar'
import { ReviewerTable } from '../components/ReviewerTable'
import { useSemesterScope } from '../hooks/useSemesterScope'

export default function ReviewerAssignmentPage() {
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

  const querySemesterId =
    selectedSemesterId === 'all' || selectedYear === 'all'
      ? undefined
      : (selectedSemesterId || activeSemesterId)

  const { data: majors } = useMajors()
  const { data: batches } = useBatches({ semesterId: querySemesterId })

  const { data: remoteStudents = [], isLoading: _studentsLoading } = useQuery({
    queryKey: ['reviewer-students', querySemesterId],
    queryFn: () => reviewerService.getStudents(querySemesterId),
    enabled: true,
  })

  const { data: lecturers = [], isLoading: _lecturersLoading } = useQuery({
    queryKey: ['reviewer-lecturers', querySemesterId],
    queryFn: () => reviewerService.getLecturers(querySemesterId),
    enabled: true,
  })

  const [reviewerOverrides, setReviewerOverrides] = useState<
    Record<string, { reviewerId: string | null; reviewerName: string | null }>
  >({})

  const students = useMemo(() => {
    return remoteStudents.map((s) => {
      const override = reviewerOverrides[s.id]
      if (override) {
        return {
          ...s,
          reviewerId: override.reviewerId,
          reviewerName: override.reviewerName,
        }
      }
      return s
    })
  }, [remoteStudents, reviewerOverrides])

  const [filters, setFilters] = useState<ReviewerFilters>({
    search: '',
    department: 'all',
    batch: 'all',
    className: 'all',
    status: 'all',
  })

  const [page, setPage] = useState(0)
  const pageSize = 15

  const handleFilterChange = (patch: Partial<ReviewerFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }))
    setPage(0)
  }

  // Lấy danh sách lớp duy nhất từ danh sách sinh viên
  const uniqueClasses = useMemo(() => {
    return Array.from(new Set(students.map((s) => s.className).filter(Boolean))).sort()
  }, [students])

  // Thống kê
  const totalTopics = useMemo(() => students.filter((s) => s.topic).length, [students])
  const reviewedTopics = useMemo(() => students.filter((s) => s.reviewerId).length, [students])

  // Lọc
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (filters.search.trim()) {
        const q = filters.search.trim().toLowerCase()
        const mCode = s.code.toLowerCase().includes(q)
        const mName = s.name.toLowerCase().includes(q)
        const mTopic = (s.topic || '').toLowerCase().includes(q)
        if (!mCode && !mName && !mTopic) return false
      }

      if (filters.department !== 'all' && s.department !== filters.department) {
        return false
      }

      if (filters.batch !== 'all' && s.batch !== filters.batch) {
        return false
      }

      if (filters.className !== 'all' && s.className !== filters.className) {
        return false
      }

      if (filters.status === 'assigned' && !s.reviewerId) return false
      if (filters.status === 'unassigned' && !!s.reviewerId) return false

      return true
    })
  }, [students, filters])

  const totalElements = filteredStudents.length
  const pagedStudents = useMemo(() => {
    return filteredStudents.slice(page * pageSize, (page + 1) * pageSize)
  }, [filteredStudents, page, pageSize])

  const handleAssignReviewer = (studentId: string, reviewerId: string | null) => {
    const reviewer = reviewerId ? lecturers.find((l) => l.id === reviewerId) : null
    setReviewerOverrides((prev) => ({
      ...prev,
      [studentId]: {
        reviewerId: reviewer ? reviewer.id : null,
        reviewerName: reviewer ? reviewer.name : null,
      },
    }))

    const st = students.find((s) => s.id === studentId)
    if (reviewerId && reviewer && st) {
      toast.info(`Đã chọn ${reviewer.name} nhận xét cho ${st.name} (chờ Backend cung cấp API lưu).`)
    } else if (st) {
      toast.info(`Đã bỏ người nhận xét của sinh viên ${st.name}.`)
    }
  }

  return (
    <div className="space-y-4">
      <ReviewerToolbar
        filters={filters}
        onChange={handleFilterChange}
        totalTopics={totalTopics}
        reviewedTopics={reviewedTopics}
        majors={majors}
        batches={batches}
        classes={uniqueClasses}
        selectedYear={selectedYear}
        selectedSemesterId={selectedSemesterId}
        academicYears={academicYears}
        termsOfYear={termsOfYear}
        isLoadingSemesters={semestersLoading}
        onYearChange={(y) => {
          onYearChange(y)
          setPage(0)
        }}
        onSemesterChange={(s) => {
          onSemesterChange(s)
          setPage(0)
        }}
      />

      <ReviewerTable
        students={pagedStudents}
        lecturers={lecturers}
        page={page}
        pageSize={pageSize}
        totalElements={totalElements}
        onPageChange={setPage}
        onAssignReviewer={handleAssignReviewer}
      />
    </div>
  )
}

