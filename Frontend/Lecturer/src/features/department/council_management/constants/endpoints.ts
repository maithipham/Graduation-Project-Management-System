import { API_ENDPOINTS } from '@/shared/api/endpoints'

/**
 * Constants endpoint cho module Quản lý Hội đồng bảo vệ (Inter 3 – Bước 11)
 * Đã bỏ prefix /api/v1, danh từ số ít theo chuẩn REST của backend
 */
export const DEFENSE_COUNCIL_ENDPOINTS = {
  // GET /defense-council?semesterId=&majorId=
  OVERVIEW: API_ENDPOINTS.defenseCouncil.base,
  // POST /defense-council/batch
  BATCH_CREATE: API_ENDPOINTS.defenseCouncil.batch,
  // PATCH /defense-council/{councilPublicId}
  DETAIL: API_ENDPOINTS.defenseCouncil.detail,
  // GET /defense-council/teacher?semesterId=&majorId=&scope=&assignedOnly=&keyword=
  TEACHERS: API_ENDPOINTS.defenseCouncil.teacher,
  // PUT /defense-council/{councilPublicId}/member
  MEMBERS: API_ENDPOINTS.defenseCouncil.member,
  // GET /defense-council/student?semesterId=&majorId=&assigned=&page=&size=
  STUDENTS: API_ENDPOINTS.defenseCouncil.student,
  // POST /defense-council/{councilPublicId}/assignment
  ASSIGN_STUDENTS: API_ENDPOINTS.defenseCouncil.assignment,
  // DELETE /defense-council/{councilPublicId}/assignment/{assignmentPublicId}
  REMOVE_ASSIGNMENT: API_ENDPOINTS.defenseCouncil.removeAssignment,
} as const
