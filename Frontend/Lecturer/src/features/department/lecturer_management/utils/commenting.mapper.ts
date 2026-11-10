import type {
  CommentingLecturerApi,
  StudentAssignmentApi,
  CommentingLecturer,
  StudentAssignment,
  AssignmentFilterParams,
  DistributionPreviewSummary,
} from '../types/commenting.types'

/**
 * Data Transformer Layer (Frontend):
 * Chuyển đổi dữ liệu từ API DTO Backend sang View State Model giao diện,
 * đảm bảo chuẩn hóa dữ liệu hiển thị, tách biệt hoàn toàn contract API và UI state.
 */

export function transformCommentingLecturer(
  dto: CommentingLecturerApi,
  managedMajorName?: string,
): CommentingLecturer {
  const title = (dto.title || '').trim()
  const fullName = (dto.fullName || 'Giảng viên').trim()
  const displayName = title && !fullName.startsWith(title) ? `${title} ${fullName}` : fullName
  const org = (dto.organization || '').trim()
  const dept = (dto.department || '').trim()

  // Kiểm tra giảng viên nội bộ Trường ĐH Thủy Lợi
  const isInternal =
    !org ||
    org.toLowerCase().includes('thủy lợi') ||
    org.toLowerCase().includes('tlu') ||
    org.toLowerCase().includes('thuy loi')

  let category: 'internal' | 'dept_ext' | 'univ_ext' = 'internal'
  let categoryLabel = 'Trong bộ môn'
  let subLabel = dept || org || 'Bộ môn'

  if (!isInternal) {
    category = 'univ_ext'
    categoryLabel = 'Ngoài trường'
    subLabel = org || dept || 'Ngoài trường'
  } else if (
    managedMajorName &&
    dept &&
    !dept.toLowerCase().includes(managedMajorName.toLowerCase())
  ) {
    category = 'dept_ext'
    categoryLabel = 'Ngoài bộ môn'
    subLabel = dept
  } else {
    category = 'internal'
    categoryLabel = 'Trong bộ môn'
    subLabel = dept || 'Trong bộ môn'
  }

  return {
    id: dto.id,
    publicId: dto.publicId || String(dto.id),
    code: dto.code || `GV${dto.id}`,
    displayName,
    rawName: fullName,
    title,
    email: dto.email || '',
    department: dept || 'Bộ môn',
    organization: org || 'Trường Đại học Thủy lợi',
    commentingStudentCount: dto.currentCommentingCount ?? 0,
    isInternal,
    category,
    categoryLabel,
    subLabel,
  }
}

export function transformStudentAssignment(dto: StudentAssignmentApi): StudentAssignment {
  const isAssigned = dto.commentingLecturerId != null && dto.commentingLecturerId !== 0
  const isConflict =
    dto.isSupervisorConflict ||
    (dto.commentingLecturerId != null && dto.commentingLecturerId === dto.supervisorId)

  return {
    id: dto.topicId || dto.studentId,
    studentId: dto.studentId,
    studentPublicId: dto.studentPublicId || String(dto.studentId),
    studentCode: dto.studentCode,
    studentName: dto.studentName,
    className: dto.className || 'Chưa xếp lớp',
    majorName: dto.majorName || '',
    topicId: dto.topicId,
    topicPublicId: dto.topicPublicId || String(dto.topicId),
    topicTitle: dto.topicTitle || 'Chưa đăng ký tên đề tài',
    supervisorId: dto.supervisorId ?? null,
    supervisorPublicId: dto.supervisorPublicId || '',
    supervisorName: dto.supervisorName || 'Chưa phân công',
    coSupervisorId: dto.coSupervisorId ?? null,
    coSupervisorName: dto.coSupervisorName || '',
    commentingLecturerId: dto.commentingLecturerId ?? null,
    commentingLecturerPublicId: dto.commentingLecturerPublicId || null,
    commentingLecturerName: dto.commentingLecturerName || null,
    status: isAssigned ? 'ASSIGNED' : 'UNASSIGNED',
    statusLabel: isAssigned ? 'Đã phân công' : 'Chưa phân công',
    isConflict: Boolean(isConflict),
  }
}

/**
 * Kiểm tra xem 1 sinh viên có bị xung đột lợi ích nếu gán giảng viên nhận xét này hay không
 * BR-05: commenting_lecturer_id != supervisor_id && commenting_lecturer_id != co_supervisor_id
 */
export function checkSupervisorConflict(
  student: StudentAssignment,
  lecturer: CommentingLecturer,
): boolean {
  if (!student || !lecturer) return false
  if (student.supervisorId != null && student.supervisorId === lecturer.id) {
    return true
  }
  if (student.coSupervisorId != null && student.coSupervisorId === lecturer.id) {
    return true
  }
  return false
}

/**
 * Kiểm tra xem giảng viên này có bị trùng với GVHD của BẤT KỲ sinh viên nào trong danh sách đang được chọn hay không
 */
export function hasAnySupervisorConflict(
  selectedStudents: StudentAssignment[],
  lecturer: CommentingLecturer,
): boolean {
  if (!selectedStudents.length || !lecturer) return false
  return selectedStudents.some((s) => checkSupervisorConflict(s, lecturer))
}

/**
 * Lấy danh sách các sinh viên bị trùng GVHD với giảng viên được chọn (dùng để hiển thị cảnh báo chi tiết)
 */
export function getConflictingStudents(
  selectedStudents: StudentAssignment[],
  lecturer: CommentingLecturer,
): StudentAssignment[] {
  return selectedStudents.filter((s) => checkSupervisorConflict(s, lecturer))
}

/**
 * Lọc danh sách sinh viên theo bộ lọc
 */
export function filterStudentAssignments(
  students: StudentAssignment[],
  filters: AssignmentFilterParams,
): StudentAssignment[] {
  return students.filter((s) => {
    // 1. Lọc theo trạng thái
    if (filters.status === 'UNASSIGNED' && s.status !== 'UNASSIGNED') {
      return false
    }
    if (filters.status === 'ASSIGNED' && s.status !== 'ASSIGNED') {
      return false
    }

    // 2. Lọc theo từ khóa tìm kiếm (MSSV, Họ tên, Đề tài, GVHD)
    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase()
      const matchCode = s.studentCode.toLowerCase().includes(q)
      const matchName = s.studentName.toLowerCase().includes(q)
      const matchTopic = s.topicTitle.toLowerCase().includes(q)
      const matchSup = s.supervisorName.toLowerCase().includes(q)
      const matchCom = (s.commentingLecturerName || '').toLowerCase().includes(q)
      if (!matchCode && !matchName && !matchTopic && !matchSup && !matchCom) {
        return false
      }
    }

    return true
  })
}

/**
 * Tính toán thống kê trước & sau phân công chia đều để hiển thị lên Preview Modal
 */
export function calculateDistributionPreviewSummary(
  lecturers: CommentingLecturer[],
  previewResults: StudentAssignment[],
): DistributionPreviewSummary[] {
  const newCountsMap = new Map<number, number>()

  for (const item of previewResults) {
    if (item.commentingLecturerId) {
      newCountsMap.set(
        item.commentingLecturerId,
        (newCountsMap.get(item.commentingLecturerId) || 0) + 1,
      )
    }
  }

  return lecturers.map((lec) => {
    const additionalCount = newCountsMap.get(lec.id) || 0
    return {
      lecturerId: lec.id,
      lecturerName: lec.displayName,
      department: lec.department,
      currentCount: lec.commentingStudentCount,
      newCount: lec.commentingStudentCount + additionalCount,
      diffCount: additionalCount,
    }
  })
}

