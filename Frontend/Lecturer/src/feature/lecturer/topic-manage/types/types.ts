export interface LecturerTopicDto {
  id?: string
  title: string
  description: string
  maxStudents: number
  targetMajor: string
  requirements?: string
  status?: 'draft' | 'published' | 'assigned' | 'completed'
}

export type CreateTopicPayload = LecturerTopicDto
export type UpdateTopicPayload = Partial<LecturerTopicDto>
