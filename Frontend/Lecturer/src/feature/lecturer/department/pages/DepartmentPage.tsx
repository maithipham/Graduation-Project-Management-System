import React from 'react'
import { useDepartmentContact } from '../hooks/useDepartmentContact'
import { DepartmentNoticeCard } from '../components/DepartmentNoticeCard'

export const DepartmentPage: React.FC = () => {
  const { info, announcements, isLoading } = useDepartmentContact()

  return (
    <div className="page-body">
      <div className="greeting">
        <div>
          <h1>Quản lý Cấp Bộ môn & Khoa</h1>
          <p className="subhead">Phân công GVHD, thành lập hội đồng và phê duyệt danh sách đồ án.</p>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-head">
          <h3>{info?.name || 'Bộ môn Công nghệ phần mềm'}</h3>
          <span className="badge blue">Trưởng bộ môn: {info?.dean || 'PGS. TS. Nguyễn Văn Hùng'}</span>
        </div>
        <p style={{ margin: 0, color: '#64748b' }}>
          Tổng số sinh viên làm đồ án: {info?.totalGraduationStudents || 45} · Tỷ lệ phân công: {info?.assignedRate || '100%'}
        </p>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Thông báo từ Bộ môn</h3>
        </div>
        {isLoading ? (
          <p style={{ color: '#94a3b8' }}>Đang tải thông báo...</p>
        ) : (
          announcements.map((a) => (
            <DepartmentNoticeCard key={a.id} announcement={a} />
          ))
        )}
      </div>
    </div>
  )
}

export default DepartmentPage
