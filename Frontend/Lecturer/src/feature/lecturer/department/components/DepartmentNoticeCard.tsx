import React from 'react'
import type { DepartmentAnnouncement } from '../types'

interface Props {
  announcement: DepartmentAnnouncement
}

export const DepartmentNoticeCard: React.FC<Props> = ({ announcement }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        backgroundColor: '#ffffff',
        marginBottom: '10px',
      }}
    >
      <div>
        <strong>{announcement.title}</strong>
        <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
          Ngày đăng: {announcement.date}
        </p>
      </div>
      {announcement.isUrgent && (
        <span className="badge blue" style={{ background: '#fee2e2', color: '#b91c1c' }}>
          Quan trọng
        </span>
      )}
    </div>
  )
}
