import type {
  BeDate,
  BeDateTime,
  EvaluationTemplateDetail,
  EvaluationTemplateSummary,
  EvaluationType,
  RubricDetail,
  RubricListItem,
  RubricRole,
  RubricStatus,
  RubricTreeGroup,
  SaveRubricBody,
  SemesterEvaluationTemplate,
  SemesterRubricAssignment,
  TemplateDisplayStatus,
} from '../types'

// Mapper giống lớp Converter/MapStruct bên Spring: đổi DTO của BE sang model giao diện và ngược lại.
// Component chỉ dùng model giao diện, nên BE đổi tên trường thì chỉ sửa ở file này.

// ---------------------------------------------------------------------------
// Enum
// ---------------------------------------------------------------------------

const ROLE_TO_TYPE: Record<RubricRole, EvaluationType> = {
  supervisor: 'ADVISOR',
  reviewer: 'EXAMINER',
  council: 'COUNCIL',
}

const TYPE_TO_ROLE: Record<EvaluationType, RubricRole> = {
  ADVISOR: 'supervisor',
  EXAMINER: 'reviewer',
  COUNCIL: 'council',
}

const DISPLAY_STATUS_TO_STATUS: Record<TemplateDisplayStatus, RubricStatus> = {
  DRAFT: 'draft',
  SCHEDULED: 'upcoming',
  ACTIVE: 'active',
  EXPIRED: 'archived',
}

export function toEvaluationType(role: RubricRole): EvaluationType {
  return ROLE_TO_TYPE[role]
}

export function toRubricRole(type: EvaluationType): RubricRole {
  return TYPE_TO_ROLE[type]
}

export function toRubricStatus(status: TemplateDisplayStatus): RubricStatus {
  return DISPLAY_STATUS_TO_STATUS[status]
}

// ---------------------------------------------------------------------------
// Ngày: BE trả "dd-MM-yyyy"; giao diện hiện "dd/MM/yyyy"
// (tự tách chuỗi thay vì qua Date để không lệch ngày do múi giờ)
// ---------------------------------------------------------------------------

const BE_DATE = /^(\d{2})-(\d{2})-(\d{4})/
const BE_DATE_TIME = /^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})/

/** "16-11-2026" → "16/11/2026"; null/sai định dạng → null */
export function formatBeDate(value: BeDate | null | undefined): string | null {
  const match = value ? BE_DATE.exec(value) : null
  return match ? `${match[1]}/${match[2]}/${match[3]}` : null
}

/** "16-11-2026 08:30:00" → "16/11/2026 08:30" */
export function formatBeDateTime(value: BeDateTime | null | undefined): string | null {
  const match = value ? BE_DATE_TIME.exec(value) : null
  if (match) return `${match[1]}/${match[2]}/${match[3]} ${match[4]}:${match[5]}`
  return formatBeDate(value)
}

/**
 * "16-11-2026" → "20261116": chuỗi so sánh được theo thứ tự ngày (dùng để lọc / so học kỳ).
 * Sai định dạng → "" (đứng trước mọi ngày hợp lệ)
 */
export function beDateSortKey(value: BeDate | null | undefined): string {
  const match = value ? BE_DATE.exec(value) : null
  return match ? `${match[3]}${match[2]}${match[1]}` : ''
}

// ---------------------------------------------------------------------------
// DTO → model giao diện
// ---------------------------------------------------------------------------

export function toRubricListItem(dto: EvaluationTemplateSummary): RubricListItem {
  return {
    publicId: dto.publicId,
    role: toRubricRole(dto.type),
    name: dto.name,
    status: toRubricStatus(dto.displayStatus),
    statusLabel: dto.displayStatusName,
    // BE có thể bỏ hẳn field null khỏi JSON → `?? null` để luôn có key
    fromSemester: dto.fromSemester ?? null,
    toSemester: dto.toSemester ?? null,
    totalWeight: dto.totalWeight,
    criteriaCount: dto.criteriaCount,
    isValid: dto.isValid,
    semesterCount: dto.semesterCount,
    sheetCount: dto.sheetCount,
    canDelete: dto.canDelete,
    updatedByName: dto.updatedByName,
    updatedAt: formatBeDateTime(dto.updatedAt),
  }
}

/** Cây nhóm/tiêu chí từ BE: sắp theo displayOrder, mã "1", "1.2" ghép theo vị trí */
function toRubricTree(groups: EvaluationTemplateDetail['groups']): RubricTreeGroup[] {
  const tree = [...groups]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map<RubricTreeGroup>((group) => ({
      key: group.publicId,
      publicId: group.publicId,
      code: '',
      name: group.name,
      criteria: [...group.criteria]
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((criterion) => ({
          key: criterion.publicId,
          publicId: criterion.publicId,
          code: '',
          name: criterion.name,
          weight: criterion.weight,
          maxScore: criterion.maxScore,
        })),
    }))
  return renumberTree(tree)
}

export function toRubricDetail(dto: EvaluationTemplateDetail): RubricDetail {
  return {
    publicId: dto.publicId,
    role: toRubricRole(dto.type),
    name: dto.name,
    status: toRubricStatus(dto.displayStatus),
    statusLabel: dto.displayStatusName,
    fromSemester: dto.fromSemester ?? null,
    toSemester: dto.toSemester ?? null,
    totalWeight: dto.totalWeight,
    criteriaCount: dto.criteriaCount,
    semesterCount: dto.semesterCount,
    sheetCount: dto.sheetCount,
    canDelete: dto.canDelete,
    updatedByName: dto.updatedByName,
    updatedAt: formatBeDateTime(dto.updatedAt),
    version: dto.version,
    canEdit: dto.canEdit,
    canApply: dto.canApply,
    applyBlockedReason: dto.applyBlockedReason,
    canChangeFromSemester: dto.canChangeFromSemester,
    canChangeToSemester: dto.canChangeToSemester,
    canCancelApply: dto.canCancelApply,
    createdByName: dto.createdByName,
    createdAt: formatBeDateTime(dto.createdAt),
    groups: toRubricTree(dto.groups),
  }
}

/** Học kỳ chưa có rubric loại đó: BE trả null hoặc bỏ hẳn các field rubric → đưa hết về null */
export function toSemesterRubricAssignment(dto: SemesterEvaluationTemplate): SemesterRubricAssignment {
  return {
    role: toRubricRole(dto.evaluationType),
    roleLabel: dto.evaluationTypeName,
    templatePublicId: dto.templatePublicId ?? null,
    templateName: dto.templateName ?? null,
    status: dto.displayStatus ? toRubricStatus(dto.displayStatus) : null,
    statusLabel: dto.displayStatusName ?? null,
    fromSemester: dto.fromSemester ?? null,
    toSemester: dto.toSemester ?? null,
  }
}

// ---------------------------------------------------------------------------
// Cây đang sửa
// ---------------------------------------------------------------------------

/** Đánh lại mã "1", "1.1"… theo vị trí sau khi thêm/xóa (không đổi mảng gốc) */
export function renumberTree(groups: RubricTreeGroup[]): RubricTreeGroup[] {
  return groups.map((group, groupIndex) => ({
    ...group,
    code: String(groupIndex + 1),
    criteria: group.criteria.map((criterion, criterionIndex) => ({
      ...criterion,
      code: `${groupIndex + 1}.${criterionIndex + 1}`,
    })),
  }))
}

/** Key tạm cho nhóm/tiêu chí mới (publicId vẫn null đến khi BE lưu) */
export function createTreeKey(prefix: 'group' | 'criterion'): string {
  return `new-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

/** Làm tròn 2 chữ số thập phân, tránh 0.1 + 0.2 = 0.30000000000000004 */
export function roundWeight(value: number): number {
  return Math.round(value * 100) / 100
}

export function sumGroupWeight(group: RubricTreeGroup): number {
  return roundWeight(group.criteria.reduce((sum, criterion) => sum + criterion.weight, 0))
}

export function sumTreeWeight(groups: RubricTreeGroup[]): number {
  return roundWeight(groups.reduce((sum, group) => sum + sumGroupWeight(group), 0))
}

/**
 * Model giao diện → body A5 (PUT toàn bộ cây). Thứ tự mảng = thứ tự hiển thị, BE tự đánh displayOrder
 * và tự tính maxScore nên không gửi. Phần tử mới có publicId null; phần tử bị xóa thì không có trong mảng.
 */
export function toSaveRubricBody(name: string, version: number, groups: RubricTreeGroup[]): SaveRubricBody {
  return {
    name: name.trim(),
    version,
    groups: groups.map((group) => ({
      publicId: group.publicId,
      name: group.name.trim(),
      criteria: group.criteria.map((criterion) => ({
        publicId: criterion.publicId,
        name: criterion.name.trim(),
        weight: roundWeight(criterion.weight),
      })),
    })),
  }
}
