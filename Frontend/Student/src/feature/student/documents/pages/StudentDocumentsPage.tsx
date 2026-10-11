import React from 'react'
import { BookOpen, Download } from 'lucide-react'

export const StudentDocumentsPage: React.FC = () => {
  return (
    <div className="page-body">
      <div className="greeting">
        <div>
          <h1>Biểu mẫu & Tài liệu hướng dẫn</h1>
          <p className="subhead">Tải các biểu mẫu chuẩn quy định của Nhà trường về đồ án tốt nghiệp.</p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Biểu mẫu chính thức</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            'Mẫu 01: Đơn đề xuất đề tài tốt nghiệp (.docx)',
            'Mẫu 02: Mẫu đề cương chi tiết đồ án (.docx)',
            'Mẫu 03: Sổ theo dõi tiến độ thực hiện đồ án (.xlsx)',
            'Mẫu 04: Bản nhận xét đồ án tốt nghiệp của GVHD (.docx)',
          ].map((doc) => (
            <div
              key={doc}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                <BookOpen size={16} color="#3b82f6" />
                <span>{doc}</span>
              </div>
              <button type="button" className="btn" style={{ padding: '6px 10px', fontSize: '0.8rem' }}>
                <Download size={14} style={{ marginRight: 4 }} /> Tải xuống
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default StudentDocumentsPage
