export interface DepartmentInfo {
  name: string
  dean: string
  totalSupervisors: number
  totalGraduationStudents: number
  assignedRate: string
}

export interface DepartmentAnnouncement {
  id: string
  title: string
  date: string
  isUrgent: boolean
}
