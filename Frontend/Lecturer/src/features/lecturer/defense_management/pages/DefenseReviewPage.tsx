import React from 'react'
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  Search,
  XCircle,
} from 'lucide-react'
import { useDefenseManagement } from '../hooks/useDefenseManagement'
import type { DefenseReviewStatus } from '../types/defenseManagement.types'

export const DefenseReviewPage: React.FC = () => {
  const {
    defenseReviews,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    rowErrorId,
    pendingCount,
    filteredReviews,
    handleScoreChange,
    handleApprove,
    handleReject,
  } = useDefenseManagement()

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
            Đánh giá & Chấm điểm phản biện đồ án
          </h2>
          <p className="text-[13px] text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap" id="topSummaryText">
            <span className="font-semibold text-slate-800">{defenseReviews.length}</span> sinh viên được phân công nhận xét
            <span className="text-slate-300 mx-1">·</span>
            <span className="font-semibold text-amber-700">{pendingCount}</span> cần hoàn thành đánh giá
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-[12.5px] font-semibold shrink-0">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Hạn nộp nhận xét phản biện: 23:59 28/06/2026</span>
        </div>
      </div>

      {/* 2. MAIN TABLE CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Filters Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên SV, MSSV, tên đề tài..."
                className="w-full text-xs sm:text-[13px] pl-10 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0] transition"
              />
            </div>

            <div className="relative w-full sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | DefenseReviewStatus)}
                className="w-full text-xs sm:text-[13px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0] transition appearance-none cursor-pointer pr-9"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ đánh giá</option>
                <option value="approved">Đồng ý bảo vệ</option>
                <option value="rejected">Không đồng ý</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium shrink-0 self-center">
            Hiển thị <span className="font-bold text-slate-800">{filteredReviews.length}</span> / {defenseReviews.length} sinh viên
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
          {filteredReviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <FileText size={28} />
              </div>
              <p className="text-sm font-semibold text-slate-700">Không tìm thấy sinh viên phản biện nào</p>
              <p className="text-xs text-slate-400 mt-1">Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">STT</th>
                  <th className="py-3 px-4 min-w-[200px]">Sinh viên & Chuyên ngành</th>
                  <th className="py-3 px-4 min-w-[240px]">Đề tài & Giảng viên hướng dẫn</th>
                  <th className="py-3 px-4 min-w-[160px]">File báo cáo</th>
                  <th className="py-3 px-4 min-w-[120px] text-center">Điểm PB</th>
                  <th className="py-3 px-4 min-w-[130px] text-center">Trạng thái</th>
                  <th className="py-3 px-4 min-w-[180px] text-right">Ý kiến phản biện</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReviews.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="py-3 px-4 text-center font-medium text-slate-400 text-xs">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-[#1565C0] transition-colors">{item.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-slate-600 font-semibold">{item.mssv}</span>
                        <span>·</span>
                        <span>{item.major}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-slate-800 line-clamp-2 leading-relaxed" title={item.topic}>
                        {item.topic}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        GVHD: <span className="font-medium text-slate-700">{item.supervisorName}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {item.reportFileName ? (
                        <a
                          href="#"
                          onClick={(e) => e.preventDefault()}
                          className="font-bold text-[12px] text-[#1565C0] hover:text-[#0D47A1] hover:underline cursor-pointer line-clamp-1"
                          title="Click để tải hoặc xem báo cáo"
                        >
                          {item.reportFileName}
                        </a>
                      ) : (
                        <span className="text-[11.5px] text-slate-400 italic">Chưa nộp</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          value={item.score ?? ''}
                          onChange={(e) => handleScoreChange(item.id, e.target.value)}
                          placeholder="—"
                          className={`w-16 text-center text-xs font-bold py-1 px-1 rounded-lg border transition ${
                            rowErrorId === item.id
                              ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/50'
                              : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0]'
                          }`}
                        />
                        <span className="text-[11px] text-slate-400 font-medium">/10</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {item.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Chờ đánh giá
                        </span>
                      )}
                      {item.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                          <CheckCircle2 size={13} className="text-emerald-500" />
                          Đồng ý bảo vệ
                        </span>
                      )}
                      {item.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                          <XCircle size={13} className="text-rose-500" />
                          Không đồng ý
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => handleApprove(item.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer active:scale-95 ${
                            item.status === 'approved'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[#1565C0] text-white hover:bg-[#0D47A1] shadow-xs'
                          }`}
                        >
                          Cho bảo vệ
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(item.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer active:scale-95 ${
                            item.status === 'rejected'
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700'
                          }`}
                        >
                          Không đồng ý
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default DefenseReviewPage
