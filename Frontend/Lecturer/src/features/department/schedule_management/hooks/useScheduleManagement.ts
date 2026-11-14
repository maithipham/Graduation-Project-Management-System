import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ScheduleEventItem, SchedulePhase } from '../types';
import { scheduleService } from '../services/schedule.service';
import { toast } from '@/shared/components/feedback/toast.store';

/**
 * Định dạng ngày giờ chuẩn: HHhmm dd/mm/yyyy (ví dụ: 14h30 07/11/2026)
 * Trích xuất trực tiếp từ chuỗi thời gian để tránh lệch múi giờ (timezone drift)
 */
export function formatDisplayDate(val: string | null | undefined): string {
  if (!val) return '';
  const str = val.replace(' ', 'T');
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (match) {
    const [, year, month, day, hours, minutes] = match;
    return `${hours}h${minutes} ${day}/${month}/${year}`;
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) return '';
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${hours}h${minutes} ${day}/${month}/${year}`;
}

/**
 * Trả về chuỗi thời gian hiện tại định dạng ISO (YYYY-MM-DDTHH:mm) để chọn ngày hôm nay trước
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export const useScheduleManagement = (selectedSemesterId: string, selectedMajorId?: string | null) => {
  // Hoàn toàn không dùng data mẫu, khởi tạo mảng rỗng và lấy 100% từ Database
  const [events, setEvents] = useState<ScheduleEventItem[]>([]);
  const [currentPhase, setCurrentPhase] = useState<SchedulePhase>('assignment');
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Map theo dõi các dòng đang được chỉnh sửa: Key là id mốc, Value là thời gian mới
  const [editedEvents, setEditedEvents] = useState<
    Map<string, { start: string; end: string; rawStart: string; rawEnd: string }>
  >(new Map());

  // Trạng thái phục vụ Modal Xác nhận Lưu
  const [pendingConfirm, setPendingConfirm] = useState<{
    item: ScheduleEventItem;
    rawStart: string;
    rawEnd: string;
    startDisplay: string;
    endDisplay: string;
  } | null>(null);

  // Tải danh sách mốc thời hạn từ API Database
  const fetchSchedule = useCallback(async () => {
    if (!selectedSemesterId) return;
    setLoading(true);
    try {
      const data = await scheduleService.getSchedule(selectedSemesterId, selectedMajorId);
      
      const rawList: any[] = [];
      if (data) {
        if (Array.isArray(data.giaoNhanDeadlines)) rawList.push(...data.giaoNhanDeadlines);
        if (Array.isArray(data.thucHienDeadlines)) rawList.push(...data.thucHienDeadlines);
        if (Array.isArray(data.danhGiaDeadlines)) rawList.push(...data.danhGiaDeadlines);
      }

      if (rawList.length > 0) {
        const mapped: ScheduleEventItem[] = rawList.map((item: any) => {
          let phase: SchedulePhase = 'assignment';
          if (item.stage === 'THUC_HIEN') phase = 'execution';
          else if (item.stage === 'DANH_GIA') phase = 'evaluation';

          return {
            id: item.deadlineId,
            deadlineId: item.deadlineId,
            templateId: item.templateId,
            name: item.name,
            code: item.code,
            phase,
            stage: item.stage,
            scope: item.scope,
            orderIndex: item.orderIndex || 0,
            description: item.description,
            majorId: item.majorId,
            majorName: item.majorName,
            start: formatDisplayDate(item.startDate),
            end: formatDisplayDate(item.endDate),
            rawStart: item.startDate || '',
            rawEnd: item.endDate || '',
            status: item.status || 'NOT_STARTED',
          };
        });

        // Sắp xếp theo thứ tự orderIndex
        mapped.sort((a, b) => a.orderIndex - b.orderIndex);
        setEvents(mapped);
        setEditedEvents(new Map());
      } else {
        setEvents([]);
        setEditedEvents(new Map());
      }
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [selectedSemesterId, selectedMajorId]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // Xử lý thay đổi ngày trên 1 dòng
  const handleDateChange = (eventId: string, field: 'start' | 'end', rawValue: string) => {
    const val = rawValue;
    setEditedEvents((prev) => {
      const item = events.find((e) => e.id === eventId);
      const existing = prev.get(eventId) || {
        start: item?.start || '',
        end: item?.end || '',
        rawStart: item?.rawStart || '',
        rawEnd: item?.rawEnd || '',
      };

      const updated = new Map(prev);
      if (field === 'start') {
        updated.set(eventId, {
          ...existing,
          rawStart: val,
          start: formatDisplayDate(val),
        });
      } else {
        updated.set(eventId, {
          ...existing,
          rawEnd: val,
          end: formatDisplayDate(val),
        });
      }
      return updated;
    });
  };

  // Hủy chỉnh sửa trên dòng
  const handleResetRow = (eventId: string) => {
    setEditedEvents((prev) => {
      const updated = new Map(prev);
      updated.delete(eventId);
      return updated;
    });
  };

  // Mở modal xác nhận trước khi lưu
  const handleOpenConfirm = (item: ScheduleEventItem) => {
    const edit = editedEvents.get(item.id);
    const rawStart = edit ? edit.rawStart : item.rawStart;
    const rawEnd = edit ? edit.rawEnd : item.rawEnd;

    // 1. Kiểm tra không được để trống
    if (!rawStart || !rawEnd) {
      toast.error('Vui lòng nhập đầy đủ Thời gian bắt đầu và Thời gian kết thúc!');
      return;
    }

    const startDate = new Date(rawStart);
    const endDate = new Date(rawEnd);

    // 2. Kiểm tra bắt đầu phải trước kết thúc
    if (startDate >= endDate) {
      toast.error('Thời gian kết thúc phải diễn ra sau thời gian bắt đầu!');
      return;
    }

    // 3. RÀNG BUỘC TIẾN ĐỘ TUẦN TỰ (Sequential Constraints)
    const phaseEvents = events.filter((e) => e.phase === item.phase);
    const itemIndex = phaseEvents.findIndex((e) => e.id === item.id);

    // Kiểm tra với sự kiện liền trước
    if (itemIndex > 0) {
      const prevItem = phaseEvents[itemIndex - 1];
      const prevEdit = editedEvents.get(prevItem.id);
      const prevRawEnd = prevEdit ? prevEdit.rawEnd : prevItem.rawEnd;
      if (prevRawEnd) {
        const prevEndDate = new Date(prevRawEnd);
        if (startDate < prevEndDate) {
          toast.error(
            `Thời gian bắt đầu phải sau thời gian kết thúc của "${prevItem.name}" (${formatDisplayDate(prevRawEnd)})!`
          );
          return;
        }
      }
    }

    // Kiểm tra với sự kiện liền sau
    if (itemIndex < phaseEvents.length - 1) {
      const nextItem = phaseEvents[itemIndex + 1];
      const nextEdit = editedEvents.get(nextItem.id);
      const nextRawStart = nextEdit ? nextEdit.rawStart : nextItem.rawStart;
      if (nextRawStart) {
        const nextStartDate = new Date(nextRawStart);
        if (endDate > nextStartDate) {
          toast.error(
            `Thời gian kết thúc phải trước thời gian bắt đầu của "${nextItem.name}" (${formatDisplayDate(nextRawStart)})!`
          );
          return;
        }
      }
    }

    setPendingConfirm({
      item,
      rawStart,
      rawEnd,
      startDisplay: formatDisplayDate(rawStart),
      endDisplay: formatDisplayDate(rawEnd),
    });
  };

  // Chuẩn hóa chuỗi thời gian gửi lên Backend (đảm bảo đúng định dạng ISO không bị lệch giờ)
  const formatPayloadDate = (val: string) => {
    if (!val) return '';
    const str = val.replace(' ', 'T');
    return str.length === 16 ? `${str}:00` : str;
  };

  // Xác nhận lưu mốc từ Modal vào Database (bảng semester_deadlines)
  const handleExecuteSave = async () => {
    if (!pendingConfirm || !selectedSemesterId) return;

    setSaving(true);
    try {
      await scheduleService.updateDeadlines({
        semesterId: selectedSemesterId,
        deadlines: [
          {
            deadlineId: pendingConfirm.item.deadlineId,
            templateId: pendingConfirm.item.templateId,
            majorId: pendingConfirm.item.majorId || selectedMajorId || undefined,
            startDate: formatPayloadDate(pendingConfirm.rawStart),
            endDate: formatPayloadDate(pendingConfirm.rawEnd),
          },
        ],
      });

      toast.success(`Đã lưu mốc thời gian: "${pendingConfirm.item.name}"`);
      // Xóa trạng thái edit của dòng này
      handleResetRow(pendingConfirm.item.id);
      setPendingConfirm(null);
      await fetchSchedule();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi lưu mốc thời hạn');
    } finally {
      setSaving(false);
    }
  };

  // Danh sách hiển thị theo tab hiện tại: Hiển thị đầy đủ tất cả các mốc khởi tạo từ template
  // Những mốc chưa set ngày sẽ hiển thị ô trống (--/--/----), chỉ mốc nào set rồi mới hiện ngày
  const currentEvents = useMemo(() => {
    return events.filter((e) => e.phase === currentPhase);
  }, [events, currentPhase]);

  // Đếm số lượng mốc trong từng giai đoạn
  const phaseCounts = useMemo(() => {
    return {
      assignment: events.filter((e) => e.phase === 'assignment').length,
      execution: events.filter((e) => e.phase === 'execution').length,
      evaluation: events.filter((e) => e.phase === 'evaluation').length,
    };
  }, [events]);

  return {
    events,
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
    fetchSchedule,
  };
};

