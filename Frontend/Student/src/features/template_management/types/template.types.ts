export type TemplateDocumentCategory =
  | 'Mẫu báo cáo'
  | 'Phiếu đánh giá'
  | 'Quy chế'
  | 'Biên bản'
  | 'Mẫu đề cương'

export interface TemplateDocumentItem {
  id: number
  title: string
  extension: '.DOCX' | '.PDF'
  type: TemplateDocumentCategory
  category: 'report' | 'evaluation' | 'regulation' | 'minutes' | 'outline'
  size: string
  format: 'docx' | 'pdf'
  iconColor: 'blue' | 'red'
}

