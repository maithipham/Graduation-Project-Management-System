import { describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import type { DefenseScoreBoard, DefenseScoreEntry } from '@/features/lecturer/defense_management/types'

// Giả lập tầng service: panel + hook chạy thật, chỉ thay phần gọi HTTP
const serviceMock = vi.hoisted(() => ({ trialScore: vi.fn() }))
vi.mock('@/features/lecturer/defense_management/services/defenseEvaluation.service', () => ({
  defenseEvaluationService: serviceMock,
}))

import { DefenseScoreTrialPanel } from '@/features/lecturer/defense_management/components/DefenseScoreTrialPanel'

function entry(teacherName: string, score: number, extra: Partial<DefenseScoreEntry> = {}): DefenseScoreEntry {
  return { teacherName, score, status: 'SUBMITTED', ...extra }
}

const BOARD: DefenseScoreBoard = {
  defenseAssignmentPublicId: 'da-1',
  version: 3,
  updatedAt: '2026-11-20T10:00:00',
  defenseStatus: 'SCHEDULED',
  advisor: entry('GV Hướng Dẫn', 8),
  coAdvisor: entry('GV Đồng Hướng Dẫn', 6),
  examiners: [entry('GV Phản Biện 1', 7, { order: 1 }), entry('GV Phản Biện 2', 7, { order: 2 })],
  council: [
    entry('Chủ Tịch', 8, { role: 'CHAIRPERSON' }),
    entry('Thư Ký', 8, { role: 'SECRETARY' }),
    entry('Ủy Viên 1', 8, { role: 'COUNCIL_MEMBER' }),
    entry('Ủy Viên 2', 8, { role: 'COUNCIL_MEMBER' }),
    entry('Ủy Viên 3', 8, { role: 'COUNCIL_MEMBER' }),
  ],
  submittedCouncilCount: 5,
  councilScore: 8,
  finalScore: 7.6,
  result: 'PASSED',
  hasDeviation: true,
  scoreHidden: false,
}

function renderPanel() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <DefenseScoreTrialPanel board={BOARD} />
    </QueryClientProvider>,
  )
}

describe('DefenseScoreTrialPanel', () => {
  it('nạp điểm hiện tại (2 GVHD), sửa thử điểm GVHD 2 rồi gửi đúng thứ tự và hiện kết quả', async () => {
    serviceMock.trialScore.mockResolvedValue({
      advisors: [
        { score: 8, deviated: false, deviation: 0.29 },
        { score: 7.5, deviated: false, deviation: 0.21 },
      ],
      examiners: [
        { score: 7, deviated: false, deviation: 1 },
        { score: 7, deviated: false, deviation: 1 },
      ],
      council: Array.from({ length: 5 }, () => ({ score: 8, deviated: false, deviation: 0 })),
      advisorScore: 7.8,
      examinerScore: 7,
      councilScore: 8,
      finalScore: 7.7,
      result: 'PASSED',
      hasDeviation: false,
    })
    renderPanel()

    expect(screen.getAllByRole('textbox')).toHaveLength(9)
    const coAdvisor = screen.getByLabelText('Điểm thử GVHD 2 GV Đồng Hướng Dẫn')
    expect(coAdvisor).toHaveValue('6.0')

    await userEvent.clear(coAdvisor)
    await userEvent.type(coAdvisor, '7.5')
    await userEvent.click(screen.getByRole('button', { name: /Tính thử/ }))

    await waitFor(() =>
      expect(serviceMock.trialScore).toHaveBeenCalledWith('da-1', {
        advisorScores: [8, 7.5],
        examinerScores: [7, 7],
        councilScores: [8, 8, 8, 8, 8],
      }),
    )
    expect(await screen.findByText('7.7')).toBeInTheDocument()
    expect(screen.getByText('(Đạt)')).toBeInTheDocument()
  })

  it('thành viên Hội đồng để trống = vắng: chỉ gửi 4 điểm Hội đồng', async () => {
    serviceMock.trialScore.mockReset()
    serviceMock.trialScore.mockResolvedValue({
      advisors: [
        { score: 8, deviated: false, deviation: 0.6 },
        { score: 6, deviated: false, deviation: 0.6 },
      ],
      examiners: [
        { score: 7, deviated: false, deviation: 1 },
        { score: 7, deviated: false, deviation: 1 },
      ],
      council: Array.from({ length: 4 }, () => ({ score: 8, deviated: false, deviation: 0 })),
      advisorScore: 7,
      examinerScore: 7,
      councilScore: 8,
      finalScore: 7.6,
      result: 'PASSED',
      hasDeviation: false,
    })
    renderPanel()

    await userEvent.clear(screen.getByLabelText('Điểm thử Ủy viên Ủy Viên 3'))
    await userEvent.click(screen.getByRole('button', { name: /Tính thử/ }))

    await waitFor(() =>
      expect(serviceMock.trialScore).toHaveBeenCalledWith('da-1', {
        advisorScores: [8, 6],
        examinerScores: [7, 7],
        councilScores: [8, 8, 8, 8],
      }),
    )
  })

  it('điểm ngoài khoảng 0 - 10 thì báo lỗi, không gọi API', async () => {
    serviceMock.trialScore.mockClear()
    renderPanel()

    const chair = screen.getByLabelText('Điểm thử Chủ tịch Chủ Tịch')
    await userEvent.clear(chair)
    await userEvent.type(chair, '11')
    await userEvent.click(screen.getByRole('button', { name: /Tính thử/ }))

    expect(
      screen.getByText('Nhập đủ điểm GVHD, GVPB; mỗi điểm từ 0 đến 10. Thành viên Hội đồng vắng thì để trống.'),
    ).toBeInTheDocument()
    expect(serviceMock.trialScore).not.toHaveBeenCalled()
  })
})
