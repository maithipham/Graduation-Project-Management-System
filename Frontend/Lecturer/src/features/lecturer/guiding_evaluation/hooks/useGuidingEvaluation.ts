import { useMemo, useState } from 'react'
import { toast } from '@/shared/components/feedback/toast.store'
import { guidingEvaluationService } from '../services/guidingEvaluation.service'
import { useGuidingEvaluationStore } from '../store/guidingEvaluation.store'
import type {
  GuidingEvaluationItem,
  GuidingEvaluationTabStatus,
  RubricScores,
} from '../types/guidingEvaluation.types'
import {
  hasTrackingFile,
  isEvaluationCompleted,
} from '../utils/guidingEvaluation.utils'

export function useGuidingEvaluation() {
  const {
    guidingEvaluations,
    teacher,
    academicYear,
    semester,
    submitEvaluationTrackingFile,
    saveEvaluationRubric,
  } = useGuidingEvaluationStore()

  const [filterStatus, setFilterStatus] = useState<GuidingEvaluationTabStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [pageSize, setPageSize] = useState<number>(15)
  const [currentPage, setCurrentPage] = useState<number>(1)

  const [uploadTarget, setUploadTarget] = useState<GuidingEvaluationItem | null>(null)
  const [rubricTarget, setRubricTarget] = useState<GuidingEvaluationItem | null>(null)
  const [previewTarget, setPreviewTarget] = useState<GuidingEvaluationItem | null>(null)

  const counts = useMemo(
    () => guidingEvaluationService.getCounts(guidingEvaluations),
    [guidingEvaluations],
  )

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return guidingEvaluations.filter((item) => {
      const completed = isEvaluationCompleted(item)
      if (filterStatus === 'incomplete' && completed) return false
      if (filterStatus === 'completed' && !completed) return false

      if (q) {
        return (
          item.name.toLowerCase().includes(q) ||
          item.mssv.toLowerCase().includes(q) ||
          item.topic.toLowerCase().includes(q) ||
          item.classCode.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [guidingEvaluations, filterStatus, searchQuery])

  const totalItems = filteredItems.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(Math.max(1, currentPage), totalPages)
  const startIdx = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1
  const endIdx = Math.min(safePage * pageSize, totalItems)

  const pagedItems = useMemo(() => {
    const from = (safePage - 1) * pageSize
    return filteredItems.slice(from, from + pageSize)
  }, [filteredItems, safePage, pageSize])

  const handleTabChange = (status: GuidingEvaluationTabStatus) => {
    setFilterStatus(status)
    setCurrentPage(1)
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
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

  const handleConfirmUpload = (item: GuidingEvaluationItem, fileName: string) => {
    const isReUpload = hasTrackingFile(item)
    submitEvaluationTrackingFile(item.id, fileName)
    setUploadTarget(null)
    toast.success(
      isReUpload
        ? `Đã cập nhật (nộp lại) phiếu theo dõi tiến độ mới cho sinh viên ${item.name} thành công!`
        : `Đã nộp phiếu theo dõi tiến độ cho sinh viên ${item.name} thành công!`,
    )
  }

  const handleSaveRubric = (
    item: GuidingEvaluationItem,
    totalScore: number,
    rubricScores: RubricScores,
    isDraft: boolean,
  ) => {
    saveEvaluationRubric(item.id, totalScore, rubricScores, isDraft)
    setRubricTarget(null)
    if (isDraft) {
      toast.info(`Đã lưu nháp bảng điểm cho sinh viên ${item.name}.`)
    } else {
      toast.success(
        `Đã lưu bảng điểm hướng dẫn (${totalScore.toFixed(1)} / 10.0) cho ${item.name} thành công!`,
      )
    }
  }

  const handleDownloadTrackingFile = (item: GuidingEvaluationItem) => {
    const finalName = item.fileName || `Phieu_tiendo_${item.mssv}.pdf`
    const lecturerFullName = `${teacher.degree ? `${teacher.degree} ` : ''}${teacher.name || 'Chu Thị Minh Huệ'}`
    const workplace = teacher.workplace || 'Trường Đại học Thủy lợi'

    const fileContent = [
      'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
      'Độc lập – Tự do – Hạnh phúc',
      '',
      'PHIẾU THEO DÕI HƯỚNG DẪN SINH VIÊN THỰC HIỆN HỌC PHẦN TỐT NGHIỆP',
      '',
      `Sinh viên: ${item.name}`,
      `Mã sinh viên: ${item.mssv}`,
      `Lớp: ${item.classCode || '64CNTT3'}`,
      `Đề tài: ${item.topic}`,
      `Giảng viên hướng dẫn: ${lecturerFullName}`,
      `Đơn vị công tác: ${workplace}`,
      '',
      `Tệp tài liệu: ${finalName}`,
      'Trạng thái: Đã xác thực điện tử bởi Cổng Giảng viên TLU Capstone.',
    ].join('\n')

    const blob = new Blob([fileContent], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = finalName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(url), 1000)

    toast.success(`Đã tải xuống file ${finalName} về máy thành công!`)
  }

  return {
    teacher,
    academicYear,
    semester,
    counts,
    filterStatus,
    searchQuery,
    pageSize,
    currentPage: safePage,
    totalPages,
    startIdx,
    endIdx,
    totalItems,
    pagedItems,

    uploadTarget,
    setUploadTarget,
    rubricTarget,
    setRubricTarget,
    previewTarget,
    setPreviewTarget,

    handleTabChange,
    handleSearchChange,
    handlePageSizeChange,
    handlePageChange,
    handleConfirmUpload,
    handleSaveRubric,
    handleDownloadTrackingFile,
  }
}

