/**
 * Tiện ích tính toán độ lệch điểm và cảnh báo điểm lạc (Kỹ thuật #28: Live Outlier Alert)
 */
export function checkScoreOutlier(
  scores: number[],
  maxAllowedDiff: number = 2.0,
): { hasOutlier: boolean; min: number; max: number; diff: number } {
  if (scores.length < 2) {
    return { hasOutlier: false, min: scores[0] ?? 0, max: scores[0] ?? 0, diff: 0 }
  }

  const min = Math.min(...scores)
  const max = Math.max(...scores)
  const diff = parseFloat((max - min).toFixed(2))

  return {
    hasOutlier: diff > maxAllowedDiff,
    min,
    max,
    diff,
  }
}
