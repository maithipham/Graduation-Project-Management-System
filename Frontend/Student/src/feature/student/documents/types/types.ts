export interface GraduationDocument {
  id: string
  title: string
  code: string
  fileExtension: 'docx' | 'xlsx' | 'pdf'
  fileSize: number
  downloadUrl: string
}
