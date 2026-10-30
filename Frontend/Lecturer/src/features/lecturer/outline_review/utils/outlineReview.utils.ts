import type {
  OutlineCategory,
  OutlineReviewItem,
} from '../types/outlineReview.types'

export function getOutlineCategory(item: OutlineReviewItem): OutlineCategory {
  if (item.status === 'approved') return 'approved'
  if (item.isResubmitted || (item.submitCount > 1 && item.status === 'pending')) {
    return 'resubmitted'
  }
  if (item.status === 'rejected') return 'rejected'
  if (item.status === 'pending') return 'pending'
  return 'not_submitted'
}

export function parseDateVi(str?: string): number {
  if (!str || str === '—') return 0
  const parts = str.trim().split(' ')
  const dateParts = parts[0]?.split('/') ?? []
  if (dateParts.length < 3) return 0
  const day = parseInt(dateParts[0], 10) || 1
  const month = (parseInt(dateParts[1], 10) || 1) - 1
  const year = parseInt(dateParts[2], 10) || 2026
  let hour = 0
  let min = 0
  if (parts[1]) {
    const timeParts = parts[1].split(':')
    hour = parseInt(timeParts[0], 10) || 0
    min = parseInt(timeParts[1], 10) || 0
  }
  return new Date(year, month, day, hour, min).getTime()
}

