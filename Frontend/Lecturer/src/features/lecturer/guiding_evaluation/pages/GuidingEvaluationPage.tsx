import {
  CheckSquare,
  ChevronDown,
  Clock,
  ExternalLink,
  Eye,
  FileQuestion,
  FileText,
  RotateCcw,
  Search,
} from 'lucide-react'
import {
  PreviewTrackingModal,
  RubricGradingModal,
  UploadTrackingModal,
} from '../components/GuidingEvaluationModals'
import { useGuidingEvaluation } from '../hooks/useGuidingEvaluation'
import type { GuidingEvaluationTabStatus } from '../types/guidingEvaluation.types'
import {
  getMissingEvaluationStatus,
  hasEvaluationScore,
  hasTrackingFile,
  isEvaluationCompleted,
} from '../utils/guidingEvaluation.utils'

export default function GuidingEvaluationPage() {
  const {
    teacher,
    academicYear,
    semester,
    counts,
    filterStatus,
    searchQuery,
    pageSize,
    currentPage,
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
  } = useGuidingEvaluation()

  const tabs: Array<{
    status: GuidingEvaluationTabStatus
    label: string
    count: number
  }> = [
    { status: 'all', label: 'Tất cả', count: counts.all },
    { status: 'incomplete', label: 'Chưa hoàn thành', count: counts.incomplete },
    { status: 'completed', label: 'Đã hoàn thành', count: counts.completed },
  ]

  return (
    <div
      className="flex-1 min-h-0 w-full flex flex-col overflow-hidden max-w-[1520px] mx-auto"
      style={{
        fontFamily:
          '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Toolbar Header (Tách riêng ngoài khối danh sách, sát dưới Header) */}
      <div className="flex items-center gap-3.5 flex-wrap mb-3 shrink-0">
        {/* 1. Tabs trạng thái dạng Pill Segmented */}
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
                onClick={() => handleTabChange(tab.status)}
                className={`h-[32px] px-3.5 sm:px-4 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-[#1565C0] font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full text-[11px] ${
                    isActive
                      ? 'px-2 py-0.5 font-bold bg-[#E3F2FD] text-[#1565C0]'
                      : 'px-1.5 py-0.5 font-semibold text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* 2. Ô tìm kiếm sinh viên, đề tài */}
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Tìm kiếm sinh viên, mã SV hoặc tên đề tài..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200/90 bg-white text-[13px] text-slate-800 placeholder-slate-400 outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
          />
        </div>

        {/* 3. Box Hạn đánh giá (Deadline) */}
        <div className="inline-flex items-center gap-2 px-3.5 h-10 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-800 text-[12.5px] font-semibold shrink-0 shadow-2xs whitespace-nowrap ml-auto sm:ml-0">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Hạn hoàn thành:{' '}
            <b className="font-bold text-amber-900">25/11/2026 23:59</b>
          </span>
        </div>
      </div>

      {/* Main Card: Table (6 Cột) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 text-[11.5px] font-bold uppercase tracking-wider border-b border-slate-200 shadow-2xs select-none">
              <tr>
                <th className="py-3.5 px-5 text-slate-600 font-bold uppercase tracking-wider text-[11.5px] bg-slate-50 w-16 text-center">
                  STT
                </th>
                <th className="py-3.5 px-5 bg-slate-50 min-w-[220px]">
                  SINH VIÊN HƯỚNG DẪN
                </th>
                <th className="py-3.5 px-5 bg-slate-50 min-w-[320px]">
                  ĐỀ TÀI TỐT NGHIỆP
                </th>
                <th className="py-3.5 px-5 bg-slate-50 min-w-[240px]">
                  PHIẾU THEO DÕI TIẾN ĐỘ
                </th>
                <th className="py-3.5 px-5 bg-slate-50 min-w-[180px]">
                  ĐIỂM HƯỚNG DẪN
                </th>
                <th className="py-3.5 px-5 bg-slate-50 min-w-[160px]">
                  TRẠNG THÁI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {pagedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-400">
                    <FileQuestion className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <div className="text-[13px] font-semibold text-slate-600">
                      Không tìm thấy sinh viên nào trong danh sách
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Vui lòng thử tìm kiếm với từ khóa khác hoặc chuyển tab lọc.
                    </div>
                  </td>
                </tr>
              ) : (
                pagedItems.map((item, idx) => {
                  const completed = isEvaluationCompleted(item)
                  const missingText = getMissingEvaluationStatus(item)
                  const hasFile = hasTrackingFile(item)
                  const hasScore = hasEvaluationScore(item)
                  const displayStt = startIdx + idx

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 transition border-b border-slate-100 last:border-b-0"
                    >
                      {/* 1. STT */}
                      <td className="py-4 px-5 text-center text-[13px] font-semibold text-slate-400">
                        {displayStt}
                      </td>

                      {/* 2. SINH VIÊN HƯỚNG DẪN */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-[13.5px] text-slate-900 leading-snug">
                          {item.name}
                        </div>
                        <div className="text-[12px] text-slate-500 font-mono mt-0.5">
                          {item.mssv}
                        </div>
                      </td>

                      {/* 3. ĐỀ TÀI TỐT NGHIỆP */}
                      <td className="py-4 px-5 max-w-[340px]">
                        <div
                          className="text-[13px] font-medium text-slate-800 leading-snug line-clamp-2"
                          title={item.topic}
                        >
                          {item.topic}
                        </div>
                      </td>

                      {/* 4. PHIẾU THEO DÕI TIẾN ĐỘ */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        {!hasFile ? (
                          <button
                            type="button"
                            onClick={() => setUploadTarget(item)}
                            className="h-8 px-3.5 rounded-lg bg-blue-50/90 hover:bg-blue-100 border border-blue-200/90 text-[#1565C0] text-[12px] font-semibold transition cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span>Nộp phiếu</span>
                          </button>
                        ) : (
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 max-w-[280px]">
                              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                              <button
                                type="button"
                                onClick={() => setPreviewTarget(item)}
                                className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-[12.5px] truncate cursor-pointer"
                                title="Nhấp để xem trước phiếu theo dõi"
                              >
                                {item.fileName}
                              </button>
                              <button
                                type="button"
                                onClick={() => setPreviewTarget(item)}
                                className="text-slate-400 hover:text-blue-600 p-1 rounded-md hover:bg-blue-50 transition cursor-pointer"
                                title="Xem trước phiếu theo dõi"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-normal">
                              <span>
                                Nộp lúc: {item.submittedAt || '20/11/2026 14:30'}
                              </span>
                              <span>•</span>
                              <button
                                type="button"
                                onClick={() => setUploadTarget(item)}
                                className="text-blue-600 hover:text-blue-800 hover:underline font-bold transition cursor-pointer inline-flex items-center gap-1"
                                title="Nộp lại file phiếu tiến độ mới"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Nộp lại file</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 5. ĐIỂM HƯỚNG DẪN */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        {!hasScore ? (
                          <button
                            type="button"
                            onClick={() => setRubricTarget(item)}
                            className="h-8 px-3.5 rounded-lg bg-[#1565C0] hover:bg-blue-700 text-white text-[12px] font-bold transition cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>Chấm điểm</span>
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-1.5">
                            <span className="font-extrabold text-[13.5px] text-slate-900">
                              {Number(item.score).toFixed(1)}
                            </span>
                            <span className="text-xs text-slate-400 font-semibold">
                              / 10.0
                            </span>
                            <button
                              type="button"
                              onClick={() => setRubricTarget(item)}
                              className="p-1 rounded-md text-slate-400 hover:text-[#1565C0] hover:bg-blue-50 transition cursor-pointer ml-0.5"
                              title="Xem / Chỉnh sửa điểm Rubric"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* 6. TRẠNG THÁI */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        {completed ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                            Đã hoàn tất
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11.5px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                            {missingText}
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
          <p className="text-[12.5px] text-slate-500">
            Hiển thị{' '}
            <b className="text-slate-800">
              {totalItems === 0 ? 0 : `${startIdx}–${endIdx}`}
            </b>{' '}
            trên <b className="text-slate-800">{totalItems}</b> sinh viên
          </p>
          <div className="flex items-center gap-2">
            <div className="relative inline-flex items-center">
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="h-8 px-2.5 pr-7 bg-white border border-slate-300 rounded-lg text-[12px] font-medium outline-none cursor-pointer appearance-none shadow-2xs hover:border-slate-400 transition text-slate-800"
              >
                <option value={15}>15/trang</option>
                <option value={25}>25/trang</option>
                <option value={50}>50/trang</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="flex gap-1 items-center">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="h-8 px-2.5 rounded-lg border border-slate-200 text-slate-600 text-[12px] font-semibold hover:bg-slate-50 transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                Trước
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNum) => {
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
                },
              )}

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="h-8 px-2.5 rounded-lg border border-slate-200 text-slate-600 text-[12px] font-semibold hover:bg-slate-50 transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <UploadTrackingModal
        key={`upload-${uploadTarget?.id ?? 'closed'}`}
        item={uploadTarget}
        onClose={() => setUploadTarget(null)}
        onConfirm={handleConfirmUpload}
      />

      <RubricGradingModal
        key={`rubric-${rubricTarget?.id ?? 'closed'}`}
        item={rubricTarget}
        onClose={() => setRubricTarget(null)}
        onSave={handleSaveRubric}
      />

      <PreviewTrackingModal
        key={`preview-${previewTarget?.id ?? 'closed'}`}
        item={previewTarget}
        teacher={teacher}
        academicYear={academicYear}
        semester={semester}
        onClose={() => setPreviewTarget(null)}
        onReUpload={(it) => setUploadTarget(it)}
        onDownload={handleDownloadTrackingFile}
      />
    </div>
  )
}

