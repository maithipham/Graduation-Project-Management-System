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

/** Trạng thái hiển thị: BE tính từ ngày, không lưu DB */
export type TemplateDisplayStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'EXPIRED'

/** Ngày BE trả về: "dd-MM-yyyy" */
export type BeDate = string
/** Ngày giờ BE trả về: "dd-MM-yyyy HH:mm:ss" */
export type BeDateTime = string
/** Ngày gửi lên BE: "yyyy-MM-dd" */
export type ApiDate = string

/** A1 – một dòng của GET /evaluation-template?type= */
export interface EvaluationTemplateSummary {
  publicId: string
  name: string
  type: EvaluationType
  effectiveFrom: BeDate | null
  effectiveTo: BeDate | null
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
  effectiveFrom: BeDate | null
  effectiveTo: BeDate | null
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
  canChangeEffectiveFrom: boolean
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

/** A8, A9 – body { effectiveFrom } */
export interface EffectiveFromBody {
  effectiveFrom: ApiDate
}

/** A7 – GET /evaluation-template/{publicId}/apply-preview */
export interface ApplyPreview {
  effectiveFrom: BeDate
  closingTemplatePublicId: string | null
  closingTemplateName: string | null
  closingTemplateEffectiveFrom: BeDate | null
  closingTemplateEffectiveTo: BeDate | null
  assignedSemesterCount: number
  keptSemesterCount: number
}

/** B1 – một dòng của GET /semester/{id}/evaluation-template (luôn đủ 3 dòng) */
export interface SemesterEvaluationTemplate {
  evaluationType: EvaluationType
  evaluationTypeName: string
  templatePublicId: string | null
  templateName: string | null
  effectiveFrom: BeDate | null
  effectiveTo: BeDate | null
  displayStatus: TemplateDisplayStatus | null
  displayStatusName: string | null
  /** false = học kỳ đã có phiếu chấm loại này → khóa nút Đổi */
  canChange: boolean
}

/** B2 – body PUT /semester/{id}/evaluation-template */
export interface ChangeSemesterRubricBody {
  evaluationType: EvaluationType
  templatePublicId: string
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
  /** DD/MM/YYYY, null = chưa áp dụng */
  effectiveFrom: string | null
  effectiveTo: string | null
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
  canChangeEffectiveFrom: boolean
  canCancelApply: boolean
  createdByName: string | null
  createdAt: string | null
  groups: RubricTreeGroup[]
}

/** Rubric đang gán cho học kỳ của 1 loại phiếu (từ B1) */
export interface SemesterRubricAssignment {
  role: RubricRole
  roleLabel: string
  /** null = học kỳ chưa có rubric loại này */
  templatePublicId: string | null
  templateName: string | null
  status: RubricStatus | null
  statusLabel: string | null
  effectiveFrom: string | null
  effectiveTo: string | null
  canChange: boolean
}
