import { useMemo } from 'react'
import { useSemesterScope } from '../hooks/useSemesterScope'
import { CommentingAssignmentWorkspaceView } from '../components/CommentingAssignmentWorkspaceView'

export default function ReviewerAssignmentPage() {
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

  // Xác định ID học kỳ hiệu lực để truy vấn
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
    : 'Học kỳ hiện tại'

  return (
    <div className="space-y-4">
      {effectiveSemesterId ? (
        <CommentingAssignmentWorkspaceView
          semesterId={effectiveSemesterId}
          semesterName={termName}
          academicYear={selectedYear !== 'all' ? selectedYear : ''}
          academicYears={academicYears}
          termsOfYear={termsOfYear}
          selectedYear={selectedYear}
          selectedSemesterId={selectedSemesterId}
          onYearChange={onYearChange}
          onSemesterChange={onSemesterChange}
          semestersLoading={semestersLoading}
        />
      ) : (
        <div className="p-12 text-center text-gray-500 bg-white border border-gray-200 rounded-xl">
          Vui lòng chọn học kỳ để hiển thị màn hình phân công
        </div>
      )}
    </div>
  )
}
