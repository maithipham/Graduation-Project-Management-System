export interface LecturerDocumentTemplate {
  id: number
  title: string
  extension: '.DOCX' | '.PDF'
  type: 'Mẫu báo cáo' | 'Phiếu đánh giá' | 'Quy chế' | 'Biên bản' | 'Mẫu đề cương'
  category: 'report' | 'evaluation' | 'regulation' | 'minutes' | 'outline'
  size: string
  format: 'docx' | 'pdf'
}

