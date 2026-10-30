import React from 'react'
import { Download, FileQuestion, Search } from 'lucide-react'
import { useLecturerTemplates } from '../hooks/useLecturerTemplates'

export const LecturerTemplatesPage: React.FC = () => {
  const {
    documentTemplates,
    searchQuery,
    setSearchQuery,
    selectedType,
    setSelectedType,
    selectedIds,
    selectAllRef,
    filteredTemplates,
    allFilteredSelected,
    handleToggleSelectAll,
    handleToggleOne,
    handleDownloadOne,
    handleBulkDownload,
  } = useLecturerTemplates()

  return (
    <div
      className="space-y-6 max-w-[1520px] w-full mx-auto"
      style={{
        fontFamily:
          '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* 1. TOP HEADER BANNER */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">
            Kho tài liệu & biểu mẫu đồ án tốt nghiệp
          </h2>
          <p className="text-[13px] text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
            Các mẫu báo cáo, quy chế chấm điểm, biên bản dành cho giảng viên hướng dẫn và hội đồng bảo vệ.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200/80 text-[#1565C0] text-[12.5px] font-semibold shrink-0">
          <span>Tổng số: {documentTemplates.length} tài liệu biểu mẫu</span>
        </div>
      </div>

      {/* 2. MAIN TEMPLATE CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Filters Toolbar & Bulk Download Button */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên tài liệu..."
                className="w-full text-xs sm:text-[13px] pl-10 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0] transition"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl shrink-0 overflow-x-auto">
              {[
                { key: '', label: 'Tất cả' },
                { key: 'Mẫu báo cáo', label: 'Báo cáo' },
                { key: 'Mẫu đề cương', label: 'Đề cương' },
                { key: 'Phiếu đánh giá', label: 'Phiếu đánh giá' },
                { key: 'Biên bản', label: 'Biên bản' },
                { key: 'Quy chế', label: 'Quy chế' },
              ].map((btn) => {
                const isActive = selectedType === btn.key
                return (
                  <button
                    key={btn.key}
                    type="button"
                    onClick={() => setSelectedType(btn.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-white text-slate-800 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {btn.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Nút Tải nhiều file */}
          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
            {selectedIds.length > 0 && (
              <span className="text-xs text-slate-500 font-medium">
                Đã chọn <strong className="text-slate-800 font-bold">{selectedIds.length}</strong> mục
              </span>
            )}
            <button
              type="button"
              onClick={handleBulkDownload}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#1565C0] text-white hover:bg-[#0D47A1] transition shadow-xs cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Tải tài liệu đã chọn</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
          {filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <FileQuestion size={28} />
              </div>
              <p className="text-sm font-semibold text-slate-700">Không tìm thấy tài liệu phù hợp</p>
              <p className="text-xs text-slate-400 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc loại tài liệu.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={handleToggleSelectAll}
                      className="rounded border-slate-300 text-[#1565C0] focus:ring-[#1565C0]/20 cursor-pointer"
                      title="Chọn tất cả"
                    />
                  </th>
                  <th className="py-3 px-4 w-12 text-center">STT</th>
                  <th className="py-3 px-4 min-w-[280px]">Tên tài liệu & biểu mẫu</th>
                  <th className="py-3 px-4 min-w-[130px]">Loại tài liệu</th>
                  <th className="py-3 px-4 min-w-[90px] text-center">Định dạng</th>
                  <th className="py-3 px-4 min-w-[100px] text-center">Dung lượng</th>
                  <th className="py-3 px-4 min-w-[120px] text-right">Tải về</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTemplates.map((doc, idx) => {
                  const isChecked = selectedIds.includes(doc.id)
                  const isDocx = doc.format === 'docx'

                  return (
                    <tr
                      key={doc.id}
                      className={`hover:bg-slate-50/70 transition-colors group ${
                        isChecked ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleOne(doc.id)}
                          className="rounded border-slate-300 text-[#1565C0] focus:ring-[#1565C0]/20 cursor-pointer"
                        />
                      </td>

                      <td className="py-3 px-4 text-center font-medium text-slate-400 text-xs">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleDownloadOne(doc)}
                          className="font-bold text-[12px] text-slate-900 group-hover:text-[#1565C0] hover:underline cursor-pointer text-left line-clamp-1"
                        >
                          {doc.title}
                        </button>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
                          {doc.type}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-bold ${
                            isDocx
                              ? 'bg-blue-50 text-[#1565C0] border border-blue-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {doc.extension}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {doc.size}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDownloadOne(doc)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-[#1565C0] hover:text-white transition cursor-pointer active:scale-95"
                          title="Tải về máy tính"
                        >
                          <Download size={13} />
                          <span>Tải về</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default LecturerTemplatesPage
