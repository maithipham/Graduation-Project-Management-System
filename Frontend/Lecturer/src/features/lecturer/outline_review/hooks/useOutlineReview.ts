import { useMemo, useState } from 'react'
import { toast } from '@/shared/components/feedback/toast.store'
import { useOutlineReviewStore } from '../store/outlineReview.store'
import type {
  OutlineReviewItem,
  OutlineRole,
  RejectedSubTab,
  OutlineTabStatus,
} from '../types/outlineReview.types'
import { getOutlineCategory, parseDateVi } from '../utils/outlineReview.utils'

const PAGE_SIZE = 15

export function useOutlineReview() {
  const {
    outlines,
    readOutlineIds,
    approveOutline,
    rejectOutline,
    updateOutlineFeedback,
    markOutlineAsRead,
    resetOutlines,
  } = useOutlineReviewStore()

  const [activeRole, setActiveRole] = useState<OutlineRole>('guide')
  const [tabStatus, setTabStatus] = useState<OutlineTabStatus>('pending')
  const [rejectedSubTab, setRejectedSubTab] = useState<RejectedSubTab>('rejected_resubmitted')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [previewItem, setPreviewItem] = useState<OutlineReviewItem | null>(null)
  const [approveItem, setApproveItem] = useState<OutlineReviewItem | null>(null)
  const [rejectItem, setRejectItem] = useState<OutlineReviewItem | null>(null)
  const [historyItem, setHistoryItem] = useState<OutlineReviewItem | null>(null)
  const [feedbackItem, setFeedbackItem] = useState<OutlineReviewItem | null>(null)

  const roleOutlines = useMemo(
    () => outlines.filter((o) => o.role === activeRole),
    [outlines, activeRole],
  )

  const counts = useMemo(() => {
    let pending = 0
    let approved = 0
    let rejected = 0
    let resubmitted = 0
    let unsubmitted = 0

    roleOutlines.forEach((item) => {
      const cat = getOutlineCategory(item)
      if (cat === 'pending' || cat === 'resubmitted') pending++
      if (cat === 'approved') approved++
      if (cat === 'rejected') rejected++
      if (item.status === 'rejected') {
        if (item.isResubmitted || item.history.some((h) => h.submitIndex > 1)) {
          resubmitted++
        } else {
          unsubmitted++
        }
      }
    })

    return {
      pending,
      approved,
      rejected,
      resubmitted,
      unsubmitted,
      all: roleOutlines.length,
    }
  }, [roleOutlines])

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return roleOutlines
      .filter((item) => {
        const cat = getOutlineCategory(item)
        if (tabStatus === 'pending') {
          if (cat !== 'pending' && cat !== 'resubmitted') return false
        } else if (tabStatus === 'approved') {
          if (cat !== 'approved') return false
        } else if (tabStatus === 'rejected') {
          if (cat !== 'rejected') return false
          if (rejectedSubTab === 'rejected_resubmitted') {
            const hasResubmitted = item.isResubmitted || item.history.some((h) => h.submitIndex > 1)
            if (!hasResubmitted) return false
          } else if (rejectedSubTab === 'rejected_unsubmitted') {
            const hasResubmitted = item.isResubmitted || item.history.some((h) => h.submitIndex > 1)
            if (hasResubmitted) return false
          }
        }

        if (q) {
          const matchName = item.name.toLowerCase().includes(q)
          const matchMssv = item.mssv.toLowerCase().includes(q)
          const matchTopic = item.topic.toLowerCase().includes(q)
          const matchFile = item.fileName.toLowerCase().includes(q)
          if (!matchName && !matchMssv && !matchTopic && !matchFile) return false
        }
        return true
      })
      .sort((a, b) => parseDateVi(b.submittedDate) - parseDateVi(a.submittedDate))
  }, [roleOutlines, tabStatus, rejectedSubTab, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(Math.max(1, currentPage), totalPages)
  const startIdx = (safePage - 1) * PAGE_SIZE
  const endIdx = Math.min(startIdx + PAGE_SIZE, filtered.length)
  const pageData = filtered.slice(startIdx, endIdx)

  const handleOpenPreview = (item: OutlineReviewItem) => {
    markOutlineAsRead(item.id)
    setPreviewItem(item)
  }

  const handleConfirmApprove = (id: string) => {
    const target = approveItem || outlines.find((o) => o.id === id)
    approveOutline(id)
    toast.success(`Đã duyệt đề cương của sinh viên ${target?.name ?? ''} thành công!`)
    setApproveItem(null)
  }

  const handleConfirmReject = (id: string, reason: string) => {
    const target = rejectItem || outlines.find((o) => o.id === id)
    rejectOutline(id, reason)
    toast.success(`Đã từ chối và gửi phản hồi đề cương cho sinh viên ${target?.name ?? ''}!`)
    setRejectItem(null)
  }

  const handleSaveFeedback = (id: string, feedback: string) => {
    updateOutlineFeedback(id, feedback)
    toast.success('Đã cập nhật góp ý đề cương thành công!')
    setFeedbackItem(null)
  }

  return {
    activeRole,
    setActiveRole,
    tabStatus,
    setTabStatus,
    rejectedSubTab,
    setRejectedSubTab,
    searchQuery,
    setSearchQuery,
    currentPage: safePage,
    setCurrentPage,
    totalPages,
    counts,
    filtered,
    pageData,
    readOutlineIds,
    previewItem,
    setPreviewItem,
    approveItem,
    setApproveItem,
    rejectItem,
    setRejectItem,
    historyItem,
    setHistoryItem,
    feedbackItem,
    setFeedbackItem,
    handleOpenPreview,
    handleConfirmApprove,
    handleConfirmReject,
    handleSaveFeedback,
    resetOutlines,
  }
}
