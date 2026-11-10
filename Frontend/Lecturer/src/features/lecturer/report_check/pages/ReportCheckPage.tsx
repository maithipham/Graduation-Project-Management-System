import React from 'react'
import {
  Check,
  ChevronDown,
  Clock,
  Eye,
  FileCheck,
  FileText,
  History,
  Inbox,
  Search,
} from 'lucide-react'
import {
  ApproveReportModal,
  PlagiarismUploadModal,
  RejectReportModal,
  ReportClassroomPreviewModal,
  ReportHistoryModal,
} from '../components/ReportCheckModals'
import { useReportCheck } from '../hooks/useReportCheck'
import type { ReportCheckItem, ReportTabStatus } from '../types/reportCheck.types'

export default function ReportCheckPage() {
  const {
    filteredReports,
    pagedReports,
    counts,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    pageSize,
    setPageSize,
    currentPage,
    totalPages,
    startIdx,
    endIdx,
    totalItems,
    handlePageChange,

    // Modals
    plagiarismTarget,
    setPlagiarismTarget,
    approveTarget,
    setApproveTarget,
    rejectTarget,
    setRejectTarget,
    historyTarget,
    setHistoryTarget,
    previewTarget,
    setPreviewTarget,

    // Actions
    handleConfirmApprove,
    handleConfirmReject,
    handleConfirmPlagiarism,
    handleDownloadReport,
  } = useReportCheck()

  const tabs: Array<{
    status: ReportTabStatus
    label: string
    count: number
    id: string
    badgeId: string
  }> = [
    {
      status: 'pending',
      label: 'Chưa duyệt',
      count: counts.pending,
      id: 'btnTabPending',
      badgeId: 'tabCountPending',
    },
    {
      status: 'rejected',
      label: 'Từ chối - Chưa nộp lại',
      count: counts.rejected,
      id: 'btnTabRejected',
      badgeId: 'tabCountRejected',
    },
    {
      status: 'not_submitted',
      label: 'Chưa nộp',
      count: counts.notSubmitted,
      id: 'btnTabNotSubmitted',
      badgeId: 'tabCountNotSubmitted',
    },
    {
      status: 'approved',
      label: 'Đã duyệt',
      count: counts.approved,
      id: 'btnTabApproved',
      badgeId: 'tabCountApproved',
    },
    {
      status: '',
      label: 'Tất cả',
      count: counts.all,
      id: 'btnTabAll',
      badgeId: 'tabCountAll',
    },
  ]

  return (
    <div
      className="flex-1 min-h-0 w-full flex flex-col overflow-hidden"
      style={{
        fontFamily:
          '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Tabs & Search Toolbar (Tách riêng ngoài khối danh sách, sát dưới Header) */}
      <div className="flex items-center justify-between gap-3 shrink-0 flex-wrap xl:flex-nowrap mb-3">
        {/* 1. Tabs trạng thái (Chưa duyệt / Từ chối - Chưa nộp lại / Chưa nộp / Đã duyệt / Tất cả) */}
        <div
          className="h-10 bg-[#E2E8F0] p-1 rounded-xl flex items-center gap-1 text-[13px] font-semibold shadow-2xs border border-slate-300/70 shrink-0"
          id="statusTabs"
        >
          {tabs.map((tab) => {
            const isActive = filterStatus === tab.status
            return (
              <button
                key={tab.status}
                type="button"
                data-status={tab.status}
                id={tab.id}
                onClick={() => setFilterStatus(tab.status)}
                className={`tab-btn h-[32px] px-3.5 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'active bg-white text-[#1565C0] font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  id={tab.badgeId}
                  className={`tab-badge rounded-full text-[11px] font-bold ${
                    isActive
                      ? 'px-2 py-0.5 bg-[#E3F2FD] text-[#1565C0]'
                      : 'px-1.5 py-0.5 text-slate-500 font-semibold'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* 2. Ô tìm kiếm sinh viên, đề tài & Hạn hoàn thành */}
        <div className="flex items-center gap-3 flex-1 justify-end max-w-2xl flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2 h-10 w-full max-w-md px-3.5 bg-white border border-slate-200/90 rounded-xl focus-within:border-[#1565C0] focus-within:ring-2 focus-within:ring-blue-100 transition shadow-2xs">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              id="searchInput"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã sinh viên, tên hoặc đề tài..."
              className="w-full bg-transparent outline-none text-[13px] text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Hạn hoàn thành */}
          <div className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-[12px] font-semibold shrink-0 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>
              Hạn hoàn thành: <b className="font-bold text-amber-900">20/11/2026 23:59</b>
            </span>
          </div>
        </div>
      </div>

      {/* Main Card: Table (Khối danh sách kiểm tra báo cáo có bo góc riêng biệt) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto" id="tableScrollContainer">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead
              id="tableHead"
              className="sticky top-0 z-10 bg-slate-50 text-slate-600 text-[11.5px] font-bold uppercase tracking-wider border-b border-slate-200 shadow-2xs whitespace-nowrap"
            >
              <tr>
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4 min-w-[210px]">Sinh viên & Đề tài</th>
                <th className="py-3 px-4 min-w-[220px]">File báo cáo đồ án</th>
                <th className="py-3 px-4 min-w-[210px]">Kết quả kiểm tra trùng lặp</th>
                <th className="py-3 px-4 w-36 text-center">Trạng thái</th>
                <th className="py-3 px-4 min-w-[170px] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody id="tableBody" className="divide-y divide-slate-100 bg-white">
              {pagedReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                        <Inbox className="w-7 h-7" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        Không tìm thấy báo cáo đồ án phù hợp
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Thử chọn tab trạng thái khác hoặc nhập từ khóa tìm kiếm mới.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedReports.map((item: ReportCheckItem, idx: number) => {
                  const itemIndex = startIdx + idx
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* STT */}
                      <td className="py-3.5 px-4 text-center font-medium text-slate-400 text-xs">
                        {itemIndex}
                      </td>

                      {/* Sinh viên & Đề tài */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-[#1565C0] transition-colors">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {item.mssv} {item.studentClass ? `• ${item.studentClass}` : ''}
                        </div>
                        <div
                          className="text-slate-700 text-[12px] font-medium line-clamp-1 mt-1"
                          title={item.topic}
                        >
                          {item.topic}
                        </div>
                      </td>

                      {/* File báo cáo đồ án */}
                      <td className="py-3.5 px-4">
                        {item.reportFileName ? (
                          <div className="space-y-1">
                            <button
                              type="button"
                              onClick={() => setPreviewTarget(item)}
                              className="inline-flex items-center gap-1.5 text-[#1565C0] hover:text-[#0D47A1] font-bold text-[12.5px] group/file cursor-pointer text-left"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-400 group-hover/file:text-[#1565C0] shrink-0 transition-colors" />
                              <span className="line-clamp-1 group-hover/file:underline">
                                {item.reportFileName}
                              </span>
                            </button>
                            <div className="flex items-center gap-2.5 text-[11px] text-slate-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 shrink-0" />
                                <span>{item.reportSubmittedAt}</span>
                              </span>
                              <span>•</span>
                              <button
                                type="button"
                                onClick={() => setHistoryTarget(item)}
                                className="inline-flex items-center gap-1 text-[#1565C0] hover:underline font-semibold cursor-pointer"
                              >
                                <History className="w-3 h-3" />
                                <span>Lịch sử</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[12px] text-slate-400 italic">Chưa nộp</span>
                        )}
                      </td>

                      {/* Kết quả kiểm tra trùng lặp */}
                      <td className="py-3.5 px-4">
                        {item.plagiarismFile ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                  (item.plagiarismRate ?? 0) <= 20
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : (item.plagiarismRate ?? 0) <= 35
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                Trùng {item.plagiarismRate}%
                              </span>
                              <span
                                className="text-[11.5px] text-slate-500 truncate max-w-[120px]"
                                title={item.plagiarismFile}
                              >
                                {item.plagiarismFile}
                              </span>
                            </div>
                            <div>
                              <button
                                type="button"
                                onClick={() => setPlagiarismTarget(item)}
                                className="text-[11px] font-semibold text-[#1565C0] hover:underline cursor-pointer"
                              >
                                Cập nhật kết quả
                              </button>
                            </div>
                          </div>
                        ) : item.reportFileName ? (
                          <button
                            type="button"
                            onClick={() => setPlagiarismTarget(item)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-[#1565C0] hover:bg-blue-100 transition cursor-pointer"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Nộp file kết quả</span>
                          </button>
                        ) : (
                          <span className="text-[12px] text-slate-400 italic">—</span>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {item.status === 'pending' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Chưa duyệt
                          </span>
                        )}
                        {item.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Từ chối
                          </span>
                        )}
                        {item.status === 'not_submitted' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Chưa nộp
                          </span>
                        )}
                        {item.status === 'approved' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Đã duyệt
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {item.reportFileName && item.status !== 'approved' ? (
                          <div className="inline-flex items-center gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => setApproveTarget(item)}
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
                          <div className="inline-flex items-center gap-2 justify-end">
                            <span className="text-[11.5px] text-emerald-600 font-semibold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Đã duyệt báo cáo
                            </span>
                            <button
                              type="button"
                              onClick={() => setPreviewTarget(item)}
                              className="p-1 text-slate-400 hover:text-[#1565C0] rounded transition cursor-pointer"
                              title="Xem lại báo cáo"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11.5px] text-slate-400 italic">
                            Chờ sinh viên nộp
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3 bg-slate-50/70 shrink-0">
          <p className="text-[12.5px] text-slate-500" id="plagiarismPaginationInfo">
            Hiển thị <b className="text-slate-800">{totalItems === 0 ? 0 : `${startIdx}–${endIdx}`}</b>{' '}
            trên <b className="text-slate-800">{totalItems}</b> sinh viên
          </p>
          <div className="flex items-center gap-2">
            <div className="relative inline-flex items-center">
              <select
                id="plagiarismPageSizeSelect"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="h-8 px-2.5 pr-7 bg-white border border-slate-300 rounded-lg text-[12px] font-medium outline-none cursor-pointer appearance-none shadow-2xs hover:border-slate-400 transition text-slate-800"
              >
                <option value="15">15/trang</option>
                <option value="25">25/trang</option>
                <option value="50">50/trang</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="flex gap-1 items-center" id="plagiarismPaginationControls">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="btn-prev h-8 px-2.5 rounded-lg border border-slate-200 text-slate-600 text-[12px] font-semibold hover:bg-slate-50 transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                Trước
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                const isActive = pageNum === currentPage
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => handlePageChange(pageNum)}
                    className={`h-8 min-w-8 px-2 rounded-lg text-[12.5px] transition cursor-pointer font-bold ${
                      isActive
                        ? 'bg-[#1565C0] text-white shadow-xs'
                        : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="btn-next h-8 px-2.5 rounded-lg border border-slate-200 text-slate-600 text-[12px] font-semibold hover:bg-slate-50 transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Các Modals */}
      <PlagiarismUploadModal
        item={plagiarismTarget}
        onClose={() => setPlagiarismTarget(null)}
        onSave={handleConfirmPlagiarism}
      />

      <ApproveReportModal
        item={approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={handleConfirmApprove}
      />

      <RejectReportModal
        item={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleConfirmReject}
      />

      <ReportHistoryModal
        item={historyTarget}
        onClose={() => setHistoryTarget(null)}
      />

      <ReportClassroomPreviewModal
        item={previewTarget}
        onClose={() => setPreviewTarget(null)}
        onOpenPlagiarism={(it) => {
          setPreviewTarget(null)
          setPlagiarismTarget(it)
        }}
        onDownloadReport={handleDownloadReport}
      />
    </div>
  )
}
