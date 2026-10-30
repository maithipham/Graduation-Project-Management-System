import { useMemo, useState } from 'react'
import { toast } from '@/shared/components/feedback/toast.store'
import { useReportCheckStore } from '../store/reportCheck.store'
import type {
  ReportCheckItem,
  ReportPreviewDocState,
} from '../types/reportCheck.types'

export function useReportCheck() {
  const { reports, approveReport, rejectReport, submitPlagiarismResult } =
    useReportCheckStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [plagiarismTarget, setPlagiarismTarget] = useState<ReportCheckItem | null>(null)
  const [rejectTarget, setRejectTarget] = useState<ReportCheckItem | null>(null)
  const [previewDoc, setPreviewDoc] = useState<ReportPreviewDocState | null>(null)

  const summary = useMemo(() => {
    const total = reports.length
    const submittedCount = reports.filter(
      (r) => Boolean(r.reportFileName) && r.status !== 'not_submitted',
    ).length
    const notSubmittedCount = total - submittedCount
    const hasPlagCount = reports.filter((r) => Boolean(r.plagiarismFile)).length
    const approvedCount = reports.filter((r) => r.status === 'approved').length
    return { total, submittedCount, notSubmittedCount, hasPlagCount, approvedCount }
  }, [reports])

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return reports.filter((item) => {
      const matchQ =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.mssv.toLowerCase().includes(q) ||
        item.topic.toLowerCase().includes(q) ||
        item.reportFileName.toLowerCase().includes(q)
      const matchSt = !filterStatus || item.status === filterStatus
      return matchQ && matchSt
    })
  }, [reports, searchQuery, filterStatus])

  const handleApprove = (item: ReportCheckItem) => {
    approveReport(item.id)
    toast.success(`Đã duyệt báo cáo đồ án của sinh viên ${item.name} thành công!`)
  }

  const handleConfirmReject = (id: string, comment: string) => {
    const studentName = rejectTarget?.name ?? ''
    rejectReport(id, comment)
    setRejectTarget(null)
    toast.success(`Đã từ chối báo cáo của sinh viên ${studentName}!`)
  }

  const handleConfirmPlagiarism = (id: string, fileName: string, rate: number) => {
    const studentName = plagiarismTarget?.name ?? ''
    submitPlagiarismResult(id, fileName, rate)
    setPlagiarismTarget(null)
    toast.success(`Đã cập nhật kết quả kiểm tra trùng lặp cho ${studentName}!`)
  }

  return {
    reports,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    summary,
    filtered,
    plagiarismTarget,
    setPlagiarismTarget,
    rejectTarget,
    setRejectTarget,
    previewDoc,
    setPreviewDoc,
    handleApprove,
    handleConfirmReject,
    handleConfirmPlagiarism,
  }
}

