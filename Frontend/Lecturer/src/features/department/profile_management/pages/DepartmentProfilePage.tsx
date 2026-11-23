import React from 'react'
import { LecturerProfileView } from '@/features/lecturer/profile_management'

// Trưởng bộ môn cũng là giảng viên → dùng chung giao diện + dữ liệu hồ sơ với trang /lecturer/profile
export const DepartmentProfilePage: React.FC = () => <LecturerProfileView roleLabel="Trưởng bộ môn" />

export default DepartmentProfilePage
