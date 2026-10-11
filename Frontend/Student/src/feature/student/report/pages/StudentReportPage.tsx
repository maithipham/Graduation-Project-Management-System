import React from 'react'
import { Plus } from 'lucide-react'

export const StudentReportPage: React.FC = () => {
  return (
    <div className="page-body">
      <div className="greeting">
        <div>
          <h1>Báo cáo tiến độ định kỳ</h1>
          <p className="subhead">Cập nhật công việc thực hiện hàng tuần và nhận đánh giá từ giảng viên hướng dẫn.</p>
        </div>
        <button type="button" className="btn primary">
          <Plus size={16} style={{ marginRight: 6 }} /> Tạo báo cáo tuần mới
        </button>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Báo cáo tuần 4: Thiết kế kiến trúc & cơ sở dữ liệu</h3>
          <span className="badge blue">Đã nộp</span>
        </div>
        <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem' }}>
          Đã hoàn thành lược đồ ERD, thiết lập dự án Frontend Vite React TypeScript và hoàn thành mock API endpoints.
        </p>
        <div className="divider" />
        <div className="detail">
          <span>Nhận xét của GVHD</span>
          <strong style={{ color: '#16a34a' }}>Đạt tiến độ đề ra. Tuần tới tập trung code API logic.</strong>
        </div>
      </div>
    </div>
  )
}

export default StudentReportPage
