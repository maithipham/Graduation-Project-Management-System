import React from 'react'
import { useCouncilDefense } from '../hooks/useCouncilDefense'
import { CouncilGradingCard } from '../components/CouncilGradingCard'
import type { CouncilDefenseStudent } from '../types'

export const CouncilPage: React.FC = () => {
  const { students, isLoading, submitGrading } = useCouncilDefense()

  const handleGrade = (student: CouncilDefenseStudent) => {
    submitGrading({
      defenseId: student.defenseId,
      score: 9.0,
      comments: 'Sinh viên báo cáo lưu loát, trả lời tốt câu hỏi của hội đồng.',
      memberRole: 'reviewer',
    })
  }

  return (
    <div className="page-body">
      <div className="greeting">
        <div>
          <h1>Hội đồng Chấm Đồ án & Nhập điểm</h1>
          <p className="subhead">Phiếu chấm điểm điện tử và biên bản chấm bảo vệ đồ án tốt nghiệp.</p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Hội đồng 02 - Công nghệ phần mềm</h3>
          <span className="badge blue">Chủ tịch: PGS. TS. Nguyễn Văn Hùng</span>
        </div>
        <p style={{ margin: '0 0 16px 0', color: '#64748b' }}>
          Vai trò của bạn: Ủy viên phản biện · Số sinh viên cần chấm: {students.length} sinh viên
        </p>

        {isLoading ? (
          <p style={{ color: '#94a3b8' }}>Đang tải danh sách sinh viên bảo vệ...</p>
        ) : (
          students.map((st) => (
            <CouncilGradingCard key={st.defenseId} student={st} onGrade={handleGrade} />
          ))
        )}
      </div>
    </div>
  )
}

export default CouncilPage
