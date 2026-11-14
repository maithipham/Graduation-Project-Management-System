import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoints';
import { useDeadlines } from '../hooks/useDeadlines';
import { DeadlineTable } from '../components/DeadlineTable';
import type { DeadlineItem, DeadlineStage } from '../types/deadline.types';

interface SemesterItem {
  id?: number;
  publicId?: string;
  name: string;
  academicYear?: string;
  term?: string;
}

interface MajorItem {
  id?: number;
  publicId?: string;
  name: string;
  code: string;
}

export const DeadlineManagementPage: React.FC = () => {
  // State danh sách bộ lọc
  const [semesters, setSemesters] = useState<SemesterItem[]>([]);
  const [majors, setMajors] = useState<MajorItem[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');
  const [selectedMajorId, setSelectedMajorId] = useState<string>('');
  const [currentTab, setCurrentTab] = useState<DeadlineStage>('GIAO_NHAN');

  // Nạp danh sách Học kỳ và Chuyên ngành khi mount
  useEffect(() => {
    const fetchInitialFilters = async () => {
      try {
        // Lấy danh sách học kỳ
        const semRes = await apiClient.get<any>(API_ENDPOINTS.admin.semesters);
        const semList = Array.isArray(semRes.data?.data)
          ? semRes.data.data
          : semRes.data?.data?.content || [];
        setSemesters(semList);
        if (semList.length > 0) {
          const firstSem = semList[0];
          setSelectedSemesterId(firstSem.publicId || String(firstSem.id));
        }

        // Lấy danh sách chuyên ngành
        const majorRes = await apiClient.get<any>(API_ENDPOINTS.admin.majors);
        const majorList = Array.isArray(majorRes.data?.data)
          ? majorRes.data.data
          : majorRes.data?.data?.content || [];
        setMajors(majorList);
        if (majorList.length > 0) {
          const firstMajor = majorList[0];
          setSelectedMajorId(firstMajor.publicId || String(firstMajor.id));
        }
      } catch (e) {
        console.error('Không thể nạp danh mục học kỳ/ngành', e);
      }
    };

    fetchInitialFilters();
  }, []);

  // Custom hook xử lý dữ liệu mốc thời hạn
  const {
    data,
    loading,
    saving,
    isDirty,
    errorMessage,
    successMessage,
    editedDeadlines,
    handleDateChange,
    saveChanges,
    initSemester,
  } = useDeadlines(
    selectedSemesterId,
    currentTab === 'DANH_GIA' ? selectedMajorId : null
  );

  // Lọc danh sách mốc tương ứng với Tab hiện tại
  const currentDeadlines: DeadlineItem[] = useMemo(() => {
    if (!data) return [];
    switch (currentTab) {
      case 'GIAO_NHAN':
        return data.giaoNhanDeadlines || [];
      case 'THUC_HIEN':
        return data.thucHienDeadlines || [];
      case 'DANH_GIA':
        return data.danhGiaDeadlines || [];
      default:
        return [];
    }
  }, [data, currentTab]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Quản lý Kế hoạch & Mốc thời hạn (Deadline) Đồ án
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Thiết lập thời gian và giám sát lịch trình tiến độ đồ án tốt nghiệp theo từng học kỳ
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={initSemester}
            disabled={!selectedSemesterId || loading}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            Khởi tạo mốc theo mẫu
          </Button>

          <Button
            onClick={saveChanges}
            disabled={!isDirty || saving}
            className={`font-semibold shadow-sm transition ${
              isDirty && !saving ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-300 text-gray-500'
            }`}
          >
            {saving ? 'Đang lưu...' : isDirty ? 'Lưu thay đổi (*)' : 'Đã lưu tất cả'}
          </Button>
        </div>
      </div>

      {/* ALERT MESSAGES */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded shadow-sm">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm rounded shadow-sm">
          {successMessage}
        </div>
      )}

      {/* FILTER CONTROLS */}
      <Card className="p-4 shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Dropdown Học kỳ */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
            Học kỳ / Năm học
          </label>
          <select
            value={selectedSemesterId}
            onChange={(e) => setSelectedSemesterId(e.target.value)}
            className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3 border"
          >
            {semesters.map((s) => {
              const semKey = s.publicId || String(s.id);
              return (
                <option key={semKey} value={semKey}>
                  {s.name} {s.academicYear ? `(${s.academicYear})` : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Dropdown Chuyên ngành (Chỉ kích hoạt ở Tab Đánh giá) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-gray-600 uppercase">
              Chuyên ngành đào tạo
            </label>
            {currentTab !== 'DANH_GIA' && (
              <span className="text-[11px] text-gray-400 italic">(Áp dụng toàn trường)</span>
            )}
          </div>
          <select
            value={selectedMajorId}
            onChange={(e) => setSelectedMajorId(e.target.value)}
            disabled={currentTab !== 'DANH_GIA'}
            className={`w-full rounded-lg shadow-sm text-sm py-2 px-3 border transition ${
              currentTab === 'DANH_GIA'
                ? 'border-blue-500 bg-blue-50/20 text-gray-800'
                : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {majors.map((m) => {
              const majorKey = m.publicId || String(m.id);
              return (
                <option key={majorKey} value={majorKey}>
                  {m.name} ({m.code})
                </option>
              );
            })}
          </select>
        </div>

        {/* Thông tin hỗ trợ */}
        <div className="text-xs text-gray-500 flex flex-col justify-center">
          <span className="font-semibold text-gray-700">Cơ chế quản lý độc lập theo kỳ:</span>
          <span>
            Thay đổi Học kỳ sẽ tự động tải chính xác các mốc đã lưu của kỳ đó, không bị ghi đè bởi kỳ mới.
          </span>
        </div>
      </Card>

      {/* TABS GIAI ĐOẠN */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-4 pt-3 shadow-sm">
        <button
          onClick={() => setCurrentTab('GIAO_NHAN')}
          className={`pb-3 px-4 font-semibold text-sm transition relative flex items-center gap-2 ${
            currentTab === 'GIAO_NHAN'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          1. Giao nhận đồ án
          <span className="text-[10px] bg-blue-100 text-blue-700 font-normal px-2 py-0.5 rounded-full">
            Toàn trường
          </span>
        </button>

        <button
          onClick={() => setCurrentTab('THUC_HIEN')}
          className={`pb-3 px-4 font-semibold text-sm transition relative flex items-center gap-2 ${
            currentTab === 'THUC_HIEN'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          2. Thực hiện đồ án
          <span className="text-[10px] bg-blue-100 text-blue-700 font-normal px-2 py-0.5 rounded-full">
            Toàn trường
          </span>
        </button>

        <button
          onClick={() => setCurrentTab('DANH_GIA')}
          className={`pb-3 px-4 font-semibold text-sm transition relative flex items-center gap-2 ${
            currentTab === 'DANH_GIA'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          3. Đánh giá đồ án
          <span className="text-[10px] bg-purple-100 text-purple-700 font-normal px-2 py-0.5 rounded-full">
            Theo chuyên ngành
          </span>
        </button>
      </div>

      {/* TABLE HIỂN THỊ MỐC THỜI HẠN */}
      <Card className="rounded-t-none border-t-0 shadow-sm overflow-hidden">
        <DeadlineTable
          deadlines={currentDeadlines}
          editedDeadlines={editedDeadlines}
          onDateChange={handleDateChange}
          loading={loading}
        />
      </Card>
    </div>
  );
};

export default DeadlineManagementPage;

