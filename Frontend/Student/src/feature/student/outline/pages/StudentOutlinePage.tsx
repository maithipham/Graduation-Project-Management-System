import React from 'react'
import { Upload, AlertCircle } from 'lucide-react'

export const StudentOutlinePage: React.FC = () => {
  return (
    <div className="page-body">
      <div className="greeting">
        <div>
          <h1>Đề cương đồ án tốt nghiệp</h1>
          <p className="subhead">Nộp đề cương, nhận xét góp ý và theo dõi lịch sử các lần sửa đổi.</p>
        </div>
      </div>

      <div className="panel" style={{ borderLeft: '4px solid #f59e0b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={20} color="#f59e0b" />
          <div>
            <strong>Góp ý từ GVHD (Lần nộp 2):</strong>
            <p style={{ margin: '4px 0 0 0', color: '#475569', fontSize: '0.9rem' }}>
              "Bổ sung thêm phần phân tích yêu cầu phi chức năng và lược đồ cơ sở dữ liệu chi tiết."
            </p>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Nộp đề cương cập nhật</h3>
          <span className="badge blue">Hạn: 18/10/2026</span>
        </div>
        <div style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '30px', textAlign: 'center' }}>
          <Upload size={32} style={{ color: '#94a3b8', margin: '0 auto 10px' }} />
          <p style={{ margin: 0, fontWeight: 500 }}>Kéo thả file đề cương (.pdf, .docx) vào đây hoặc bấm để chọn tệp</p>
          <small style={{ color: '#94a3b8' }}>Dung lượng tối đa: 25MB</small>
        </div>
      </div>
    </div>
  )
}

export default StudentOutlinePage
