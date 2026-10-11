import React from 'react'
import { Plus } from 'lucide-react'
import { useTopicManage } from '../hooks/useTopicManage'
import { TopicCard } from '../components/TopicCard'

export const TopicManagePage: React.FC = () => {
  const { topics, isLoading } = useTopicManage()

  return (
    <div className="page-body">
      <div className="greeting">
        <div>
          <h1>Quản lý & Đề xuất Đề tài</h1>
          <p className="subhead">Danh sách các đề tài đã công bố và sinh viên đăng ký thực hiện.</p>
        </div>
        <button type="button" className="btn primary" style={{ background: '#059669', borderColor: '#059669' }}>
          <Plus size={16} style={{ marginRight: 6 }} /> Đề xuất đề tài mới
        </button>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Kho đề tài năm học 2026-2027</h3>
        </div>
        <p style={{ margin: '0 0 16px 0', color: '#64748b' }}>
          Tổng số: {topics.length} đề tài · Đã có sinh viên nhận: 3 · Còn trống: {Math.max(0, topics.length - 3)}
        </p>

        {isLoading ? (
          <p style={{ color: '#94a3b8' }}>Đang tải danh sách đề tài...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {topics.map((t) => (
              <TopicCard key={t.id || t.title} topic={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TopicManagePage
