import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdvisorGradeCell } from '@/features/lecturer/guiding_evaluation/components/AdvisorGradeCell'
import type { AdvisorGradeTopic } from '@/features/lecturer/guiding_evaluation/types/advisorGrade.types'

const topic = (over: Partial<AdvisorGradeTopic> = {}): AdvisorGradeTopic => ({
  topicPublicId: 't1',
  topicName: 'Đề tài',
  studentCode: '2151060001',
  studentName: 'Nguyễn Văn A',
  className: '63CNTT1',
  topicStatus: 'IN_PROGRESS',
  currentStage: 'STAGE_4_REPORT_APPROVED',
  sheetPublicId: null,
  sheetStatus: 'NOT_STARTED',
  gradedCount: 0,
  totalCriteria: 4,
  advisorScore: null,
  canGrade: true,
  readonlyReason: null,
  ...over,
})

const deadline = { startDate: '2026-11-10T00:00:00', endDate: '2026-11-30T23:59:59', open: true }

describe('AdvisorGradeCell', () => {
  it('chưa có trong C1 → "Chưa đến giai đoạn chấm"', () => {
    render(<AdvisorGradeCell topic={undefined} deadline={deadline} onOpen={vi.fn()} />)
    expect(screen.getByText('Chưa đến giai đoạn chấm')).toBeInTheDocument()
  })

  it('chưa chấm, chấm được → nút "Chấm điểm" gọi onOpen', async () => {
    const onOpen = vi.fn()
    const row = topic()
    render(<AdvisorGradeCell topic={row} deadline={deadline} onOpen={onOpen} />)
    await userEvent.click(screen.getByRole('button', { name: 'Chấm điểm' }))
    expect(onOpen).toHaveBeenCalledWith(row)
  })

  it('đang nháp → hiện tiến độ x/y tiêu chí', () => {
    render(
      <AdvisorGradeCell
        topic={topic({ sheetStatus: 'DRAFT', sheetPublicId: 's1', gradedCount: 2 })}
        deadline={deadline}
        onOpen={vi.fn()}
      />,
    )
    expect(screen.getByText(/2\/4 tiêu chí/)).toBeInTheDocument()
  })

  it('chưa có phiếu và hết hạn → nút khóa + lý do', () => {
    render(
      <AdvisorGradeCell
        topic={topic({ canGrade: false, readonlyReason: 'DEADLINE_EXPIRED' })}
        deadline={{ ...deadline, open: false }}
        onOpen={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: 'Chấm điểm' })).toBeDisabled()
    expect(screen.getByText(/Đã hết hạn chấm/)).toBeInTheDocument()
  })

  it('đã nộp → hiện điểm + nút Xem', async () => {
    const onOpen = vi.fn()
    render(
      <AdvisorGradeCell
        topic={topic({ sheetStatus: 'SUBMITTED', sheetPublicId: 's1', advisorScore: 8, canGrade: false, readonlyReason: 'SUBMITTED' })}
        deadline={deadline}
        onOpen={onOpen}
      />,
    )
    expect(screen.getByText('8.0')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Xem/ }))
    expect(onOpen).toHaveBeenCalled()
  })
})
