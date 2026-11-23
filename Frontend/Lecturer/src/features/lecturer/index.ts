// Public API của role: lecturer
export * from './layouts'
export * from './dashboard'
export * from './supervisor_registration'
export * from './topic_proposal'
export * from './outline_review'
export * from './report_check'
export { isValidDocumentFileName } from './report_check'
export * from './guiding_evaluation'
export * from './defense_management'
// outline_review và defense_management cùng khai báo ThesisStage → chỉ định rõ bản dùng ở public API
export type { ThesisStage } from './defense_management'
export * from './template_management'
export * from './profile_management'
