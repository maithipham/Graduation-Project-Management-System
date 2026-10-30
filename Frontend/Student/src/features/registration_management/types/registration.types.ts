export type RegistrationOrigin = 'internal' | 'external'

export type RegistrationSubStatus =
  | 'pending_gvhd'
  | 'pending_tbm'
  | 'approved_tbm'
  | 'rejected_gvhd'
  | 'rejected_tbm'

export type RegistrationStatus = 'Đang xử lý' | 'Đã duyệt' | 'Đã từ chối'

export interface RegistrationLecturerOption {
  id: number
  name: string
  degree: string
  department: string
  unit?: string
  origin: RegistrationOrigin
  email: string
  phone: string
  room: string
  quota: string
  used: number
  max: number
  isAccepting: number
  field: string
  bio: string
}

export interface SupervisorRegistrationItem {
  id: number
  time: string
  lecturerId: number
  lecturer: string
  dept: string
  origin: RegistrationOrigin
  unit: string
  topic: string
  status: RegistrationStatus
  subStatus: RegistrationSubStatus
  approvedTime: string
  note: string
}

