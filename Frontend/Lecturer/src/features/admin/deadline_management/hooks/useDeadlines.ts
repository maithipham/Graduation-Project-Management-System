import { useState, useEffect, useCallback, useMemo } from 'react';
import type { DeadlineGroupedData, DeadlineItem } from '../types/deadline.types';
import { deadlineService } from '../services/deadline.service';

/**
 * Custom Hook quản lý trạng thái và các tương tác API cho Kế hoạch & Mốc thời hạn (Deadline) đồ án:
 * - Tự động tải lại dữ liệu khi Học kỳ hoặc Chuyên ngành thay đổi (Trigger độc lập)
 * - Quản lý Dirty state (các hàng có thay đổi nhưng chưa lưu)
 * - Validate ràng buộc thời gian (startDate <= endDate)
 * - Gửi batch update tối ưu lên server
 */
export const useDeadlines = (selectedSemesterId: string, selectedMajorId: string | null) => {
  const [data, setData] = useState<DeadlineGroupedData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Map lưu trữ các thay đổi chưa lưu: Key là deadlineId, Value là cặp thời gian mới
  const [editedDeadlines, setEditedDeadlines] = useState<Map<string, { startDate: string; endDate: string }>>(
    new Map()
  );

  // Helper tìm kiếm thông tin mốc từ dữ liệu hiện tại
  const findDeadline = useCallback(
    (id: string): DeadlineItem | undefined => {
      if (!data) return undefined;
      return (
        data.giaoNhanDeadlines.find((m) => m.deadlineId === id) ||
        data.thucHienDeadlines.find((m) => m.deadlineId === id) ||
        data.danhGiaDeadlines.find((m) => m.deadlineId === id)
      );
    },
    [data]
  );

  // Tải danh sách mốc thời hạn từ Backend
  const fetchDeadlines = useCallback(async () => {
    if (!selectedSemesterId) return;

    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await deadlineService.getDeadlines(selectedSemesterId, selectedMajorId);
      setData(res);
      // Xóa sạch các thay đổi tạm thời sau khi tải dữ liệu mới
      setEditedDeadlines(new Map());
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Không thể tải danh sách mốc thời hạn');
    } finally {
      setLoading(false);
    }
  }, [selectedSemesterId, selectedMajorId]);

  // Kích hoạt nạp lại dữ liệu mỗi khi đổi Học kỳ hoặc đổi Chuyên ngành
  useEffect(() => {
    fetchDeadlines();
  }, [fetchDeadlines]);

  // Cập nhật giá trị ngày giờ vào state tạm thời khi người dùng thay đổi trên DatePicker
  const handleDateChange = (deadlineId: string, field: 'startDate' | 'endDate', value: string) => {
    setEditedDeadlines((prev) => {
      const existing = prev.get(deadlineId) || {
        startDate: findDeadline(deadlineId)?.startDate || '',
        endDate: findDeadline(deadlineId)?.endDate || '',
      };
      const updated = new Map(prev);
      updated.set(deadlineId, { ...existing, [field]: value });
      return updated;
    });
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  // Gửi danh sách cập nhật hàng loạt lên Server
  const saveChanges = async () => {
    if (editedDeadlines.size === 0 || !selectedSemesterId) return;

    // Validate kiểm tra thời gian: bắt đầu phải trước kết thúc
    for (const [id, dates] of editedDeadlines.entries()) {
      if (new Date(dates.startDate) > new Date(dates.endDate)) {
        const item = findDeadline(id);
        const name = item ? `"${item.name}"` : 'có mốc';
        setErrorMessage(`Lỗi: Mốc ${name} có thời gian bắt đầu lớn hơn thời gian kết thúc!`);
        return;
      }
    }

    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const deadlinesPayload = Array.from(editedDeadlines.entries()).map(([id, dates]) => ({
        deadlineId: id,
        startDate: dates.startDate,
        endDate: dates.endDate,
      }));

      await deadlineService.batchUpdate({
        semesterId: selectedSemesterId,
        deadlines: deadlinesPayload,
      });

      setSuccessMessage('Cập nhật kế hoạch mốc thời gian thành công!');
      await fetchDeadlines(); // Tải lại dữ liệu mới nhất từ server
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
      await deadlineService.initSemester({ semesterId: selectedSemesterId });
      setSuccessMessage('Khởi tạo bộ mốc thời hạn chuẩn thành công!');
      await fetchDeadlines();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Lỗi khi khởi tạo bộ mốc thời hạn');
    } finally {
      setLoading(false);
    }
  };

  // Xác định xem giao diện có thay đổi chưa được lưu hay không
  const isDirty = useMemo(() => editedDeadlines.size > 0, [editedDeadlines]);

  return {
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
    fetchDeadlines,
  };
};

