// Public API của sub-feature: student_management
// Không export pages: page được nạp bằng lazy() trong app/routes.
export * from './types'
export * from './hooks/useStudents'
// Đếm / chọn tab kết quả import theo trạng thái dòng — import giáo viên dùng lại
export {
  countRowsByStatus,
  IMPORT_TAB_ORDER,
  pickDefaultTab,
  type ImportRowCounts,
} from './utils/importResult'
// Popup Thêm / Import + form 8 trường — Admin dùng lại với API tài khoản riêng (prop useCreate / useImport)
export { CreateStudentDialog } from './components/CreateStudentDialog'
export { ImportStudentDialog } from './components/ImportStudentDialog'
export { StudentFormFields } from './components/StudentFormFields'
export {
  createStudentSchema,
  EMPTY_CREATE_STUDENT_VALUES,
  type CreateStudentFormInput,
  type CreateStudentFormValues,
} from './utils/createStudentSchema'
export { splitFullName } from './utils/updateStudentSchema'
