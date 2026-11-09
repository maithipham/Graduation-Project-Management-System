/**
 * Định nghĩa kiểu dữ liệu cho tính năng Quản lý Kế hoạch & Mốc thời hạn (Deadline) Đồ án
 */

export type DeadlineStage = 'GIAO_NHAN' | 'THUC_HIEN' | 'DANH_GIA';
export type DeadlineScope = 'GLOBAL' | 'MAJOR_SPECIFIC';
export type DeadlineStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXTENDED';

export interface DeadlineItem {
  deadlineId: string;        // publicId của SemesterDeadline
  templateId: string;        // publicId của DeadlineTemplate
  name: string;              // Tên mốc sự kiện (VD: Đăng ký GVHD, Nộp đề cương,...)
  code: string;              // Mã định danh
  stage: DeadlineStage;      // GIAO_NHAN, THUC_HIEN, DANH_GIA
  scope: DeadlineScope;      // GLOBAL hoặc MAJOR_SPECIFIC
  orderIndex: number;        // Thứ tự sắp xếp
  description?: string;      // Hướng dẫn chi tiết
  majorId: string | null;    // publicId chuyên ngành (null nếu là GLOBAL)
  majorName: string | null;  // Tên chuyên ngành (null nếu là GLOBAL)
  startDate: string;         // ISO datetime string
  endDate: string;           // ISO datetime string
  status: DeadlineStatus;    // Trạng thái mốc
}

export interface DeadlineGroupedData {
  giaoNhanDeadlines: DeadlineItem[];  // Tab 1: Giai đoạn 1 (Chung toàn trường)
  thucHienDeadlines: DeadlineItem[];  // Tab 2: Giai đoạn 2 (Chung toàn trường)
  danhGiaDeadlines: DeadlineItem[];   // Tab 3: Giai đoạn 3 (Theo chuyên ngành)
}

export interface DeadlineItemUpdatePayload {
  deadlineId: string;
  startDate: string;
  endDate: string;
  status?: DeadlineStatus;
}

export interface DeadlineBatchUpdatePayload {
  semesterId: string;
  deadlines: DeadlineItemUpdatePayload[];
}

export interface InitSemesterDeadlinesPayload {
  semesterId: string;
  copyFromSemesterId?: string;
}

