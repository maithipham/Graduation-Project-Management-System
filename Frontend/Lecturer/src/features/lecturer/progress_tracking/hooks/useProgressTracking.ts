import { useMemo, useState } from 'react'
import { toast } from '@/shared/components/feedback/toast.store'
import { useProgressTrackingStore } from '../store/progressTracking.store'
import type {
  TrackingSheetItem,
  TrackingSheetStatus,
} from '../types/progressTracking.types'

export function useProgressTracking() {
  const { trackingSheets, submitTrackingSheet } = useProgressTrackingStore()

  const [searchTracking, setSearchTracking] = useState('')
  const [filterStatus, setFilterStatus] = useState<'' | TrackingSheetStatus>('')
  const [activeItem, setActiveItem] = useState<TrackingSheetItem | null>(null)

  const stats = useMemo(() => {
    const total = trackingSheets.length
    const submitted = trackingSheets.filter((x) => x.status === 'submitted').length
    const unsubmitted = total - submitted
    return {
      total,
      submitted,
      unsubmitted,
    }
  }, [trackingSheets])

  const filteredItems = useMemo(() => {
    const q = searchTracking.trim().toLowerCase()
    return trackingSheets.filter((item) => {
      const matchQ =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.mssv.toLowerCase().includes(q) ||
        item.topic.toLowerCase().includes(q)
      const matchSt = !filterStatus || item.status === filterStatus
      return matchQ && matchSt
    })
  }, [trackingSheets, searchTracking, filterStatus])

  const handleConfirmSubmit = (id: string, fileName?: string) => {
    const target = trackingSheets.find((x) => x.id === id)
    submitTrackingSheet(id, fileName)
    toast.success(`Đã nộp phiếu theo dõi cho sinh viên ${target?.name ?? ''} thành công!`)
    setActiveItem(null)
  }

  const handleDownloadFile = (fileName: string) => {
    toast.info(`Đang tải xuống: ${fileName}`)
  }

  return {
    trackingSheets,
    searchTracking,
    setSearchTracking,
    filterStatus,
    setFilterStatus,
    activeItem,
    setActiveItem,
    stats,
    filteredItems,
    handleConfirmSubmit,
    handleDownloadFile,
  }
}

