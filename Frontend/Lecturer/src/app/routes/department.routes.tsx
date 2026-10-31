import { lazy } from 'react'
import { Navigate, type RouteObject } from 'react-router-dom'
import { DepartmentLayout } from '@/features/department'
import { withSuspense } from './withSuspense'

const StudentManagementPage = lazy(
  () => import('@/features/department/student_management/pages/StudentManagementPage'),
)
const LecturerManagementPage = lazy(
  () => import('@/features/department/lecturer_management/pages/LecturerManagementPage'),
)
const SupervisorAssignmentPage = lazy(
  () => import('@/features/department/lecturer_management/pages/SupervisorAssignmentPage'),
)
const ReviewerAssignmentPage = lazy(
  () => import('@/features/department/lecturer_management/pages/ReviewerAssignmentPage'),
)

export const departmentRoutes: RouteObject = {
  path: 'department',
  element: <DepartmentLayout />,
  children: [
    {
      index: true,
      element: (
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <h2 className="text-lg font-bold text-slate-800">
            Khu vực nội dung (Content Area)
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Đang hiển thị thử nghiệm khung <strong>Header</strong> và <strong>Sidebar</strong> của vai trò Trưởng Bộ Môn.
          </p>
        </div>
      ),
    },
    { path: 'student-management', element: withSuspense(<StudentManagementPage />) },
    // 3 Trang quản lý giáo viên:
    // 1. Giảng viên (Danh sách khả dụng để phân công GVHD)
    { path: 'teachers', element: <Navigate to="/department/lecturer-management" replace /> },
    { path: 'lecturer-management', element: withSuspense(<LecturerManagementPage />) },
    // 2. Giáo viên Hướng dẫn (GVHD trong học kỳ, chỉ tiêu, sinh viên nhận)
    { path: 'supervisors', element: withSuspense(<SupervisorAssignmentPage />) },
    // 3. Giáo viên Nhận xét (GVPB đề cương, danh sách đề tài & phân công)
    { path: 'reviewers', element: withSuspense(<ReviewerAssignmentPage />) },
  ],
}

export default departmentRoutes
