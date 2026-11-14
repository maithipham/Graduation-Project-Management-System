export interface Semester {
  id: string
  publicId: string
  name: string
  academicYear: string
  term: string
  startDate: string
  endDate: string
  status: string
  statusCode: 'UPCOMING' | 'ONGOING' | 'COMPLETED'
}