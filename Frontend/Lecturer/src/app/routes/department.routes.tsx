import type { RouteObject } from 'react-router-dom'
import { DepartmentLayout } from '@/features/department'

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
  ],
}

export default departmentRoutes
