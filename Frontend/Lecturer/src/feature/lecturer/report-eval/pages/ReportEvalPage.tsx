import React from 'react'
import { useReportEval } from '../hooks/useReportEval'
import { EvaluationCard } from '../components/EvaluationCard'
import type { ProgressEvaluationDto } from '../types'

export const ReportEvalPage: React.FC = () => {
  const { reports, isLoading, submitEvaluation } = useReportEval()

  const handleUpdate = (item: ProgressEvaluationDto) => {
    submitEvaluation({
      ...item,
      comment: item.comment + ' (Đã rà soát)',
    })
  }

  return (
    <div className="page-body">
      <div className="greeting">
        <div>
          <h1>Đánh giá Tiến độ & Chấm điểm Báo cáo</h1>
          <p className="subhead">Theo dõi sổ nhật ký đồ án và cho điểm đánh giá quá trình thực hiện.</p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Báo cáo tiến độ tuần 4</h3>
        </div>
        <p style={{ margin: '0 0 16px 0', color: '#64748b' }}>
          Đã nhận {reports.length} báo cáo tuần từ các sinh viên hướng dẫn.
        </p>

        {isLoading ? (
          <p style={{ color: '#94a3b8' }}>Đang tải danh sách báo cáo...</p>
        ) : (
          reports.map((r) => (
            <EvaluationCard key={r.reportId} report={r} onEvaluate={handleUpdate} />
          ))
        )}
      </div>
    </div>
  )
}

export default ReportEvalPage
