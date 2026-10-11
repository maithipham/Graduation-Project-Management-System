import React from 'react'
import { useReviewOutline } from '../hooks/useReviewOutline'
import { ReviewCard } from '../components/ReviewCard'

export const ReviewOutlinePage: React.FC = () => {
  const { reviews, isLoading, submitReview } = useReviewOutline()

  const handleApprove = (id: string) => {
    submitReview({
      outlineId: id,
      decision: 'approved',
      comment: 'Đề cương đạt yêu cầu, đồng ý cho triển khai đồ án.',
    })
  }

  const handleReject = (id: string) => {
    submitReview({
      outlineId: id,
      decision: 'revision_required',
      comment: 'Cần bổ sung thêm sơ đồ kiến trúc và làm rõ phạm vi công việc.',
    })
  }

  return (
    <div className="page-body">
      <div className="greeting">
        <div>
          <h1>Phê duyệt & Góp ý Đề cương</h1>
          <p className="subhead">Xem xét bản đề cương chi tiết của sinh viên và gửi phản hồi chỉnh sửa.</p>
        </div>
      </div>

      {isLoading ? (
        <p style={{ color: '#94a3b8' }}>Đang tải danh sách đề cương...</p>
      ) : reviews.length === 0 ? (
        <div className="panel">
          <p style={{ margin: 0, color: '#64748b' }}>Không có đề cương nào đang chờ duyệt.</p>
        </div>
      ) : (
        reviews.map((r) => (
          <ReviewCard
            key={r.id}
            review={r}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ))
      )}
    </div>
  )
}

export default ReviewOutlinePage
