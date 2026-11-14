import { useMemo, useState } from 'react'
import { toast } from '@/shared/components/feedback/toast.store'
import { useTopicProposalStore } from '../store/topicProposal.store'
import type {
  TopicProposalItem,
  TopicProposalTabStatus,
} from '../types/topicProposal.types'

const PAGE_SIZE = 15

export function useTopicProposals() {
  const { topicProposals, approveTopicProposal, rejectTopicProposal } =
    useTopicProposalStore()

  const [tabStatus, setTabStatus] = useState<TopicProposalTabStatus>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [approveTarget, setApproveTarget] = useState<TopicProposalItem | null>(null)
  const [rejectTarget, setRejectTarget] = useState<TopicProposalItem | null>(null)
  const [detailTarget, setDetailTarget] = useState<TopicProposalItem | null>(null)

  const counts = useMemo(
    () => ({
      pending: topicProposals.filter((p) => p.status === 'pending').length,
      approved: topicProposals.filter((p) => p.status === 'approved').length,
      rejected: topicProposals.filter((p) => p.status === 'rejected').length,
      all: topicProposals.length,
    }),
    [topicProposals],
  )

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return topicProposals.filter((item) => {
      const matchQ =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.mssv.toLowerCase().includes(q) ||
        item.topic.toLowerCase().includes(q) ||
        item.oldTopic.toLowerCase().includes(q)
      const matchSt = !tabStatus || item.status === tabStatus
      return matchQ && matchSt
    })
  }, [topicProposals, searchQuery, tabStatus])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(Math.max(1, currentPage), totalPages)
  const startIdx = (safePage - 1) * PAGE_SIZE
  const endIdx = Math.min(startIdx + PAGE_SIZE, filtered.length)
  const pageData = filtered.slice(startIdx, endIdx)

  const handleConfirmApprove = (id: string) => {
    const target = approveTarget || topicProposals.find((p) => p.id === id)
    approveTopicProposal(id)
    toast.success(`Đã duyệt tên đề tài cho sinh viên ${target?.name ?? ''} thành công!`)
    setApproveTarget(null)
  }

  const handleConfirmReject = (id: string, reason?: string) => {
    const target = rejectTarget || topicProposals.find((p) => p.id === id)
    rejectTopicProposal(id, reason)
    toast.success(`Đã từ chối đề xuất tên đề tài của sinh viên ${target?.name ?? ''}!`)
    setRejectTarget(null)
  }

  return {
    tabStatus,
    setTabStatus,
    searchQuery,
    setSearchQuery,
    currentPage: safePage,
    setCurrentPage,
    totalPages,
    counts,
    filtered,
    pageData,
    approveTarget,
    setApproveTarget,
    rejectTarget,
    setRejectTarget,
    detailTarget,
    setDetailTarget,
    handleConfirmApprove,
    handleConfirmReject,
  }
}

