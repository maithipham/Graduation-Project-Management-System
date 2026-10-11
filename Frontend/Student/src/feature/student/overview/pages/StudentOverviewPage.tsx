import React from 'react'
import { Link } from 'react-router-dom'
import { FilePlus2, Clock3, Upload, LockKeyhole, Check, UserCheck, Send } from 'lucide-react'

export const StudentOverviewPage: React.FC = () => {
  return (
    <section className="page-body">
      <div className="greeting">
        <div>
          <h1>Chào An, đồ án của bạn đang tiến triển tốt</h1>
          <p className="subhead">Theo dõi các mốc quan trọng và việc cần hoàn thành tiếp theo.</p>
        </div>
        <Link to="/student/registration" className="btn">
          <FilePlus2 size={16} style={{ marginRight: 6 }} /> Hồ sơ đồ án
        </Link>
      </div>

      <div className="deadline">
        <span className="deadline-icon">
          <Clock3 size={18} />
        </span>
        <div className="deadline-copy">
          <strong>Việc cần làm tiếp theo · Nộp đề cương</strong>
          <span>Đã có nhận xét từ giảng viên phụ trách review. Xem góp ý rồi nộp lại.</span>
        </div>
        <time dateTime="2026-10-18">Hạn 18/10/2026</time>
        <Link to="/student/outline" className="btn primary subtle">Mở đề cương</Link>
      </div>

      <div className="section-title">
        <h2>Tiến độ đồ án</h2>
        <span className="badge blue">Giai đoạn 3 / 6</span>
      </div>

      <div className="progress-wrap">
        <div className="steps" aria-label="Tiến độ: đang viết đề cương, giai đoạn 3 trên 6">
          <div className="step done">
            <span className="step-dot">✓</span>
            <div className="step-label">Đăng ký GVHD</div>
          </div>
          <div className="step done">
            <span className="step-dot">✓</span>
            <div className="step-label">Chốt đề tài</div>
          </div>
          <div className="step current">
            <span className="step-dot">3</span>
            <div className="step-label">Đề cương</div>
          </div>
          <div className="step">
            <span className="step-dot">4</span>
            <div className="step-label">Thực hiện đồ án</div>
          </div>
          <div className="step">
            <span className="step-dot">5</span>
            <div className="step-label">Nộp báo cáo</div>
          </div>
          <div className="step">
            <span className="step-dot">6</span>
            <div className="step-label">Bảo vệ</div>
          </div>
        </div>
      </div>

      <div className="columns">
        <section>
          <div className="section-title">
            <h2>Hồ sơ hiện tại</h2>
            <Link to="/student/registration">Xem chi tiết →</Link>
          </div>
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Đồ án tốt nghiệp · 2026–2027</h3>
                <p>Mã hồ sơ: DATN-26-0148</p>
              </div>
              <span className="badge blue">Đang thực hiện</span>
            </div>
            <div className="topic">
              <small>TÊN ĐỀ TÀI ĐÃ ĐƯỢC DUYỆT</small>
              <strong>Hệ thống hỗ trợ phân tích phản hồi khách hàng bằng xử lý ngôn ngữ tự nhiên</strong>
            </div>
            <div className="details">
              <div className="detail">
                <span>Giảng viên hướng dẫn</span>
                <strong>TS. Trần Minh Khôi</strong>
              </div>
              <div className="detail">
                <span>Đề cương</span>
                <strong>Cần chỉnh sửa · Lần nộp 2</strong>
              </div>
              <div className="detail">
                <span>Nhận xét đề cương</span>
                <strong>Đã có góp ý lần nộp 2</strong>
              </div>
              <div className="detail">
                <span>Ngày cập nhật gần nhất</span>
                <strong>10/10/2026, 09:42</strong>
              </div>
            </div>
            <div className="divider" />
            <div className="action-row">
              <Link to="/student/outline" className="btn primary">
                <Upload size={14} style={{ marginRight: 6 }} /> Nộp đề cương
              </Link>
              <Link to="/student/registration" className="btn">
                <LockKeyhole size={14} style={{ marginRight: 6 }} /> Xem đề tài đã khóa
              </Link>
              <span className="action-hint">Mỗi lần nộp sẽ được lưu lịch sử.</span>
            </div>
          </div>

          <div className="section-title">
            <h2>Hoạt động gần đây</h2>
            <Link to="/student/documents">Xem tất cả →</Link>
          </div>
          <div className="panel recent">
            <div className="recent-row">
              <span className="recent-icon">
                <Check size={14} />
              </span>
              <div>
                <strong>GVHD đã duyệt tên đề tài</strong>
                <small>TS. Trần Minh Khôi · Hồ sơ DATN-26-0148</small>
              </div>
              <time>10/10 · 09:42</time>
            </div>
            <div className="recent-row">
              <span className="recent-icon">
                <UserCheck size={14} />
              </span>
              <div>
                <strong>Bạn đã được phân công GVHD</strong>
                <small>Phân công bởi Trưởng bộ môn</small>
              </div>
              <time>08/10 · 14:10</time>
            </div>
            <div className="recent-row">
              <span className="recent-icon">
                <Send size={14} />
              </span>
              <div>
                <strong>Đã gửi đăng ký đề tài</strong>
                <small>Lịch sử thao tác được lưu trong hồ sơ</small>
              </div>
              <time>05/10 · 16:25</time>
            </div>
          </div>
        </section>

        <aside>
          <div className="section-title">
            <h2>Cần bạn lưu ý</h2>
          </div>
          <div className="panel">
            <div className="task">
              <span className="task-dot" />
              <div>
                <strong>Hoàn thiện đề cương</strong>
                <span>Hạn nộp 18/10/2026 · còn 2 ngày</span>
              </div>
            </div>
            <div className="task">
              <span className="task-dot" style={{ background: '#9aacc0' }} />
              <div>
                <strong>Theo dõi kết quả review</strong>
                <span>Hệ thống sẽ gửi thông báo khi có nhận xét.</span>
              </div>
            </div>
            <div className="task">
              <span className="task-dot" style={{ background: '#9aacc0' }} />
              <div>
                <strong>Cập nhật tiến độ hàng tuần</strong>
                <span>Trao đổi định kỳ với giảng viên hướng dẫn.</span>
              </div>
            </div>
          </div>

          <div className="section-title">
            <h2>Mốc sắp tới</h2>
          </div>
          <div className="panel">
            <div className="timeline">
              <div className="timeline-row">
                <time>18/10/2026</time>
                <span className="timeline-mark" />
                <p>Hạn nộp đề cương</p>
              </div>
              <div className="timeline-row">
                <time>25/10/2026</time>
                <span className="timeline-mark" />
                <p>Dự kiến nhận nhận xét đề cương</p>
              </div>
              <div className="timeline-row">
                <time>Tháng 01/2027</time>
                <span className="timeline-mark" />
                <p>Nộp báo cáo và chuẩn bị bảo vệ</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}

export default StudentOverviewPage
