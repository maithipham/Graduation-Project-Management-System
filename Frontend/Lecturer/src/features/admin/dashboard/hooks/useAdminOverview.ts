import { useStudentAccounts } from '@/features/admin/account_management'
import { useSemesters } from '@/features/admin/semester_management'
import { useFaculties } from '@/features/admin/faculty_management'
import { useTeachers } from '@/features/department'
import type { SystemOverviewStats } from '../types/overview.types'

const pct = (part: number, total: number) =>
  total ? Number(((part / total) * 100).toFixed(1)) : 0

/**
 * Số liệu tổng quan Quản trị lấy hoàn toàn từ API:
 * - Sinh viên: GET /student/account (đọc totalElements, lọc status)
 * - Giảng viên: GET /teacher (totalElements; trạng thái đếm trên tối đa 500 bản ghi đầu)
 * - Học kỳ: GET /semester, Khoa: GET /faculty
 * Chưa có API tài khoản Quản trị viên nên không hiển thị mục này.
 */
export function useAdminOverview() {
  const studentsAll = useStudentAccounts({ page: 0, size: 1 })
  const studentsActive = useStudentAccounts({ page: 0, size: 1, status: true })
  const teachers = useTeachers({ page: 0, size: 500 })
  const semesters = useSemesters({ page: 0, size: 20 })
  const faculties = useFaculties({ page: 0, size: 100 })

  const studentCount = studentsAll.data?.totalElements ?? 0
  const studentActive = studentsActive.data?.totalElements ?? 0
  const lecturerCount = teachers.data?.totalElements ?? 0
  const lecturerActive = (teachers.data?.content ?? []).filter((t) => t.status).length
  const lecturerLoaded = teachers.data?.content.length ?? 0
  // Nếu có nhiều hơn 500 giảng viên, phần chưa tải coi như cùng tỉ lệ hoạt động của phần đã tải
  const lecturerActiveEstimated =
    lecturerLoaded > 0 && lecturerCount > lecturerLoaded
      ? Math.round((lecturerActive / lecturerLoaded) * lecturerCount)
      : lecturerActive

  const totalAccounts = studentCount + lecturerCount
  const activeAccounts = studentActive + lecturerActiveEstimated

  const semesterList = semesters.data?.content ?? []
  const currentSemester =
    semesterList.find((s) => s.statusCode === 'ONGOING') ??
    semesterList.find((s) => s.statusCode === 'UPCOMING')

  const facultyList = faculties.data?.content ?? []

  const stats: SystemOverviewStats = {
    totalAccounts,
    activeAccounts,
    inactiveAccounts: Math.max(0, totalAccounts - activeAccounts),
    activeRate: pct(activeAccounts, totalAccounts),
    studentCount,
    studentPct: pct(studentCount, totalAccounts),
    lecturerCount,
    lecturerPct: pct(lecturerCount, totalAccounts),
    currentSemesterName: currentSemester?.name ?? 'Chưa thiết lập',
    currentSemesterPeriod: currentSemester
      ? `${currentSemester.startDate} - ${currentSemester.endDate}`
      : 'Chưa có lịch',
    totalFaculties: faculties.data?.totalElements ?? facultyList.length,
    totalMajors: facultyList.reduce((sum, f) => sum + (f.totalMajors ?? 0), 0),
  }

  return {
    stats,
    semesters: semesterList,
    faculties: facultyList,
    isLoading:
      studentsAll.isPending || teachers.isPending || semesters.isPending || faculties.isPending,
  }
}
