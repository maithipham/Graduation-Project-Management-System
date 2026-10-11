import React from 'react'

export const StudentResultsPage: React.FC = () => {
  return (
    <div className="page-body">
      <div className="greeting">
        <div>
          <h1>Kết quả & Điểm đánh giá đồ án</h1>
          <p className="subhead">Bảng tổng hợp điểm số từ GVHD, GVPB và Hội đồng bảo vệ.</p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Bảng điểm tổng hợp</h3>
          <span className="badge blue">Đang chấm điểm</span>
        </div>
        <div className="details">
          <div className="detail">
            <span>Điểm GV Hướng dẫn</span>
            <strong>8.8 / 10</strong>
          </div>
          <div className="detail">
            <span>Điểm GV Phản biện</span>
            <strong>8.5 / 10</strong>
          </div>
          <div className="detail">
            <span>Điểm Hội đồng chấm</span>
            <strong style={{ color: '#f59e0b' }}>Chờ công bố sau bảo vệ</strong>
          </div>
          <div className="detail">
            <span>Điểm tổng kết dự kiến</span>
            <strong>Chưa hoàn tất</strong>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentResultsPage
