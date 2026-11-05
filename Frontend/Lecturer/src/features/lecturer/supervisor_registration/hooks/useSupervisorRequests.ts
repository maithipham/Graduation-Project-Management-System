import { useEffect, useMemo, useState } from 'react'
import { toast } from '@/shared/components/feedback/toast.store'
import { useSupervisorRegistrationStore } from '../store/supervisorRegistration.store'

import type {
  SupervisorRequestItem,
  SupervisorTabStatus,
} from '../types/supervisorRegistration.types'

const PAGE_SIZE = 15

export function useSupervisorRequests(semesterPublicId: string) {
  const {
    supervisorRequests,
    counts,
    loading,
    error,
    fetchRequests,
    approveRequest,
    rejectRequest,
  } = useSupervisorRegistrationStore()

  const [tabStatus, setTabStatus] =
    useState<SupervisorTabStatus>('pending')

  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [approveTarget, setApproveTarget] =
    useState<SupervisorRequestItem | null>(null)

  const [rejectTarget, setRejectTarget] =
    useState<SupervisorRequestItem | null>(null)

  // Gọi BE khi học kỳ, trạng thái hoặc từ khóa thay đổi
  useEffect(() => {
    if (!semesterPublicId) return

    const params = {
      semesterPublicId,
      status: tabStatus,
      keyword: searchQuery.trim(),
    }

    fetchRequests(params)
    setCurrentPage(1)
  }, [semesterPublicId, tabStatus, searchQuery, fetchRequests])

  // Danh sách hiện tại đã được BE lọc
  const filtered = useMemo(
    () => supervisorRequests,
    [supervisorRequests],
  )

  // Phân trang ở FE
  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / PAGE_SIZE),
  )

  const safePage = Math.min(
    Math.max(1, currentPage),
    totalPages,
  )

  const startIdx = (safePage - 1) * PAGE_SIZE
  const endIdx = Math.min(startIdx + PAGE_SIZE, filtered.length)

  const pageData = filtered.slice(startIdx, endIdx)

  // Xác nhận duyệt
  const handleConfirmApprove = async (id: string) => {
    const target =
      approveTarget || supervisorRequests.find((r) => r.id === id)

    try {
      await approveRequest(id)

      toast.success(
        `Đã tiếp nhận hướng dẫn đồ án cho sinh viên ${target?.name ?? ''} thành công!`,
      )

      setApproveTarget(null)
    } catch {
      toast.error('Không thể duyệt yêu cầu. Vui lòng thử lại!')
    }
  }

  // Xác nhận từ chối - không cần lý do
  const handleConfirmReject = async (id: string) => {
    const target =
      rejectTarget || supervisorRequests.find((r) => r.id === id)

    try {
      await rejectRequest(id)

      toast.success(
        `Đã từ chối hướng dẫn đồ án của sinh viên ${target?.name ?? ''}!`,
      )

      setRejectTarget(null)
    } catch {
      toast.error('Không thể từ chối yêu cầu. Vui lòng thử lại!')
    }
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

    loading,
    error,

    approveTarget,
    setApproveTarget,

    rejectTarget,
    setRejectTarget,

    handleConfirmApprove,
    handleConfirmReject,
  }
}