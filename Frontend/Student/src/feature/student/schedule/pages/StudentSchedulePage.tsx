import React from 'react'

export const StudentSchedulePage: React.FC = () => {
  return (
    <div className="page-body">
      <div className="greeting">
        <div>
          <h1>Lịch phản biện & bảo vệ đồ án</h1>
          <p className="subhead">Thông tin thời gian, hội đồng và phòng bảo vệ đồ án tốt nghiệp.</p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Lễ bảo vệ Đồ án Tốt nghiệp - Đợt 1</h3>
          <span className="badge blue">Sắp diễn ra</span>
        </div>
        <div className="details">
          <div className="detail">
            <span>Ngày bảo vệ</span>
            <strong>15/01/2027</strong>
          </div>
          <div className="detail">
            <span>Ca bảo vệ</span>
            <strong>Ca sáng (08:00 - 11:30)</strong>
          </div>
          <div className="detail">
            <span>Địa điểm / Phòng bảo vệ</span>
            <strong>Phòng 302 - Nhà T45</strong>
          </div>
          <div className="detail">
            <span>Hội đồng chuyên môn</span>
            <strong>Hội đồng 02 - Công nghệ phần mềm</strong>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentSchedulePage
