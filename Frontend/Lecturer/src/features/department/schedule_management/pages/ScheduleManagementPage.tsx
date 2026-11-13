import React, { useState, useMemo } from 'react';
import { Select } from '@/shared/components/ui';
import { useScheduleManagement } from '../hooks/useScheduleManagement';
import { ScheduleTable } from '../components/ScheduleTable';
import { ConfirmSaveModal } from '../components/ConfirmSaveModal';
import {
  useSemesters,
  useCurrentSemester,
  useMajors,
} from '@/features/department/student_management/hooks/useStudents';
import { useManagedMajor } from '@/features/department/lecturer_management/hooks/useTeachers';

// "2026-2027" → "2026–2027" (gạch nối dài en-dash chuẩn mockup)
const formatAcademicYear = (year: string) => year.replace('-', '–');

// Style thống nhất với các màn hình khác trong phân hệ bộ môn
const SCOPE_SELECT_CLASS =
  'h-9 rounded-lg border-slate-300 bg-white pl-3 pr-8 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 focus-visible:border-[#1565C0] focus-visible:ring-2 focus-visible:ring-blue-100 shadow-none';

export const ScheduleManagementPage: React.FC = () => {
  // Lấy danh sách học kỳ & học kỳ hiện tại từ API
  const { data: semesterList, isPending: semestersLoading } = useSemesters();
  const { data: currentSemester } = useCurrentSemester();
  const { data: majorList } = useMajors();
  const { data: managedMajor, isPending: managedMajorLoading } = useManagedMajor();

  const [pickedSemesterId, setPickedSemesterId] = useState<string | undefined>();

  // Gộp học kỳ hiện tại nếu chưa có trong danh sách
  const semesters = useMemo(() => {
    const list = semesterList ?? [];
    const cur = currentSemester;
    return cur && !list.some((s) => s.publicId === cur.publicId)
      ? [cur, ...list]
      : list;
  }, [semesterList, currentSemester]);

  // Xác định học kỳ đang chọn (mặc định lấy kỳ tự chọn, hoặc kỳ hiện tại, hoặc kỳ đầu tiên)
  const selectedSemesterId =
    pickedSemesterId ??
    currentSemester?.publicId ??
    semesters[0]?.publicId ??
    '';

  const activeSemester = useMemo(
    () => semesters.find((s) => s.publicId === selectedSemesterId) ?? currentSemester ?? semesters[0],
    [semesters, selectedSemesterId, currentSemester]
  );

  // Danh sách các Năm học duy nhất
  const academicYears = useMemo(
    () => [...new Set(semesters.map((s) => s.academicYear).filter(Boolean))],
    [semesters]
  );

  // Danh sách các Học kỳ thuộc Năm học đang chọn
  const termsOfYear = useMemo(
    () => semesters.filter((s) => s.academicYear === activeSemester?.academicYear),
    [semesters, activeSemester?.academicYear]
  );

  // Hàm chuyển đổi Năm học: tự động chọn học kỳ mới nhất thuộc năm đó
  const changeAcademicYear = (year: string) => {
    const matched = semesters.find((s) => s.academicYear === year);
    if (matched) {
      setPickedSemesterId(matched.publicId);
    }
  };

  // Hàm chuyển đổi Học kỳ
  const changeSemester = (publicId: string) => {
    setPickedSemesterId(publicId);
  };

  // Ngành do Trưởng bộ môn phụ trách (tự động lấy theo tài khoản TBM đang đăng nhập)
  const activeMajor = useMemo(
    () => managedMajor ?? majorList?.[0],
    [managedMajor, majorList]
  );
  const selectedMajorId = activeMajor?.publicId || ((activeMajor as { id?: number | string })?.id ? String((activeMajor as { id?: number | string }).id) : '');
  const majorDisplayName = activeMajor
    ? `${activeMajor.name}${activeMajor.code ? ` (${activeMajor.code})` : ''}`
    : managedMajorLoading
      ? 'Đang tải...'
      : 'Chưa phân ngành';

  // Hook quản lý dữ liệu Kế hoạch & Tiến độ
  const {
    currentEvents,
    currentPhase,
    setCurrentPhase,
    phaseCounts,
    loading,
    saving,
    editedEvents,
    pendingConfirm,
    setPendingConfirm,
    handleDateChange,
    handleResetRow,
    handleOpenConfirm,
    handleExecuteSave,
  } = useScheduleManagement(
    selectedSemesterId,
    selectedMajorId
  );

  return (
    <div className="space-y-3">
      {/* 1. THANH BỘ LỌC NĂM HỌC, HỌC KỲ & CHUYÊN NGÀNH */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Dropdown Năm học */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Năm học:</span>
            <Select
              value={activeSemester?.academicYear ?? ''}
              onChange={(e) => changeAcademicYear(e.target.value)}
              disabled={academicYears.length === 0}
              aria-label="Năm học"
              title={
                activeSemester
                  ? `${activeSemester.status || ''} · ${activeSemester.startDate || ''} – ${activeSemester.endDate || ''}`
                  : undefined
              }
              className={SCOPE_SELECT_CLASS}
              containerClassName="w-auto"
            >
              {academicYears.length === 0 && (
                <option value="">
                  {semestersLoading ? 'Đang tải...' : 'Chưa có năm học'}
                </option>
              )}
              {academicYears.map((year) => (
                <option key={year} value={year}>
                  {formatAcademicYear(year)}
                </option>
              ))}
            </Select>
          </div>

          {/* Dropdown Học kỳ */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Học kỳ:</span>
            <Select
              value={selectedSemesterId}
              onChange={(e) => changeSemester(e.target.value)}
              disabled={termsOfYear.length === 0}
              aria-label="Học kỳ"
              className={SCOPE_SELECT_CLASS}
              containerClassName="w-auto"
            >
              {termsOfYear.length === 0 && (
                <option value="">
                  {semestersLoading ? 'Đang tải...' : 'Chưa có học kỳ'}
                </option>
              )}
              {termsOfYear.map((s) => (
                <option key={s.publicId} value={s.publicId}>
                  {s.term || s.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Hiển thị Ngành của Trưởng bộ môn (không cho chọn ngành khác) */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ngành:</span>
            <div className="h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 text-[13px] font-semibold text-slate-700 flex items-center gap-2 shadow-2xs">
              <span className="text-slate-900 font-bold">{majorDisplayName}</span>
              {currentPhase === 'evaluation' ? (
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/70 border border-blue-200/80 px-2 py-0.5 rounded-full">
                  Bộ môn phụ trách
                </span>
              ) : (
                <span className="text-[11px] font-normal text-slate-400 italic">
                  (Áp dụng toàn trường)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400 italic">
          * Trưởng bộ môn thiết lập thời hạn mở và kết thúc các mốc tiến độ đồ án
        </div>
      </div>

      {/* 2. CỤM CỐ ĐỊNH PHÍA TRÊN: TAB GIAI ĐOẠN ĐỒ ÁN (ĐẨY SÁT BẢNG) */}
      <div className="w-full">
        <div
          className="h-10 bg-[#E2E8F0] p-1 rounded-xl flex items-center gap-1 text-[13px] font-semibold w-full shadow-2xs border border-slate-300/70"
          id="phaseTabs"
        >
          {/* Tab 1: Giao nhận đồ án */}
          <button
            type="button"
            onClick={() => setCurrentPhase('assignment')}
            className={`phase-tab flex-1 h-[32px] px-4 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap ${
              currentPhase === 'assignment'
                ? 'bg-white text-[#1565C0] font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <span>Giao nhận đồ án</span>
            <span
              className={`phase-badge px-2 py-0.5 rounded-full text-[11px] font-bold ${
                currentPhase === 'assignment'
                  ? 'bg-[#E3F2FD] text-[#1565C0]'
                  : 'text-slate-500'
              }`}
            >
              {phaseCounts.assignment}
            </span>
          </button>

          {/* Tab 2: Thực hiện đồ án */}
          <button
            type="button"
            onClick={() => setCurrentPhase('execution')}
            className={`phase-tab flex-1 h-[32px] px-4 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap ${
              currentPhase === 'execution'
                ? 'bg-white text-[#1565C0] font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <span>Thực hiện đồ án</span>
            <span
              className={`phase-badge px-2 py-0.5 rounded-full text-[11px] font-bold ${
                currentPhase === 'execution'
                  ? 'bg-[#E3F2FD] text-[#1565C0]'
                  : 'text-slate-500'
              }`}
            >
              {phaseCounts.execution}
            </span>
          </button>

          {/* Tab 3: Đánh giá đồ án */}
          <button
            type="button"
            onClick={() => setCurrentPhase('evaluation')}
            className={`phase-tab flex-1 h-[32px] px-4 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap ${
              currentPhase === 'evaluation'
                ? 'bg-white text-[#1565C0] font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <span>Đánh giá đồ án</span>
            <span
              className={`phase-badge px-2 py-0.5 rounded-full text-[11px] font-bold ${
                currentPhase === 'evaluation'
                  ? 'bg-[#E3F2FD] text-[#1565C0]'
                  : 'text-slate-500'
              }`}
            >
              {phaseCounts.evaluation}
            </span>
          </button>
        </div>
      </div>

      {/* 3. KHỐI DANH SÁCH BẢNG SỰ KIỆN */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
        <ScheduleTable
          events={currentEvents}
          editedEvents={editedEvents}
          onDateChange={handleDateChange}
          onResetRow={handleResetRow}
          onSaveRow={handleOpenConfirm}
          loading={loading}
        />
      </div>

      {/* 4. MODAL XÁC NHẬN LƯU MỐC THỜI GIAN */}
      <ConfirmSaveModal
        isOpen={Boolean(pendingConfirm)}
        onClose={() => setPendingConfirm(null)}
        onConfirm={handleExecuteSave}
        eventName={pendingConfirm?.item.name || ''}
        startDateDisplay={pendingConfirm?.startDisplay || ''}
        endDateDisplay={pendingConfirm?.endDisplay || ''}
        isSaving={saving}
      />
    </div>
  );
};

export default ScheduleManagementPage;

