import React from 'react'
import { Mail } from 'lucide-react'

export const StudentLecturerListPage: React.FC = () => {
  return (
    <div className="page-body">
      <div className="greeting">
        <div>
          <h1>Danh sách Giảng viên Hướng dẫn</h1>
          <p className="subhead">Tra cứu thông tin, hướng nghiên cứu và hạn ngạch (quota) của giảng viên.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {[
          { name: 'TS. Trần Minh Khôi', dept: 'Bộ môn CNPM', email: 'khoitm@tlu.edu.vn', quota: '4/5', field: 'NLP, AI Engineering' },
          { name: 'PGS. TS. Nguyễn Văn Hùng', dept: 'Bộ môn Hệ thống thông tin', email: 'hungnv@tlu.edu.vn', quota: '5/5', field: 'Data Mining, BI' },
          { name: 'ThS. Lê Thị Mai', dept: 'Bộ môn Mạng & ATTT', email: 'mailt@tlu.edu.vn', quota: '2/4', field: 'Cloud Security, DevOps' },
        ].map((gv) => (
          <div key={gv.email} className="panel">
            <div className="panel-head">
              <h3>{gv.name}</h3>
              <span className="badge blue">{gv.dept}</span>
            </div>
            <div className="detail">
              <span>Hướng nghiên cứu chính</span>
              <strong>{gv.field}</strong>
            </div>
            <div className="detail">
              <span>Số lượng sinh viên nhận</span>
              <strong>{gv.quota} sinh viên</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#64748b' }}>
              <Mail size={14} /> {gv.email}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StudentLecturerListPage
