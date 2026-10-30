export type SupervisorApprovalStatus = 'pending' | 'approved' | 'rejected'

export type SupervisorTabStatus = SupervisorApprovalStatus | ''

export interface SupervisorRequestItem {
  id: string
  mssv: string
  name: string
  major: string
  topic: string
  submittedDate: string
  status: SupervisorApprovalStatus
  approvedAt?: string
  rejectedAt?: string
  rejectReason?: string
  email: string
  phone: string
  note: string
}

export interface SupervisorRequestCounts {
  pending: number
  approved: number
  rejected: number
  all: number
}

export interface SupervisorRequestFilterParams {
  tabStatus?: SupervisorTabStatus
  searchQuery?: string
}
