/**
 * Định nghĩa kiểu dữ liệu cho tính năng Quản lý Kế hoạch & Mốc thời hạn (Deadline) Đồ án
 */

export type MilestoneStage = 'GIAO_NHAN' | 'THUC_HIEN' | 'DANH_GIA';
export type MilestoneScope = 'GLOBAL' | 'MAJOR_SPECIFIC';
export type MilestoneStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXTENDED';

export interface MilestoneItem {
  milestoneId: string;       // publicId của SemesterMilestone
  templateId: string;        // publicId của MilestoneTemplate
  name: string;              // Tên mốc sự kiện (VD: Đăng ký GVHD, Nộp đề cương,...)
  code: string;              // Mã định danh
  stage: MilestoneStage;     // GIAO_NHAN, THUC_HIEN, DANH_GIA
  scope: MilestoneScope;     // GLOBAL hoặc MAJOR_SPECIFIC
  orderIndex: number;        // Thứ tự sắp xếp
  description?: string;      // Hướng dẫn chi tiết
  majorId: string | null;    // publicId chuyên ngành (null nếu là GLOBAL)
  majorName: string | null;  // Tên chuyên ngành (null nếu là GLOBAL)
  startDate: string;         // ISO datetime string
  endDate: string;           // ISO datetime string
  status: MilestoneStatus;   // Trạng thái mốc
}

export interface MilestoneGroupedData {
  giaoNhanMilestones: MilestoneItem[];  // Tab 1: Giai đoạn 1 (Chung)
  thucHienMilestones: MilestoneItem[];  // Tab 2: Giai đoạn 2 (Chung)
  danhGiaMilestones: MilestoneItem[];   // Tab 3: Giai đoạn 3 (Theo chuyên ngành)
}

export interface MilestoneItemUpdatePayload {
  milestoneId: string;
  startDate: string;
  endDate: string;
  status?: MilestoneStatus;
}

export interface MilestoneBatchUpdatePayload {
  semesterId: string;
  milestones: MilestoneItemUpdatePayload[];
}

export interface InitSemesterMilestonesPayload {
  semesterId: string;
  copyFromSemesterId?: string;
}

