import React from 'react'
import { Award, Clock, Search } from 'lucide-react'
import { GradingModal } from '../components/GradingModal'
import { useGuidingScore } from '../hooks/useGuidingScore'
import { formatScoreVi } from '../utils/guidingScore.utils'

export const GuidingScorePage: React.FC = () => {
  const {
    guidingScores,
    searchStudent,
    setSearchStudent,
    activeItem,
    setActiveItem,
    stats,
    filteredItems,
    handleSaveGrading,
  } = useGuidingScore()

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
            Chấm điểm hướng dẫn đồ án
          </h2>
          <p className="text-[13px] text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap" id="topSummaryText">
            <span className="font-semibold text-slate-800">{stats.total}</span> sinh viên hướng dẫn
            <span className="text-slate-300 mx-1">·</span>
            <span className="font-semibold text-slate-800">{stats.gradedCount}</span> đã chấm điểm,
            <span className="font-semibold text-slate-800">{stats.ungradedCount}</span> chưa chấm điểm
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-[12.5px] font-semibold shrink-0">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Hạn hoàn thành chấm: 23:59 25/06/2026</span>
        </div>
      </div>

      {/* 2. MAIN TABLE CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Filters Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
              placeholder="Tìm theo tên SV, MSSV, tên đề tài..."
              className="w-full text-xs sm:text-[13px] pl-10 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0] transition"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium shrink-0 self-center">
            Hiển thị <span className="font-bold text-slate-800">{filteredItems.length}</span> / {guidingScores.length} sinh viên
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Award size={28} />
              </div>
              <p className="text-sm font-semibold text-slate-700">Không tìm thấy sinh viên nào</p>
              <p className="text-xs text-slate-400 mt-1">Thử thay đổi từ khóa tìm kiếm.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">STT</th>
                  <th className="py-3 px-4 min-w-[200px]">Sinh viên & Chuyên ngành</th>
                  <th className="py-3 px-4 min-w-[240px]">Đề tài đồ án</th>
                  <th className="py-3 px-4 min-w-[120px] text-center">Điểm HD</th>
                  <th className="py-3 px-4 min-w-[200px]">Nhận xét đánh giá</th>
                  <th className="py-3 px-4 min-w-[130px] text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item, idx) => (
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
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {item.score !== null && item.score !== undefined ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-[#1565C0] border border-blue-200">
                          {formatScoreVi(item.score)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-500">
                          Chưa chấm
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {item.comment ? (
                        <div className="text-slate-600 text-[11.5px] line-clamp-2 italic" title={item.comment}>
                          "{item.comment}"
                        </div>
                      ) : (
                        <span className="text-[11.5px] text-slate-400 italic">Chưa có nhận xét</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setActiveItem(item)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer active:scale-95 ${
                          item.score !== null && item.score !== undefined
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            : 'bg-[#1565C0] text-white hover:bg-[#0D47A1] shadow-xs'
                        }`}
                      >
                        {item.score !== null && item.score !== undefined ? 'Sửa điểm' : 'Chấm điểm'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Chấm điểm */}
      <GradingModal
        item={activeItem}
        onClose={() => setActiveItem(null)}
        onSave={handleSaveGrading}
      />
    </div>
  )
}

export default GuidingScorePage
