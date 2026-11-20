import type { GuidingEvaluationItem } from '../types/guidingEvaluation.types'

export function hasTrackingFile(
  item: Pick<GuidingEvaluationItem, 'progressReport' | 'fileName'>,
): boolean {
  return Boolean(item.progressReport || (item.fileName && item.fileName.trim()))
}

export function isEvaluationCompleted(
  item: Pick<GuidingEvaluationItem, 'progressReport' | 'fileName'>,
): boolean {
  return hasTrackingFile(item)
}
