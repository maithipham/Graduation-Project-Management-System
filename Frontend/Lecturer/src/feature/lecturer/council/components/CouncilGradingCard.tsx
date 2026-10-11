import React from 'react'
import type { CouncilDefenseStudent } from '../types'

interface Props {
  student: CouncilDefenseStudent
  onGrade: (student: CouncilDefenseStudent) => void
}

export const CouncilGradingCard: React.FC<Props> = ({ student, onGrade }) => {
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
        <strong>{student.studentName}</strong> ({student.studentCode})
        <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
          {student.topicTitle}
        </p>
        <span style={{ fontSize: '0.8rem', color: '#0369a1' }}>
          Điểm GVHD: {student.supervisorScore} · Điểm Phản biện: {student.reviewerScore}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <strong style={{ fontSize: '1.1rem', color: '#059669' }}>
          {student.finalScore ?? 'Chưa chấm'}
        </strong>
        <button
          type="button"
          onClick={() => onGrade(student)}
          className="btn primary"
          style={{ background: '#059669', borderColor: '#059669', fontSize: '0.82rem', padding: '6px 10px' }}
        >
          Nhập điểm
        </button>
      </div>
    </div>
  )
}
