import React from 'react'

export const StudentRegistrationPage: React.FC = () => {
  return (
    <div className="page-body">
      <div className="greeting">
        <div>
          <h1>Đăng ký đề tài tốt nghiệp</h1>
          <p className="subhead">Lựa chọn hướng nghiên cứu hoặc đề xuất đề tài mới với giảng viên hướng dẫn.</p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Thông tin hồ sơ đề tài</h3>
          <span className="badge blue">Đã phê duyệt</span>
        </div>
        <div className="topic">
          <small>TÊN ĐỀ TÀI CHÍNH THỨC</small>
          <strong>Hệ thống hỗ trợ phân tích phản hồi khách hàng bằng xử lý ngôn ngữ tự nhiên</strong>
        </div>
        <div className="details">
          <div className="detail">
            <span>Mã hồ sơ</span>
            <strong>DATN-26-0148</strong>
          </div>
          <div className="detail">
            <span>Giảng viên hướng dẫn</span>
            <strong>TS. Trần Minh Khôi</strong>
          </div>
          <div className="detail">
            <span>Bộ môn</span>
            <strong>Công nghệ phần mềm</strong>
          </div>
          <div className="detail">
            <span>Trạng thái khóa đề tài</span>
            <strong style={{ color: '#16a34a' }}>Đã xác nhận & Khóa chỉnh sửa</strong>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentRegistrationPage
