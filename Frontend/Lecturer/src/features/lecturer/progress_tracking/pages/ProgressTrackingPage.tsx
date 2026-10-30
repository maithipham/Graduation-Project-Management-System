import React from 'react'
import { Clock, FileCheck, FileQuestion, Search } from 'lucide-react'
import { UploadTrackingModal } from '../components/UploadTrackingModal'
import { useProgressTracking } from '../hooks/useProgressTracking'

export const ProgressTrackingPage: React.FC = () => {
  const {
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
  } = useProgressTracking()

  return (
    <div
      className="space-y-6 max-w-[1520px] w-full mx-auto"
      style={{
        fontFamily:
          '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* 1. TOP STATUS BANNER */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">
            Phiếu theo dõi tiến trình đồ án
          </h2>
          <p className="text-[13px] text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap" id="topSummaryText">
            <span className="font-semibold text-slate-800">{stats.total}</span> sinh viên hướng dẫn
            <span className="text-slate-300 mx-1">·</span>
            <span className="font-semibold text-slate-800">{stats.submitted}</span> đã nộp phiếu theo dõi,
            <span className="font-semibold text-slate-800">{stats.unsubmitted}</span> chưa nộp
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-[12.5px] font-semibold shrink-0">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Hạn nộp phiếu: 23:59 20/06/2026</span>
        </div>
      </div>

      {/* 2. MAIN TABLE CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Filters Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTracking}
                onChange={(e) => setSearchTracking(e.target.value)}
                placeholder="Tìm theo tên SV, MSSV, tên đề tài..."
                className="w-full text-xs sm:text-[13px] pl-10 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0] transition"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setFilterStatus('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  filterStatus === ''
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tất cả ({stats.total})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('submitted')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  filterStatus === 'submitted'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Đã nộp ({stats.submitted})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('not_submitted')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  filterStatus === 'not_submitted'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Chưa nộp ({stats.unsubmitted})
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium shrink-0 self-center">
            Hiển thị <span className="font-bold text-slate-800">{filteredItems.length}</span> / {trackingSheets.length} sinh viên
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <FileQuestion size={28} />
              </div>
              <p className="text-sm font-semibold text-slate-700">Không tìm thấy sinh viên phù hợp</p>
              <p className="text-xs text-slate-400 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">STT</th>
                  <th className="py-3 px-4 min-w-[200px]">Sinh viên & Đề tài</th>
                  <th className="py-3 px-4 min-w-[220px]">File phiếu theo dõi</th>
                  <th className="py-3 px-4 min-w-[130px]">Thời gian nộp</th>
                  <th className="py-3 px-4 min-w-[120px] text-center">Trạng thái</th>
                  <th className="py-3 px-4 min-w-[140px] text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="py-3 px-4 text-center font-medium text-slate-400 text-xs">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-[#1565C0] transition-colors">{item.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{item.mssv}</div>
                      <div className="text-slate-700 text-[11.5px] line-clamp-1 mt-1" title={item.topic}>
                        {item.topic}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {item.fileName ? (
                        <button
                          type="button"
                          onClick={() => handleDownloadFile(item.fileName)}
                          className="font-bold text-[12px] text-[#1565C0] hover:text-[#0D47A1] hover:underline cursor-pointer line-clamp-1 text-left"
                          title="Click để tải về"
                        >
                          {item.fileName}
                        </button>
                      ) : (
                        <span className="text-[11.5px] text-slate-400 italic">Chưa nộp file</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {item.submittedAt ? (
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-slate-400 shrink-0" />
                          <span>{item.submittedAt}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {item.status === 'submitted' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                          <FileCheck size={13} className="text-emerald-500" />
                          Đã nộp
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Chưa nộp
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setActiveItem(item)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer active:scale-95 ${
                          item.status === 'submitted'
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            : 'bg-[#1565C0] text-white hover:bg-[#0D47A1] shadow-xs'
                        }`}
                      >
                        {item.status === 'submitted' ? 'Nộp lại file' : 'Nộp phiếu'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal nộp phiếu */}
      <UploadTrackingModal
        item={activeItem}
        onClose={() => setActiveItem(null)}
        onConfirm={handleConfirmSubmit}
      />
    </div>
  )
}

export default ProgressTrackingPage
