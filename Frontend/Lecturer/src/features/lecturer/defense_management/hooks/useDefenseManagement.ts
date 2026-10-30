import { useMemo, useState } from 'react'
import { toast } from '@/shared/components/feedback/toast.store'
import { useDefenseManagementStore } from '../store/defenseManagement.store'
import type { DefenseReviewStatus } from '../types/defenseManagement.types'

export function useDefenseManagement() {
  const {
    defenseCouncils,
    defenseReviews,
    updateDefenseReviewScore,
    approveDefenseReview,
    rejectDefenseReview,
  } = useDefenseManagementStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | DefenseReviewStatus>('all')
  const [rowErrorId, setRowErrorId] = useState<string | null>(null)

  const pendingCount = useMemo(
    () => defenseReviews.filter((item) => item.status === 'pending').length,
    [defenseReviews],
  )

  const filteredReviews = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return defenseReviews.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false
      }
      if (!q) return true
      return (
        item.name.toLowerCase().includes(q) ||
        item.mssv.toLowerCase().includes(q) ||
        item.topic.toLowerCase().includes(q) ||
        item.supervisorName.toLowerCase().includes(q)
      )
    })
  }, [defenseReviews, searchQuery, statusFilter])

  const handleScoreChange = (id: string, rawValue: string) => {
    if (rowErrorId === id) {
      setRowErrorId(null)
    }
    if (rawValue.trim() === '') {
      updateDefenseReviewScore(id, null)
      return
    }
    const parsed = Number(rawValue)
    if (!Number.isNaN(parsed)) {
      if (parsed < 0 || parsed > 10) {
        setRowErrorId(id)
      } else {
        updateDefenseReviewScore(id, parsed)
      }
    }
  }

  const handleApprove = (id: string) => {
    const item = defenseReviews.find((x) => x.id === id)
    if (item?.score === null || item?.score === undefined) {
      setRowErrorId(id)
      toast.error('Vui lòng nhập điểm trước khi đồng ý cho bảo vệ!')
      return
    }
    approveDefenseReview(id)
    toast.success(`Đã xác nhận cho sinh viên ${item.name} bảo vệ thành công!`)
  }

  const handleReject = (id: string) => {
    const item = defenseReviews.find((x) => x.id === id)
    rejectDefenseReview(id)
    toast.error(`Đã từ chối cho sinh viên ${item?.name ?? ''} bảo vệ.`)
  }

  return {
    defenseCouncils,
    defenseReviews,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    rowErrorId,
    pendingCount,
    filteredReviews,
    handleScoreChange,
    handleApprove,
    handleReject,
  }
}

