import type {
  GuidingEvaluationItem,
  RubricCriterionKey,
  RubricGroupConfig,
  RubricScores,
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

const EMPTY_RUBRIC_SCORES: RubricScores = {
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

export function hasTrackingFile(
  item: Pick<GuidingEvaluationItem, 'progressReport' | 'fileName'>,
): boolean {
  return Boolean(item.progressReport || (item.fileName && item.fileName.trim()))
}

export function hasEvaluationScore(item: Pick<GuidingEvaluationItem, 'score'>): boolean {
  return item.score !== null && item.score !== undefined
}

export function isEvaluationCompleted(
  item: Pick<GuidingEvaluationItem, 'progressReport' | 'fileName'>,
): boolean {
  return hasTrackingFile(item)
}

export function clampRubricValue(val: number): number {
  if (Number.isNaN(val)) return 0
  if (val > 10) return 10
  if (val < 0) return 0
  return val
}

export function getInitialRubricScores(
  item: Pick<GuidingEvaluationItem, 'rubricScores'>,
): RubricScores {
  if (item.rubricScores) return { ...item.rubricScores }
  return { ...EMPTY_RUBRIC_SCORES }
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
