import React from 'react'
import { DownloadCloud, FileQuestion } from 'lucide-react'
import type { TemplateDocumentItem } from '../types/template.types'

interface DocumentTemplateTableProps {
  documents: TemplateDocumentItem[]
  selectedIds: number[]
  onToggleSelect: (id: number) => void
  onToggleSelectAll: (checked: boolean) => void
  allSelected: boolean
  someSelected: boolean
  onDownload: (doc: TemplateDocumentItem) => void
}

export const DocumentTemplateTable: React.FC<DocumentTemplateTableProps> = ({
  documents,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  allSelected,
  someSelected,
  onDownload,
}) => {
  const checkboxRef = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = someSelected
    }
  }, [someSelected])

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-700 font-semibold">
            <tr>
              <th className="py-3.5 px-4 w-12 text-center">
                <input
                  ref={checkboxRef}
                  type="checkbox"
                  aria-label="Chọn tất cả tài liệu hiển thị"
                  checked={allSelected}
                  onChange={(e) => onToggleSelectAll(e.target.checked)}
                  className="rounded-sm border-slate-300 text-[#1565C0] focus:ring-[#1565C0] cursor-pointer"
                />
              </th>
              <th className="py-3.5 px-4 w-16">STT</th>
              <th className="py-3.5 px-4">Tên tài liệu / Biểu mẫu</th>
              <th className="py-3.5 px-4 w-44">Loại biểu mẫu</th>
              <th className="py-3.5 px-4 w-32">Định dạng</th>
              <th className="py-3.5 px-4 w-32">Kích thước</th>
              <th className="py-3.5 px-4 w-28 text-center">Tải về</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {documents.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <FileQuestion className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <span>Không tìm thấy tài liệu nào phù hợp</span>
                </td>
              </tr>
            ) : (
              documents.map((doc, idx) => {
                const isChecked = selectedIds.includes(doc.id)
                return (
                  <tr
                    key={doc.id}
                    className={`hover:bg-slate-50/60 transition-colors ${isChecked ? 'bg-blue-50/30' : ''}`}
                  >
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        aria-label={`Chọn tài liệu ${doc.title}`}
                        checked={isChecked}
                        onChange={() => onToggleSelect(doc.id)}
                        className="rounded-sm border-slate-300 text-[#1565C0] focus:ring-[#1565C0] cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {doc.title}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        {doc.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-bold text-slate-700">
                        {doc.extension}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {doc.size}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onDownload(doc)}
                        className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-500 hover:text-[#1565C0] hover:bg-blue-50 transition-colors cursor-pointer"
                        title={`Tải ${doc.title}`}
                      >
                        <DownloadCloud className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
