import React from 'react'
import type { LecturerDashboardStats } from '../types'

interface Props {
  stats: LecturerDashboardStats | null
}

export const DashboardStatsGrid: React.FC<Props> = ({ stats }) => {
  return (
    <div className="gv-stats-grid">
      <div className="gv-stat-card">
        <span>Sinh viên đang hướng dẫn</span>
        <strong>{stats ? `${stats.supervisedCount} / ${stats.maxQuota}` : '4 / 5'}</strong>
      </div>
      <div className="gv-stat-card">
        <span>Đề cương chờ duyệt</span>
        <strong style={{ color: '#f59e0b' }}>{stats?.pendingOutlinesCount ?? 2}</strong>
      </div>
      <div className="gv-stat-card">
        <span>Báo cáo tiến độ tuần</span>
        <strong>{stats ? `${stats.weeklyReportsCount} đã nộp` : '4 đã nộp'}</strong>
      </div>
      <div className="gv-stat-card">
        <span>Hội đồng phản biện</span>
        <strong>{stats ? `${stats.councilsCount} hội đồng` : '2 hội đồng'}</strong>
      </div>
    </div>
  )
}
