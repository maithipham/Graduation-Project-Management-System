export interface TopicRegistrationDto {
  topicId: string
  studentId: string
  desiredLecturerId?: string
  proposalNotes?: string
}

export interface StudentTopic {
  id: string
  code: string
  title: string
  lecturerName: string
  department: string
  status: 'pending' | 'approved' | 'rejected' | 'locked'
}
