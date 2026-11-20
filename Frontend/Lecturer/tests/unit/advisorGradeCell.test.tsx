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
  lockAt: '2026-11-30T23:59:59',
  canGrade: true,
  readonlyReason: null,
  ...over,
})

describe('AdvisorGradeCell', () => {
  it('chưa có trong C1 → "Chưa đến giai đoạn chấm"', () => {
    render(<AdvisorGradeCell topic={undefined} onOpen={vi.fn()} />)
    expect(screen.getByText('Chưa đến giai đoạn chấm')).toBeInTheDocument()
  })

  it('chưa chấm, chấm được → nút "Chấm điểm" gọi onOpen + hiện hạn sửa', async () => {
    const onOpen = vi.fn()
    const row = topic()
    render(<AdvisorGradeCell topic={row} onOpen={onOpen} />)
    expect(screen.getByText(/Sửa được đến .*30\/11\/2026/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Chấm điểm' }))
    expect(onOpen).toHaveBeenCalledWith(row)
  })

  it('ngành chưa có mốc khóa (lockAt null) → không hiện hạn sửa', () => {
    render(<AdvisorGradeCell topic={topic({ lockAt: null })} onOpen={vi.fn()} />)
    expect(screen.queryByText(/Sửa được đến/)).not.toBeInTheDocument()
  })

  it('đang nháp → hiện tiến độ x/y tiêu chí', () => {
    render(<AdvisorGradeCell topic={topic({ sheetStatus: 'DRAFT', sheetPublicId: 's1', gradedCount: 2 })} onOpen={vi.fn()} />)
    expect(screen.getByText(/2\/4 tiêu chí/)).toBeInTheDocument()
  })

  it('chưa có phiếu và đã khóa chấm → nút khóa + lý do kèm thời điểm khóa', () => {
    render(<AdvisorGradeCell topic={topic({ canGrade: false, readonlyReason: 'GRADING_LOCKED' })} onOpen={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Chấm điểm' })).toBeDisabled()
    expect(screen.getByText(/Đã qua thời gian tổ chức hội đồng bảo vệ.*khóa lúc/)).toBeInTheDocument()
  })

  it('đã nộp, chưa khóa → hiện điểm + nút "Sửa điểm"', async () => {
    const onOpen = vi.fn()
    render(<AdvisorGradeCell topic={topic({ sheetStatus: 'SUBMITTED', sheetPublicId: 's1', advisorScore: 8 })} onOpen={onOpen} />)
    expect(screen.getByText('8.0')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Sửa điểm/ }))
    expect(onOpen).toHaveBeenCalled()
  })

  it('đã nộp và đã khóa → hiện điểm + nút "Xem", không hiện hạn sửa', async () => {
    const onOpen = vi.fn()
    render(
      <AdvisorGradeCell
        topic={topic({
          sheetStatus: 'SUBMITTED',
          sheetPublicId: 's1',
          advisorScore: 8,
          canGrade: false,
          readonlyReason: 'GRADING_LOCKED',
        })}
        onOpen={onOpen}
      />,
    )
    expect(screen.getByText('8.0')).toBeInTheDocument()
    expect(screen.queryByText(/Sửa được đến/)).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Xem/ }))
    expect(onOpen).toHaveBeenCalled()
  })
})
