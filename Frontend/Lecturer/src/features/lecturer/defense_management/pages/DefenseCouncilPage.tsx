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
  memberCount: number;
  assignProgress: string;
  isAssignDone: boolean;
  gradingProgress: string;
}

const MOCK_COUNCILS_LIST: CouncilItem[] = [
  {
    id: 'hd-1',
    code: 'HĐ CNTT 01',
    subTitle: 'Tiểu ban Công nghệ phần mềm & Trí tuệ nhân tạo',
    date: '20/06/2026',
    timeRange: '08:00 - 11:30',
    room: 'Phòng Hội thảo 205 - Nhà T45',
    role: 'Chủ tịch',
    roleKey: 'CHAIRPERSON',
    studentCount: 8,
    memberCount: 5,
    assignProgress: 'Còn 1 SV chưa gán',
    isAssignDone: false,
    gradingProgress: '1/8 SV',
  },
  {
    id: 'hd-2',
    code: 'HĐ CNTT 02',
    subTitle: 'Tiểu ban Hệ thống thông tin & Khoa học dữ liệu',
    date: '21/06/2026',
    timeRange: '13:30 - 17:00',
    room: 'Phòng Hội thảo 302 - Nhà T45',
    role: 'Thư ký',
    roleKey: 'SECRETARY',
    studentCount: 6,
    memberCount: 5,
    assignProgress: 'Đã hoàn tất',
    isAssignDone: true,
    gradingProgress: '1/6 SV',
  },
  {
    id: 'hd-3',
    code: 'HĐ CNTT 03',
    subTitle: 'Tiểu ban Mạng máy tính & An toàn thông tin',
    date: '22/06/2026',
    timeRange: '08:00 - 11:00',
    room: 'Phòng Hội thảo 401 - Nhà T45',
    role: 'Ủy viên',
    roleKey: 'COUNCIL_MEMBER',
    studentCount: 3,
    memberCount: 5,
    assignProgress: 'Đã hoàn tất',
    isAssignDone: true,
    gradingProgress: '0/3 SV',
  },
  {
    id: 'hd-4',
    code: 'HĐ CNTT 04',
    subTitle: 'Tiểu ban Công nghệ phần mềm & Ứng dụng Di động',
    date: '23/11/2026',
    timeRange: '13:30 - 17:00',
    room: 'Phòng 502 - Nhà T45',
    role: 'Chủ tịch',
    roleKey: 'CHAIRPERSON',
    studentCount: 3,
    memberCount: 5,
    assignProgress: 'Đã hoàn tất',
    isAssignDone: true,
    gradingProgress: '0/3 SV',
  },
  {
    id: 'hd-5',
    code: 'HĐ CNTT 05',
    subTitle: 'Tiểu ban Khoa học máy tính & Thị giác máy tính',
    date: '24/06/2026',
    timeRange: '08:00 - 11:30',
    room: 'Phòng Lab AI 503 - Nhà C5',
    role: 'Thư ký',
    roleKey: 'SECRETARY',
    studentCount: 5,
    memberCount: 5,
    assignProgress: 'Đã hoàn tất',
    isAssignDone: true,
    gradingProgress: '2/5 SV',
  },
  {
    id: 'hd-6',
    code: 'HĐ CNTT 06',
    subTitle: 'Tiểu ban Mạng viễn thông & IoT ứng dụng',
    date: '25/06/2026',
    timeRange: '13:30 - 16:30',
    room: 'Phòng Hội đồng 201 - Nhà A1',
    role: 'Ủy viên',
    roleKey: 'COUNCIL_MEMBER',
    studentCount: 4,
    memberCount: 5,
    assignProgress: 'Đã hoàn tất',
    isAssignDone: true,
    gradingProgress: '0/4 SV',
  },
];

export const DefenseCouncilPage: React.FC = () => {
  const navigate = useNavigate();
  const currentSemesterQuery = useLecturerCurrentSemester();
  const semesterId = currentSemesterQuery.data?.publicId;

  const { data: serverCouncils } = useMyCouncils(semesterId);

  const [roleFilter, setRoleFilter] = useState<'all' | 'Chủ tịch' | 'Thư ký' | 'Ủy viên'>('all');

  // Combined list preferring server councils if mapped
  const councilList: CouncilItem[] = useMemo(() => {
    if (serverCouncils && serverCouncils.length > 0) {
      return serverCouncils.map((sc, idx) => {
        const fallback = MOCK_COUNCILS_LIST[idx % MOCK_COUNCILS_LIST.length];
        const roleLabel =
          sc.myRole === 'CHAIRPERSON'
            ? 'Chủ tịch'
            : sc.myRole === 'SECRETARY'
              ? 'Thư ký'
              : 'Ủy viên';

        return {
          id: sc.councilPublicId,
          code: sc.code,
          subTitle: sc.name || fallback.subTitle,
          date: sc.defenseStartTime ? sc.defenseStartTime.split('T')[0].split('-').reverse().join('/') : fallback.date,
          timeRange: fallback.timeRange,
          room: sc.location || fallback.room,
          role: roleLabel,
          roleKey: sc.myRole,
          studentCount: sc.studentCount || fallback.studentCount,
          memberCount: 5,
          assignProgress: fallback.assignProgress,
          isAssignDone: fallback.isAssignDone,
          gradingProgress: fallback.gradingProgress,
        };
      });
    }
    return MOCK_COUNCILS_LIST;
  }, [serverCouncils]);

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
                <th className="py-3 px-4 min-w-[200px]">Tiến độ chuẩn bị</th>
                <th className="py-3 px-4 min-w-[110px] text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
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
                    <div className="text-[11px] text-slate-500">{c.memberCount} thành viên</div>
                  </td>

                  {/* Tiến độ chuẩn bị */}
                  <td className="py-3.5 px-4">
                    <div className="text-[11px]">
                      <span>Phân công: </span>
                      <span className={c.isAssignDone ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                        {c.assignProgress}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      <span>Chấm bảo vệ của bạn: </span>
                      <b className="text-slate-700">{c.gradingProgress}</b>
                    </div>
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
