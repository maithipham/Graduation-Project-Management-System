import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Crown,
  FileSignature,
  Users,
} from 'lucide-react';
import { useLecturerCurrentSemester } from '@/features/lecturer/supervisor_registration';
import { useMyCouncils } from '../hooks/useExaminerReview';
import type { CouncilMemberRole } from '../types';

interface CouncilItem {
  id: string;
  code: string;
  subTitle: string;
  date: string;
  timeRange: string;
  room: string;
  role: 'Chủ tịch' | 'Thư ký' | 'Ủy viên';
  roleKey: CouncilMemberRole;
  studentCount: number;
  statusLabel: string;
  isPublished: boolean;
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Bản nháp',
  PUBLISHED: 'Đã công bố',
  COMPLETED: 'Đã kết thúc',
  CANCELLED: 'Đã hủy',
};

function formatDate(iso: string | null): string {
  if (!iso) return 'Chưa xếp ngày';
  return iso.split('T')[0].split('-').reverse().join('/');
}

function formatTimeRange(start: string | null, end: string | null): string {
  if (!start || !end) return 'Chưa xếp giờ';
  return `${start.slice(11, 16)} - ${end.slice(11, 16)}`;
}

export const DefenseCouncilPage: React.FC = () => {
  const navigate = useNavigate();
  const currentSemesterQuery = useLecturerCurrentSemester();
  const semesterId = currentSemesterQuery.data?.publicId;

  const { data: serverCouncils, isPending: councilsLoading } = useMyCouncils(semesterId);

  const [roleFilter, setRoleFilter] = useState<'all' | 'Chủ tịch' | 'Thư ký' | 'Ủy viên'>('all');

  // Danh sách hội đồng lấy hoàn toàn từ server
  const councilList: CouncilItem[] = useMemo(
    () =>
      (serverCouncils ?? []).map((sc) => ({
        id: sc.councilPublicId,
        code: sc.code,
        subTitle: sc.name,
        date: formatDate(sc.defenseStartTime),
        timeRange: formatTimeRange(sc.defenseStartTime, sc.defenseEndTime),
        room: sc.location || 'Chưa xếp phòng',
        role:
          sc.myRole === 'CHAIRPERSON' ? 'Chủ tịch' : sc.myRole === 'SECRETARY' ? 'Thư ký' : 'Ủy viên',
        roleKey: sc.myRole,
        studentCount: sc.studentCount,
        statusLabel: STATUS_LABEL[sc.status] ?? sc.status,
        isPublished: sc.status === 'PUBLISHED',
      })),
    [serverCouncils],
  );

  const countAll = councilList.length;
  const countChair = councilList.filter((c) => c.role === 'Chủ tịch').length;
  const countSecretary = councilList.filter((c) => c.role === 'Thư ký').length;
  const countMember = councilList.filter((c) => c.role === 'Ủy viên').length;

  const filteredCouncils = useMemo(() => {
    if (roleFilter === 'all') return councilList;
    return councilList.filter((c) => c.role === roleFilter);
  }, [councilList, roleFilter]);

  return (
    <div className="max-w-[1520px] w-full mx-auto space-y-4">
      {/* Table Card Matching 100% Image 5 */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        {/* Top Filter Pills Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Tất cả */}
            <button
              type="button"
              onClick={() => setRoleFilter('all')}
              className={`h-9 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                roleFilter === 'all'
                  ? 'bg-[#1565C0] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tất cả</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10.5px] font-extrabold ${
                  roleFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {countAll}
              </span>
            </button>

            {/* Chủ tịch */}
            <button
              type="button"
              onClick={() => setRoleFilter('Chủ tịch')}
              className={`h-9 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                roleFilter === 'Chủ tịch'
                  ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                  : 'bg-amber-50/70 border-amber-200 text-amber-800 hover:bg-amber-100/70'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Chủ tịch</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10.5px] font-extrabold ${
                  roleFilter === 'Chủ tịch' ? 'bg-white/20 text-white' : 'bg-amber-200/80 text-amber-900'
                }`}
              >
                {countChair}
              </span>
            </button>

            {/* Thư ký */}
            <button
              type="button"
              onClick={() => setRoleFilter('Thư ký')}
              className={`h-9 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                roleFilter === 'Thư ký'
                  ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                  : 'bg-purple-50/70 border-purple-200 text-purple-800 hover:bg-purple-100/70'
              }`}
            >
              <FileSignature className="w-3.5 h-3.5" />
              <span>Thư ký</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10.5px] font-extrabold ${
                  roleFilter === 'Thư ký' ? 'bg-white/20 text-white' : 'bg-purple-200/80 text-purple-900'
                }`}
              >
                {countSecretary}
              </span>
            </button>

            {/* Ủy viên */}
            <button
              type="button"
              onClick={() => setRoleFilter('Ủy viên')}
              className={`h-9 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                roleFilter === 'Ủy viên'
                  ? 'bg-sky-600 border-sky-600 text-white shadow-xs'
                  : 'bg-sky-50/70 border-sky-200 text-sky-800 hover:bg-sky-100/70'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Ủy viên</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10.5px] font-extrabold ${
                  roleFilter === 'Ủy viên' ? 'bg-white/20 text-white' : 'bg-sky-200/80 text-sky-900'
                }`}
              >
                {countMember}
              </span>
            </button>
          </div>

          <p className="text-[11.5px] text-slate-500 mt-1">
            Hiển thị toàn bộ {filteredCouncils.length} hội đồng được phân công
          </p>
        </div>

        {/* Councils Table matching Image 5 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4 min-w-[240px]">Hội đồng</th>
                <th className="py-3 px-4 min-w-[220px]">Thời gian & Địa điểm</th>
                <th className="py-3 px-4 min-w-[120px] text-center">Vai trò</th>
                <th className="py-3 px-4 min-w-[120px]">Quy mô</th>
                <th className="py-3 px-4 min-w-[140px]">Trạng thái</th>
                <th className="py-3 px-4 min-w-[110px] text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCouncils.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 px-4 text-center text-slate-500 text-[12.5px]">
                    {councilsLoading ? 'Đang tải danh sách hội đồng...' : 'Bạn chưa được phân công vào hội đồng nào.'}
                  </td>
                </tr>
              )}
              {filteredCouncils.map((c, idx) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition">
                  {/* STT */}
                  <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                    {idx + 1}
                  </td>

                  {/* Hội đồng */}
                  <td className="py-3.5 px-4">
                    <div className="font-extrabold text-[#1565C0] text-[13px]">
                      {c.code}
                    </div>
                    <div className="text-slate-800 font-medium text-[11.5px] line-clamp-1 mt-0.5">
                      {c.subTitle}
                    </div>
                  </td>

                  {/* Thời gian & Địa điểm */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-800 text-[11.5px]">
                      {c.date} · {c.timeRange}
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5 truncate">
                      {c.room}
                    </div>
                  </td>

                  {/* Vai trò */}
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        c.role === 'Chủ tịch'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : c.role === 'Thư ký'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : 'bg-sky-50 text-sky-800 border-sky-200'
                      }`}
                    >
                      {c.role}
                    </span>
                  </td>

                  {/* Quy mô */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{c.studentCount} sinh viên</div>
                  </td>

                  {/* Trạng thái */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        c.isPublished
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {c.statusLabel}
                    </span>
                  </td>

                  {/* Thao tác */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => navigate(`/lecturer/defense/councils/${c.id}?tab=members`)}
                      className="h-8.5 px-3.5 rounded-xl bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-bold transition cursor-pointer shadow-2xs whitespace-nowrap"
                    >
                      Vào chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default DefenseCouncilPage;
