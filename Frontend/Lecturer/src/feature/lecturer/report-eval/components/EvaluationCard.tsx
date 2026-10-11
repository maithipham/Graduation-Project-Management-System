import React from 'react'
import type { ProgressEvaluationDto } from '../types'

interface Props {
  report: ProgressEvaluationDto
  onEvaluate: (report: ProgressEvaluationDto) => void
}

export const EvaluationCard: React.FC<Props> = ({ report, onEvaluate }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        backgroundColor: '#ffffff',
        marginBottom: '10px',
      }}
    >
      <div>
        <strong>Sinh viên ID: {report.studentId}</strong> — Tuần {report.weekNumber}
        <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
          Nhận xét: {report.comment}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span className="badge blue" style={{ background: '#dcfce7', color: '#166534', fontWeight: 600 }}>
          {report.progressScore} / 10
        </span>
        <button
          type="button"
          onClick={() => onEvaluate(report)}
          className="btn"
          style={{ fontSize: '0.8rem', padding: '4px 8px' }}
        >
          Cập nhật điểm
        </button>
      </div>
    </div>
  )
}
