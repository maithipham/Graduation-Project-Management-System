import type { StudentSemesterScoreCard } from '../types/score.types'

export const STUDENT_RESULTS_DATA: StudentSemesterScoreCard[] = [
  {
    semesterKey: 'HK1 2026-2027',
    courseName: 'Đồ án tốt nghiệp',
    className: '21DH-CNTT1',
    rows: [
      {
        type: 'Hướng dẫn',
        component: 'Điểm hướng dẫn',
        weight: 30,
        score: 8.5,
        comment: 'Hoàn thành tốt mục tiêu đề tài, tinh thần làm việc chủ động.',
      },
      {
        type: 'Phản biện',
        component: 'Điểm phản biện 1',
        weight: 20,
        score: 8.0,
        comment: 'Cần làm rõ phần đánh giá hiệu năng và so sánh giải pháp.',
      },
      {
        type: 'Phản biện',
        component: 'Điểm phản biện 2',
        weight: 20,
        score: 8.5,
        comment: 'Báo cáo trình bày rõ ràng, cấu trúc logic.',
      },
      {
        type: 'Hội đồng',
        component: 'Điểm cuối hội đồng',
        weight: 30,
        score: 8.0,
        comment: 'Trả lời tốt các câu hỏi vấn đáp của hội đồng.',
      },
    ],
  },
]



export const scoreService = {
  getResults: (): StudentSemesterScoreCard[] => [...STUDENT_RESULTS_DATA],
}
