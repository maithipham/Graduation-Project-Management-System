import { useMemo, useState } from 'react'
import { toast } from '@/shared/components/feedback/toast.store'
import { useSupervisorRegistrationStore } from '../store/supervisorRegistration.store'
import type {
  SupervisorRequestItem,
  SupervisorTabStatus,
} from '../types/supervisorRegistration.types'

const PAGE_SIZE = 15

export function useSupervisorRequests() {
  const { supervisorRequests, approveSupervisorRequest, rejectSupervisorRequest } =
    useSupervisorRegistrationStore()

  const [tabStatus, setTabStatus] = useState<SupervisorTabStatus>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [approveTarget, setApproveTarget] = useState<SupervisorRequestItem | null>(null)
  const [rejectTarget, setRejectTarget] = useState<SupervisorRequestItem | null>(null)

  const counts = useMemo(
    () => ({
      pending: supervisorRequests.filter((r) => r.status === 'pending').length,
      approved: supervisorRequests.filter((r) => r.status === 'approved').length,
      rejected: supervisorRequests.filter((r) => r.status === 'rejected').length,
      all: supervisorRequests.length,
    }),
    [supervisorRequests],
  )

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return supervisorRequests.filter((item) => {
      const matchQ =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.mssv.toLowerCase().includes(q) ||
        item.topic.toLowerCase().includes(q) ||
        item.major.toLowerCase().includes(q)
      const matchSt = !tabStatus || item.status === tabStatus
      return matchQ && matchSt
    })
  }, [supervisorRequests, searchQuery, tabStatus])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(Math.max(1, currentPage), totalPages)
  const startIdx = (safePage - 1) * PAGE_SIZE
  const endIdx = Math.min(startIdx + PAGE_SIZE, filtered.length)
  const pageData = filtered.slice(startIdx, endIdx)

  const handleConfirmApprove = (id: string) => {
    const target = approveTarget || supervisorRequests.find((r) => r.id === id)
    approveSupervisorRequest(id)
    toast.success(`Đã tiếp nhận hướng dẫn đồ án cho sinh viên ${target?.name ?? ''} thành công!`)
    setApproveTarget(null)
  }

  const handleConfirmReject = (id: string, reason?: string) => {
    const target = rejectTarget || supervisorRequests.find((r) => r.id === id)
    rejectSupervisorRequest(id, reason)
    toast.success(`Đã từ chối hướng dẫn đồ án của sinh viên ${target?.name ?? ''}!`)
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
    handleConfirmApprove,
    handleConfirmReject,
  }
}
