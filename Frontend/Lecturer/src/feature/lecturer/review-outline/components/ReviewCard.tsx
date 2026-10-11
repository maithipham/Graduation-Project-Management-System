import React from 'react'
import type { ReviewPendingItem } from '../types'

interface Props {
  review: ReviewPendingItem
  onApprove: (id: string) => void
  onReject: (id: string) => void
}

export const ReviewCard: React.FC<Props> = ({ review, onApprove, onReject }) => {
  return (
    <div className="panel" style={{ marginBottom: 12 }}>
      <div className="panel-head">
        <h3>
          {review.studentName} ({review.studentCode})
        </h3>
        <span className="badge blue" style={{ background: '#fef3c7', color: '#b45309' }}>
          Phiên bản {review.version} · {review.submittedAt}
        </span>
      </div>
      <p style={{ margin: '0 0 10px 0', color: '#475569', fontSize: '0.9rem' }}>
        Đề tài: {review.topicTitle}
      </p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          type="button"
          onClick={() => onApprove(review.id)}
          className="btn primary"
          style={{ background: '#059669', borderColor: '#059669' }}
        >
          Duyệt đề cương
        </button>
        <button type="button" onClick={() => onReject(review.id)} className="btn">
          Yêu cầu chỉnh sửa
        </button>
      </div>
    </div>
  )
}
