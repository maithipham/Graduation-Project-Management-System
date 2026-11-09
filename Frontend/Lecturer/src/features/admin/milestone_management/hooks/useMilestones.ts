import { useState, useEffect, useCallback, useMemo } from 'react';
import type { MilestoneGroupedData, MilestoneItem } from '../types/milestone.types';
import { milestoneService } from '../services/milestone.service';

/**
 * Custom Hook quản lý trạng thái và các tương tác API cho Kế hoạch & Mốc thời hạn đồ án:
 * - Tự động tải lại dữ liệu khi Học kỳ hoặc Chuyên ngành thay đổi (Trigger độc lập)
 * - Quản lý Dirty state (các hàng có thay đổi nhưng chưa lưu)
 * - Validate ràng buộc thời gian (startDate <= endDate)
 * - Gửi batch update tối ưu lên server
 */
export const useMilestones = (selectedSemesterId: string, selectedMajorId: string | null) => {
  const [data, setData] = useState<MilestoneGroupedData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Map lưu trữ các thay đổi chưa lưu: Key là milestoneId, Value là cặp thời gian mới
  const [editedMilestones, setEditedMilestones] = useState<Map<string, { startDate: string; endDate: string }>>(
    new Map()
  );

  // Helper tìm kiếm thông tin mốc từ dữ liệu hiện tại
  const findMilestone = useCallback(
    (id: string): MilestoneItem | undefined => {
      if (!data) return undefined;
      return (
        data.giaoNhanMilestones.find((m) => m.milestoneId === id) ||
        data.thucHienMilestones.find((m) => m.milestoneId === id) ||
        data.danhGiaMilestones.find((m) => m.milestoneId === id)
      );
    },
    [data]
  );

  // Tải danh sách mốc thời hạn từ Backend
  const fetchMilestones = useCallback(async () => {
    if (!selectedSemesterId) return;

    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await milestoneService.getMilestones(selectedSemesterId, selectedMajorId);
      setData(res);
      // Xóa sạch các thay đổi tạm thời sau khi tải dữ liệu mới
      setEditedMilestones(new Map());
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Không thể tải danh sách mốc thời hạn');
    } finally {
      setLoading(false);
    }
  }, [selectedSemesterId, selectedMajorId]);

  // Kích hoạt nạp lại dữ liệu mỗi khi đổi Học kỳ hoặc đổi Chuyên ngành
  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  // Cập nhật giá trị ngày giờ vào state tạm thời khi người dùng thay đổi trên DatePicker
  const handleDateChange = (milestoneId: string, field: 'startDate' | 'endDate', value: string) => {
    setEditedMilestones((prev) => {
      const existing = prev.get(milestoneId) || {
        startDate: findMilestone(milestoneId)?.startDate || '',
        endDate: findMilestone(milestoneId)?.endDate || '',
      };
      const updated = new Map(prev);
      updated.set(milestoneId, { ...existing, [field]: value });
      return updated;
    });
    // Xóa thông báo cũ để người dùng tập trung vào thay đổi mới
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  // Gửi danh sách cập nhật hàng loạt lên Server
  const saveChanges = async () => {
    if (editedMilestones.size === 0 || !selectedSemesterId) return;

    // Validate kiểm tra thời gian: bắt đầu phải trước kết thúc
    for (const [id, dates] of editedMilestones.entries()) {
      if (new Date(dates.startDate) > new Date(dates.endDate)) {
        const item = findMilestone(id);
        const name = item ? `"${item.name}"` : 'có mốc';
        setErrorMessage(`Lỗi: Mốc ${name} có thời gian bắt đầu lớn hơn thời gian kết thúc!`);
        return;
      }
    }

    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const milestonesPayload = Array.from(editedMilestones.entries()).map(([id, dates]) => ({
        milestoneId: id,
        startDate: dates.startDate,
        endDate: dates.endDate,
      }));

      await milestoneService.batchUpdate({
        semesterId: selectedSemesterId,
        milestones: milestonesPayload,
      });

      setSuccessMessage('Cập nhật kế hoạch mốc thời gian thành công!');
      await fetchMilestones(); // Tải lại dữ liệu mới nhất từ server
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Lỗi khi cập nhật danh sách mốc thời hạn');
    } finally {
      setSaving(false);
    }
  };

  // Khởi tạo mốc cho học kỳ mới
  const initSemester = async () => {
    if (!selectedSemesterId) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      await milestoneService.initSemester({ semesterId: selectedSemesterId });
      setSuccessMessage('Khởi tạo bộ mốc thời hạn chuẩn thành công!');
      await fetchMilestones();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Lỗi khi khởi tạo bộ mốc thời hạn');
    } finally {
      setLoading(false);
    }
  };

  // Xác định xem giao diện có thay đổi chưa được lưu hay không
  const isDirty = useMemo(() => editedMilestones.size > 0, [editedMilestones]);

  return {
    data,
    loading,
    saving,
    isDirty,
    errorMessage,
    successMessage,
    editedMilestones,
    handleDateChange,
    saveChanges,
    initSemester,
    fetchMilestones,
  };
};

