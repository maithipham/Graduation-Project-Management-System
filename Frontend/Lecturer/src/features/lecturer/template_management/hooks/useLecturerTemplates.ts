import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from '@/shared/components/feedback/toast.store'
import { useTemplateManagementStore } from '../store/templateManagement.store'

export function useLecturerTemplates() {
  const { documentTemplates } = useTemplateManagementStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const selectAllRef = useRef<HTMLInputElement>(null)

  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return documentTemplates.filter((doc) => {
      const matchSearch =
        q === '' ||
        doc.title.toLowerCase().includes(q) ||
        doc.extension.toLowerCase().includes(q)
      const matchType = selectedType === '' || doc.type === selectedType
      return matchSearch && matchType
    })
  }, [documentTemplates, searchQuery, selectedType])

  const visibleIds = useMemo(
    () => filteredTemplates.map((doc) => doc.id),
    [filteredTemplates],
  )

  const allFilteredSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id))
  const someFilteredSelected =
    !allFilteredSelected && visibleIds.some((id) => selectedIds.includes(id))

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.checked = allFilteredSelected
      selectAllRef.current.indeterminate = someFilteredSelected
    }
  }, [allFilteredSelected, someFilteredSelected])

  const handleToggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked
    if (isChecked) {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])))
    } else {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)))
    }
  }

  const handleToggleOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const handleDownloadOne = (doc: { title: string; extension: string }) => {
    toast.success(`Đang tải xuống: ${doc.title}${doc.extension.toLowerCase()}`)
  }

  const handleBulkDownload = () => {
    if (selectedIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một tài liệu để tải về!')
      return
    }
    toast.success(`Đang tải nén ZIP ${selectedIds.length} tài liệu đã chọn...`)
  }

  return {
    documentTemplates,
    searchQuery,
    setSearchQuery,
    selectedType,
    setSelectedType,
    selectedIds,
    selectAllRef,
    filteredTemplates,
    visibleIds,
    allFilteredSelected,
    someFilteredSelected,
    handleToggleSelectAll,
    handleToggleOne,
    handleDownloadOne,
    handleBulkDownload,
  }
}

