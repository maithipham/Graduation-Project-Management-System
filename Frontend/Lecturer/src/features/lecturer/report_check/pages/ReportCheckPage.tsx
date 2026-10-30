import { ChevronDown, Clock, Eye, Inbox, Search } from 'lucide-react'
import {
  PlagiarismUploadModal,
  RejectReportModal,
  ReportDocumentPreviewModal,
} from '../components/ReportCheckModals'
import { useReportCheck } from '../hooks/useReportCheck'
import type { ReportCheckItem } from '../types/reportCheck.types'

export default function ReportCheckPage() {
  const {
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
  } = useReportCheck()

  return (
    <div
      className="space-y-6 max-w-[1520px] w-full mx-auto"
      style={{
        fontFamily:
          '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* 1. TOP SUMMARY BANNER */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">
            Kiểm tra báo cáo đồ án
          </h2>
          <p className="text-[13px] text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap" id="topSummaryText">
            <span className="font-semibold text-slate-800">{summary.total}</span> sinh viên
            <span className="text-slate-300 mx-1">·</span>
            <span className="font-semibold text-slate-800">{summary.submittedCount}</span> đã nộp báo cáo,
            <span className="font-semibold text-slate-800">{summary.notSubmittedCount}</span> chưa nộp
            <span className="text-slate-300 mx-1">·</span>
            <span className="font-semibold text-slate-800">{summary.hasPlagCount}</span> có kết quả kiểm tra trùng
            <span className="text-slate-300 mx-1">·</span>
            <span className="font-semibold text-slate-800">{summary.approvedCount}</span> đã duyệt
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-[12.5px] font-semibold shrink-0">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Hạn nộp báo cáo: 23:59 15/06/2026</span>
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên SV, MSSV, tên file..."
                className="w-full text-xs sm:text-[13px] pl-10 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0] transition"
              />
            </div>

            <div className="relative w-full sm:w-56">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full text-xs sm:text-[13px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0] transition appearance-none cursor-pointer pr-9"
              >
                <option value="">Tất cả trạng thái duyệt</option>
                <option value="pending">Chờ duyệt</option>
                <option value="approved">Đã duyệt</option>
                <option value="rejected">Từ chối</option>
                <option value="not_submitted">Chưa nộp</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium shrink-0 self-center">
            Hiển thị <span className="font-bold text-slate-800">{filtered.length}</span> / {reports.length} sinh viên
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Inbox size={28} />
              </div>
              <p className="text-sm font-semibold text-slate-700">Không tìm thấy báo cáo phù hợp</p>
              <p className="text-xs text-slate-400 mt-1">Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">STT</th>
                  <th className="py-3 px-4 min-w-[200px]">Sinh viên & Đề tài</th>
                  <th className="py-3 px-4 min-w-[220px]">File báo cáo đồ án</th>
                  <th className="py-3 px-4 min-w-[190px]">Kết quả kiểm tra trùng</th>
                  <th className="py-3 px-4 min-w-[120px] text-center">Trạng thái</th>
                  <th className="py-3 px-4 min-w-[160px] text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item: ReportCheckItem, idx: number) => (
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
                      {item.reportFileName ? (
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewDoc({
                                fileName: item.reportFileName,
                                studentName: item.name,
                                docType: 'Báo cáo đồ án tốt nghiệp',
                              })
                            }
                            className="inline-flex items-center gap-1.5 text-[#1565C0] hover:text-[#0D47A1] font-bold text-[12px] group/file cursor-pointer text-left"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400 group-hover/file:text-[#1565C0] shrink-0 transition-colors" />
                            <span className="line-clamp-1 group-hover/file:underline">{item.reportFileName}</span>
                          </button>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>{item.reportSubmittedAt}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11.5px] text-slate-400 italic">Chưa nộp</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {item.plagiarismFile ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                (item.plagiarismRate ?? 0) <= 20
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : (item.plagiarismRate ?? 0) <= 30
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              Trùng {item.plagiarismRate}%
                            </span>
                            <span className="text-[11px] text-slate-500 truncate max-w-[110px]" title={item.plagiarismFile}>
                              {item.plagiarismFile}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPlagiarismTarget(item)}
                            className="text-[11px] font-semibold text-[#1565C0] hover:underline cursor-pointer"
                          >
                            Nộp lại file kết quả
                          </button>
                        </div>
                      ) : item.reportFileName ? (
                        <button
                          type="button"
                          onClick={() => setPlagiarismTarget(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-[#1565C0] hover:bg-blue-100/80 transition cursor-pointer"
                        >
                          Nộp file kết quả
                        </button>
                      ) : (
                        <span className="text-[11.5px] text-slate-400 italic">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {item.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Chờ duyệt
                        </span>
                      )}
                      {item.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Đã duyệt
                        </span>
                      )}
                      {item.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Từ chối
                        </span>
                      )}
                      {item.status === 'not_submitted' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">
                          Chưa nộp
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {item.reportFileName && item.status !== 'approved' ? (
                        <div className="inline-flex items-center gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => handleApprove(item)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1565C0] text-white hover:bg-[#0D47A1] transition shadow-xs cursor-pointer active:scale-95"
                          >
                            Duyệt
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejectTarget(item)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer active:scale-95"
                          >
                            Từ chối
                          </button>
                        </div>
                      ) : item.status === 'approved' ? (
                        <span className="text-[11px] text-emerald-600 font-semibold">Đã duyệt báo cáo</span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Chờ sinh viên nộp</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modals */}
      <PlagiarismUploadModal
        item={plagiarismTarget}
        onClose={() => setPlagiarismTarget(null)}
        onSave={handleConfirmPlagiarism}
      />
      <RejectReportModal
        item={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleConfirmReject}
      />
      <ReportDocumentPreviewModal
        preview={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  )
}
