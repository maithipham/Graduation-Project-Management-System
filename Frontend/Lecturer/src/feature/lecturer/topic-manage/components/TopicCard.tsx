import React from 'react'
import type { LecturerTopicDto } from '../types'

interface Props {
  topic: LecturerTopicDto
}

export const TopicCard: React.FC<Props> = ({ topic }) => {
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
      }}
    >
      <div>
        <strong>{topic.title}</strong>
        <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
          {topic.description} · Chuyên ngành: {topic.targetMajor}
        </p>
      </div>
      <span className="badge blue" style={{ background: '#d1fae5', color: '#065f46' }}>
        {topic.status === 'assigned' ? 'Đã có sinh viên nhận' : topic.status === 'published' ? 'Đang mở đăng ký' : 'Bản nháp'}
      </span>
    </div>
  )
}
