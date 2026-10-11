import React from 'react'
import { Link } from 'react-router-dom'
import { useLecturerDashboard } from '../hooks/useLecturerDashboard'
import { DashboardStatsGrid } from '../components/DashboardStatsGrid'

export const LecturerDashboardPage: React.FC = () => {
  const { stats, students } = useLecturerDashboard()

  return (
    <div className="page-body">
      <div className="greeting">
        <div>
          <h1>Bảng điều khiển Giảng viên</h1>
          <p className="subhead">Quản lý các nhóm sinh viên thực hiện đồ án tốt nghiệp năm học 2026-2027.</p>
        </div>
      </div>

      <DashboardStatsGrid stats={stats} />

      <div className="panel">
        <div className="panel-head">
          <h3>Danh sách sinh viên hướng dẫn</h3>
          <Link to="/lecturer/topic-manage" style={{ fontSize: '0.88rem', color: '#059669', textDecoration: 'none', fontWeight: 600 }}>
            Quản lý tất cả →
          </Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {students.map((sv) => (
            <div
              key={sv.msv}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
              }}
            >
              <div>
                <strong>{sv.name}</strong> ({sv.msv})
                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>{sv.topic}</p>
              </div>
              <span className="badge blue" style={{ background: '#d1fae5', color: '#065f46' }}>
                {sv.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LecturerDashboardPage
