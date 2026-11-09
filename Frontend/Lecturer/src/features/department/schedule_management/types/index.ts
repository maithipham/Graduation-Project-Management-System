/**
 * Type definitions cho tính năng Kế hoạch & Tiến độ đợt đồ án (Trưởng bộ môn)
 */

export type SchedulePhase = 'assignment' | 'execution' | 'evaluation';

export type DeadlineStage = 'GIAO_NHAN' | 'THUC_HIEN' | 'DANH_GIA';
export type DeadlineScope = 'GLOBAL' | 'MAJOR_SPECIFIC';
export type DeadlineStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXTENDED';

export interface ScheduleEventItem {
  id: string;              // publicId của SemesterDeadline (hoặc client id nếu chưa lưu)
  deadlineId: string;      // publicId
  templateId?: string;
  name: string;            // Tên mốc sự kiện
  code?: string;
  phase: SchedulePhase;    // assignment, execution, evaluation
  stage: DeadlineStage;    // GIAO_NHAN, THUC_HIEN, DANH_GIA
  scope: DeadlineScope;    // GLOBAL, MAJOR_SPECIFIC
  orderIndex: number;
  description?: string;
  majorId: string | null;
  majorName: string | null;
  start: string;           // Chuỗi hiển thị (VD: "02h35 07/11/2026")
  end: string;             // Chuỗi hiển thị (VD: "23h59 09/12/2026")
  rawStart: string;        // ISO string (VD: "2026-11-07T02:35:00")
  rawEnd: string;          // ISO string (VD: "2026-12-09T23:59:00")
  status: DeadlineStatus;
}

export interface ScheduleGroupedData {
  giaoNhanDeadlines: any[];
  thucHienDeadlines: any[];
  danhGiaDeadlines: any[];
}

export interface DeadlineItemUpdatePayload {
  deadlineId?: string;
  templateId?: string;
  majorId?: string | null;
  startDate: string;
  endDate: string;
  status?: DeadlineStatus;
}

export interface DeadlineBatchUpdatePayload {
  semesterId: string;
  deadlines: DeadlineItemUpdatePayload[];
}



