import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LecturerFilterBar } from '../components/LecturerFilterBar'
import { LecturerTable } from '../components/LecturerTable'
import { useLecturerFilters } from '../hooks/useLecturerFilters'
import { useSemesterScope } from '../hooks/useSemesterScope'
import type { MajorOption } from '../types/lecturer.types'
import {
  DEFAULT_TLU_MAJORS,
  lecturerService,
} from '../services/lecturer.service'

export default function StudentLecturersPage() {
  // 1. Quản lý phạm vi Năm học & Học kỳ (filter theo kì năm học như màn của Trưởng bộ môn)
  const {
    academicYears,
    termsOfYear,
    selectedYear,
    selectedSemesterId,
    effectiveSemesterId,
    isLoading: semestersLoading,
    onYearChange,
    onSemesterChange,
  } = useSemesterScope({ defaultToCurrent: true, allowAll: true })

  // 2. Query danh sách tất cả GVHD của học kỳ này từ Backend (từ bảng semester_advisors /semesters/{id}/advisors)
  const {
    data: lecturers = [],
    isLoading: isLecturersLoading,
  } = useQuery({
    queryKey: ['semester-advisors', effectiveSemesterId],
    queryFn: () => lecturerService.getSemesterAdvisors(effectiveSemesterId),
    staleTime: 60 * 1000,
  })

  // 3. Query danh sách các ngành từ Backend (GET /major)
  const { data: apiMajors = [] } = useQuery<MajorOption[]>({
    queryKey: ['majors'],
    queryFn: () => lecturerService.getMajors(),
    staleTime: 30 * 60 * 1000,
  })

  // Dropdown ngành chỉ lấy danh sách các ngành từ bảng major (GET /major)
  const departmentOptions = useMemo(() => {
    const seen = new Set<string>()
    const dynamicOpts: Array<{ value: string; label: string }> = []

    // Danh sách ngành lấy từ BE (GET /major) hoặc danh sách ngành của trường
    const majorSource = apiMajors && apiMajors.length > 0 ? apiMajors : DEFAULT_TLU_MAJORS

    for (const m of majorSource) {
      const name = m.name?.trim()
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase())
        dynamicOpts.push({ value: name, label: name })
      }
    }

    return [{ value: '', label: 'Tất cả ngành' }, ...dynamicOpts]
  }, [apiMajors])

  // 4. Quản lý trạng thái bộ lọc và phân trang (mặc định lấy tất cả các ngành và tất cả GVHD của kỳ)
  const {
    search,
    department,
    origin,
    currentPage,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    paginatedLecturers,
    handleSearchChange,
    handleDepartmentChange,
    handleOriginChange,
    handlePageChange,
  } = useLecturerFilters(lecturers)

  return (
    <div className="flex-1 min-h-0 w-full flex flex-col overflow-hidden">
      <LecturerFilterBar
        selectedYear={selectedYear}
        selectedSemesterId={selectedSemesterId}
        academicYears={academicYears}
        termsOfYear={termsOfYear}
        isSemestersLoading={semestersLoading}
        onYearChange={onYearChange}
        onSemesterChange={onSemesterChange}
        search={search}
        department={department}
        origin={origin}
        onSearchChange={handleSearchChange}
        onDepartmentChange={handleDepartmentChange}
        onOriginChange={handleOriginChange}
        departmentOptions={departmentOptions}
      />

      <LecturerTable
        lecturers={paginatedLecturers}
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        isLoading={isLecturersLoading || semestersLoading}
      />
    </div>
  )
}
