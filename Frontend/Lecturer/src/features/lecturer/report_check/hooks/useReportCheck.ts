import { useMemo, useState } from 'react'
import { toast } from '@/shared/components/feedback/toast.store'
import { useReportCheckStore } from '../store/reportCheck.store'
import type {
  ReportCheckCounts,
  ReportCheckItem,
  ReportTabStatus,
} from '../types/reportCheck.types'

export function useReportCheck() {
  const {
    reports,
    approveReport,
    rejectReport,
    submitPlagiarismResult,
    markReportDownloaded,
  } = useReportCheckStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<ReportTabStatus>('pending')
  const [pageSize, setPageSize] = useState<number>(15)
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Targets cho các modal
  const [plagiarismTarget, setPlagiarismTarget] = useState<ReportCheckItem | null>(null)
  const [approveTarget, setApproveTarget] = useState<ReportCheckItem | null>(null)
  const [rejectTarget, setRejectTarget] = useState<ReportCheckItem | null>(null)
  const [historyTarget, setHistoryTarget] = useState<ReportCheckItem | null>(null)
  const [previewTarget, setPreviewTarget] = useState<ReportCheckItem | null>(null)

  // Thống kê đếm số lượng cho các tab
  const counts: ReportCheckCounts = useMemo(() => {
    let pending = 0
    let rejected = 0
    let notSubmitted = 0
    let approved = 0

    for (const r of reports) {
      if (r.status === 'pending') pending++
      else if (r.status === 'rejected') rejected++
      else if (r.status === 'not_submitted') notSubmitted++
      else if (r.status === 'approved') approved++
    }

    return {
      pending,
      rejected,
      notSubmitted,
      approved,
      all: reports.length,
    }
  }, [reports])

  // Lọc dữ liệu theo tab và từ khóa tìm kiếm
  const filteredReports = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return reports.filter((item) => {
      const matchQ =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.mssv.toLowerCase().includes(q) ||
        item.topic.toLowerCase().includes(q) ||
        item.reportFileName.toLowerCase().includes(q)

      let matchStatus = true
      if (filterStatus) {
        matchStatus = item.status === filterStatus
      }

      return matchQ && matchStatus
    })
  }, [reports, searchQuery, filterStatus])

  // Phân trang
  const totalItems = filteredReports.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(Math.max(1, currentPage), totalPages)
  const startIdx = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1
  const endIdx = Math.min(safePage * pageSize, totalItems)

  const pagedReports = useMemo(() => {
    const from = (safePage - 1) * pageSize
    return filteredReports.slice(from, from + pageSize)
  }, [filteredReports, safePage, pageSize])

  const handleTabChange = (status: ReportTabStatus) => {
    setFilterStatus(status)
    setCurrentPage(1)
  }

  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    setCurrentPage(1)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  // Thao tác duyệt báo cáo
  const handleConfirmApprove = (id: string, comment?: string) => {
    const studentName = approveTarget?.name ?? ''
    approveReport(id, comment)
    setApproveTarget(null)
    toast.success(`Đã phê duyệt báo cáo đồ án của sinh viên ${studentName} thành công!`)
  }

  // Thao tác từ chối báo cáo
  const handleConfirmReject = (id: string, comment?: string) => {
    const studentName = rejectTarget?.name ?? ''
    rejectReport(id, comment)
    setRejectTarget(null)
    toast.info(`Đã xác nhận từ chối báo cáo của sinh viên ${studentName}!`)
  }

  // Cập nhật kết quả đạo văn
  const handleConfirmPlagiarism = (id: string, fileName: string, rate: number) => {
    const studentName = plagiarismTarget?.name ?? ''
    submitPlagiarismResult(id, fileName, rate)
    setPlagiarismTarget(null)
    toast.success(`Đã cập nhật kết quả kiểm tra trùng lặp cho sinh viên ${studentName}!`)
  }

  // Download báo cáo
  const handleDownloadReport = (item: ReportCheckItem) => {
    markReportDownloaded(item.id)
    toast.success(`Đang tải xuống tệp: ${item.reportFileName || `${item.name}-Bao-cao.pdf`}`)
  }

  return {
    reports,
    filteredReports,
    pagedReports,
    counts,
    searchQuery,
    setSearchQuery: handleSearchChange,
    filterStatus,
    setFilterStatus: handleTabChange,
    pageSize,
    setPageSize: handlePageSizeChange,
    currentPage: safePage,
    totalPages,
    startIdx,
    endIdx,
    totalItems,
    handlePageChange,

    // Modal targets
    plagiarismTarget,
    setPlagiarismTarget,
    approveTarget,
    setApproveTarget,
    rejectTarget,
    setRejectTarget,
    historyTarget,
    setHistoryTarget,
    previewTarget,
    setPreviewTarget,

    // Actions
    handleConfirmApprove,
    handleConfirmReject,
    handleConfirmPlagiarism,
    handleDownloadReport,
  }
}
