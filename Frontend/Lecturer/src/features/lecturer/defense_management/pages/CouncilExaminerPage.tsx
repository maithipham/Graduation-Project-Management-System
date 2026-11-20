import React from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  BarChart3,
  CalendarClock,
  ClipboardCheck,
  GitMerge,
  Info,
  Users,
} from 'lucide-react'
import { Skeleton } from '@/shared/components/ui'
import { formatDate } from '@/shared/utils'
import { CouncilAssignPanel } from '../components/CouncilAssignPanel'
import { DefenseScheduleBoard } from '../components/DefenseScheduleBoard'
import { DefenseGradingPanel } from '../components/DefenseGradingPanel'
import { CouncilSummaryPanel } from '../components/CouncilSummaryPanel'
import { useCouncilBoard, useMyCouncils } from '../hooks/useExaminerReview'
import type { CouncilMemberRole } from '../types'

const ROLE_DISPLAY: Record<CouncilMemberRole, { label: string; badge: string }> =
  {
    CHAIRPERSON: {
      label: 'Chủ tịch',
      badge: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    SECRETARY: {
      label: 'Thư ký',
      badge: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    COUNCIL_MEMBER: {
      label: 'Ủy viên',
      badge: 'bg-sky-50 text-sky-800 border-sky-200',
    },
  }

type CouncilTab = 'members' | 'assign' | 'schedule' | 'grading' | 'summary'

export const CouncilExaminerPage: React.FC = () => {
  const navigate = useNavigate()
  const { councilPublicId } = useParams<{ councilPublicId: string }>()
  const { data: board, isPending, isError } = useCouncilBoard(councilPublicId)
  const { data: myCouncils } = useMyCouncils()
  const [searchParams, setSearchParams] = useSearchParams()

  const tabParam = searchParams.get('tab')
  const validTabs: CouncilTab[] = ['members', 'assign', 'schedule', 'grading', 'summary']
  const activeTab: CouncilTab = validTabs.includes(tabParam as CouncilTab)
    ? (tabParam as CouncilTab)
    : 'members' // Mở chi tiết Hội đồng: mặc định vào tab Thành viên

  const handleSelectTab = (tab: CouncilTab) => {
    setSearchParams({ tab })
  }

  if (isPending) {
    return (
      <div className="space-y-4">
        <div className="h-11 bg-white border border-slate-200 rounded-xl px-3 flex items-center justify-between">
          <Skeleton className="w-48 h-8 rounded-lg" />
          <Skeleton className="w-96 h-8 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
            <Skeleton className="h-8 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-4 space-y-4">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !board) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate('/lecturer/defense/councils')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#1565C0] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách hội đồng</span>
        </button>
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-6 rounded-2xl">
          Không tìm thấy thông tin hội đồng hoặc bạn không có quyền xem thông tin hội đồng này.
        </div>
      </div>
    )
  }

  const timeDisplay =
    board.defenseStartTime && board.defenseEndTime
      ? `${formatDate(board.defenseStartTime, 'short')} (${formatDate(board.defenseStartTime, 'time')} – ${formatDate(board.defenseEndTime, 'time')})`
      : board.defenseStartTime
        ? formatDate(board.defenseStartTime, 'full')
        : 'Chưa sắp lịch'

  const myRoleConfig = ROLE_DISPLAY[board.myRole] ?? ROLE_DISPLAY.COUNCIL_MEMBER
  const isManager = board.myRole === 'CHAIRPERSON' || board.myRole === 'SECRETARY'

  // List of councils for quick switch
  const availableCouncils = myCouncils && myCouncils.length > 0
    ? myCouncils
    : [{ councilPublicId: board.councilPublicId, code: board.code, myRole: board.myRole }]

  return (
    <div className="space-y-3 max-w-[1520px] w-full mx-auto">
      {/* ========================================================================= */}
      {/* UNIFIED COMPACT HEADER: 1 DÒNG DUY NHẤT KHỚP 100% GIAO DIỆN MOCK IMAGE 3 */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-2xs flex items-center justify-between gap-3 shrink-0 overflow-x-auto">
        {/* Left: Back Button + Council Selector (Hiển thị Hội đồng hiện tại) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/lecturer/defense/councils')}
            className="h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5 shrink-0"
            title="Quay lại danh sách hội đồng"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Hội đồng</span>
          </button>

          <select
            value={councilPublicId}
            onChange={(e) => navigate(`/lecturer/defense/councils/${e.target.value}?tab=${activeTab}`)}
            className="h-8 px-2.5 rounded-lg border border-blue-200 bg-blue-50/50 text-xs font-extrabold text-[#1565C0] outline-hidden focus:border-[#1565C0] cursor-pointer shadow-2xs"
          >
            {availableCouncils.map((c) => (
              <option key={c.councilPublicId} value={c.councilPublicId}>
                {c.code} ({ROLE_DISPLAY[c.myRole]?.label || 'Ủy viên'})
              </option>
            ))}
          </select>
        </div>

        {/* Right: Tabs Navigation (Pills gọn gàng đúng giao diện Image 3) */}
        <div className="bg-slate-100 p-0.5 rounded-xl flex items-center gap-1 shadow-2xs border border-slate-200/80 shrink-0">
          {/* Tab 1: Thành viên */}
          <button
            type="button"
            onClick={() => handleSelectTab('members')}
            className={`h-7.5 px-3 rounded-lg flex items-center gap-1.5 text-xs transition cursor-pointer whitespace-nowrap ${
              activeTab === 'members'
                ? 'bg-white text-[#1565C0] font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Thành viên</span>
          </button>

          {/* Tab 2: Phân công (CT/TK) */}
          {isManager && (
            <button
              type="button"
              onClick={() => handleSelectTab('assign')}
              className={`h-7.5 px-3 rounded-lg flex items-center gap-1.5 text-xs transition cursor-pointer whitespace-nowrap ${
                activeTab === 'assign'
                  ? 'bg-white text-[#1565C0] font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              <GitMerge className="w-3.5 h-3.5" />
              <span>Phân công</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[9.5px] font-extrabold ${
                  activeTab === 'assign'
                    ? 'bg-blue-100 text-[#1565C0]'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                CT/TK
              </span>
            </button>
          )}

          {/* Tab 3: Lịch bảo vệ */}
          <button
            type="button"
            onClick={() => handleSelectTab('schedule')}
            className={`h-7.5 px-3 rounded-lg flex items-center gap-1.5 text-xs transition cursor-pointer whitespace-nowrap ${
              activeTab === 'schedule'
                ? 'bg-white text-[#1565C0] font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <CalendarClock className="w-3.5 h-3.5" />
            <span>Lịch bảo vệ</span>
          </button>

          {/* Tab 4: Chấm điểm */}
          <button
            type="button"
            onClick={() => handleSelectTab('grading')}
            className={`h-7.5 px-3 rounded-lg flex items-center gap-1.5 text-xs transition cursor-pointer whitespace-nowrap ${
              activeTab === 'grading'
                ? 'bg-white text-[#1565C0] font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Chấm điểm</span>
          </button>

          {/* Tab 5: Tổng hợp (CT/TK) */}
          {isManager && (
            <button
              type="button"
              onClick={() => handleSelectTab('summary')}
              className={`h-7.5 px-3 rounded-lg flex items-center gap-1.5 text-xs transition cursor-pointer whitespace-nowrap ${
                activeTab === 'summary'
                  ? 'bg-white text-[#1565C0] font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Tổng hợp</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[9.5px] font-extrabold ${
                  activeTab === 'summary'
                    ? 'bg-blue-100 text-[#1565C0]'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                CT/TK
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB BODY: HIỂN THỊ NỘI DUNG TƯƠNG ỨNG TAB ĐANG CHỌN                       */}
      {/* ========================================================================= */}

      {/* 1. TAB LỊCH BẢO VỆ: Drag & Drop Board 2 Cột chuẩn Image 3 */}
      {activeTab === 'schedule' && (
        <DefenseScheduleBoard councilPublicId={councilPublicId!} />
      )}

      {/* 2. TAB THÀNH VIÊN: Thông tin chung & Bảng thành viên */}
      {activeTab === 'members' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full min-h-0">
          {/* Cột trái: Thông tin chung */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-[14.5px] font-extrabold text-slate-900 flex items-center gap-2">
                <Info className="w-4 h-4 text-[#1565C0]" /> Thông tin chung hội đồng
              </h3>
              <div className="space-y-3 text-[13px]">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="text-[11px] font-bold uppercase text-slate-400">Tên hội đồng</div>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {board.code} — {board.name}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <div className="text-[11px] font-bold uppercase text-slate-400">Thời gian bảo vệ</div>
                    <div className="font-bold text-slate-900 mt-0.5 text-xs">{timeDisplay}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <div className="text-[11px] font-bold uppercase text-slate-400">Địa điểm</div>
                    <div className="font-bold text-slate-900 mt-0.5 text-xs">{board.location || 'Chưa cập nhật'}</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold uppercase text-blue-700">Vai trò của bạn</div>
                    <div className="font-extrabold text-slate-900 mt-0.5">{myRoleConfig.label}</div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${myRoleConfig.badge}`}>
                    {myRoleConfig.label}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số sinh viên bảo vệ:</span>
                    <b>{board.students.length} SV</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số thành viên hội đồng:</span>
                    <b>{board.members.length} Giảng viên</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Quyền phân công GVPB:</span>
                    <b className={board.canAssignExaminers ? 'text-emerald-700' : 'text-slate-500'}>
                      {board.canAssignExaminers ? 'Có quyền điều chỉnh' : 'Chỉ xem'}
                    </b>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cột phải: Danh sách thành viên */}
          <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <h3 className="text-[14.5px] font-extrabold text-slate-900">
                Thành viên hội đồng ({board.members.length} giảng viên)
              </h3>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">STT</th>
                    <th className="py-3 px-4 min-w-[180px]">Giảng viên</th>
                    <th className="py-3 px-4 min-w-[150px]">Học vị / Đơn vị</th>
                    <th className="py-3 px-4 min-w-[120px] text-center">Vai trò HĐ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {board.members.map((member, idx) => {
                    const roleInfo = ROLE_DISPLAY[member.role] ?? ROLE_DISPLAY.COUNCIL_MEMBER
                    const isCurrentUser = member.role === board.myRole

                    return (
                      <tr key={member.memberPublicId} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            {member.fullName}
                            {isCurrentUser && (
                              <span className="text-[10px] font-bold text-[#1565C0] bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                                Bạn
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {member.teacherCode || member.memberPublicId.slice(0, 8)}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          <div className="font-medium">{member.academicTitle || 'Giảng viên'}</div>
                          <div className="text-[11px] text-slate-500">{member.departmentName || 'Khoa CNTT'}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${roleInfo.badge}`}>
                            {roleInfo.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB CHẤM ĐIỂM RUBRIC (Bước 14 – Pha 1) + biên bản từng sinh viên */}
      {activeTab === 'grading' && (
        <DefenseGradingPanel councilPublicId={board.councilPublicId} members={board.members} />
      )}

      {/* 4. TAB TỔNG HỢP KẾT QUẢ (Bước 14 – Pha 1c, 3, 3b) */}
      {activeTab === 'summary' && isManager && (
        <CouncilSummaryPanel
          councilPublicId={board.councilPublicId}
          councilCode={board.code}
          members={board.members}
          isManager={isManager}
        />
      )}

      {/* 5. TAB PHÂN CÔNG PHẢN BIỆN (CT/TK) KHỚP 100% GIAO DIỆN MOCK */}
      {activeTab === 'assign' && <CouncilAssignPanel board={board} />}
    </div>
  )
}

export default CouncilExaminerPage
