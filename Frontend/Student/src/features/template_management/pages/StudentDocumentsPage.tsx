import React, { useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  Download,
  Search,
} from 'lucide-react'
import { DocumentTemplateTable } from '../components/DocumentTemplateTable'
import { useTemplateManagement } from '../hooks/useTemplateManagement'
import { TEMPLATE_DOCUMENT_TYPES } from '../services/template.service'
import type { TemplateDocumentItem } from '../types/template.types'

interface ToastMessage {
  id: number
  message: string
  type: 'success' | 'warning' | 'error'
}

export const StudentDocumentsPage: React.FC = () => {
  const { documents, selectedIds, setSelectedIds } = useTemplateManagement()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const toastSeqRef = useRef(0)

  const pushToast = (message: string, type: ToastMessage['type'] = 'success') => {
    toastSeqRef.current += 1
    const id = toastSeqRef.current
    setToasts((prev) => [...prev, { id, message, type }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id))
    }, 3200)
  }

  const filteredDocs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return documents.filter((doc) => {
      const matchSearch =
        query === '' ||
        doc.title.toLowerCase().includes(query) ||
        doc.extension.toLowerCase().includes(query)

      const matchType = selectedType === '' || doc.type === selectedType
      return matchSearch && matchType
    })
  }, [documents, searchQuery, selectedType])

  const allFilteredSelected =
    filteredDocs.length > 0 && filteredDocs.every((doc) => selectedIds.includes(doc.id))
  const someFilteredSelected =
    !allFilteredSelected && filteredDocs.some((doc) => selectedIds.includes(doc.id))

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      const filteredIds = filteredDocs.map((doc) => doc.id)
      setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])))
    } else {
      const filteredIdsSet = new Set(filteredDocs.map((doc) => doc.id))
      setSelectedIds((prev) => prev.filter((id) => !filteredIdsSet.has(id)))
    }
  }

  const handleToggleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const handleDownloadSingle = (doc: TemplateDocumentItem) => {
    pushToast(`Đang tải xuống: ${doc.title}${doc.extension}...`, 'success')
  }

  const handleDownloadBulk = () => {
    if (selectedIds.length === 0) {
      pushToast('Vui lòng chọn ít nhất một tài liệu để tải về!', 'warning')
      return
    }
    pushToast(
      `Đang nén và chuẩn bị tải xuống ${selectedIds.length} tài liệu đã chọn...`,
      'success',
    )
  }

  return (
    <div className="max-w-7xl w-full mx-auto space-y-6">
      {/* Toast notifications */}
      <div className="fixed top-20 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-150 ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : toast.type === 'warning'
                  ? 'bg-amber-600 text-white border-amber-500'
                  : 'bg-rose-600 text-white border-rose-500'
            }`}
          >
            {toast.type === 'success' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Header card with action */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Tài liệu & Biểu mẫu mẫu
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tổng hợp các biểu mẫu hướng dẫn, mẫu đề cương, phiếu chấm điểm và báo cáo cho sinh viên
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadBulk}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-bold uppercase transition-colors shadow-xs cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Tải các mục đã chọn ({selectedIds.length})</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên biểu mẫu, đuôi tệp (.docx, .pdf, .xlsx)..."
            className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#1565C0]/30 focus:border-[#1565C0]"
          />
        </div>

        <div className="relative w-full md:w-64 shrink-0">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full text-xs appearance-none pl-3.5 pr-8 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1565C0]/30 focus:border-[#1565C0] text-slate-700 cursor-pointer"
          >
            <option value="">Tất cả loại biểu mẫu</option>
            {TEMPLATE_DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Documents Table */}
      <DocumentTemplateTable
        documents={filteredDocs}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelectOne}
        onToggleSelectAll={handleToggleSelectAll}
        allSelected={allFilteredSelected}
        someSelected={someFilteredSelected}
        onDownload={handleDownloadSingle}
      />
    </div>
  )
}

export default StudentDocumentsPage
