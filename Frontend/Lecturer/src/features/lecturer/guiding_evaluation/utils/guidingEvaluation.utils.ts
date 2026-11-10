import type {
  GuidingEvaluationItem,
  RubricCriterionKey,
  RubricGroupConfig,
  RubricScores,
  TrackingTimelineEntry,
} from '../types/guidingEvaluation.types'

export const RUBRIC_GROUPS: RubricGroupConfig[] = [
  {
    group: 1,
    title: '1. Chuyên cần, ý thức và thái độ làm việc',
    weight: 20,
    criteria: [
      {
        key: 'r1_1',
        code: '1.1',
        label: 'Tham gia đầy đủ các buổi hướng dẫn theo quy định',
        weight: 10,
        group: 1,
      },
      {
        key: 'r1_2',
        code: '1.2',
        label: 'Nghiêm túc, tích cực tham gia trao đổi, thảo luận',
        weight: 10,
        group: 1,
      },
    ],
  },
  {
    group: 2,
    title: '2. Tiến độ thực hiện đồ án',
    weight: 30,
    criteria: [
      {
        key: 'r2_1',
        code: '2.1',
        label: 'Thực hiện đúng đề cương & phân công của GVHD',
        weight: 15,
        group: 2,
      },
      {
        key: 'r2_2',
        code: '2.2',
        label: 'Nộp tiến độ đồ án đúng hạn quy định',
        weight: 15,
        group: 2,
      },
    ],
  },
  {
    group: 3,
    title: '3. Đánh giá kết quả thực hiện',
    weight: 40,
    criteria: [
      {
        key: 'r3_1',
        code: '3.1',
        label: 'Hoàn thành và đảm bảo đầy đủ nội dung theo yêu cầu',
        weight: 25,
        group: 3,
      },
      {
        key: 'r3_2',
        code: '3.2',
        label: 'Đảm bảo hình thức trình bày, bản vẽ, tài liệu tham khảo',
        weight: 15,
        group: 3,
      },
    ],
  },
  {
    group: 4,
    title: '4. Tính khoa học và ứng dụng thực tiễn',
    weight: 10,
    criteria: [
      {
        key: 'r4_1',
        code: '4.1',
        label: 'Tính mới, tính sáng tạo của giải pháp công nghệ',
        weight: 3,
        group: 4,
      },
      {
        key: 'r4_2',
        code: '4.2',
        label: 'Mức độ khả thi và ứng dụng thực tế',
        weight: 4,
        group: 4,
      },
      {
        key: 'r4_3',
        code: '4.3',
        label: 'Triển vọng phát triển đề tài',
        weight: 3,
        group: 4,
      },
    ],
  },
]

export const DEFAULT_STUDENT_RUBRIC_SCORES: Record<string, RubricScores> = {
  'eval-01': {
    r1_1: 9.0, r1_2: 9.0,
    r2_1: 8.5, r2_2: 9.0,
    r3_1: 8.8, r3_2: 8.7,
    r4_1: 8.5, r4_2: 9.0, r4_3: 8.5,
  },
  'eval-02': {
    r1_1: 9.5, r1_2: 9.0,
    r2_1: 9.0, r2_2: 9.5,
    r3_1: 9.2, r3_2: 9.0,
    r4_1: 9.0, r4_2: 9.5, r4_3: 9.0,
  },
  'eval-03': {
    r1_1: 9.0, r1_2: 8.5,
    r2_1: 8.5, r2_2: 9.0,
    r3_1: 8.8, r3_2: 8.5,
    r4_1: 8.5, r4_2: 9.0, r4_3: 8.5,
  },
  'eval-04': {
    r1_1: 8.5, r1_2: 8.5,
    r2_1: 8.5, r2_2: 8.5,
    r3_1: 8.5, r3_2: 8.5,
    r4_1: 8.5, r4_2: 8.5, r4_3: 8.5,
  },
  'eval-05': {
    r1_1: 9.5, r1_2: 9.5,
    r2_1: 9.5, r2_2: 9.5,
    r3_1: 9.5, r3_2: 9.5,
    r4_1: 9.5, r4_2: 9.5, r4_3: 9.5,
  },
  'eval-06': {
    r1_1: 9.0, r1_2: 8.5,
    r2_1: 8.5, r2_2: 9.0,
    r3_1: 8.5, r3_2: 8.5,
    r4_1: 8.0, r4_2: 8.5, r4_3: 8.0,
  },
  'eval-07': {
    r1_1: 8.5, r1_2: 8.5,
    r2_1: 8.0, r2_2: 8.5,
    r3_1: 8.5, r3_2: 8.0,
    r4_1: 8.0, r4_2: 8.0, r4_3: 8.0,
  },
  'eval-08': {
    r1_1: 9.0, r1_2: 9.0,
    r2_1: 9.0, r2_2: 8.5,
    r3_1: 9.0, r3_2: 8.5,
    r4_1: 8.5, r4_2: 9.0, r4_3: 8.5,
  },
  'eval-09': {
    r1_1: 8.0, r1_2: 8.5,
    r2_1: 8.5, r2_2: 8.0,
    r3_1: 8.0, r3_2: 8.5,
    r4_1: 8.0, r4_2: 8.0, r4_3: 8.0,
  },
  'eval-10': {
    r1_1: 9.0, r1_2: 9.0,
    r2_1: 8.5, r2_2: 9.0,
    r3_1: 9.0, r3_2: 9.0,
    r4_1: 8.5, r4_2: 9.0, r4_3: 8.5,
  },
  'eval-11': {
    r1_1: 8.5, r1_2: 8.5,
    r2_1: 8.0, r2_2: 8.5,
    r3_1: 8.5, r3_2: 8.5,
    r4_1: 8.0, r4_2: 8.0, r4_3: 8.0,
  },
  'eval-12': {
    r1_1: 9.5, r1_2: 9.0,
    r2_1: 9.0, r2_2: 9.0,
    r3_1: 9.0, r3_2: 9.0,
    r4_1: 9.0, r4_2: 9.0, r4_3: 8.5,
  },
}

// Dữ liệu 16 đợt theo dõi tiến độ chuẩn ĐH Thủy Lợi (Mẫu 1: Đủ điều kiện ra hội đồng)
export const OFFICIAL_TRACKING_TIMELINE: TrackingTimelineEntry[] = [
  { date: '24/3', work: 'Giao đề tài, hướng dẫn, góp ý làm đề cương', comment: 'Yêu cầu chỉnh sửa, tên, mục tiêu đề tài', location: 'Email và Zalo' },
  { date: '31/3', work: 'Duyệt, chỉnh sửa nội dung phác thảo', comment: 'Đạt yêu cầu, nhưng cần bổ sung tài liệu tham khảo', location: 'Gặp trực tiếp' },
  { date: '7/4', work: 'Báo cáo tiến độ thu thập dữ liệu/thực hiện Chương 1.', comment: 'Nhắc nhở về thời hạn nộp bài. Chỉnh sửa nội dung và góp ý', location: 'Zalo và google meet' },
  { date: '14/4', work: 'Yêu cầu và nghiệp vụ của dự án', comment: 'Cần xác định các yêu cầu chức năng và phi chức năng của hệ thống', location: 'Gặp trực tiếp' },
  { date: '21/4', work: 'Yêu cầu sv báo cáo kết quả chỉnh sửa chương 1, nội dung chương 2', comment: 'Sinh viên báo cáo kết quả thực hiện, xác định được các yêu cầu cho hệ thống', location: 'Zalo và google meet' },
  { date: '28/4', work: 'Xác định các chức năng nghiệp vụ chính hệ thống', comment: 'Đặc tả các yêu cầu chức năng bằng biểu đồ use cases', location: 'Zalo và google meet' },
  { date: '5/5', work: 'Yêu cầu sv báo cáo kết quả chức năng trong Inter 1, và nội dung trong chương 3', comment: 'Cần chỉnh sửa biểu đồ Use case', location: 'Gặp trực tiếp' },
  { date: '12/5', work: 'Báo cáo kết quả Inter 1', comment: 'Tiếp tục chỉnh sửa đáp ứng yêu cầu nghiệp vụ và các định các chức năng phát triển trong inter 2', location: 'Zalo và google meet' },
  { date: '19/5', work: 'Yêu cầu Sinh viên báo cáo kết quả chức năng và tài liệu trong Inter 2', comment: 'Sinh viên đã triển khai tốt các chức năng phân quyền người dùng', location: 'Google meet' },
  { date: '26/5', work: 'Báo cáo kết quả Inter 2', comment: 'Tiếp tục chỉnh sửa đáp ứng yêu cầu nghiệp vụ và các định các chức năng phát triển trong inter 3', location: 'Zalo và google meet' },
  { date: '2/6', work: 'Yêu cầu Sinh viên báo cáo kết quả chức năng và tài liệu trong Inter 3', comment: 'Sinh viên báo cáo các chức năng quản lý thuê máy, cần tổ chức nhóm các chức năng đảm bảo chỉ lấy dữ liệu khi cần thiết, nên tổ chức theo tab', location: 'Gặp trực tiếp' },
  { date: '9/6', work: 'Báo cáo kết quả Inter 3', comment: 'Tiếp tục chỉnh sửa đáp ứng yêu cầu nghiệp vụ và các định các chức năng phát triển trong inter 4', location: 'Zalo và google meet' },
  { date: '16/6', work: 'Sinh viên báo cáo kết quả chức năng và tài liệu trong Inter 4', comment: 'Với các chức năng thống kê báo cáo. Các chức năng cần lấy dữ liệu tổng hợp theo nhu cầu thực tế. Hoàn thiện các chức năng xuất hóa đơn và thống kê', location: 'Google meet' },
  { date: '23/6', work: 'Sinh viên hoàn thiện tài liệu báo cáo đồ án tốt nghiệp', comment: 'Cần chỉnh sửa các tài liệu yêu cầu, bổ sung các yêu cầu chức năng, tài liệu thiết kế', location: 'Google meet' },
  { date: '25/6', work: 'Review cuốn báo cáo và tài chương trình', comment: 'Hoàn thiện chương trình và tài liệu, báo cáo chuẩn bị để bảo vệ', location: 'Gặp trực tiếp' },
  { date: '27/6', work: 'Review báo cáo trước khi nộp', comment: 'Sinh viên chỉnh sửa theo góp ý', location: 'Google meet' },
]

// Dữ liệu timeline Mẫu 2: Sinh viên chưa hoàn thành / không đủ điều kiện đề xuất hội đồng
export const INCOMPLETE_TRACKING_TIMELINE: TrackingTimelineEntry[] = [
  { date: '10/7', work: 'Giao đề tài, hướng dẫn, góp ý làm đề cương', comment: 'Yêu cầu chỉnh sửa, tên, mục tiêu...', location: 'zoom/zalo nhóm/...' },
  { date: '20/7', work: 'Duyệt, chỉnh sửa nội dung phác thảo', comment: 'Đạt yêu cầu, nhưng cần bổ sung tài liệu...', location: 'zoom/zalo nhóm/ P212/ nhật ký HD' },
  { date: '30/7', work: 'Báo cáo tiến độ thu thập dữ liệu/thực hiện Chương 1.', comment: 'Nhắc nhở về thời hạn nộp bài. Chỉnh sửa nội dung...', location: 'zoom/zalo nhóm/...' },
  { date: '10/8', work: 'Yêu cầu sv báo cáo kết quả chỉnh sửa chương 1, nội dung chương 2', comment: 'Sinh viên không phản hồi, không tham gia', location: 'Gửi thông tin email/zalo...' },
]

export function hasTrackingFile(item: Pick<GuidingEvaluationItem, 'fileName'>): boolean {
  return Boolean(item.fileName && item.fileName.trim())
}

export function hasEvaluationScore(item: Pick<GuidingEvaluationItem, 'score'>): boolean {
  return item.score !== null && item.score !== undefined
}

export function isEvaluationCompleted(
  item: Pick<GuidingEvaluationItem, 'fileName' | 'score'>,
): boolean {
  return hasTrackingFile(item) && hasEvaluationScore(item)
}

export function getMissingEvaluationStatus(
  item: Pick<GuidingEvaluationItem, 'fileName' | 'score'>,
): string | null {
  const hasFile = hasTrackingFile(item)
  const hasScore = hasEvaluationScore(item)
  if (hasFile && hasScore) return null
  if (!hasFile && !hasScore) return 'Thiếu cả 2 mục'
  if (!hasFile) return 'Chưa nộp phiếu theo dõi'
  return 'Chưa chấm điểm hướng dẫn'
}

export function clampRubricValue(val: number): number {
  if (Number.isNaN(val)) return 0
  if (val > 10) return 10
  if (val < 0) return 0
  return val
}

export function getInitialRubricScores(item: GuidingEvaluationItem): RubricScores {
  if (item.rubricScores) return { ...item.rubricScores }
  const preset = DEFAULT_STUDENT_RUBRIC_SCORES[item.id] ?? DEFAULT_STUDENT_RUBRIC_SCORES['eval-01']
  return { ...preset }
}

export function computeRubricSummary(scores: RubricScores) {
  const criterionWeighted: Record<RubricCriterionKey, number> = {
    r1_1: 0,
    r1_2: 0,
    r2_1: 0,
    r2_2: 0,
    r3_1: 0,
    r3_2: 0,
    r4_1: 0,
    r4_2: 0,
    r4_3: 0,
  }
  const groupTotals: Record<1 | 2 | 3 | 4, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }
  let overallSum = 0

  for (const grp of RUBRIC_GROUPS) {
    let gSum = 0
    for (const crit of grp.criteria) {
      const raw = clampRubricValue(scores[crit.key])
      const weighted = (raw * crit.weight) / 100
      criterionWeighted[crit.key] = weighted
      gSum += weighted
      overallSum += weighted
    }
    groupTotals[grp.group] = gSum
  }

  const totalScore = Math.round(overallSum * 10) / 10

  return {
    criterionWeighted,
    groupTotals,
    totalScore,
  }
}

export function verifyTrackingFileContent(
  contentString: string,
  fileName: string,
  student: Pick<GuidingEvaluationItem, 'mssv'>,
): boolean {
  const combined = `${contentString} ${fileName}`.trim()
  return Boolean(student.mssv && combined.includes(student.mssv))
}

