/** Vai trò chấm điểm: mỗi vai trò có kho rubric riêng (3 tab trên đầu trang) */
export type RubricRole = 'supervisor' | 'reviewer' | 'council'

/** Nháp → Sắp áp dụng → Đang áp dụng → Hết áp dụng */
export type RubricStatus = 'draft' | 'upcoming' | 'active' | 'archived'

// ============================================================================
// Type BE – khớp DTO của EvaluationTemplateController / SemesterController
// (đặc tả: readme.md/department/api_rubricConfig.md)
// ============================================================================

/** Loại phiếu chấm (BE gửi / nhận đúng mã chữ hoa) */
export type EvaluationType = 'ADVISOR' | 'EXAMINER' | 'COUNCIL'

/** Trạng thái hiển thị: BE tính từ khoảng học kỳ so với hôm nay, không lưu DB */
export type TemplateDisplayStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'EXPIRED'

/** Ngày BE trả về: "dd-MM-yyyy" */
export type BeDate = string
/** Ngày giờ BE trả về: "dd-MM-yyyy HH:mm:ss" */
export type BeDateTime = string

/** Học kỳ rút gọn trong response rubric */
export interface SemesterRef {
  publicId: string
  name: string
}

/** Một dòng của GET /semester (chỉ các field ô chọn "Từ kỳ" / "Đến kỳ" cần) */
export interface RubricSemesterOption {
  publicId: string
  name: string
  startDate: BeDate
  endDate: BeDate
  /** Tên trạng thái tiếng Việt */
  status: string
  statusCode: 'UPCOMING' | 'ONGOING' | 'COMPLETED'
}

/** A1 – một dòng của GET /evaluation-template?type= */
export interface EvaluationTemplateSummary {
  publicId: string
  name: string
  type: EvaluationType
  /** "Từ kỳ"; null = Nháp */
  fromSemester: SemesterRef | null
  /** "Đến kỳ"; null = chưa xác định kỳ kết thúc (hoặc Nháp) */
  toSemester: SemesterRef | null
  displayStatus: TemplateDisplayStatus
  displayStatusName: string
  totalWeight: number
  criteriaCount: number
  isValid: boolean
  semesterCount: number
  sheetCount: number
  canDelete: boolean
  updatedByName: string | null
  updatedAt: BeDateTime | null
}

export interface EvaluationCriteria {
  publicId: string
  displayOrder: number
  name: string
  weight: number
  maxScore: number
}

export interface EvaluationCriteriaGroup {
  publicId: string
  displayOrder: number
  name: string
  totalWeight: number
  maxScore: number
  criteria: EvaluationCriteria[]
}

/** A2 – GET /evaluation-template/{publicId} */
export interface EvaluationTemplateDetail {
  publicId: string
  name: string
  type: EvaluationType
  /** "Từ kỳ"; null = Nháp */
  fromSemester: SemesterRef | null
  /** "Đến kỳ"; null = chưa xác định kỳ kết thúc (hoặc Nháp) */
  toSemester: SemesterRef | null
  displayStatus: TemplateDisplayStatus
  displayStatusName: string
  /** Khóa lạc quan (giống @Version JPA): gửi lại đúng số này khi lưu */
  version: number
  totalWeight: number
  criteriaCount: number
  semesterCount: number
  sheetCount: number
  canEdit: boolean
  canApply: boolean
  applyBlockedReason: string | null
  /** Ô "Từ kỳ" trong hộp thoại Sửa kỳ áp dụng được chọn (đã áp dụng, chưa có phiếu chấm) */
  canChangeFromSemester: boolean
  /** Nút "Sửa kỳ áp dụng" (đã áp dụng, kể cả đã có phiếu chấm) */
  canChangeToSemester: boolean
  canCancelApply: boolean
  canDelete: boolean
  createdByName: string | null
  updatedByName: string | null
  createdAt: BeDateTime | null
  updatedAt: BeDateTime | null
  groups: EvaluationCriteriaGroup[]
}

/** A3 – body POST /evaluation-template */
export interface CreateRubricBody {
  type: EvaluationType
  name: string
}

/** A5 – body PUT /evaluation-template/{publicId}: gửi toàn bộ cây, publicId null = phần tử mới */
export interface SaveRubricBody {
  name: string
  version: number
  groups: {
    publicId: string | null
    name: string
    criteria: { publicId: string | null; name: string; weight: number }[]
  }[]
}

/** A8, A9 – body; toSemesterId null = chưa xác định kỳ kết thúc */
export interface SemesterRangeBody {
  fromSemesterId: string
  toSemesterId: string | null
}

/** A7 (xem trước Áp dụng / Sửa kỳ) và A7b (xem trước Hủy áp dụng – không có from/to) */
export interface ApplyPreview {
  fromSemester?: SemesterRef | null
  toSemester?: SemesterRef | null
  /** Học kỳ mới vào khoảng → sẽ dùng rubric này */
  assignedSemesters: SemesterRef[]
  /** Học kỳ rời khỏi khoảng → sẽ không còn rubric loại này */
  releasedSemesters: SemesterRef[]
}

/**
 * B1 – một dòng của GET /semester/{id}/evaluation-template (luôn đủ 3 dòng, chỉ xem).
 * Học kỳ chưa có rubric loại đó thì các field rubric là null hoặc bị ẩn khỏi JSON.
 */
export interface SemesterEvaluationTemplate {
  evaluationType: EvaluationType
  evaluationTypeName: string
  templatePublicId?: string | null
  templateName?: string | null
  fromSemester?: SemesterRef | null
  toSemester?: SemesterRef | null
  displayStatus?: TemplateDisplayStatus | null
  displayStatusName?: string | null
}

// ============================================================================
// Type UI (view-model) – component đọc các type này, mapper đổi từ type BE sang
// ============================================================================

/** Một dòng bảng kho rubric (từ A1) */
export interface RubricListItem {
  publicId: string
  role: RubricRole
  name: string
  status: RubricStatus
  statusLabel: string
  /** null = Nháp (chưa áp dụng) */
  fromSemester: SemesterRef | null
  /** null = chưa xác định kỳ kết thúc */
  toSemester: SemesterRef | null
  totalWeight: number
  criteriaCount: number
  isValid: boolean
  semesterCount: number
  sheetCount: number
  canDelete: boolean
  updatedByName: string | null
  /** DD/MM/YYYY HH:mm */
  updatedAt: string | null
}

/** Tiêu chí trên màn sửa. `key` để React render, `publicId` null = tiêu chí mới chưa lưu */
export interface RubricTreeCriterion {
  key: string
  publicId: string | null
  /** "1.2", FE tự ghép theo vị trí */
  code: string
  name: string
  weight: number
  /** Điểm tối đa BE trả; null = tiêu chí mới, chưa có số của BE */
  maxScore: number | null
}

/** Nhóm tiêu chí trên màn sửa. Nhóm không có trọng số riêng: tổng = tổng tiêu chí con */
export interface RubricTreeGroup {
  key: string
  publicId: string | null
  code: string
  name: string
  criteria: RubricTreeCriterion[]
}

/** Chi tiết rubric (từ A2) */
export interface RubricDetail extends Omit<RubricListItem, 'isValid'> {
  version: number
  canEdit: boolean
  canApply: boolean
  applyBlockedReason: string | null
  canChangeFromSemester: boolean
  canChangeToSemester: boolean
  canCancelApply: boolean
  createdByName: string | null
  createdAt: string | null
  groups: RubricTreeGroup[]
}

/** Rubric đang gán cho học kỳ của 1 loại phiếu (từ B1, chỉ xem) */
export interface SemesterRubricAssignment {
  role: RubricRole
  roleLabel: string
  /** null = học kỳ chưa có rubric loại này */
  templatePublicId: string | null
  templateName: string | null
  status: RubricStatus | null
  statusLabel: string | null
  fromSemester: SemesterRef | null
  toSemester: SemesterRef | null
}
